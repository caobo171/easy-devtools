import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EditMode } from '../types';
import {
  CursorArrowRaysIcon,
  ScissorsIcon,
  DocumentTextIcon,
  ArrowUpRightIcon,
  RectangleGroupIcon,
  EllipsisHorizontalCircleIcon,
  PaintBrushIcon,
  PencilIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface ToolBarProps {
    editMode: EditMode;
    setEditMode: (mode: EditMode) => void;
    onTakeScreenshot: () => void;
    isCapturing: boolean;
    hasImage: boolean;
    onSizeChange?: (width: number, height: number) => void;
    currentSize?: { width: number; height: number };
}

const tools = [
    { id: 'select', icon: CursorArrowRaysIcon, label: 'Select', tooltip: 'Select and move annotations' },
    { id: 'crop', icon: ScissorsIcon, label: 'Crop', tooltip: 'Crop image area' },
    { id: 'text', icon: DocumentTextIcon, label: 'Text', tooltip: 'Add text annotation' },
    { id: 'arrow', icon: ArrowUpRightIcon, label: 'Arrow', tooltip: 'Draw arrow' },
    { id: 'rectangle', icon: RectangleGroupIcon, label: 'Rectangle', tooltip: 'Draw rectangle' },
    { id: 'circle', icon: EllipsisHorizontalCircleIcon, label: 'Circle', tooltip: 'Draw circle' },
    { id: 'highlight', icon: PaintBrushIcon, label: 'Highlight', tooltip: 'Highlight area' },
    { id: 'pen', icon: PencilIcon, label: 'Pen', tooltip: 'Free drawing' },
    { id: 'blur', icon: EyeSlashIcon, label: 'Blur', tooltip: 'Blur sensitive areas' },
] as const;

const sizePresets = [
    // Preset category
    { category: 'Preset', name: '16:9', width: 1920, height: 1080 },
    { category: 'Preset', name: '1:1', width: 800, height: 800 },
    { category: 'Preset', name: '4:3', width: 600, height: 400 },
    { category: 'Preset', name: '4:2', width: 800, height: 400 },
    
    // Instagram
    { category: 'Instagram', name: 'Feed - Square', width: 1080, height: 1080 },
    { category: 'Instagram', name: 'Feed - Portrait', width: 1080, height: 1350 },
    { category: 'Instagram', name: 'Stories', width: 1080, height: 1920 },
    { category: 'Instagram', name: 'Reels', width: 1080, height: 1920 },
    
    // LinkedIn
    { category: 'LinkedIn', name: 'Feed', width: 1080, height: 1080 },
    { category: 'LinkedIn', name: 'Cover (Business)', width: 2256, height: 382 },
    { category: 'LinkedIn', name: 'Cover (Personal)', width: 1584, height: 396 },
    { category: 'LinkedIn', name: 'Stories', width: 1080, height: 1920 },
    
    // X (Twitter)
    { category: 'X', name: 'One Image', width: 2400, height: 1350 },
    { category: 'X', name: 'Two Images', width: 2800, height: 3200 },
    { category: 'X', name: 'Cover', width: 2400, height: 800 },
    { category: 'X', name: 'Open Graph', width: 2400, height: 1260 },
    
    // Facebook
    { category: 'Facebook', name: 'Single Image', width: 1200, height: 630 },
    { category: 'Facebook', name: 'Two Images', width: 245, height: 245 },
    { category: 'Facebook', name: 'Three Images (Top)', width: 492, height: 245 },
    { category: 'Facebook', name: 'Event Photo', width: 1920, height: 1005 },
    { category: 'Facebook', name: 'Open Graph', width: 1200, height: 630 },
];

export const ToolBar: React.FC<ToolBarProps> = ({
    editMode,
    setEditMode,
    onTakeScreenshot,
    isCapturing,
    hasImage,
    onSizeChange,
    currentSize = { width: 800, height: 800 }
}) => {
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
    const [customWidth, setCustomWidth] = useState(currentSize.width.toString());
    const [customHeight, setCustomHeight] = useState(currentSize.height.toString());
    
    const handleSizeSelect = (width: number, height: number) => {
        if (onSizeChange) {
            onSizeChange(width, height);
        }
        setCustomWidth(width.toString());
        setCustomHeight(height.toString());
        setShowSizeDropdown(false);
    };
    
    const handleCustomSizeApply = () => {
        const width = parseInt(customWidth);
        const height = parseInt(customHeight);
        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
            handleSizeSelect(width, height);
        }
    };
    
    const groupedPresets = sizePresets.reduce((acc, preset) => {
        if (!acc[preset.category]) {
            acc[preset.category] = [];
        }
        acc[preset.category].push(preset);
        return acc;
    }, {} as Record<string, typeof sizePresets>);
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
            {/* Screenshot Button */}
            <Button
                onClick={onTakeScreenshot}
                disabled={isCapturing}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md font-medium"
            >
                {isCapturing ? '📷' : '📷'}
            </Button>
            
            <div className="w-px h-6 bg-slate-200" />
            
            {/* Size Selection Dropdown */}
            {hasImage && (
                <div className="relative">
                    <Button
                        onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                        variant="outline"
                        size="sm"
                        className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200 font-medium min-w-[120px] justify-between"
                    >
                        <span>📐 {currentSize.width}×{currentSize.height}</span>
                        <span className={`ml-2 transition-transform duration-200 ${showSizeDropdown ? 'rotate-180' : ''}`}>▼</span>
                    </Button>
                    
                    {showSizeDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-xl border border-slate-200 shadow-xl z-[9999] max-h-96 overflow-y-auto">                        
                            {/* Preset Categories */}
                            {Object.entries(groupedPresets).map(([category, presets]) => (
                                <div key={category} className="p-2">
                                    <div className="text-xs font-semibold text-slate-600 px-2 py-1 mb-1">
                                        {category === 'X' ? '𝕏' : category}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {presets.map((preset, index) => (
                                            <button
                                                key={`${category}-${index}`}
                                                onClick={() => handleSizeSelect(preset.width, preset.height)}
                                                className={`text-left p-2 rounded-lg text-sm hover:bg-slate-100 transition-colors duration-200 ${
                                                    currentSize.width === preset.width && currentSize.height === preset.height
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'text-slate-700'
                                                }`}
                                            >
                                                <div className="font-medium">{preset.name}</div>
                                                <div className="text-xs text-slate-500">{preset.width}×{preset.height}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="w-px h-6 bg-slate-200" />
            
            {/* Tools */}
            {hasImage && tools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                    <div key={tool.id} className="relative group">
                        <Button
                            onClick={() => setEditMode(editMode === tool.id ? null : tool.id as EditMode)}
                            variant="ghost"
                            size="sm"
                            className={`
                                w-10 h-10 p-0 rounded-lg transition-all duration-200
                                ${editMode === tool.id 
                                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-200' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:shadow-sm'
                                }
                            `}
                        >
                            <IconComponent className="w-5 h-5" />
                        </Button>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {tool.tooltip}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
