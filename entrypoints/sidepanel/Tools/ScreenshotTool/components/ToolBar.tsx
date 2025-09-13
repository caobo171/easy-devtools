import React from 'react';
import { Button } from '@/components/ui/button';
import { EditMode } from '../types';

interface ToolBarProps {
    editMode: EditMode;
    setEditMode: (mode: EditMode) => void;
    onTakeScreenshot: () => void;
    isCapturing: boolean;
    hasImage: boolean;
}

const tools = [
    { id: 'select', icon: '↖️', label: 'Select', tooltip: 'Select and move annotations' },
    { id: 'crop', icon: '✂️', label: 'Crop', tooltip: 'Crop image area' },
    { id: 'text', icon: '📝', label: 'Text', tooltip: 'Add text annotation' },
    { id: 'arrow', icon: '↗️', label: 'Arrow', tooltip: 'Draw arrow' },
    { id: 'rectangle', icon: '⬜', label: 'Rectangle', tooltip: 'Draw rectangle' },
    { id: 'circle', icon: '⭕', label: 'Circle', tooltip: 'Draw circle' },
    { id: 'highlight', icon: '🟨', label: 'Highlight', tooltip: 'Highlight area' },
    { id: 'pen', icon: '✏️', label: 'Pen', tooltip: 'Free drawing' },
    { id: 'blur', icon: '🔒', label: 'Blur', tooltip: 'Blur sensitive areas' },
] as const;

export const ToolBar: React.FC<ToolBarProps> = ({
    editMode,
    setEditMode,
    onTakeScreenshot,
    isCapturing,
    hasImage
}) => {
    return (
        <div className="flex items-center gap-1 p-2 bg-gray-900 rounded-lg border border-gray-700">
            {/* Screenshot Button */}
            <Button
                onClick={onTakeScreenshot}
                disabled={isCapturing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
            >
                {isCapturing ? '📷' : '📷'}
            </Button>
            
            <div className="w-px h-6 bg-gray-600 mx-2" />
            
            {/* Tools */}
            {hasImage && tools.map((tool) => (
                <Button
                    key={tool.id}
                    onClick={() => setEditMode(editMode === tool.id ? null : tool.id as EditMode)}
                    variant="ghost"
                    size="sm"
                    className={`
                        w-10 h-10 p-0 rounded-md transition-all duration-200
                        ${editMode === tool.id 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                    `}
                    title={tool.tooltip}
                >
                    <span className="text-lg">{tool.icon}</span>
                </Button>
            ))}
        </div>
    );
};
