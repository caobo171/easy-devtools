import React from 'react';
import { browser } from 'wxt/browser';
import { MessageType, MessageFrom } from '@/entrypoints/types';
import { Annotation, ScreenshotToolProps } from './ScreenshotTool/types';
import { useScreenshotState } from './ScreenshotTool/hooks/useScreenshotState';
import { ToolBar } from './ScreenshotTool/components/ToolBar';
import { PropertyPanel } from './ScreenshotTool/components/PropertyPanel';
import { KonvaEditor } from './ScreenshotTool/components/KonvaEditor';
import { StatusBar } from './ScreenshotTool/components/StatusBar';
import { ActionBar } from './ScreenshotTool/components/ActionBar';
import { TextInputModal } from './ScreenshotTool/components/TextInputModal';

export default function ScreenshotTool({ initialImage }: ScreenshotToolProps) {
    // Use the custom hook for state management
    const state = useScreenshotState(initialImage);
    
    // Canvas size state
    const [canvasSize, setCanvasSize] = React.useState({ width: 800, height: 800 });
    
    // Handle canvas size changes
    const handleSizeChange = (width: number, height: number) => {
        setCanvasSize({ width, height });
    };


    // Handle annotation updates from PropertyPanel
    const handleAnnotationUpdate = (updatedAnnotation: Annotation) => {
        const updatedAnnotations = state.annotations.map(ann => 
            ann.id === updatedAnnotation.id ? updatedAnnotation : ann
        );
        state.setAnnotations(updatedAnnotations);
    };

    // Handle selected annotation changes from KonvaEditor
    const handleSelectedAnnotationChange = (annotationId: string | null) => {
        state.setSelectedAnnotationId(annotationId);
    };

    // Handle removing the selected annotation
    const handleRemoveSelectedAnnotation = () => {
        if (state.selectedAnnotationId) {
            const updatedAnnotations = state.annotations.filter(ann => ann.id !== state.selectedAnnotationId);
            state.setAnnotations(updatedAnnotations);
            state.setSelectedAnnotationId(null);
        }
    };


    // Action handlers
    const downloadImage = () => {
        if (!state.capturedImage || !state.stageRef.current) return;

        const stage = state.stageRef.current;
        const dataURL = stage.toDataURL({ pixelRatio: 2 });

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
        if (!state.capturedImage || !state.stageRef.current) return;

        try {
            const stage = state.stageRef.current;
            const dataURL = stage.toDataURL({ pixelRatio: 2 });

            // Convert dataURL to blob
            const response = await fetch(dataURL);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const applyCrop = () => {
        if (!state.cropArea || !state.capturedImage || !state.stageRef.current) return;

        const stage = state.stageRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get the stage dimensions
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        // Create a temporary image to get original dimensions
        const img = new Image();
        img.onload = () => {
            const scaleX = img.naturalWidth / stageWidth;
            const scaleY = img.naturalHeight / stageHeight;

            canvas.width = state.cropArea!.width * scaleX;
            canvas.height = state.cropArea!.height * scaleY;

            ctx.drawImage(
                img,
                state.cropArea!.x * scaleX,
                state.cropArea!.y * scaleY,
                state.cropArea!.width * scaleX,
                state.cropArea!.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const croppedDataUrl = canvas.toDataURL('image/png');
            state.setCapturedImage(croppedDataUrl);
            state.setCropArea(null);
        };
        img.src = state.capturedImage;
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
        <div className="h-full text-white flex flex-col">
            {/* Top Section - Toolbar and Action Bar */}
            <div className="flex-shrink-0 p-4 z-10">
                <div className="flex items-start justify-between gap-4">
                    <ToolBar
                        editMode={state.editMode}
                        setEditMode={state.setEditMode}
                        onTakeScreenshot={state.takeScreenshot}
                        isCapturing={state.isCapturing}
                        hasImage={!!state.capturedImage}
                        onSizeChange={handleSizeChange}
                        currentSize={canvasSize}
                    />
                    
                    {/* Action Bar - Top Right */}
                    <ActionBar
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
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0">
                {/* Canvas Area - Fixed, no scrolling */}
                <div className="flex-1 flex overflow-hidden">
                    <KonvaEditor
                        capturedImage={state.capturedImage}
                        cropArea={state.cropArea}
                        annotations={state.annotations}
                        currentAnnotation={state.currentAnnotation}
                        editMode={state.editMode}
                        imageAdjustments={state.imageAdjustments}
                        selectedColor={state.selectedColor}
                        fontSize={state.fontSize}
                        strokeWidth={state.strokeWidth}
                        stageRef={state.stageRef}
                        onAnnotationsChange={state.setAnnotations}
                        onCurrentAnnotationChange={state.setCurrentAnnotation}
                        onCropAreaChange={state.setCropArea}
                        onTextInputRequest={(position) => {
                            state.setTextPosition(position);
                            state.setShowTextInput(true);
                        }}
                        selectedAnnotationId={state.selectedAnnotationId}
                        onSelectedAnnotationChange={handleSelectedAnnotationChange}
                        onEditModeChange={state.setEditMode}
                        canvasSize={canvasSize}
                        setCanvasSize={setCanvasSize}
                        setCapturedImage={state.setCapturedImage}

						setRealImage={state.handleSetRealImage}
						realImage={state.realImage}
                    />
                </div>

                {/* Right Property Panel - Only this scrolls */}
                {state.capturedImage && (
                    <div className="flex-shrink-0">
                        <PropertyPanel
                            annotations={state.annotations}
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
                            selectedAnnotationId={state.selectedAnnotationId}
                            onUpdateAnnotation={handleAnnotationUpdate}
                            onRemoveSelectedAnnotation={handleRemoveSelectedAnnotation}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex-shrink-0">
                <StatusBar
                    capturedImage={state.capturedImage}
                    cropArea={state.cropArea}
                    editMode={state.editMode}
                    currentSize={canvasSize}
                />
            </div>

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
