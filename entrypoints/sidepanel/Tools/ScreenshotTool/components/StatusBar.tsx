import React from 'react';
import { Button } from '@/components/ui/button';

interface StatusBarProps {
    capturedImage: string | null;
    cropArea: any;
    onCopy: () => void;
    onDownload: () => void;
    onOpenInNewTab: () => void;
    onApplyCrop: () => void;
    onReplaceImage: () => void;
    onRemoveImage: () => void;
    editMode: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    capturedImage,
    cropArea,
    onCopy,
    onDownload,
    onOpenInNewTab,
    onApplyCrop,
    onReplaceImage,
    onRemoveImage,
    editMode
}) => {
    if (!capturedImage) return null;

    return (
        <div className="flex items-center justify-between p-4 bg-gray-900 border-t border-gray-700">
            {/* Left side - Image info */}
            <div className="flex items-center gap-4 text-gray-300 text-sm">
                <span>1:1 800x800</span>
                {cropArea && editMode === 'crop' && (
                    <span className="text-blue-400">
                        Selection: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                    </span>
                )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={onReplaceImage}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                    Replace Image
                </Button>
                
                <Button
                    onClick={onRemoveImage}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                    Remove Image ⌘D
                </Button>

                {cropArea && editMode === 'crop' && (
                    <Button
                        onClick={onApplyCrop}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        ✂️ Crop
                    </Button>
                )}

                <Button
                    onClick={onCopy}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                    📋 Copy ⌘C
                </Button>

                <Button
                    onClick={onOpenInNewTab}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                    Upload ⌘U
                </Button>

                <Button
                    onClick={onDownload}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    💾 Export ⌘E
                </Button>
            </div>
        </div>
    );
};
