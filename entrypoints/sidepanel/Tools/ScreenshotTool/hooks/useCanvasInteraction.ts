import { useCallback } from 'react';
import { CropArea, Annotation, EditMode } from '../types';

interface UseCanvasInteractionProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    capturedImage: string | null;
    editMode: EditMode;
    annotations: Annotation[];
    setAnnotations: (annotations: Annotation[]) => void;
    selectedColor: string;
    fontSize: number;
    strokeWidth: number;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    dragStart: { x: number; y: number };
    setDragStart: (start: { x: number; y: number }) => void;
    cropArea: CropArea | null;
    setCropArea: (area: CropArea | null) => void;
    currentAnnotation: Annotation | null;
    setCurrentAnnotation: (annotation: Annotation | null) => void;
    selectedAnnotationId: string | null;
    setSelectedAnnotationId: (id: string | null) => void;
    isMovingAnnotation: boolean;
    setIsMovingAnnotation: (moving: boolean) => void;
    setTextPosition: (pos: { x: number; y: number }) => void;
    setShowTextInput: (show: boolean) => void;
}

export const useCanvasInteraction = ({
    canvasRef,
    capturedImage,
    editMode,
    annotations,
    setAnnotations,
    selectedColor,
    fontSize,
    strokeWidth,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    cropArea,
    setCropArea,
    currentAnnotation,
    setCurrentAnnotation,
    selectedAnnotationId,
    setSelectedAnnotationId,
    isMovingAnnotation,
    setIsMovingAnnotation,
    setTextPosition,
    setShowTextInput
}: UseCanvasInteractionProps) => {
    
    const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        return { x, y };
    }, [canvasRef]);

    const isPointInAnnotation = useCallback((x: number, y: number, annotation: Annotation): boolean => {
        const hitPadding = 5;
        
        switch (annotation.type) {
            case 'text':
                const textWidth = annotation.text ? annotation.text.length * (annotation.fontSize || fontSize) * 0.6 : 0;
                const textHeight = (annotation.fontSize || fontSize);
                return x >= annotation.x - hitPadding && 
                       x <= annotation.x + textWidth + hitPadding && 
                       y >= annotation.y - textHeight - hitPadding && 
                       y <= annotation.y + hitPadding;
            
            case 'arrow':
                if (annotation.endX === undefined || annotation.endY === undefined) return false;
                
                const lineLength = Math.sqrt(
                    Math.pow(annotation.endX - annotation.x, 2) + 
                    Math.pow(annotation.endY - annotation.y, 2)
                );
                
                if (lineLength === 0) return false;
                
                const distance = Math.abs(
                    (annotation.endY - annotation.y) * x - 
                    (annotation.endX - annotation.x) * y + 
                    annotation.endX * annotation.y - 
                    annotation.endY * annotation.x
                ) / lineLength;
                
                return distance < hitPadding && 
                       x >= Math.min(annotation.x, annotation.endX) - hitPadding && 
                       x <= Math.max(annotation.x, annotation.endX) + hitPadding && 
                       y >= Math.min(annotation.y, annotation.endY) - hitPadding && 
                       y <= Math.max(annotation.y, annotation.endY) + hitPadding;
            
            case 'rectangle':
            case 'blur':
            case 'highlight':
                if (annotation.width === undefined || annotation.height === undefined) return false;
                
                const insideRect = 
                    x >= annotation.x - hitPadding && 
                    x <= annotation.x + annotation.width + hitPadding && 
                    y >= annotation.y - hitPadding && 
                    y <= annotation.y + annotation.height + hitPadding;
                    
                if (annotation.width < 20 || annotation.height < 20) {
                    const extraPadding = 15;
                    return x >= annotation.x - extraPadding && 
                           x <= annotation.x + annotation.width + extraPadding && 
                           y >= annotation.y - extraPadding && 
                           y <= annotation.y + annotation.height + extraPadding;
                }
                
                return insideRect;
            
            case 'circle':
                if (annotation.width === undefined || annotation.height === undefined) return false;
                
                const centerX = annotation.x + annotation.width / 2;
                const centerY = annotation.y + annotation.height / 2;
                const radius = Math.min(annotation.width, annotation.height) / 2;
                
                const distance2 = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                return distance2 <= radius + hitPadding;
            
            default:
                return false;
        }
    }, [fontSize]);

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!capturedImage) return;

        const { x, y } = getCanvasCoordinates(e);
        setDragStart({ x, y });
        
        if (editMode === 'select' || !editMode) {
            let foundAnnotation = false;
            let clickedAnnotations = [];
            
            for (let i = 0; i < annotations.length; i++) {
                const annotation = annotations[i];
                if (isPointInAnnotation(x, y, annotation)) {
                    clickedAnnotations.push(annotation);
                }
            }
            
            if (clickedAnnotations.length > 0) {
                foundAnnotation = true;
                
                if (selectedAnnotationId) {
                    const currentIndex = clickedAnnotations.findIndex(a => a.id === selectedAnnotationId);
                    
                    if (currentIndex !== -1) {
                        const nextIndex = (currentIndex + 1) % clickedAnnotations.length;
                        const nextAnnotation = clickedAnnotations[nextIndex];
                        
                        setSelectedAnnotationId(nextAnnotation.id);
                        setIsMovingAnnotation(true);
                        setIsDragging(true);
                        
                        setAnnotations(annotations.map(a => ({
                            ...a,
                            selected: a.id === nextAnnotation.id
                        })));
                    } else {
                        const firstAnnotation = clickedAnnotations[0];
                        
                        setSelectedAnnotationId(firstAnnotation.id);
                        setIsMovingAnnotation(true);
                        setIsDragging(true);
                        
                        setAnnotations(annotations.map(a => ({
                            ...a,
                            selected: a.id === firstAnnotation.id
                        })));
                    }
                } else {
                    const firstAnnotation = clickedAnnotations[0];
                    
                    setSelectedAnnotationId(firstAnnotation.id);
                    setIsMovingAnnotation(true);
                    setIsDragging(true);
                    
                    setAnnotations(annotations.map(a => ({
                        ...a,
                        selected: a.id === firstAnnotation.id
                    })));
                }
            }
            
            if (!foundAnnotation) {
                setSelectedAnnotationId(null);
                setIsMovingAnnotation(false);
                setAnnotations(annotations.map(a => ({
                    ...a,
                    selected: false
                })));
                setIsDragging(false);
            }
        } else {
            setIsDragging(true);
            
            setSelectedAnnotationId(null);
            setAnnotations(annotations.map(a => ({
                ...a,
                selected: false
            })));
            
            if (editMode === 'crop') {
                setCropArea({ x, y, width: 0, height: 0 });
            } else if (editMode === 'text') {
                setTextPosition({ x, y });
                setShowTextInput(true);
            } else if (editMode && ['arrow', 'rectangle', 'circle', 'blur', 'highlight', 'pen'].includes(editMode)) {
                const newAnnotation: Annotation = {
                    id: Date.now().toString(),
                    type: editMode as 'arrow' | 'rectangle' | 'circle' | 'blur' | 'highlight' | 'pen',
                    x,
                    y,
                    color: selectedColor,
                    strokeWidth,
                    endX: x,
                    endY: y,
                    width: 0,
                    height: 0,
                    opacity: editMode === 'highlight' ? 0.3 : 1
                };
                setCurrentAnnotation(newAnnotation);
            }
        }
    }, [capturedImage, editMode, annotations, selectedAnnotationId, selectedColor, fontSize, strokeWidth, getCanvasCoordinates, isPointInAnnotation, setDragStart, setSelectedAnnotationId, setIsMovingAnnotation, setIsDragging, setAnnotations, setCropArea, setTextPosition, setShowTextInput, setCurrentAnnotation]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !capturedImage) return;

        const { x, y } = getCanvasCoordinates(e);
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;

        if (isMovingAnnotation && selectedAnnotationId) {
            const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);
            
            if (selectedAnnotation) {
                const updatedAnnotations = annotations.map(annotation => {
                    if (annotation.id === selectedAnnotationId) {
                        const updatedAnnotation = { ...annotation };
                        
                        if (annotation.type === 'arrow') {
                            if (updatedAnnotation.endX !== undefined && updatedAnnotation.endY !== undefined && 
                                annotation.endX !== undefined && annotation.endY !== undefined) {
                                const originalOffsetX = annotation.x - dragStart.x;
                                const originalOffsetY = annotation.y - dragStart.y;
                                const endOffsetX = annotation.endX - dragStart.x;
                                const endOffsetY = annotation.endY - dragStart.y;
                                
                                updatedAnnotation.x = x + originalOffsetX;
                                updatedAnnotation.y = y + originalOffsetY;
                                updatedAnnotation.endX = x + endOffsetX;
                                updatedAnnotation.endY = y + endOffsetY;
                            }
                        } else {
                            const originalOffsetX = annotation.x - dragStart.x;
                            const originalOffsetY = annotation.y - dragStart.y;
                            
                            updatedAnnotation.x = x + originalOffsetX;
                            updatedAnnotation.y = y + originalOffsetY;
                        }
                        
                        return updatedAnnotation;
                    }
                    return annotation;
                });
                
                setAnnotations(updatedAnnotations);
            }
            
            setDragStart({ x, y });
        } else if (editMode === 'crop') {
            const width = x - dragStart.x;
            const height = y - dragStart.y;

            setCropArea({
                x: Math.min(dragStart.x, x),
                y: Math.min(dragStart.y, y),
                width: Math.abs(width),
                height: Math.abs(height)
            });
        } else if (currentAnnotation) {
            const updatedAnnotation = { ...currentAnnotation };
            
            if (editMode === 'arrow') {
                updatedAnnotation.endX = x;
                updatedAnnotation.endY = y;
            } else if (editMode === 'rectangle' || editMode === 'circle' || editMode === 'blur' || editMode === 'highlight') {
                updatedAnnotation.width = Math.abs(x - dragStart.x);
                updatedAnnotation.height = Math.abs(y - dragStart.y);
                updatedAnnotation.x = Math.min(dragStart.x, x);
                updatedAnnotation.y = Math.min(dragStart.y, y);
            }
            
            setCurrentAnnotation(updatedAnnotation);
        }
    }, [isDragging, capturedImage, dragStart, isMovingAnnotation, selectedAnnotationId, annotations, editMode, currentAnnotation, getCanvasCoordinates, setAnnotations, setDragStart, setCropArea, setCurrentAnnotation]);

    const handleCanvasMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsMovingAnnotation(false);
        
        if (currentAnnotation && editMode !== 'crop') {
            setAnnotations([...annotations, currentAnnotation]);
            setCurrentAnnotation(null);
        }
    }, [currentAnnotation, editMode, annotations, setIsDragging, setIsMovingAnnotation, setAnnotations, setCurrentAnnotation]);

    return {
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp
    };
};
