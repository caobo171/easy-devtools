import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateConversionResult } from '@/lib/dateUtils';
import { Copy, X } from 'lucide-react';

interface DatePopupProps {
    result: DateConversionResult;
    position: { x: number; y: number };
    onClose: () => void;
}

export const DatePopup: React.FC<DatePopupProps> = ({ result, position, onClose }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here
            console.log('Copied to clipboard:', text);
        });
    };

    if (!result.success) {
        return (
            <div 
                className="fixed z-[1000000001] bg-background border border-red-300 rounded-lg shadow-lg p-4 max-w-sm"
                style={{ 
                    left: `${position.x}px`, 
                    top: `${position.y}px`,
                    transform: 'translate(-50%, -100%)'
                }}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-red-600">Date Conversion Failed</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                    Original text: "{result.originalText}"
                </p>
                <p className="text-sm text-red-600">{result.error}</p>
            </div>
        );
    }

    return (
        <div 
            className="fixed z-[1000000001] bg-background border border-border rounded-lg shadow-lg p-4 max-w-md"
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Date Conversion</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="space-y-3">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Original text:</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded text-foreground">
                        "{result.originalText}"
                    </p>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-1">Primary format:</p>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground flex-1">
                            {result.convertedDate}
                        </p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyToClipboard(result.convertedDate!)}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {result.formats && result.formats.length > 1 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">All formats:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {result.formats.map((format, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                    <span className="font-mono bg-muted p-1 rounded flex-1 text-foreground">
                                        {format}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => copyToClipboard(format)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
