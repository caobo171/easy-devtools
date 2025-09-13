import { useCallback } from 'react';
import { Annotation, CropArea, EditMode, ImageAdjustments } from '../types';

interface UseCanvasDrawingProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    imageRef: React.RefObject<HTMLImageElement>;
    capturedImage: string | null;
    annotations: Annotation[];
    currentAnnotation: Annotation | null;
    cropArea: CropArea | null;
    editMode: EditMode;
    fontSize: number;
    imageAdjustments: ImageAdjustments;
}

export const useCanvasDrawing = ({
    canvasRef,
    imageRef,
    capturedImage,
    annotations,
    currentAnnotation,
    cropArea,
    editMode,
    fontSize,
    imageAdjustments
}: UseCanvasDrawingProps) => {
    const drawAnnotation = useCallback((ctx: CanvasRenderingContext2D, annotation: Annotation) => {
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth || 2;
        
        if (annotation.selected) {
            ctx.lineWidth = (annotation.strokeWidth || 2) + 1;
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 5;
        }

        switch (annotation.type) {
            case 'text':
                ctx.font = `${annotation.fontSize || fontSize}px Arial`;
                ctx.fillText(annotation.text || '', annotation.x, annotation.y);
                
                if (annotation.selected) {
                    const textWidth = (annotation.text || '').length * (annotation.fontSize || fontSize) * 0.6;
                    const textHeight = (annotation.fontSize || fontSize);
                    
                    ctx.save();
                    ctx.strokeStyle = '#3b82f6';
                    ctx.setLineDash([5, 3]);
                    ctx.strokeRect(
                        annotation.x - 5, 
                        annotation.y - textHeight, 
                        textWidth + 10, 
                        textHeight + 5
                    );
                    ctx.restore();
                }
                break;
            
            case 'arrow':
                if (annotation.endX !== undefined && annotation.endY !== undefined) {
                    ctx.beginPath();
                    ctx.moveTo(annotation.x, annotation.y);
                    ctx.lineTo(annotation.endX, annotation.endY);
                    ctx.stroke();
                    
                    const angle = Math.atan2(annotation.endY - annotation.y, annotation.endX - annotation.x);
                    const headLength = 15;
                    ctx.beginPath();
                    ctx.moveTo(annotation.endX, annotation.endY);
                    ctx.lineTo(
                        annotation.endX - headLength * Math.cos(angle - Math.PI / 6),
                        annotation.endY - headLength * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.moveTo(annotation.endX, annotation.endY);
                    ctx.lineTo(
                        annotation.endX - headLength * Math.cos(angle + Math.PI / 6),
                        annotation.endY - headLength * Math.sin(angle + Math.PI / 6)
                    );
                    ctx.stroke();
                    
                    if (annotation.selected) {
                        ctx.save();
                        ctx.fillStyle = '#3b82f6';
                        ctx.beginPath();
                        ctx.arc(annotation.x, annotation.y, 5, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(annotation.endX, annotation.endY, 5, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.restore();
                    }
                }
                break;
            
            case 'rectangle':
                ctx.strokeRect(annotation.x, annotation.y, annotation.width || 0, annotation.height || 0);
                
                if (annotation.selected && annotation.width !== undefined && annotation.height !== undefined) {
                    ctx.save();
                    ctx.fillStyle = '#3b82f6';
                    const controlPoints = [
                        { x: annotation.x, y: annotation.y },
                        { x: annotation.x + annotation.width, y: annotation.y },
                        { x: annotation.x, y: annotation.y + annotation.height },
                        { x: annotation.x + annotation.width, y: annotation.y + annotation.height }
                    ];
                    
                    controlPoints.forEach(point => {
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                        ctx.fill();
                    });
                    ctx.restore();
                }
                break;
            
            case 'circle':
                if (annotation.width && annotation.height) {
                    const centerX = annotation.x + annotation.width / 2;
                    const centerY = annotation.y + annotation.height / 2;
                    const radius = Math.min(annotation.width, annotation.height) / 2;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    
                    if (annotation.selected) {
                        ctx.save();
                        ctx.fillStyle = '#3b82f6';
                        const controlPoints = [
                            { x: annotation.x, y: centerY },
                            { x: annotation.x + annotation.width, y: centerY },
                            { x: centerX, y: annotation.y },
                            { x: centerX, y: annotation.y + annotation.height }
                        ];
                        
                        controlPoints.forEach(point => {
                            ctx.beginPath();
                            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                            ctx.fill();
                        });
                        ctx.restore();
                    }
                }
                break;

            case 'highlight':
                if (annotation.width && annotation.height) {
                    ctx.save();
                    ctx.globalAlpha = annotation.opacity || 0.3;
                    ctx.fillStyle = annotation.color;
                    ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
                    ctx.restore();
                    
                    if (annotation.selected) {
                        ctx.save();
                        ctx.strokeStyle = '#3b82f6';
                        ctx.setLineDash([5, 3]);
                        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
                        ctx.restore();
                    }
                }
                break;
            
            case 'blur':
                if (annotation.width && annotation.height) {
                    const imageData = ctx.getImageData(annotation.x, annotation.y, annotation.width, annotation.height);
                    const pixelSize = 8;
                    
                    for (let y = 0; y < imageData.height; y += pixelSize) {
                        for (let x = 0; x < imageData.width; x += pixelSize) {
                            const pixelIndex = (y * imageData.width + x) * 4;
                            const r = imageData.data[pixelIndex];
                            const g = imageData.data[pixelIndex + 1];
                            const b = imageData.data[pixelIndex + 2];
                            
                            for (let dy = 0; dy < pixelSize && y + dy < imageData.height; dy++) {
                                for (let dx = 0; dx < pixelSize && x + dx < imageData.width; dx++) {
                                    const index = ((y + dy) * imageData.width + (x + dx)) * 4;
                                    imageData.data[index] = r;
                                    imageData.data[index + 1] = g;
                                    imageData.data[index + 2] = b;
                                }
                            }
                        }
                    }
                    
                    ctx.putImageData(imageData, annotation.x, annotation.y);
                    
                    if (annotation.selected) {
                        ctx.save();
                        ctx.strokeStyle = '#3b82f6';
                        ctx.setLineDash([5, 3]);
                        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
                        ctx.restore();
                    }
                }
                break;
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }, [fontSize]);

    const drawImageWithAnnotations = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image || !capturedImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply image adjustments
        ctx.filter = `
            brightness(${imageAdjustments.brightness})
            contrast(${imageAdjustments.contrast})
            saturate(${imageAdjustments.saturation})
        `;

        // Draw the image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Reset filter for annotations
        ctx.filter = 'none';

        // Draw all annotations
        annotations.forEach(annotation => drawAnnotation(ctx, annotation));
        
        // Draw current annotation being created
        if (currentAnnotation) {
            drawAnnotation(ctx, currentAnnotation);
        }

        // Draw crop overlay
        if (cropArea && editMode === 'crop' && (cropArea.width > 0 || cropArea.height > 0)) {
            // Darken the area outside the crop
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear the crop area
            ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
            ctx.drawImage(
                image,
                cropArea.x * (image.naturalWidth / canvas.width),
                cropArea.y * (image.naturalHeight / canvas.height),
                cropArea.width * (image.naturalWidth / canvas.width),
                cropArea.height * (image.naturalHeight / canvas.height),
                cropArea.x,
                cropArea.y,
                cropArea.width,
                cropArea.height
            );

            // Draw crop border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
        }
    }, [capturedImage, cropArea, annotations, currentAnnotation, editMode, imageAdjustments, drawAnnotation]);

    return { drawImageWithAnnotations };
};
