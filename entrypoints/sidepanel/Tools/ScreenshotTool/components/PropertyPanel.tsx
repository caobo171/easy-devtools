import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EditMode, ImageAdjustments, BackgroundStyle, Annotation } from '../types';

interface PropertyPanelProps {
    editMode: EditMode;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
    annotations: Annotation[];
    fontSize: number;
    setFontSize: (size: number) => void;
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;
    imageAdjustments: ImageAdjustments;
    setImageAdjustments: (adjustments: ImageAdjustments) => void;
    onUndo: () => void;
    onClearAll: () => void;
    hasAnnotations: boolean;
    selectedAnnotationId: string | null;
    onUpdateAnnotation: (annotation: Annotation) => void;
    onRemoveSelectedAnnotation: () => void;
}

const colorPresets = [
    '#ff0000', '#ff6b35', '#f7931e', '#ffcc02', '#9bc53d',
    '#00a651', '#00bcd4', '#2196f3', '#3f51b5', '#9c27b0',
    '#e91e63', '#795548', '#607d8b', '#000000', '#ffffff'
];

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
    editMode,
    selectedColor,
    setSelectedColor,
    fontSize,
    setFontSize,
    strokeWidth,
    setStrokeWidth,
    imageAdjustments,
    setImageAdjustments,
    onUndo,
    onClearAll,
    hasAnnotations,
    annotations,
    selectedAnnotationId,
    onUpdateAnnotation,
    onRemoveSelectedAnnotation
}) => {
    const [backgroundTab, setBackgroundTab] = useState<'desktop' | 'gradient' | 'colors'>('desktop');
    const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('nature');
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    const updateAdjustment = (key: keyof ImageAdjustments, value: number | boolean | BackgroundStyle) => {
        setImageAdjustments({ ...imageAdjustments, [key]: value });
    };

    const selectedAnnotation = annotations.find(ann => ann.id === selectedAnnotationId);
    // Get effective values for the property panel
    const getEffectiveColor = () => selectedAnnotation?.color || selectedColor;
    const getEffectiveFontSize = () => selectedAnnotation?.fontSize || fontSize;
    const getEffectiveStrokeWidth = () => selectedAnnotation?.strokeWidth || strokeWidth;

    // Update annotation property
    const updateAnnotationProperty = (key: keyof Annotation, value: any) => {
        if (selectedAnnotation) {
            onUpdateAnnotation({ ...selectedAnnotation, [key]: value });
        }
    };

    // Update global property or annotation property
    const updateColorProperty = (color: string) => {
        if (selectedAnnotation) {
            updateAnnotationProperty('color', color);
        } else {
            setSelectedColor(color);
        }
    };

    const updateFontSizeProperty = (size: number) => {
        if (selectedAnnotation) {
            updateAnnotationProperty('fontSize', size);
        } else {
            setFontSize(size);
        }
    };

    const updateStrokeWidthProperty = (width: number) => {
        if (selectedAnnotation) {
            updateAnnotationProperty('strokeWidth', width);
        } else {
            setStrokeWidth(width);
        }
    };

    // Determine if we should show annotation properties
    const showAnnotationProperties = selectedAnnotation || editMode;
    const annotationType = selectedAnnotation?.type || editMode;

    // Fetch Unsplash images
    const fetchUnsplashImages = async (query: string = 'nature') => {
        setIsLoadingImages(true);
        try {
            // Using Unsplash Source API for reliable images
            const imageIds = [
                'photo-1506905925346-21bda4d32df4',
                'photo-1441974231531-c6227db76b6e', 
                'photo-1470071459604-3b5ec3a7fe05',
                'photo-1501785888041-af3ef285b470',
                'photo-1518837695005-2083093ee35b',
                'photo-1472214103451-9374bd1c798e',
                'photo-1447752875215-b2761acb3c5d',
                'photo-1433086966358-54859d0ed716'
            ];
            
            const images = imageIds.map((id, index) => ({
                id: (index + 1).toString(),
                urls: { 
                    small: `https://images.unsplash.com/${id}?w=400&h=300&fit=crop&auto=format`
                }
            }));
            
            setUnsplashImages(images);
        } catch (error) {
            console.error('Failed to fetch images:', error);
            // Fallback to solid colors if images fail
            setUnsplashImages([
                { id: '1', urls: { small: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmY5YTllIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5HcmFkaWVudCAxPC90ZXh0Pgo8L3N2Zz4K' } },
                { id: '2', urls: { small: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjYThlZGVhIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5HcmFkaWVudCAyPC90ZXh0Pgo8L3N2Zz4K' } }
            ]);
        } finally {
            setIsLoadingImages(false);
        }
    };

    useEffect(() => {
        if (backgroundTab === 'desktop') {
            fetchUnsplashImages(searchQuery);
        }
    }, [backgroundTab, searchQuery]);

    const predefinedBackgrounds = {
        desktop: unsplashImages.map(img => ({
            type: 'image' as const,
            image: img.urls.small
        })),
        gradient: [
            { type: 'gradient' as const, gradient: { type: 'linear' as const, colors: ['#ff9a9e', '#fecfef'], direction: 0 } },
            { type: 'gradient' as const, gradient: { type: 'linear' as const, colors: ['#a8edea', '#fed6e3'], direction: 45 } },
            { type: 'gradient' as const, gradient: { type: 'linear' as const, colors: ['#ffecd2', '#fcb69f'], direction: 90 } },
            { type: 'gradient' as const, gradient: { type: 'linear' as const, colors: ['#ff8a80', '#ea80fc'], direction: 135 } },
            { type: 'gradient' as const, gradient: { type: 'radial' as const, colors: ['#667eea', '#764ba2'] } },
            { type: 'gradient' as const, gradient: { type: 'radial' as const, colors: ['#f093fb', '#f5576c'] } },
            { type: 'gradient' as const, gradient: { type: 'radial' as const, colors: ['#4facfe', '#00f2fe'] } },
            { type: 'gradient' as const, gradient: { type: 'radial' as const, colors: ['#43e97b', '#38f9d7'] } }
        ],
        colors: [
            { type: 'solid' as const, color: '#ef4444' },
            { type: 'solid' as const, color: '#f97316' },
            { type: 'solid' as const, color: '#eab308' },
            { type: 'solid' as const, color: '#22c55e' },
            { type: 'solid' as const, color: '#3b82f6' },
            { type: 'solid' as const, color: '#8b5cf6' },
            { type: 'solid' as const, color: '#ec4899' },
            { type: 'solid' as const, color: '#000000' }
        ]
    };

    const getBackgroundPreview = (bg: BackgroundStyle) => {
        if (bg.type === 'solid') {
            return { backgroundColor: bg.color };
        } else if (bg.type === 'gradient' && bg.gradient) {
            const colors = bg.gradient.colors.join(', ');
            if (bg.gradient.type === 'radial') {
                return { background: `radial-gradient(circle, ${colors})` };
            } else {
                const direction = bg.gradient.direction || 45;
                return { background: `linear-gradient(${direction}deg, ${colors})` };
            }
        } else if (bg.type === 'image' && bg.image) {
            return {
                backgroundImage: `url(${bg.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            };
        }
        return {};
    };

    return (
        <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-slate-200 flex flex-col h-full shadow-lg">
            {/* Styles Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                    <h3 className="text-slate-800 font-semibold text-lg tracking-tight">
                        {selectedAnnotationId ? '✏️ Edit Annotation' : '🎨 Styles'}
                    </h3>
                    <div className="flex gap-1">
                        <Button
                            onClick={onUndo}
                            disabled={!hasAnnotations}
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-1 h-8 w-8 rounded-lg transition-all duration-200"
                            title="Undo last action"
                        >
                            ↶
                        </Button>
                        {selectedAnnotationId && (
                            <Button
                                onClick={onRemoveSelectedAnnotation}
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 h-8 w-8 rounded-lg transition-all duration-200"
                                title="Remove selected annotation"
                            >
                                ❌
                            </Button>
                        )}
                        <Button
                            onClick={onClearAll}
                            disabled={!hasAnnotations}
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-1 h-8 w-8 rounded-lg transition-all duration-200"
                            title="Reset all annotations"
                        >
                            🔄
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-white to-slate-50">

                {/* Color Picker */}
                {showAnnotationProperties && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-700 text-sm font-medium">Color</span>
                            <input
                                type="color"
                                value={getEffectiveColor()}
                                onChange={(e) => updateColorProperty(e.target.value)}
                                className="w-8 h-8 rounded-lg border-2 border-slate-300 bg-white cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                            />
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {colorPresets.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => updateColorProperty(color)}
                                    className={`
                                    w-8 h-8 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md
                                    ${getEffectiveColor() === color
                                            ? 'border-blue-500 scale-110 ring-2 ring-blue-200'
                                            : 'border-slate-300 hover:border-slate-400'
                                        }
                                `}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Tool-specific Properties */}
                {(annotationType === 'text') && (
                    <div className="space-y-3">
                        <label className="text-slate-700 text-sm font-medium">Font Size</label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="12"
                                max="72"
                                value={getEffectiveFontSize()}
                                onChange={(e) => updateFontSizeProperty(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md inline-block">{getEffectiveFontSize()}px</div>
                        </div>
                    </div>
                )}

                {(annotationType === 'arrow' || annotationType === 'rectangle' || annotationType === 'circle' || annotationType === 'pen') && (
                    <div className="space-y-3">
                        <label className="text-slate-700 text-sm font-medium">Stroke Width</label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={getEffectiveStrokeWidth()}
                                onChange={(e) => updateStrokeWidthProperty(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md inline-block">{getEffectiveStrokeWidth()}px</div>
                        </div>
                    </div>
                )}



                {/* Desktop/Gradient/Colors Tabs */}
                <div className="space-y-3">
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setBackgroundTab('desktop')}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 font-medium ${backgroundTab === 'desktop'
                                ? 'text-white bg-blue-500 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                                }`}
                        >
                            Desktop
                        </button>
                        <button
                            onClick={() => setBackgroundTab('gradient')}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 font-medium ${backgroundTab === 'gradient'
                                ? 'text-white bg-blue-500 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                                }`}
                        >
                            Gradient
                        </button>
                        <button
                            onClick={() => setBackgroundTab('colors')}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 font-medium ${backgroundTab === 'colors'
                                ? 'text-white bg-blue-500 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                                }`}
                        >
                            Colors
                        </button>
                    </div>

                    {/* Search for Unsplash images when desktop tab is active */}
                    {backgroundTab === 'desktop' && (
<>
{/* Reserve here for Unplash searching, currently not implemented */}
</>
                    )}

                    {/* Background Styles Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {predefinedBackgrounds[backgroundTab].map((bg, i) => (
                            <div
                                key={i}
                                onClick={() => updateAdjustment('background', bg)}
                                className={`aspect-square rounded-lg border cursor-pointer transition-all shadow-sm hover:shadow-md overflow-hidden ${JSON.stringify(imageAdjustments.background) === JSON.stringify(bg)
                                    ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                                    : 'border-slate-300 hover:border-slate-400'
                                    }`}
                            >
                                {bg.type === 'image' && bg.image ? (
                                    <img
                                        src={bg.image}
                                        alt="Background preview"
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            // Fallback to a placeholder or hide the image
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.style.background = '#f1f5f9';
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full"
                                        style={getBackgroundPreview(bg)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>


                    {/* Image Adjustments */}
                    <div className="space-y-4">
                        <h4 className="text-slate-800 font-semibold tracking-tight">Screenshot Adjustments</h4>

                        {/* Padding - affects canvas size */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">📏 Canvas Padding</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{imageAdjustments.padding}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={imageAdjustments.padding}
                                onChange={(e) => updateAdjustment('padding', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Brightness - main image only */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">💡 Image Brightness</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{Math.round((imageAdjustments.brightness - 1) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={imageAdjustments.brightness}
                                onChange={(e) => updateAdjustment('brightness', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Contrast - main image only */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">🔳 Image Contrast</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{Math.round((imageAdjustments.contrast - 1) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={imageAdjustments.contrast}
                                onChange={(e) => updateAdjustment('contrast', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Image Blur - main image only */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">🔒 Background Blur</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{imageAdjustments.blur}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={imageAdjustments.blur}
                                onChange={(e) => updateAdjustment('blur', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Rounded Corners - main image only */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">🔘 Image Rounded</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{imageAdjustments.rounded}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={imageAdjustments.rounded}
                                onChange={(e) => updateAdjustment('rounded', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Shadow - main image only */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">🌫️ Image Shadow</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{imageAdjustments.shadow}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={imageAdjustments.shadow}
                                onChange={(e) => updateAdjustment('shadow', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Inset */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-medium">📐 Inset</label>
                                <span className="text-slate-500 text-sm bg-slate-100 px-2 py-1 rounded-md">{imageAdjustments.inset}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={imageAdjustments.inset}
                                onChange={(e) => updateAdjustment('inset', Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Inset Balance Toggle */}
                        <div className="flex items-center justify-between">
                            <label className="text-slate-700 text-sm font-medium">⚖️ Auto Balance Inset</label>
                            <button
                                onClick={() => updateAdjustment('insetBalance', !imageAdjustments.insetBalance)}
                                className={`
                            w-12 h-6 rounded-full transition-all duration-200 shadow-sm
                            ${imageAdjustments.insetBalance ? 'bg-blue-500' : 'bg-slate-300'}
                        `}
                            >
                                <div className={`
                            w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm
                            ${imageAdjustments.insetBalance ? 'translate-x-6' : 'translate-x-0.5'}
                        `} />
                            </button>
                        </div>



                    </div>
                </div>
            </div>
        </div>
    );
};
