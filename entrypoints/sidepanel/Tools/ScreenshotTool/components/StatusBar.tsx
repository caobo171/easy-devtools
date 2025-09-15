import React from 'react';
import { Button } from '@/components/ui/button';

interface StatusBarProps {
    capturedImage: string | null;
    cropArea: any;
    editMode: string | null;
    currentSize?: { width: number; height: number };
}

export const StatusBar: React.FC<StatusBarProps> = ({
    capturedImage,
    cropArea,
    editMode,
    currentSize = { width: 800, height: 800 }
}) => {
    if (!capturedImage) return null;

    return (
        <div className="flex items-center justify-center p-3 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-sm">
            {/* Image info */}
            <div className="flex items-center gap-4 text-slate-600 text-sm font-medium">
                <span className="bg-slate-100 px-3 py-1 rounded-lg">
                    📐 {currentSize.width} × {currentSize.height}
                </span>
                {cropArea && editMode === 'crop' && (
                    <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                        ✂️ Selection: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                    </span>
                )}
            </div>
        </div>
    );
};
