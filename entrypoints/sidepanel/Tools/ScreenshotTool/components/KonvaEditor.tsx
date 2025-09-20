import React, { useEffect, useRef, useState, useMemo } from 'react';
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
    selectedAnnotationId: string | null;
    onSelectedAnnotationChange: (annotationId: string | null) => void;
    onEditModeChange: (mode: EditMode) => void;
    canvasSize: { width: number; height: number };
    setCanvasSize: (size: { width: number; height: number }) => void;
    onExportRequest?: () => void;
    setCapturedImage: (imageData: string | null) => void;

	realImage: HTMLImageElement | null;
	setRealImage: (image: HTMLImageElement) => void;
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
    onTextInputRequest,
    selectedAnnotationId,
    onSelectedAnnotationChange,
    onEditModeChange,
    canvasSize,
    setCanvasSize,
    setCapturedImage,

	realImage,
	setRealImage
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const maxFileSize = 2; // 2MB
    const imageRef = useRef<Konva.Image>(null);
    const backgroundImageRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const [processedImage, setProcessedImage] = useState<HTMLImageElement | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    // Using shared canvasSize from parent component
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDraggingArrowPoint, setIsDraggingArrowPoint] = useState<{ annotationId: string; point: 'start' | 'end' } | null>(null);

    // Calculate image display size and position using useMemo for stability
    const imageDisplaySize = useMemo(() => {
        if (!realImage || canvasSize.width <= 0 || canvasSize.height <= 0) {
            return { width: 0, height: 0 };
        }
        
        // Available space for image (canvas minus minimum padding on all sides)
        const availableWidth = canvasSize.width - (imageAdjustments.padding * 2);
        const availableHeight = canvasSize.height - (imageAdjustments.padding * 2);
        
        // Calculate scale to fit image within available space while maintaining aspect ratio
        const scaleX = availableWidth / realImage.width;
        const scaleY = availableHeight / realImage.height;
        const imageScale = Math.min(scaleX, scaleY);
        
        // Calculate actual image display dimensions
        return {
            width: realImage.width * imageScale,
            height: realImage.height * imageScale
        };
    }, [realImage, canvasSize, imageAdjustments.padding]);

    const imagePosition = useMemo(() => {
        if (!realImage || canvasSize.width <= 0 || canvasSize.height <= 0) {
            return { x: 0, y: 0 };
        }
        
        // Center the image within the canvas
        return {
            x: (canvasSize.width - imageDisplaySize.width) / 2,
            y: (canvasSize.height - imageDisplaySize.height) / 2
        };
    }, [canvasSize, imageDisplaySize, imageAdjustments.padding]);


    const previewScale = useMemo(() => {
        if (canvasSize.width <= 0 || canvasSize.height <= 0) {
            return 1;
        }
        
        // Calculate preview scale for the entire canvas
        const maxDisplayWidth = 800;
        const maxDisplayHeight = 600;
        const scaleX = maxDisplayWidth / canvasSize.width;
        const scaleY = maxDisplayHeight / canvasSize.height;
        return Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    }, [canvasSize]);

	console.log('previewScale', previewScale, imageDisplaySize, canvasSize);



    // Process image with inset balance when settings change
    useEffect(() => {
        if (realImage) {
            if (imageAdjustments.insetBalance || (imageAdjustments.inset > 0)) {
                createProcessedImageWithInset(realImage);
            } else {
                setProcessedImage(realImage);
            }
        } else {
			setProcessedImage(null);
		}
    }, [imageAdjustments.insetBalance, imageAdjustments.inset, realImage]);

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
        if (imageRef.current && realImage) {
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
    }, [imageAdjustments, realImage]);

    // Force image re-render when display size changes
    useEffect(() => {
        if (imageRef.current && processedImage) {
            const konvaImage = imageRef.current;
            // Clear cache and force redraw when size changes
            konvaImage.clearCache();
            konvaImage.cache();
            konvaImage.getLayer()?.batchDraw();
        }
    }, [imageDisplaySize, processedImage]);

    // Handle transformer selection
    useEffect(() => {
        if (selectedAnnotationId && transformerRef.current && stageRef.current) {
            const selectedAnnotation = annotations.find(ann => ann.id === selectedAnnotationId);
            const selectedNode = stageRef.current.findOne(`#${selectedAnnotationId}`);
            
            // Don't show transformer for arrows - they should only be draggable
            if (selectedNode && selectedAnnotation?.type !== 'arrow') {
                console.log('Selected node again:', selectedNode);
                transformerRef.current.nodes([selectedNode]);
                transformerRef.current.getLayer()?.batchDraw();
            } else if (transformerRef.current) {
                transformerRef.current.nodes([]);
                transformerRef.current.getLayer()?.batchDraw();
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedAnnotationId, annotations]); // Re-run when annotations change to maintain selection

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (editMode === 'select') {
            const clickedOnEmpty = e.target === e.target.getStage();
            const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';

            // Check if clicking on arrow control points
            const targetName = e.target.name();
            if (targetName?.startsWith('arrow-point-')) {
                const [, , annotationId, point] = targetName.split('-');
                setIsDraggingArrowPoint({ annotationId, point: point as 'start' | 'end' });
                setIsDrawing(true);
                return;
            }

            // Don't clear selection if clicking on transformer handles
            if (clickedOnTransformer) {
                return;
            }

            if (clickedOnEmpty) {
                onSelectedAnnotationChange(null);
                return;
            }

            const clickedShape = e.target;
            if (clickedShape.id()) {
                const clickedAnnotation = annotations.find(ann => ann.id === clickedShape.id());
                onSelectedAnnotationChange(clickedAnnotation?.id || null);
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

    // Create processed image with auto-balance and inset colors baked into pixels
    const createProcessedImageWithInset = (originalImage: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const originalWidth = originalImage.width;
        const originalHeight = originalImage.height;

        // Step 1: Auto-balance if enabled
        let balancedImage = originalImage;
        let cropArea = { x: 0, y: 0, width: originalWidth, height: originalHeight };

        if (imageAdjustments.insetBalance) {
            const balanceResult = calculateAutoBalance(originalImage);
            cropArea = balanceResult.cropArea;
            balancedImage = balanceResult.balancedImage;
        }

        const insetSize = imageAdjustments.inset;
        const balancedWidth = cropArea.width;
        const balancedHeight = cropArea.height;

        // Step 2: Create final canvas with inset space
        canvas.width = balancedWidth + (insetSize * 2);
        canvas.height = balancedHeight + (insetSize * 2);

        if (insetSize > 0) {
            // Extract edge colors from balanced image for inset
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCanvas.width = balancedWidth;
            tempCanvas.height = balancedHeight;
            tempCtx.drawImage(balancedImage, cropArea.x, cropArea.y, balancedWidth, balancedHeight, 0, 0, balancedWidth, balancedHeight);

            const imageData = tempCtx.getImageData(0, 0, balancedWidth, balancedHeight);
            const data = imageData.data;

            const getPixelColor = (x: number, y: number) => {
                const idx = (y * balancedWidth + x) * 4;
                return {
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2]
                };
            };

            // Sample edge colors from balanced image
            const topColor = getPixelColor(Math.floor(balancedWidth / 2), 0);
            const bottomColor = getPixelColor(Math.floor(balancedWidth / 2), balancedHeight - 1);
            const leftColor = getPixelColor(0, Math.floor(balancedHeight / 2));
            const rightColor = getPixelColor(balancedWidth - 1, Math.floor(balancedHeight / 2));

            // Fill inset areas with edge colors
            ctx.fillStyle = `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`;
            ctx.fillRect(0, 0, canvas.width, insetSize);

            ctx.fillStyle = `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`;
            ctx.fillRect(0, canvas.height - insetSize, canvas.width, insetSize);

            ctx.fillStyle = `rgb(${leftColor.r}, ${leftColor.g}, ${leftColor.b})`;
            ctx.fillRect(0, insetSize, insetSize, canvas.height - (insetSize * 2));

            ctx.fillStyle = `rgb(${rightColor.r}, ${rightColor.g}, ${rightColor.b})`;
            ctx.fillRect(canvas.width - insetSize, insetSize, insetSize, canvas.height - (insetSize * 2));
        }

        // Draw the balanced image in the center
        ctx.drawImage(balancedImage, cropArea.x, cropArea.y, balancedWidth, balancedHeight, insetSize, insetSize, balancedWidth, balancedHeight);

        // Create new image element from canvas
        const processedImg = new Image();
        processedImg.onload = () => {
            setProcessedImage(processedImg);
        };
        processedImg.src = canvas.toDataURL();
    };

    // Calculate auto-balance crop area by analyzing edge differences
    const calculateAutoBalance = (image: HTMLImageElement) => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return { cropArea: { x: 0, y: 0, width: image.width, height: image.height }, balancedImage: image };

        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        tempCtx.drawImage(image, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;

        const getPixelColor = (x: number, y: number) => {
            const idx = (y * image.width + x) * 4;
            return {
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2]
            };
        };

        const colorDistance = (c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }) => {
            return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
        };

        // Analyze top vs bottom difference
        let topCropPixels = 0;
        let bottomCropPixels = 0;

        const sampleWidth = Math.min(100, image.width); // Sample center area
        const startX = Math.floor((image.width - sampleWidth) / 2);

        for (let i = 0; i < Math.min(50, Math.floor(image.height / 4)); i++) {
            let topRowDiff = 0;
            let bottomRowDiff = 0;
            let samples = 0;

            for (let x = startX; x < startX + sampleWidth; x += 5) {
                const topColor = getPixelColor(x, i);
                const bottomColor = getPixelColor(x, image.height - 1 - i);
                const centerTopColor = getPixelColor(x, Math.floor(image.height * 0.3));
                const centerBottomColor = getPixelColor(x, Math.floor(image.height * 0.7));

                topRowDiff += colorDistance(topColor, centerTopColor);
                bottomRowDiff += colorDistance(bottomColor, centerBottomColor);
                samples++;
            }

            const avgTopDiff = topRowDiff / samples;
            const avgBottomDiff = bottomRowDiff / samples;

            if (avgTopDiff > 30) topCropPixels = i + 1;
            if (avgBottomDiff > 30) bottomCropPixels = i + 1;
        }

        // Analyze left vs right difference
        let leftCropPixels = 0;
        let rightCropPixels = 0;

        const sampleHeight = Math.min(100, image.height);
        const startY = Math.floor((image.height - sampleHeight) / 2);

        for (let i = 0; i < Math.min(50, Math.floor(image.width / 4)); i++) {
            let leftColDiff = 0;
            let rightColDiff = 0;
            let samples = 0;

            for (let y = startY; y < startY + sampleHeight; y += 5) {
                const leftColor = getPixelColor(i, y);
                const rightColor = getPixelColor(image.width - 1 - i, y);
                const centerLeftColor = getPixelColor(Math.floor(image.width * 0.3), y);
                const centerRightColor = getPixelColor(Math.floor(image.width * 0.7), y);

                leftColDiff += colorDistance(leftColor, centerLeftColor);
                rightColDiff += colorDistance(rightColor, centerRightColor);
                samples++;
            }

            const avgLeftDiff = leftColDiff / samples;
            const avgRightDiff = rightColDiff / samples;

            if (avgLeftDiff > 30) leftCropPixels = i + 1;
            if (avgRightDiff > 30) rightCropPixels = i + 1;
        }

        console.log('Auto-balance crop:', { top: topCropPixels, bottom: bottomCropPixels, left: leftCropPixels, right: rightCropPixels });

        const cropArea = {
            x: leftCropPixels,
            y: topCropPixels,
            width: image.width - leftCropPixels - rightCropPixels,
            height: image.height - topCropPixels - bottomCropPixels
        };

        return { cropArea, balancedImage: image };
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Handle arrow point dragging
        if (isDraggingArrowPoint && editMode === 'select') {
            const updatedAnnotations = annotations.map(ann => {
                if (ann.id === isDraggingArrowPoint.annotationId) {
                    if (isDraggingArrowPoint.point === 'start') {
                        return { ...ann, x: pos.x, y: pos.y };
                    } else {
                        return { ...ann, endX: pos.x, endY: pos.y };
                    }
                }
                return ann;
            });
            onAnnotationsChange(updatedAnnotations);
            return;
        }

        if (!isDrawing || editMode === 'select') return;

        console.log('editMode', editMode);

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

        // Reset arrow point dragging
        if (isDraggingArrowPoint) {
            setIsDraggingArrowPoint(null);
            return;
        }

        if (editMode === 'crop') {
            // Crop area is already updated in onCropAreaChange
            return;
        }

        if (currentAnnotation) {
            // Add the completed annotation to the list
            onAnnotationsChange([...annotations, currentAnnotation]);
            onCurrentAnnotationChange(null);

            // Automatically select the newly created annotation
            onSelectedAnnotationChange(currentAnnotation.id);

            // Switch to select mode to show transformer
            onEditModeChange('select');
        }
    };

    const renderAnnotation = (annotation: Annotation) => {

        const commonProps = {
            id: annotation.id,
            stroke: annotation.color,
            strokeWidth: annotation.strokeWidth || 2,
            fill: annotation.type === 'highlight' ? annotation.color : 'transparent',
            opacity: annotation.type === 'highlight' ? 0.3 : 1,
            draggable: true,
            onDragEnd: (e: any) => {
                if (annotation.id === selectedAnnotationId) {
                    const node = e.target;
                    const updatedAnnotations = annotations.map(ann => {
                        if (ann.id === annotation.id) {
                            // For circles, we need to adjust the position since the circle is rendered at center
                            // but we store the top-left corner position
                            let newX = node.x();
                            let newY = node.y();

                            if (annotation.type === 'circle') {
                                newX = node.x() - (annotation.width || 0) / 2;
                                newY = node.y() - (annotation.height || 0) / 2;
                            } else if (annotation.type === 'arrow') {
                                // For arrows, calculate the offset and apply it to both points
                                const deltaX = node.x();
                                const deltaY = node.y();

                                return {
                                    ...ann,
                                    x: annotation.x + deltaX,
                                    y: annotation.y + deltaY,
                                    endX: (annotation.endX || annotation.x) + deltaX,
                                    endY: (annotation.endY || annotation.y) + deltaY,
                                };
                            }

                            return {
                                ...ann,
                                x: newX,
                                y: newY,
                            };
                        }
                        return ann;
                    });
                    onAnnotationsChange(updatedAnnotations);

                    // Reset the arrow node position to prevent accumulating offsets
                    if (annotation.type === 'arrow') {
                        node.position({ x: 0, y: 0 });
                    }

                    // Update selected annotation
                    const updatedSelectedAnnotation = updatedAnnotations.find(ann => ann.id === annotation.id);
                    if (updatedSelectedAnnotation) {
                        onSelectedAnnotationChange(updatedSelectedAnnotation.id);
                    }
                }
            },
            onClick: () => {
                if (editMode === 'select') {
                    onSelectedAnnotationChange(annotation.id);
                }
            },
        };

        switch (annotation.type) {
            case 'rectangle':
            case 'blur':
            case 'highlight':
                return (
                    <Rect
                        {...commonProps}
                        key={annotation.id}
                        x={annotation.x}
                        y={annotation.y}
                        scaleX={annotation.scaleX || 1}
                        scaleY={annotation.scaleY || 1}
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
                        key={annotation.id}
                        x={annotation.x + (annotation.width || 0) / 2}
                        y={annotation.y + (annotation.height || 0) / 2}
                        radius={radius}
                        scaleX={annotation.scaleX || 1}
                        scaleY={annotation.scaleY || 1}
                    />
                );
            case 'arrow':
                return (
                    <Arrow
                        {...commonProps}
                        key={annotation.id}
                        points={[
                            annotation.x,
                            annotation.y,
                            annotation.endX || annotation.x,
                            annotation.endY || annotation.y
                        ]}
                        scaleX={annotation.scaleX || 1}
                        scaleY={annotation.scaleY || 1}
                        pointerLength={10}
                        pointerWidth={10}
                    />
                );
            case 'text':
                return (
                    <Text
                        key={annotation.id}
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


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            // Check file size (2MB limit)
            if (file.size > maxFileSize * 1024 * 1024) {
                alert(`File size exceeds ${maxFileSize}MB limit`);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && typeof event.target.result === 'string') {
                    setCapturedImage(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            // Check if it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Check file size (2MB limit)
            if (file.size > maxFileSize * 1024 * 1024) {
                alert(`File size exceeds ${maxFileSize}MB limit`);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && typeof event.target.result === 'string') {
                    setCapturedImage(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (!capturedImage) {
        return (
            <div 
                className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 hover:border-slate-400 hover:from-slate-100 hover:to-slate-200 cursor-pointer m-10"
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <div className="text-center p-12">
                    <div className="text-6xl mb-6 animate-pulse">📷</div>
                    <h3 className="text-slate-800 text-xl font-semibold mb-3 tracking-tight">Drag and drop a photo here</h3>
                    <p className="text-slate-500 mb-4 font-medium">or click to select a photo</p>
                    <p className="text-slate-400 text-sm bg-white/60 px-3 py-1 rounded-full inline-block backdrop-blur-sm">Max file size: {maxFileSize} MB</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 rounded-xl overflow-hidden relative bg-gradient-to-br from-white to-slate-50">
            <div className="w-full h-full flex items-center justify-center p-6">
                <div 
                    className="relative rounded-xl shadow-xl ring-1 ring-slate-200/50 bg-white backdrop-blur-sm"
                    style={{
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'center'
                    }}
                >
                    <Stage
                        ref={stageRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={handleStageMouseDown}
                        onMousemove={handleStageMouseMove}
                        onMouseup={handleStageMouseUp}
                        pixelRatio={window.devicePixelRatio || 1}
                        imageSmoothingEnabled={false}
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
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                    filters={[Konva.Filters.Blur]}
                                    blurRadius={imageAdjustments.blur}
                                />
                            ) : (
                                <Rect
                                    x={0}
                                    y={0}
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                    fill={imageAdjustments.background.type === 'solid'
                                        ? imageAdjustments.background.color || 'transparent'
                                        : undefined
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
                                                x: Math.cos((imageAdjustments.background.gradient.direction || 45) * Math.PI / 180) * canvasSize.width,
                                                y: Math.sin((imageAdjustments.background.gradient.direction || 45) * Math.PI / 180) * canvasSize.height
                                            }
                                            : undefined
                                    }
                                    fillLinearGradientColorStops={
                                        imageAdjustments.background.type === 'gradient' &&
                                            imageAdjustments.background.gradient?.type === 'linear' &&
                                            imageAdjustments.background.gradient.colors
                                            ? imageAdjustments.background.gradient.colors.flatMap((color, index) => [
                                                index / (imageAdjustments.background.gradient!.colors.length - 1),
                                                color
                                            ])
                                            : undefined
                                    }
                                    fillRadialGradientStartPoint={
                                        imageAdjustments.background.type === 'gradient' &&
                                            imageAdjustments.background.gradient?.type === 'radial'
                                            ? { x: canvasSize.width / 2, y: canvasSize.height / 2 }
                                            : undefined
                                    }
                                    fillRadialGradientEndPoint={
                                        imageAdjustments.background.type === 'gradient' &&
                                            imageAdjustments.background.gradient?.type === 'radial'
                                            ? { x: canvasSize.width / 2, y: canvasSize.height / 2 }
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
                                            ? Math.max(canvasSize.width, canvasSize.height) / 2
                                            : undefined
                                    }
                                    fillRadialGradientColorStops={
                                        imageAdjustments.background.type === 'gradient' &&
                                            imageAdjustments.background.gradient?.type === 'radial' &&
                                            imageAdjustments.background.gradient.colors
                                            ? imageAdjustments.background.gradient.colors.flatMap((color, index) => [
                                                index / (imageAdjustments.background.gradient!.colors.length - 1),
                                                color
                                            ])
                                            : undefined
                                    }
                                />
                            )}

					

                            {processedImage && (
                                <KonvaImage
                                    ref={imageRef}
                                    image={processedImage}
                                    x={imagePosition.x}
                                    y={imagePosition.y}
									width={imageDisplaySize.width}
                                    height={imageDisplaySize.height}
                                    cornerRadius={imageAdjustments.rounded}
									pixelRatio={window.devicePixelRatio || 1}
                                    shadowColor="rgba(0, 0, 0, 0.1)"
                                    shadowBlur={imageAdjustments.shadow * 2}
                                    shadowOffset={{ x: imageAdjustments.shadow / 3, y: imageAdjustments.shadow / 2 }}
                                    shadowOpacity={imageAdjustments.shadow > 0 ? 0.8 : 0}
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
                                    onTransformEnd={() => {
                                        // Update annotation position/size after transformation
                                        if (selectedAnnotationId && stageRef.current) {
                                            const selectedNode = stageRef.current.findOne(`#${selectedAnnotationId}`);
                                            if (selectedNode) {
                                                const updatedAnnotations = annotations.map(ann => {
                                                    if (ann.id === selectedAnnotationId) {
                                                        const scaleX = selectedNode.scaleX();
                                                        const scaleY = selectedNode.scaleY();

                                                        // Apply scale to dimensions and reset scale
                                                        const newWidth = (ann.width || 0);
                                                        const newHeight = (ann.height || 0);

                                                        // Handle different annotation types for transform
                                                        if (ann.type === 'circle') {
                                                            // For circles, adjust position since they're rendered at center
                                                            return {
                                                                ...ann,
                                                                x: selectedNode.x() - newWidth / 2,
                                                                y: selectedNode.y() - newHeight / 2,
                                                                scaleX,
                                                                scaleY,
                                                            };
                                                        } else {
                                                            // For rectangles and other shapes (arrows are excluded from transformer)
                                                            return {
                                                                ...ann,
                                                                x: selectedNode.x(),
                                                                y: selectedNode.y(),
                                                                width: newWidth,
                                                                scaleX,
                                                                scaleY,
                                                                height: newHeight
                                                            };
                                                        }
                                                    }
                                                    return ann;
                                                });
                                                onAnnotationsChange(updatedAnnotations);
                                            }
                                        }
                                    }}
                                />
                            )}

                            {/* Render all annotations */}
                            {annotations.map((annotation) => renderAnnotation(annotation))}

                            {/* Render current annotation being drawn (only if not in annotations array) */}
                            {currentAnnotation && !annotations.find(ann => ann.id === currentAnnotation.id) && renderAnnotation(currentAnnotation)}

                            {/* Render arrow control points for selected arrow */}
                            {selectedAnnotationId && editMode === 'select' && (() => {
                                const selectedArrow = annotations.find(ann => ann.id === selectedAnnotationId && ann.type === 'arrow');
                                if (selectedArrow) {
                                    return (
                                        <>
                                            {/* Start point control */}
                                            <Circle
                                                x={selectedArrow.x}
                                                y={selectedArrow.y}
                                                radius={6}
                                                fill="#007bff"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                name={`arrow-point-${selectedArrow.id}-start`}
                                                draggable={false}
                                                listening={true}
                                                opacity={0.9}
                                            />
                                            {/* End point control */}
                                            <Circle
                                                x={selectedArrow.endX || selectedArrow.x}
                                                y={selectedArrow.endY || selectedArrow.y}
                                                radius={6}
                                                fill="#007bff"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                name={`arrow-point-${selectedArrow.id}-end`}
                                                draggable={false}
                                                listening={true}
                                                opacity={0.9}
                                            />
                                        </>
                                    );
                                }
                                return null;
                            })()}

                            {/* Crop area */}
                            {cropArea && editMode === 'crop' && (
                                <Rect
                                    x={cropArea.x}
                                    y={cropArea.y}
                                    width={cropArea.width}
                                    height={cropArea.height}
                                    stroke="rgba(59, 130, 246, 0.8)"
                                    strokeWidth={2}
                                    dash={[8, 4]}
                                    fill="rgba(59, 130, 246, 0.05)"
                                />
                            )}


                        </Layer>
                    </Stage>
                </div>
            </div>
        </div>
    );
};

