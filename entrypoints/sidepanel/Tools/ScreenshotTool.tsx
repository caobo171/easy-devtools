import React from 'react';
import { browser } from 'wxt/browser';
import { MessageType, MessageFrom } from '@/entrypoints/types';
import { ScreenshotToolProps } from './ScreenshotTool/types';
import { useScreenshotState } from './ScreenshotTool/hooks/useScreenshotState';
import { useCanvasDrawing } from './ScreenshotTool/hooks/useCanvasDrawing';
import { useCanvasInteraction } from './ScreenshotTool/hooks/useCanvasInteraction';
import { ToolBar } from './ScreenshotTool/components/ToolBar';
import { PropertyPanel } from './ScreenshotTool/components/PropertyPanel';
import { CanvasEditor } from './ScreenshotTool/components/CanvasEditor';
import { StatusBar } from './ScreenshotTool/components/StatusBar';
import { TextInputModal } from './ScreenshotTool/components/TextInputModal';

export default function ScreenshotTool({ initialImage }: ScreenshotToolProps) {
    // Use the custom hook for state management
    const state = useScreenshotState(initialImage);

    // Use canvas drawing hook
    const { drawImageWithAnnotations } = useCanvasDrawing({
        canvasRef: state.canvasRef,
        imageRef: state.imageRef,
        capturedImage: state.capturedImage,
        annotations: state.annotations,
        currentAnnotation: state.currentAnnotation,
        cropArea: state.cropArea,
        editMode: state.editMode,
        fontSize: state.fontSize,
        imageAdjustments: state.imageAdjustments
    });

    // Use canvas interaction hook
    const { handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp } = useCanvasInteraction({
        canvasRef: state.canvasRef,
        capturedImage: state.capturedImage,
        editMode: state.editMode,
        annotations: state.annotations,
        setAnnotations: state.setAnnotations,
        selectedColor: state.selectedColor,
        fontSize: state.fontSize,
        strokeWidth: state.strokeWidth,
        isDragging: state.isDragging,
        setIsDragging: state.setIsDragging,
        dragStart: state.dragStart,
        setDragStart: state.setDragStart,
        cropArea: state.cropArea,
        setCropArea: state.setCropArea,
        currentAnnotation: state.currentAnnotation,
        setCurrentAnnotation: state.setCurrentAnnotation,
        selectedAnnotationId: state.selectedAnnotationId,
        setSelectedAnnotationId: state.setSelectedAnnotationId,
        isMovingAnnotation: state.isMovingAnnotation,
        setIsMovingAnnotation: state.setIsMovingAnnotation,
        setTextPosition: state.setTextPosition,
        setShowTextInput: state.setShowTextInput
    });

    // Action handlers
    const downloadImage = () => {
        if (!state.capturedImage) return;

        const canvas = state.canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    };

    const openInNewTab = async () => {
        if (!state.capturedImage) return;

        try {
            await browser.storage.local.set({ screenshotData: state.capturedImage });
            const newTab = await browser.tabs.create({
                url: '/media-viewer.html?type=screenshot'
            });
            
            console.log('Opened screenshot editor in new tab:', newTab.id);
            
            try {
                await browser.runtime.sendMessage({
                    messageType: MessageType.closeSidepanel,
                    from: MessageFrom.sidePanel
                });
            } catch (sidePanelError) {
                console.error('Failed to close sidepanel:', sidePanelError);
            }
        } catch (error) {
            console.error('Failed to open in new tab:', error);
        }
    };

    const copyToClipboard = async () => {
        if (!state.capturedImage) return;

        try {
            const response = await fetch(state.capturedImage);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const applyCrop = () => {
        if (!state.cropArea || !state.capturedImage || !state.imageRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const image = state.imageRef.current;
        const scaleX = image.naturalWidth / state.canvasRef.current!.width;
        const scaleY = image.naturalHeight / state.canvasRef.current!.height;

        canvas.width = state.cropArea.width * scaleX;
        canvas.height = state.cropArea.height * scaleY;

        ctx.drawImage(
            image,
            state.cropArea.x * scaleX,
            state.cropArea.y * scaleY,
            state.cropArea.width * scaleX,
            state.cropArea.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const croppedDataUrl = canvas.toDataURL('image/png');
        state.setCapturedImage(croppedDataUrl);
        state.setCropArea(null);
    };

    const addTextAnnotation = () => {
        if (state.textInput.trim() && state.textPosition) {
            const newAnnotation = {
                id: Date.now().toString(),
                type: 'text' as const,
                x: state.textPosition.x,
                y: state.textPosition.y,
                text: state.textInput,
                color: state.selectedColor,
                fontSize: state.fontSize
            };
            state.setAnnotations(prev => [...prev, newAnnotation]);
            state.setTextInput('');
            state.setShowTextInput(false);
            state.setEditMode(null);
        }
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-gray-700">
                <ToolBar
                    editMode={state.editMode}
                    setEditMode={state.setEditMode}
                    onTakeScreenshot={state.takeScreenshot}
                    isCapturing={state.isCapturing}
                    hasImage={!!state.capturedImage}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <CanvasEditor
                    capturedImage={state.capturedImage}
                    canvasRef={state.canvasRef}
                    imageRef={state.imageRef}
                    cropArea={state.cropArea}
                    annotations={state.annotations}
                    currentAnnotation={state.currentAnnotation}
                    editMode={state.editMode}
                    imageAdjustments={state.imageAdjustments}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    drawImageWithAnnotations={drawImageWithAnnotations}
                />

                {/* Right Property Panel */}
                {state.capturedImage && (
                    <PropertyPanel
                        editMode={state.editMode}
                        selectedColor={state.selectedColor}
                        setSelectedColor={state.setSelectedColor}
                        fontSize={state.fontSize}
                        setFontSize={state.setFontSize}
                        strokeWidth={state.strokeWidth}
                        setStrokeWidth={state.setStrokeWidth}
                        imageAdjustments={state.imageAdjustments}
                        setImageAdjustments={state.setImageAdjustments}
                        onUndo={state.undoLastAnnotation}
                        onClearAll={state.clearAnnotations}
                        hasAnnotations={state.annotations.length > 0}
                    />
                )}
            </div>

            {/* Bottom Status Bar */}
            <StatusBar
                capturedImage={state.capturedImage}
                cropArea={state.cropArea}
                onCopy={copyToClipboard}
                onDownload={downloadImage}
                onOpenInNewTab={openInNewTab}
                onApplyCrop={applyCrop}
                onReplaceImage={state.takeScreenshot}
                onRemoveImage={state.clearImage}
                editMode={state.editMode}
            />

            {/* Text Input Modal */}
            <TextInputModal
                show={state.showTextInput}
                textInput={state.textInput}
                setTextInput={state.setTextInput}
                onAdd={addTextAnnotation}
                onCancel={() => {
                    state.setShowTextInput(false);
                    state.setEditMode(null);
                }}
            />
        </div>
    );
}
