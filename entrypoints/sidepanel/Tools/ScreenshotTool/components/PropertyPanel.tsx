import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EditMode, ImageAdjustments, BackgroundStyle } from '../types';

interface PropertyPanelProps {
    editMode: EditMode;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;
    imageAdjustments: ImageAdjustments;
    setImageAdjustments: (adjustments: ImageAdjustments) => void;
    onUndo: () => void;
    onClearAll: () => void;
    hasAnnotations: boolean;
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
    hasAnnotations
}) => {
    const [backgroundTab, setBackgroundTab] = useState<'desktop' | 'gradient' | 'colors'>('desktop');
    const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('nature');
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    const updateAdjustment = (key: keyof ImageAdjustments, value: number | boolean | BackgroundStyle) => {
        setImageAdjustments({ ...imageAdjustments, [key]: value });
    };

    // Fetch Unsplash images
    const fetchUnsplashImages = async (query: string = 'nature') => {
        setUnsplashImages([
            { id: '1', urls: { small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' } },
            { id: '2', urls: { small: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' } },
            { id: '3', urls: { small: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400' } },
            { id: '4', urls: { small: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400' } },
            { id: '5', urls: { small: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400' } },
            { id: '6', urls: { small: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400' } },
            { id: '7', urls: { small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' } },
            { id: '8', urls: { small: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' } }
        ]);
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
                backgroundPosition: 'center'
            };
        }
        return {};
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
            {/* Styles Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">🎨 Styles</h3>
                    <div className="flex gap-1">
                        <Button
                            onClick={onUndo}
                            disabled={!hasAnnotations}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white p-1 h-8 w-8"
                            title="Undo last action"
                        >
                            ↶
                        </Button>
                        <Button
                            onClick={onClearAll}
                            disabled={!hasAnnotations}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white p-1 h-8 w-8"
                            title="Clear all annotations"
                        >
                            🗑️
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Color Picker */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-sm font-medium">Color</span>
                        <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-8 h-8 rounded border-2 border-gray-600 bg-transparent cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {colorPresets.map((color) => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`
                                w-8 h-8 rounded border-2 transition-all duration-200
                                ${selectedColor === color
                                        ? 'border-blue-400 scale-110'
                                        : 'border-gray-600 hover:border-gray-400'
                                    }
                            `}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>

                {/* Tool-specific Properties */}
                {(editMode === 'text') && (
                    <div className="space-y-3">
                        <label className="text-gray-300 text-sm font-medium">Font Size</label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="12"
                                max="72"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="text-gray-400 text-sm">{fontSize}px</div>
                        </div>
                    </div>
                )}

                {(editMode === 'arrow' || editMode === 'rectangle' || editMode === 'circle' || editMode === 'pen') && (
                    <div className="space-y-3">
                        <label className="text-gray-300 text-sm font-medium">Stroke Width</label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="text-gray-400 text-sm">{strokeWidth}px</div>
                        </div>
                    </div>
                )}



                {/* Desktop/Gradient/Colors Tabs */}
                <div className="space-y-3">
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setBackgroundTab('desktop')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${backgroundTab === 'desktop'
                                ? 'text-white bg-gray-700'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Desktop
                        </button>
                        <button
                            onClick={() => setBackgroundTab('gradient')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${backgroundTab === 'gradient'
                                ? 'text-white bg-gray-700'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Gradient
                        </button>
                        <button
                            onClick={() => setBackgroundTab('colors')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${backgroundTab === 'colors'
                                ? 'text-white bg-gray-700'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Colors
                        </button>
                    </div>

                    {/* Search for Unsplash images when desktop tab is active */}
                    {backgroundTab === 'desktop' && (
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && fetchUnsplashImages(searchQuery)}
                                    placeholder="Search images..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={() => fetchUnsplashImages(searchQuery)}
                                    disabled={isLoadingImages}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
                                >
                                    🔍
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>📷 Search Unsplash</span>
                                {isLoadingImages && <span>Loading...</span>}
                            </div>
                        </div>
                    )}

                    {/* Background Styles Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {predefinedBackgrounds[backgroundTab].map((bg, i) => (
                            <div
                                key={i}
                                onClick={() => updateAdjustment('background', bg)}
                                className={`aspect-square rounded-lg border cursor-pointer transition-all ${JSON.stringify(imageAdjustments.background) === JSON.stringify(bg)
                                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                                    : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                style={getBackgroundPreview(bg)}
                            />
                        ))}
                    </div>


                    {/* Image Adjustments */}
                    <div className="space-y-4">
                        <h4 className="text-white font-medium">Screenshot Adjustments</h4>

                        {/* Padding - affects canvas size */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-gray-300 text-sm">📏 Canvas Padding</label>
                                <span className="text-gray-400 text-sm">{imageAdjustments.padding}px</span>
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
                                <label className="text-gray-300 text-sm">💡 Image Brightness</label>
                                <span className="text-gray-400 text-sm">{Math.round((imageAdjustments.brightness - 1) * 100)}%</span>
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
                                <label className="text-gray-300 text-sm">🔳 Image Contrast</label>
                                <span className="text-gray-400 text-sm">{Math.round((imageAdjustments.contrast - 1) * 100)}%</span>
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
                                <label className="text-gray-300 text-sm">🔒 Background Blur</label>
                                <span className="text-gray-400 text-sm">{imageAdjustments.blur}px</span>
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
                                <label className="text-gray-300 text-sm">🔘 Image Rounded</label>
                                <span className="text-gray-400 text-sm">{imageAdjustments.rounded}px</span>
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
                                <label className="text-gray-300 text-sm">🌫️ Image Shadow</label>
                                <span className="text-gray-400 text-sm">{imageAdjustments.shadow}</span>
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
                                <label className="text-gray-300 text-sm">📐 Inset</label>
                                <span className="text-gray-400 text-sm">{imageAdjustments.inset}px</span>
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
                            <label className="text-gray-300 text-sm">⚖️ Auto Balance Inset</label>
                            <button
                                onClick={() => updateAdjustment('insetBalance', !imageAdjustments.insetBalance)}
                                className={`
                            w-12 h-6 rounded-full transition-colors duration-200
                            ${imageAdjustments.insetBalance ? 'bg-blue-500' : 'bg-gray-600'}
                        `}
                            >
                                <div className={`
                            w-5 h-5 bg-white rounded-full transition-transform duration-200
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
