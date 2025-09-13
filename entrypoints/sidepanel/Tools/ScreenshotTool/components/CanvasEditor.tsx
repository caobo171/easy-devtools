import React, { useEffect } from 'react';
import { CropArea, Annotation, EditMode, ImageAdjustments } from '../types';

interface CanvasEditorProps {
    capturedImage: string | null;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    imageRef: React.RefObject<HTMLImageElement>;
    cropArea: CropArea | null;
    annotations: Annotation[];
    currentAnnotation: Annotation | null;
    editMode: EditMode;
    imageAdjustments: ImageAdjustments;
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: () => void;
    drawImageWithAnnotations: () => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
    capturedImage,
    canvasRef,
    imageRef,
    cropArea,
    annotations,
    currentAnnotation,
    editMode,
    imageAdjustments,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    drawImageWithAnnotations
}) => {
    useEffect(() => {
        if (capturedImage) {
            drawImageWithAnnotations();
        }
    }, [capturedImage, cropArea, annotations, currentAnnotation, imageAdjustments]);

    if (!capturedImage) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
                <div className="text-center p-12">
                    <div className="text-6xl mb-4">📷</div>
                    <h3 className="text-white text-xl font-semibold mb-2">Drag and drop a photo here,</h3>
                    <p className="text-gray-400 mb-4">or click to select a photo</p>
                    <p className="text-gray-500 text-sm">a file with 2 MB</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
            {/* Canvas Container */}
            <div className="w-full h-full flex items-center justify-center p-4">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-2xl"
                    style={{
                        padding: `${imageAdjustments.padding}px`,
                        filter: `
                            brightness(${imageAdjustments.brightness})
                            contrast(${imageAdjustments.contrast})
                            blur(${imageAdjustments.blur}px)
                        `,
                        borderRadius: `${imageAdjustments.rounded}px`,
                        boxShadow: imageAdjustments.shadow > 0 
                            ? `0 ${imageAdjustments.shadow}px ${imageAdjustments.shadow * 2}px rgba(0,0,0,0.3)`
                            : 'none'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full cursor-crosshair"
                        width={800}
                        height={600}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        style={{
                            borderRadius: `${imageAdjustments.rounded}px`
                        }}
                    />
                </div>
            </div>

            {/* Hidden image element for loading */}
            <img
                ref={imageRef}
                src={capturedImage}
                alt="Screenshot"
                className="hidden"
                onLoad={() => {
                    const canvas = canvasRef.current;
                    const image = imageRef.current;
                    if (canvas && image) {
                        const maxWidth = 800;
                        const maxHeight = 600;
                        const aspectRatio = image.naturalWidth / image.naturalHeight;
                        
                        let canvasWidth = maxWidth;
                        let canvasHeight = maxWidth / aspectRatio;
                        
                        if (canvasHeight > maxHeight) {
                            canvasHeight = maxHeight;
                            canvasWidth = maxHeight * aspectRatio;
                        }
                        
                        canvas.width = canvasWidth;
                        canvas.height = canvasHeight;
                        
                        drawImageWithAnnotations();
                    }
                }}
            />

            {/* Mode Indicator */}
            {editMode && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                    {editMode === 'select' && '✋ Select & Move'}
                    {editMode === 'crop' && '✂️ Crop Area'}
                    {editMode === 'text' && '📝 Add Text'}
                    {editMode === 'arrow' && '↗️ Draw Arrow'}
                    {editMode === 'rectangle' && '⬜ Draw Rectangle'}
                    {editMode === 'circle' && '⭕ Draw Circle'}
                    {editMode === 'highlight' && '🟨 Highlight'}
                    {editMode === 'pen' && '✏️ Free Draw'}
                    {editMode === 'blur' && '🔒 Blur Area'}
                </div>
            )}

            {/* Crop Info */}
            {cropArea && editMode === 'crop' && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)} pixels
                </div>
            )}
        </div>
    );
};
