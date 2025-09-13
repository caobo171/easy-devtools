import React from 'react';
import { Button } from '@/components/ui/button';
import { EditMode, ImageAdjustments } from '../types';

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
    const updateAdjustment = (key: keyof ImageAdjustments, value: number | boolean) => {
        setImageAdjustments({ ...imageAdjustments, [key]: value });
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 space-y-6 overflow-y-auto">
            {/* Styles Header */}
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

            {/* Image Adjustments */}
            <div className="space-y-4">
                <h4 className="text-white font-medium">Image Adjustments</h4>
                
                {/* Brightness */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-300 text-sm">💡 Brightness</label>
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

                {/* Contrast */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-300 text-sm">🔳 Contrast</label>
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

                {/* Image Blur */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-300 text-sm">🔒 Image Blur</label>
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

                {/* Padding */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-300 text-sm">📏 Padding</label>
                        <span className="text-gray-400 text-sm">{imageAdjustments.padding}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={imageAdjustments.padding}
                        onChange={(e) => updateAdjustment('padding', Number(e.target.value))}
                        className="w-full accent-blue-500"
                    />
                </div>

                {/* Rounded Corners */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-300 text-sm">🔘 Rounded</label>
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

                {/* Shadow */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-300 text-sm">🌫️ Shadow</label>
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

                {/* Balance Image Toggle */}
                <div className="flex items-center justify-between">
                    <label className="text-gray-300 text-sm">⚖️ Balance Image</label>
                    <button
                        onClick={() => updateAdjustment('balanceImage', !imageAdjustments.balanceImage)}
                        className={`
                            w-12 h-6 rounded-full transition-colors duration-200
                            ${imageAdjustments.balanceImage ? 'bg-blue-500' : 'bg-gray-600'}
                        `}
                    >
                        <div className={`
                            w-5 h-5 bg-white rounded-full transition-transform duration-200
                            ${imageAdjustments.balanceImage ? 'translate-x-6' : 'translate-x-0.5'}
                        `} />
                    </button>
                </div>
            </div>

            {/* Desktop/Gradient/Colors Tabs (Visual Only) */}
            <div className="space-y-3">
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                    <button className="flex-1 py-2 px-3 text-sm text-white bg-gray-700 rounded-md">Desktop</button>
                    <button className="flex-1 py-2 px-3 text-sm text-gray-400">Gradient</button>
                    <button className="flex-1 py-2 px-3 text-sm text-gray-400">Colors</button>
                </div>
                
                {/* Background Styles Grid */}
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="aspect-square rounded-lg border border-gray-600 bg-gradient-to-br from-purple-500 to-pink-500 opacity-50 hover:opacity-100 cursor-pointer transition-opacity"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
