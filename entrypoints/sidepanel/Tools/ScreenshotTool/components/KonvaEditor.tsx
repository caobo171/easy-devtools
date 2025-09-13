import React, { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Arrow, Text, Transformer } from 'react-konva';
import { CropArea, Annotation, EditMode, ImageAdjustments } from '../types';

interface KonvaEditorProps {
    capturedImage: string | null;
    cropArea: CropArea | null;
    annotations: Annotation[];
    currentAnnotation: Annotation | null;
    editMode: EditMode;
    imageAdjustments: ImageAdjustments;
    selectedColor: string;
    fontSize: number;
    strokeWidth: number;
    stageRef: React.RefObject<Konva.Stage>;
    onAnnotationsChange: (annotations: Annotation[]) => void;
    onCurrentAnnotationChange: (annotation: Annotation | null) => void;
    onCropAreaChange: (cropArea: CropArea | null) => void;
    onTextInputRequest: (position: { x: number; y: number }) => void;
}

export const KonvaEditor: React.FC<KonvaEditorProps> = ({
    capturedImage,
    cropArea,
    annotations,
    currentAnnotation,
    editMode,
    imageAdjustments,
    selectedColor,
    fontSize,
    strokeWidth,
    stageRef,
    onAnnotationsChange,
    onCurrentAnnotationChange,
    onCropAreaChange,
    onTextInputRequest
}) => {
    const imageRef = useRef<Konva.Image>(null);
    const backgroundImageRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Load image and calculate stage size including padding
    useEffect(() => {
        if (capturedImage) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                setImage(img);
                // Calculate image size based on available space (excluding padding)
                const maxWidth = 800 - (imageAdjustments.padding * 2);
                const maxHeight = 600 - (imageAdjustments.padding * 2);
                const aspectRatio = img.width / img.height;
                
                let imageWidth = maxWidth;
                let imageHeight = maxWidth / aspectRatio;
                
                if (imageHeight > maxHeight) {
                    imageHeight = maxHeight;
                    imageWidth = maxHeight * aspectRatio;
                }
                
                // Stage size includes padding for background area
                setStageSize({ 
                    width: imageWidth + (imageAdjustments.padding * 2), 
                    height: imageHeight + (imageAdjustments.padding * 2) 
                });
            };
            img.src = capturedImage;
        }
    }, [capturedImage, imageAdjustments.padding]);

    // Load background image when background changes
    useEffect(() => {
        if (imageAdjustments.background.type === 'image' && imageAdjustments.background.image) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                setBackgroundImage(img);
            };
            img.src = imageAdjustments.background.image;
        } else {
            setBackgroundImage(null);
        }
    }, [imageAdjustments.background]);

    // Apply blur filter to background image when blur adjustment changes
    useEffect(() => {
        if (backgroundImageRef.current && backgroundImage && imageAdjustments.blur > 0) {
            const konvaBackgroundImage = backgroundImageRef.current;
            konvaBackgroundImage.cache();
            konvaBackgroundImage.getLayer()?.batchDraw();
        }
    }, [imageAdjustments.blur, backgroundImage]);

    // Apply filters to image when adjustments change
    useEffect(() => {
        if (imageRef.current && image) {
            const konvaImage = imageRef.current;
            
            // Apply Konva filters (excluding blur - that's for background only)
            konvaImage.filters([
                Konva.Filters.Brighten,
                Konva.Filters.Contrast
            ]);
            
            // Set filter values
            konvaImage.brightness(imageAdjustments.brightness - 1); // Konva expects -1 to 1 range
            konvaImage.contrast(imageAdjustments.contrast - 1); // Konva expects -100 to 100 range, but we'll use -1 to 1
            
            konvaImage.cache();
            konvaImage.getLayer()?.batchDraw();
        }
    }, [imageAdjustments, image]);

    // Handle transformer selection
    useEffect(() => {
        if (selectedId && transformerRef.current && stageRef.current) {
            const selectedNode = stageRef.current.findOne(`#${selectedId}`);
            if (selectedNode) {
                transformerRef.current.nodes([selectedNode]);
                transformerRef.current.getLayer()?.batchDraw();
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedId, annotations]); // Re-run when annotations change to maintain selection

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (editMode === 'select') {
            const clickedOnEmpty = e.target === e.target.getStage();
            const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';
            
            // Don't clear selection if clicking on transformer handles
            if (clickedOnTransformer) {
                return;
            }
            
            if (clickedOnEmpty) {
                setSelectedId(null);
                return;
            }
            
            const clickedShape = e.target;
            if (clickedShape.id()) {
                setSelectedId(clickedShape.id());
            }
            return;
        }

        const stage = stageRef.current;
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        if (editMode === 'crop') {
            setIsDrawing(true);
            onCropAreaChange({
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0
            });
            return;
        }

        if (!editMode) return;

        setIsDrawing(true);

        if (editMode === 'text') {
            onTextInputRequest(pos);
            return;
        }

        // Create new annotation
        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: editMode,
            x: pos.x,
            y: pos.y,
            color: selectedColor,
            strokeWidth,
            fontSize
        };

        if (editMode === 'rectangle' || editMode === 'circle' || editMode === 'blur' || editMode === 'highlight') {
            newAnnotation.width = 0;
            newAnnotation.height = 0;
        } else if (editMode === 'arrow') {
            newAnnotation.endX = pos.x;
            newAnnotation.endY = pos.y;
        }

        onCurrentAnnotationChange(newAnnotation);
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || editMode === 'select') return;

        const stage = stageRef.current;
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        if (editMode === 'crop' && cropArea) {
            onCropAreaChange({
                x: cropArea.x,
                y: cropArea.y,
                width: pos.x - cropArea.x,
                height: pos.y - cropArea.y
            });
            return;
        }

        if (!currentAnnotation) return;

        const updatedAnnotation = { ...currentAnnotation };

        if (editMode === 'rectangle' || editMode === 'circle' || editMode === 'blur' || editMode === 'highlight') {
            updatedAnnotation.width = pos.x - currentAnnotation.x;
            updatedAnnotation.height = pos.y - currentAnnotation.y;
        } else if (editMode === 'arrow') {
            updatedAnnotation.endX = pos.x;
            updatedAnnotation.endY = pos.y;
        } else if (editMode === 'pen') {
            // For pen tool, we'll need to handle path drawing differently
            // This is a simplified version
            updatedAnnotation.endX = pos.x;
            updatedAnnotation.endY = pos.y;
        }

        onCurrentAnnotationChange(updatedAnnotation);
    };

    const handleStageMouseUp = () => {
        if (!isDrawing) return;

        setIsDrawing(false);
        
        if (editMode === 'crop') {
            // Crop area is already updated in onCropAreaChange
            return;
        }

        if (currentAnnotation) {
            // Add the completed annotation to the list
            onAnnotationsChange([...annotations, currentAnnotation]);
            onCurrentAnnotationChange(null);
        }
    };

    const renderAnnotation = (annotation: Annotation) => {
        const commonProps = {
            id: annotation.id,
            key: annotation.id,
            stroke: annotation.color,
            strokeWidth: annotation.strokeWidth || 2,
            fill: annotation.type === 'highlight' ? annotation.color : 'transparent',
            opacity: annotation.type === 'highlight' ? 0.3 : 1,
            draggable: editMode === 'select',
            onClick: () => editMode === 'select' && setSelectedId(annotation.id),

        };

        switch (annotation.type) {
            case 'rectangle':
            case 'blur':
            case 'highlight':
                return (
                    <Rect
                        {...commonProps}
                        x={annotation.x}
                        y={annotation.y}
                        width={annotation.width || 0}
                        height={annotation.height || 0}
                        fill={annotation.type === 'highlight' ? annotation.color : 
                              annotation.type === 'blur' ? 'rgba(255,255,255,0.8)' : 'transparent'}
                    />
                );
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow((annotation.width || 0) / 2, 2) + 
                    Math.pow((annotation.height || 0) / 2, 2)
                );
                return (
                    <Circle
                        {...commonProps}
                        x={annotation.x + (annotation.width || 0) / 2}
                        y={annotation.y + (annotation.height || 0) / 2}
                        radius={radius}
                    />
                );
            case 'arrow':
                return (
                    <Arrow
                        {...commonProps}
                        points={[
                            annotation.x,
                            annotation.y,
                            annotation.endX || annotation.x,
                            annotation.endY || annotation.y
                        ]}
                        pointerLength={10}
                        pointerWidth={10}
                    />
                );
            case 'text':
                return (
                    <Text
                        {...commonProps}
                        x={annotation.x}
                        y={annotation.y}
                        text={annotation.text || ''}
                        fontSize={annotation.fontSize || fontSize}
                        fill={annotation.color}
                    />
                );
            default:
                return null;
        }
    };

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
            <div className="w-full h-full flex items-center justify-center p-4">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-2xl"

                >
                    <Stage
                        ref={stageRef}
                        width={stageSize.width}
                        height={stageSize.height}
                        onMouseDown={handleStageMouseDown}
                        onMousemove={handleStageMouseMove}
                        onMouseup={handleStageMouseUp}
                        style={{
                            cursor: editMode === 'select' ? 'default' : 'crosshair'
                        }}
                    >
                        <Layer>
                            {/* Background layer */}
                            {imageAdjustments.background.type === 'image' && backgroundImage ? (
                                <KonvaImage
                                    ref={backgroundImageRef}
                                    image={backgroundImage}
                                    x={0}
                                    y={0}
                                    width={stageSize.width}
                                    height={stageSize.height}
                                    filters={[Konva.Filters.Blur]}
                                    blurRadius={imageAdjustments.blur}
                                />
                            ) : (
                                <Rect
                                    x={0}
                                    y={0}
                                    width={stageSize.width}
                                    height={stageSize.height}
                                    fill={imageAdjustments.background.type === 'solid' 
                                        ? imageAdjustments.background.color || 'transparent'
                                        : 'transparent'
                                    }
                                    fillLinearGradientStartPoint={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'linear'
                                            ? { x: 0, y: 0 }
                                            : undefined
                                    }
                                    fillLinearGradientEndPoint={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'linear'
                                            ? { 
                                                x: Math.cos((imageAdjustments.background.gradient.direction || 45) * Math.PI / 180) * stageSize.width,
                                                y: Math.sin((imageAdjustments.background.gradient.direction || 45) * Math.PI / 180) * stageSize.height
                                            }
                                            : undefined
                                    }
                                    fillLinearGradientColorStops={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'linear'
                                            ? imageAdjustments.background.gradient.colors.flatMap((color, index) => [
                                                index / (imageAdjustments.background.gradient!.colors.length - 1), color
                                            ])
                                            : undefined
                                    }
                                    fillRadialGradientStartPoint={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'radial'
                                            ? { x: stageSize.width / 2, y: stageSize.height / 2 }
                                            : undefined
                                    }
                                    fillRadialGradientEndPoint={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'radial'
                                            ? { x: stageSize.width / 2, y: stageSize.height / 2 }
                                            : undefined
                                    }
                                    fillRadialGradientStartRadius={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'radial'
                                            ? 0
                                            : undefined
                                    }
                                    fillRadialGradientEndRadius={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'radial'
                                            ? Math.max(stageSize.width, stageSize.height) / 2
                                            : undefined
                                    }
                                    fillRadialGradientColorStops={
                                        imageAdjustments.background.type === 'gradient' && 
                                        imageAdjustments.background.gradient?.type === 'radial'
                                            ? imageAdjustments.background.gradient.colors.flatMap((color, index) => [
                                                index / (imageAdjustments.background.gradient!.colors.length - 1), color
                                            ])
                                            : undefined
                                    }
                                />
                            )}
                            
                            {image && (
                                <KonvaImage
                                    ref={imageRef}
                                    image={image}
                                    x={imageAdjustments.padding}
                                    y={imageAdjustments.padding}
                                    width={stageSize.width - (imageAdjustments.padding * 2)}
                                    height={stageSize.height - (imageAdjustments.padding * 2)}
                                    cornerRadius={imageAdjustments.rounded}
                                    shadowColor="rgba(0, 0, 0, 1)"
                                    shadowBlur={imageAdjustments.shadow}
                                    shadowOffset={{ x: imageAdjustments.shadow / 2, y: imageAdjustments.shadow / 2 }}
                                    shadowOpacity={imageAdjustments.shadow > 0 ? 1 : 0}
                                />
                            )}
                            
                            {/* Render all annotations */}
                            {annotations.map(renderAnnotation)}
                            
                            {/* Render current annotation being drawn */}
                            {currentAnnotation && renderAnnotation(currentAnnotation)}
                            
                            {/* Crop area */}
                            {cropArea && editMode === 'crop' && (
                                <Rect
                                    x={cropArea.x}
                                    y={cropArea.y}
                                    width={cropArea.width}
                                    height={cropArea.height}
                                    stroke="rgba(255, 255, 255, 0.8)"
                                    strokeWidth={2}
                                    dash={[5, 5]}
                                    fill="transparent"
                                />
                            )}
                            
                            {/* Transformer for selected shapes */}
                            {editMode === 'select' && (
                                <Transformer
                                    ref={transformerRef}
                                    boundBoxFunc={(oldBox: any, newBox: any) => {
                                        // Limit resize
                                        if (newBox.width < 5 || newBox.height < 5) {
                                            return oldBox;
                                        }
                                        return newBox;
                                    }}
                                    keepRatio={false}
                                    enabledAnchors={[
                                        'top-left',
                                        'top-center',
                                        'top-right',
                                        'middle-right',
                                        'middle-left',
                                        'bottom-left',
                                        'bottom-center',
                                        'bottom-right'
                                    ]}
                                />
                            )}
                        </Layer>
                    </Stage>
                </div>
            </div>
        </div>
    );
};
