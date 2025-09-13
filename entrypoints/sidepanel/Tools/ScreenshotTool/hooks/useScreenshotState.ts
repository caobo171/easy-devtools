import { useState, useRef, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { MessageType, MessageFrom } from '@/entrypoints/types';
import { CropArea, Annotation, EditMode, ImageAdjustments } from '../types';

export const useScreenshotState = (initialImage?: string | null) => {
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
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [isMovingAnnotation, setIsMovingAnnotation] = useState(false);
    const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments>({
        brightness: 1,
        contrast: 1,
        saturation: 1,
        blur: 0,
        padding: 0,
        rounded: 0,
        shadow: 0,
        balanceImage: false
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (initialImage) {
            setCapturedImage(initialImage);
        }

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
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
                await browser.tabs.sendMessage(tabs[0].id, {
                    messageType: MessageType.takeScreenshot
                });
                
                try {
                    await browser.runtime.sendMessage({
                        messageType: MessageType.closeSidepanel,
                        from: MessageFrom.sidePanel
                    });
                } catch (sidePanelError) {
                    console.error('Failed to close sidepanel:', sidePanelError);
                }
            }
        } catch (error) {
            console.error('Failed to initiate screenshot:', error);
            setIsCapturing(false);
        }
    };

    const clearImage = () => {
        setCapturedImage(null);
        setCropArea(null);
        setAnnotations([]);
        setEditMode(null);
        setSelectedAnnotationId(null);
        setImageAdjustments({
            brightness: 1,
            contrast: 1,
            saturation: 1,
            blur: 0,
            padding: 0,
            rounded: 0,
            shadow: 0,
            balanceImage: false
        });
    };

    const clearAnnotations = () => {
        setAnnotations([]);
        setCropArea(null);
        setSelectedAnnotationId(null);
    };

    const undoLastAnnotation = () => {
        setAnnotations(prev => prev.slice(0, -1));
    };

    return {
        // State
        capturedImage,
        setCapturedImage,
        isCapturing,
        setIsCapturing,
        cropArea,
        setCropArea,
        isDragging,
        setIsDragging,
        dragStart,
        setDragStart,
        editMode,
        setEditMode,
        annotations,
        setAnnotations,
        currentAnnotation,
        setCurrentAnnotation,
        selectedColor,
        setSelectedColor,
        fontSize,
        setFontSize,
        strokeWidth,
        setStrokeWidth,
        textInput,
        setTextInput,
        showTextInput,
        setShowTextInput,
        textPosition,
        setTextPosition,
        selectedAnnotationId,
        setSelectedAnnotationId,
        isMovingAnnotation,
        setIsMovingAnnotation,
        imageAdjustments,
        setImageAdjustments,
        
        // Refs
        canvasRef,
        imageRef,
        
        // Actions
        takeScreenshot,
        clearImage,
        clearAnnotations,
        undoLastAnnotation
    };
};
