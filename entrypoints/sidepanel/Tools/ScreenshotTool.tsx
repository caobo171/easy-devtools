import React from 'react';
import { browser } from 'wxt/browser';
import { MessageType, MessageFrom } from '@/entrypoints/types';
import { ScreenshotToolProps } from './ScreenshotTool/types';
import { useScreenshotState } from './ScreenshotTool/hooks/useScreenshotState';
import { ToolBar } from './ScreenshotTool/components/ToolBar';
import { PropertyPanel } from './ScreenshotTool/components/PropertyPanel';
import { KonvaEditor } from './ScreenshotTool/components/KonvaEditor';
import { StatusBar } from './ScreenshotTool/components/StatusBar';
import { TextInputModal } from './ScreenshotTool/components/TextInputModal';

export default function ScreenshotTool({ initialImage }: ScreenshotToolProps) {
    // Use the custom hook for state management
    const state = useScreenshotState(initialImage);


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
        <div className="h-full bg-gray-900 text-white flex flex-col">
            {/* Top Toolbar */}
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
                <ToolBar
                    editMode={state.editMode}
                    setEditMode={state.setEditMode}
                    onTakeScreenshot={state.takeScreenshot}
                    isCapturing={state.isCapturing}
                    hasImage={!!state.capturedImage}
                />
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
                    />
                </div>

                {/* Right Property Panel - Only this scrolls */}
                {state.capturedImage && (
                    <div className="flex-shrink-0">
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
                    </div>
                )}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex-shrink-0">
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
