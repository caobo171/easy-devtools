import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionBarProps {
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

export const ActionBar: React.FC<ActionBarProps> = ({
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
        <div className="flex items-center gap-2 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm">
            <Button
                onClick={onReplaceImage}
                variant="outline"
                size="sm"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200"
            >
                Replace Image
            </Button>
            
            <Button
                onClick={onRemoveImage}
                variant="outline"
                size="sm"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200"
            >
                Remove Image ⌘D
            </Button>

            {cropArea && editMode === 'crop' && (
                <Button
                    onClick={onApplyCrop}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                    ✂️ Crop
                </Button>
            )}

            <Button
                onClick={onCopy}
                variant="outline"
                size="sm"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200"
            >
                📋 Copy ⌘C
            </Button>

            <Button
                onClick={onOpenInNewTab}
                variant="outline"
                size="sm"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200"
            >
                Upload ⌘U
            </Button>

            <Button
                onClick={onDownload}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
            >
                💾 Export ⌘E
            </Button>
        </div>
    );
};
