import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { browser } from 'wxt/browser';
import { MessageType, MessageFrom } from '@/entrypoints/types';

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Annotation {
    id: string;
    type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'blur';
    x: number;
    y: number;
    width?: number;
    height?: number;
    endX?: number;
    endY?: number;
    text?: string;
    color: string;
    fontSize?: number;
    selected?: boolean;
}

type EditMode = 'crop' | 'text' | 'arrow' | 'rectangle' | 'circle' | 'blur' | 'select' | null;

interface ScreenshotToolProps {
    initialImage?: string | null;
}

export default function ScreenshotTool({ initialImage }: ScreenshotToolProps) {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cropArea, setCropArea] = useState<CropArea | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [editMode, setEditMode] = useState<EditMode>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
    const [selectedColor, setSelectedColor] = useState('#ff0000');
    const [fontSize, setFontSize] = useState(16);
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [isMovingAnnotation, setIsMovingAnnotation] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Set initial image if provided
        if (initialImage) {
            setCapturedImage(initialImage);
        }

        // Listen for screenshot messages
        const messageListener = (message: any) => {
            if (message.messageType === MessageType.screenshotCaptured) {
                setCapturedImage(message.content);
                setIsCapturing(false);
            }
        };

        browser.runtime.onMessage.addListener(messageListener);
        return () => browser.runtime.onMessage.removeListener(messageListener);
    }, [initialImage]);

    const takeScreenshot = async () => {
        setIsCapturing(true);
        try {
            // Send message to content script to show overlay
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
                await browser.tabs.sendMessage(tabs[0].id, {
                    messageType: MessageType.takeScreenshot
                });
            }
        } catch (error) {
            console.error('Failed to initiate screenshot:', error);
            setIsCapturing(false);
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!capturedImage) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setDragStart({ x, y });
        
        // Handle selection mode or check if we're clicking on an existing annotation
        if (editMode === 'select' || !editMode) {
            // Check if we clicked on an annotation
            let foundAnnotation = false;
            let clickedAnnotations = [];
            
            // First, find all annotations that are under the click point
            for (let i = 0; i < annotations.length; i++) {
                const annotation = annotations[i];
                if (isPointInAnnotation(x, y, annotation)) {
                    clickedAnnotations.push(annotation);
                }
            }
            
            // If we found annotations under the click
            if (clickedAnnotations.length > 0) {
                foundAnnotation = true;
                
                // If the currently selected annotation is in the clicked set, find the next one in cycle
                if (selectedAnnotationId) {
                    const currentIndex = clickedAnnotations.findIndex(a => a.id === selectedAnnotationId);
                    
                    if (currentIndex !== -1) {
                        // Select the next annotation in the cycle
                        const nextIndex = (currentIndex + 1) % clickedAnnotations.length;
                        const nextAnnotation = clickedAnnotations[nextIndex];
                        
                        setSelectedAnnotationId(nextAnnotation.id);
                        setIsMovingAnnotation(true);
                        setIsDragging(true);
                        
                        // Update annotations to mark this one as selected
                        setAnnotations(annotations.map(a => ({
                            ...a,
                            selected: a.id === nextAnnotation.id
                        })));
                    } else {
                        // Current selection not in clicked set, select the first clicked one
                        const firstAnnotation = clickedAnnotations[0];
                        
                        setSelectedAnnotationId(firstAnnotation.id);
                        setIsMovingAnnotation(true);
                        setIsDragging(true);
                        
                        // Update annotations to mark this one as selected
                        setAnnotations(annotations.map(a => ({
                            ...a,
                            selected: a.id === firstAnnotation.id
                        })));
                    }
                } else {
                    // No current selection, select the first clicked one
                    const firstAnnotation = clickedAnnotations[0];
                    
                    setSelectedAnnotationId(firstAnnotation.id);
                    setIsMovingAnnotation(true);
                    setIsDragging(true);
                    
                    // Update annotations to mark this one as selected
                    setAnnotations(annotations.map(a => ({
                        ...a,
                        selected: a.id === firstAnnotation.id
                    })));
                }
            }
            
            // If we didn't click on any annotation, deselect
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
            
            // Clear any selected annotation when starting a new drawing
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
            } else if (editMode && ['arrow', 'rectangle', 'circle', 'blur'].includes(editMode)) {
                const newAnnotation: Annotation = {
                    id: Date.now().toString(),
                    type: editMode as 'arrow' | 'rectangle' | 'circle' | 'blur',
                    x,
                    y,
                    color: selectedColor,
                    endX: x,
                    endY: y,
                    width: 0,
                    height: 0
                };
                setCurrentAnnotation(newAnnotation);
            }
        }
    };

    const downloadImage = () => {
        if (!capturedImage) return;

        const canvas = canvasRef.current;
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
        if (!capturedImage) return;

        try {
            // Store the image data in browser storage
            await browser.storage.local.set({ screenshotData: capturedImage });
            
            // Open the new tab with a direct URL
            const newTab = await browser.tabs.create({
                url: '/newtab.html'
            });
            
            console.log('Opened screenshot editor in new tab:', newTab.id);
            
            // Send message to close the sidepanel
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

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !capturedImage) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate the movement delta
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;

        if (isMovingAnnotation && selectedAnnotationId) {
            // Move the selected annotation
            setAnnotations(annotations.map(annotation => {
                if (annotation.id === selectedAnnotationId) {
                    const updatedAnnotation = { ...annotation };
                    
                    // Update position based on annotation type
                    if (annotation.type === 'arrow') {
                        // For arrows, move both start and end points
                        if (updatedAnnotation.endX !== undefined && updatedAnnotation.endY !== undefined && 
                            annotation.endX !== undefined && annotation.endY !== undefined) {
                            updatedAnnotation.x = annotation.x + deltaX;
                            updatedAnnotation.y = annotation.y + deltaY;
                            updatedAnnotation.endX = annotation.endX + deltaX;
                            updatedAnnotation.endY = annotation.endY + deltaY;
                        }
                    } else {
                        // For all other types, just move the x,y position
                        updatedAnnotation.x = annotation.x + deltaX;
                        updatedAnnotation.y = annotation.y + deltaY;
                    }
                    
                    return updatedAnnotation;
                }
                return annotation;
            }));
            
            // Update drag start for the next move event
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
            } else if (editMode === 'rectangle' || editMode === 'circle' || editMode === 'blur') {
                updatedAnnotation.width = Math.abs(x - dragStart.x);
                updatedAnnotation.height = Math.abs(y - dragStart.y);
                updatedAnnotation.x = Math.min(dragStart.x, x);
                updatedAnnotation.y = Math.min(dragStart.y, y);
            }
            
            setCurrentAnnotation(updatedAnnotation);
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
        setIsMovingAnnotation(false);
        
        if (currentAnnotation && editMode !== 'crop') {
            setAnnotations(prev => [...prev, currentAnnotation]);
            setCurrentAnnotation(null);
        }
    };

    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
        // Set styles based on whether the annotation is selected
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = annotation.selected ? 3 : 2;

        switch (annotation.type) {
            case 'text':
                ctx.font = `${annotation.fontSize || fontSize}px Arial`;
                ctx.fillText(annotation.text || '', annotation.x, annotation.y);
                
                // Draw selection indicator for text
                if (annotation.selected) {
                    const textWidth = (annotation.text || '').length * (annotation.fontSize || fontSize) * 0.6;
                    const textHeight = (annotation.fontSize || fontSize);
                    
                    // Draw dashed rectangle around text
                    ctx.save();
                    ctx.strokeStyle = '#3b82f6'; // Blue selection color
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
                    // Draw arrow line
                    ctx.beginPath();
                    ctx.moveTo(annotation.x, annotation.y);
                    ctx.lineTo(annotation.endX, annotation.endY);
                    ctx.stroke();
                    
                    // Draw arrowhead
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
                    
                    // Draw selection indicators for arrow
                    if (annotation.selected) {
                        ctx.save();
                        ctx.fillStyle = '#3b82f6'; // Blue selection color
                        
                        // Draw control points at start and end
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
                
                // Draw selection indicators for rectangle
                if (annotation.selected && annotation.width !== undefined && annotation.height !== undefined) {
                    ctx.save();
                    ctx.fillStyle = '#3b82f6'; // Blue selection color
                    
                    // Draw control points at corners
                    const controlPoints = [
                        { x: annotation.x, y: annotation.y }, // Top-left
                        { x: annotation.x + annotation.width, y: annotation.y }, // Top-right
                        { x: annotation.x, y: annotation.y + annotation.height }, // Bottom-left
                        { x: annotation.x + annotation.width, y: annotation.y + annotation.height } // Bottom-right
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
                    
                    // Draw selection indicators for circle
                    if (annotation.selected) {
                        ctx.save();
                        ctx.fillStyle = '#3b82f6'; // Blue selection color
                        
                        // Draw control points at cardinal points
                        const controlPoints = [
                            { x: annotation.x, y: centerY }, // Left
                            { x: annotation.x + annotation.width, y: centerY }, // Right
                            { x: centerX, y: annotation.y }, // Top
                            { x: centerX, y: annotation.y + annotation.height } // Bottom
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
            
            case 'blur':
                if (annotation.width && annotation.height) {
                    // Create pixelated blur effect
                    const imageData = ctx.getImageData(annotation.x, annotation.y, annotation.width, annotation.height);
                    const pixelSize = 8;
                    
                    for (let y = 0; y < imageData.height; y += pixelSize) {
                        for (let x = 0; x < imageData.width; x += pixelSize) {
                            const pixelIndex = (y * imageData.width + x) * 4;
                            const r = imageData.data[pixelIndex];
                            const g = imageData.data[pixelIndex + 1];
                            const b = imageData.data[pixelIndex + 2];
                            
                            // Fill the pixel block with the same color
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
                    
                    // Draw selection indicators for blur
                    if (annotation.selected) {
                        ctx.save();
                        ctx.strokeStyle = '#3b82f6'; // Blue selection color
                        ctx.setLineDash([5, 3]);
                        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
                        
                        // Draw control points at corners
                        ctx.fillStyle = '#3b82f6';
                        const controlPoints = [
                            { x: annotation.x, y: annotation.y }, // Top-left
                            { x: annotation.x + annotation.width, y: annotation.y }, // Top-right
                            { x: annotation.x, y: annotation.y + annotation.height }, // Bottom-left
                            { x: annotation.x + annotation.width, y: annotation.y + annotation.height } // Bottom-right
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
        }
    };

    const drawImageWithAnnotations = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image || !capturedImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

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
    };

    useEffect(() => {
        if (capturedImage) {
            drawImageWithAnnotations();
        }
    }, [capturedImage, cropArea, annotations, currentAnnotation]);

    const applyCrop = () => {
        if (!cropArea || !capturedImage || !imageRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const image = imageRef.current;
        const scaleX = image.naturalWidth / canvasRef.current!.width;
        const scaleY = image.naturalHeight / canvasRef.current!.height;

        canvas.width = cropArea.width * scaleX;
        canvas.height = cropArea.height * scaleY;

        ctx.drawImage(
            image,
            cropArea.x * scaleX,
            cropArea.y * scaleY,
            cropArea.width * scaleX,
            cropArea.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const croppedDataUrl = canvas.toDataURL('image/png');
        setCapturedImage(croppedDataUrl);
        setCropArea(null);
    };


    const addTextAnnotation = () => {
        if (textInput.trim() && textPosition) {
            const newAnnotation: Annotation = {
                id: Date.now().toString(),
                type: 'text',
                x: textPosition.x,
                y: textPosition.y,
                text: textInput,
                color: selectedColor,
                fontSize: fontSize
            };
            setAnnotations(prev => [...prev, newAnnotation]);
            setTextInput('');
            setShowTextInput(false);
            setEditMode(null);
        }
    };

    const clearAnnotations = () => {
        setAnnotations([]);
        setCropArea(null);
    };

    const clearImage = () => {
        setCapturedImage(null);
        setCropArea(null);
        setAnnotations([]);
        setEditMode(null);
        setSelectedAnnotationId(null);
    };
    
    // Helper function to check if a point is inside an annotation
    const isPointInAnnotation = (x: number, y: number, annotation: Annotation): boolean => {
        // Increase hit area for all annotations
        const hitPadding = 10; // pixels of padding around elements for easier selection
        
        switch (annotation.type) {
            case 'text':
                // For text, create a virtual box around it with padding
                const textWidth = annotation.text ? annotation.text.length * (annotation.fontSize || fontSize) * 0.6 : 0;
                const textHeight = (annotation.fontSize || fontSize);
                return x >= annotation.x - hitPadding && 
                       x <= annotation.x + textWidth + hitPadding && 
                       y >= annotation.y - textHeight - hitPadding && 
                       y <= annotation.y + hitPadding;
            
            case 'arrow':
                // For arrow, check if point is near the line with increased hit area
                if (annotation.endX === undefined || annotation.endY === undefined) return false;
                
                // Calculate distance from point to line
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
                
                // Check if point is within hitPadding of the line and between the endpoints (with padding)
                return distance < hitPadding && 
                       x >= Math.min(annotation.x, annotation.endX) - hitPadding && 
                       x <= Math.max(annotation.x, annotation.endX) + hitPadding && 
                       y >= Math.min(annotation.y, annotation.endY) - hitPadding && 
                       y <= Math.max(annotation.y, annotation.endY) + hitPadding;
            
            case 'rectangle':
            case 'blur':
                // For rectangle and blur, check if point is inside or near the border
                if (annotation.width === undefined || annotation.height === undefined) return false;
                
                // Check if point is inside the rectangle (including padding)
                const insideRect = 
                    x >= annotation.x - hitPadding && 
                    x <= annotation.x + annotation.width + hitPadding && 
                    y >= annotation.y - hitPadding && 
                    y <= annotation.y + annotation.height + hitPadding;
                    
                // For very small rectangles, increase hit area further
                if (annotation.width < 20 || annotation.height < 20) {
                    const extraPadding = 15;
                    return x >= annotation.x - extraPadding && 
                           x <= annotation.x + annotation.width + extraPadding && 
                           y >= annotation.y - extraPadding && 
                           y <= annotation.y + annotation.height + extraPadding;
                }
                
                return insideRect;
            
            case 'circle':
                // For circle, check if point is inside with padding
                if (annotation.width === undefined || annotation.height === undefined) return false;
                
                const centerX = annotation.x + annotation.width / 2;
                const centerY = annotation.y + annotation.height / 2;
                const radius = Math.min(annotation.width, annotation.height) / 2;
                
                const distance2 = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                // Add padding to the radius for easier selection
                return distance2 <= radius + hitPadding;
            
            default:
                return false;
        }
    };

    const undoLastAnnotation = () => {
        setAnnotations(prev => prev.slice(0, -1));
    };

    const copyToClipboard = async () => {
        if (!capturedImage) return;

        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">📸 Screenshot Tool</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Capture, edit, and download screenshots with area selection.
                </p>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                    onClick={takeScreenshot}
                    disabled={isCapturing}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isCapturing ? '📷 Capturing...' : '📷 Take Screenshot'}
                </Button>

                {capturedImage && (
                    <>
                        <Button onClick={copyToClipboard} variant="outline">
                            📋 Copy to Clipboard
                        </Button>
                        <Button onClick={downloadImage} variant="outline">
                            💾 Download
                        </Button>
                        <Button onClick={openInNewTab} variant="outline">
                            🔗 Open in New Tab
                        </Button>
                        {cropArea && editMode === 'crop' && (
                            <Button onClick={applyCrop} variant="outline">
                                ✂️ Apply Crop
                            </Button>
                        )}
                        <Button onClick={clearImage} variant="outline">
                            🗑️ Clear
                        </Button>
                    </>
                )}
            </div>

            {/* Editing Toolbar */}
            {capturedImage && (
                <Card className="p-4 mb-4">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Editing Tools</h3>
                        
                        {/* Tool Selection */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                onClick={() => setEditMode('select')}
                                variant={editMode === 'select' ? 'default' : 'outline'}
                                size="sm"
                            >
                                ✋ Select & Move
                            </Button>
                            <Button
                                onClick={() => setEditMode('crop')}
                                variant={editMode === 'crop' ? 'default' : 'outline'}
                                size="sm"
                            >
                                ✂️ Crop
                            </Button>
                            <Button
                                onClick={() => setEditMode('text')}
                                variant={editMode === 'text' ? 'default' : 'outline'}
                                size="sm"
                            >
                                📝 Text
                            </Button>
                            <Button
                                onClick={() => setEditMode('arrow')}
                                variant={editMode === 'arrow' ? 'default' : 'outline'}
                                size="sm"
                            >
                                ➡️ Arrow
                            </Button>
                            <Button
                                onClick={() => setEditMode('rectangle')}
                                variant={editMode === 'rectangle' ? 'default' : 'outline'}
                                size="sm"
                            >
                                ⬜ Rectangle
                            </Button>
                            <Button
                                onClick={() => setEditMode('circle')}
                                variant={editMode === 'circle' ? 'default' : 'outline'}
                                size="sm"
                            >
                                ⭕ Circle
                            </Button>
                            <Button
                                onClick={() => setEditMode('blur')}
                                variant={editMode === 'blur' ? 'default' : 'outline'}
                                size="sm"
                            >
                                🔒 Blur
                            </Button>
                        </div>

                        {/* Tool Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="w-8 h-8 rounded border"
                                    />
                                    <div className="flex gap-1">
                                        {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-6 h-6 rounded border-2 ${selectedColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {editMode === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Font Size</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="48"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-sm text-gray-500">{fontSize}px</div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {annotations.length > 0 && (
                                    <Button onClick={undoLastAnnotation} variant="outline" size="sm">
                                        ↶ Undo
                                    </Button>
                                )}
                                {annotations.length > 0 && (
                                    <Button onClick={clearAnnotations} variant="outline" size="sm">
                                        🗑️ Clear All
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Current Mode Info */}
                        {editMode && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                {editMode === 'select' && '✋ Click on an annotation to select it, then drag to move it'}
                                {editMode === 'crop' && '✂️ Click and drag to select crop area'}
                                {editMode === 'text' && '📝 Click where you want to add text'}
                                {editMode === 'arrow' && '➡️ Click and drag to draw an arrow'}
                                {editMode === 'rectangle' && '⬜ Click and drag to draw a rectangle'}
                                {editMode === 'circle' && '⭕ Click and drag to draw a circle'}
                                {editMode === 'blur' && '🔒 Click and drag to blur sensitive areas'}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Text Input Modal */}
            {showTextInput && (
                <Card className="p-4 mb-4 border-blue-500">
                    <div className="space-y-3">
                        <h4 className="font-semibold">Add Text</h4>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Enter your text..."
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addTextAnnotation();
                                } else if (e.key === 'Escape') {
                                    setShowTextInput(false);
                                    setEditMode(null);
                                }
                            }}
                        />
                        <div className="flex gap-2">
                            <Button onClick={addTextAnnotation} size="sm">
                                ✅ Add Text
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowTextInput(false);
                                    setEditMode(null);
                                }} 
                                variant="outline" 
                                size="sm"
                            >
                                ❌ Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Screenshot Display Area */}
            {capturedImage && (
                <Card className="p-4">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Captured Screenshot</h3>
                            <div className="text-sm text-gray-500">
                                {cropArea ? 'Drag to select crop area' : 'Click and drag to crop'}
                            </div>
                        </div>
                        
                        <div className="relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                            <canvas
                                ref={canvasRef}
                                className="max-w-full h-auto cursor-crosshair"
                                width={800}
                                height={600}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                            />
                            
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
                                        // Adjust canvas size to maintain aspect ratio
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
                        </div>
                        
                        {cropArea && (
                            <div className="text-sm text-blue-600 dark:text-blue-400">
                                Selection: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} pixels
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    📸 How to use Screenshot Tool:
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p><strong>Taking Screenshots:</strong></p>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                                <li>Click "Take Screenshot" button</li>
                                <li>Select area on the webpage by dragging</li>
                                <li>Screenshot will appear in the tool</li>
                            </ul>
                        </div>
                        <div>
                            <p><strong>Editing & Saving:</strong></p>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                                <li>Use "Select & Move" to reposition annotations</li>
                                <li>Drag on image to select crop area</li>
                                <li>Click "Apply Crop" to crop the image</li>
                                <li>Use "Copy" or "Download" to save</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}