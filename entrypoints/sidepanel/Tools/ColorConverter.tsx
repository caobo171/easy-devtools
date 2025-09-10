import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ColorConverter() {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<Array<{format: string, value: string, color?: string}>>([]);
    const [error, setError] = useState('');

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };

    const hslToRgb = (h: number, s: number, l: number) => {
        h /= 360;
        s /= 100;
        l /= 100;
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    };

    const convertColor = () => {
        if (!input.trim()) {
            setResults([]);
            setError('');
            return;
        }

        const trimmedInput = input.trim().toLowerCase();
        let rgb = { r: 0, g: 0, b: 0 };
        let isValid = false;

        try {
            // Try HEX format
            if (trimmedInput.match(/^#?[0-9a-f]{6}$/i)) {
                const hexResult = hexToRgb(trimmedInput);
                if (hexResult) {
                    rgb = hexResult;
                    isValid = true;
                }
            }
            // Try RGB format
            else if (trimmedInput.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/)) {
                const matches = trimmedInput.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (matches) {
                    rgb = {
                        r: parseInt(matches[1]),
                        g: parseInt(matches[2]),
                        b: parseInt(matches[3])
                    };
                    if (rgb.r <= 255 && rgb.g <= 255 && rgb.b <= 255) {
                        isValid = true;
                    }
                }
            }
            // Try HSL format
            else if (trimmedInput.match(/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/)) {
                const matches = trimmedInput.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
                if (matches) {
                    const h = parseInt(matches[1]);
                    const s = parseInt(matches[2]);
                    const l = parseInt(matches[3]);
                    if (h <= 360 && s <= 100 && l <= 100) {
                        rgb = hslToRgb(h, s, l);
                        isValid = true;
                    }
                }
            }

            if (!isValid) {
                setError('Invalid color format. Use HEX (#FF0000), RGB (rgb(255,0,0)), or HSL (hsl(0,100%,50%))');
                setResults([]);
                return;
            }

            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

            const colorResults = [
                { format: 'HEX', value: hex.toUpperCase(), color: hex },
                { format: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, color: hex },
                { format: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, color: hex },
                { format: 'RGB Values', value: `R: ${rgb.r}, G: ${rgb.g}, B: ${rgb.b}`, color: hex },
                { format: 'CSS RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, color: hex },
                { format: 'CSS HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, color: hex },
            ];

            setResults(colorResults);
            setError('');
        } catch (err) {
            setError('Error processing color format');
            setResults([]);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const clearAll = () => {
        setInput('');
        setResults([]);
        setError('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">🎨 Color Converter</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Convert colors between HEX, RGB, and HSL formats with live preview.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Input Color
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g., #FF0000, rgb(255,0,0), or hsl(0,100%,50%)"
                            className="flex-1"
                        />
                        <Button onClick={convertColor}>
                            🎨 Convert
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={clearAll} variant="outline" className="flex-1">
                        🗑️ Clear
                    </Button>
                </div>

                {error && (
                    <Card className="p-3 border-red-200 bg-red-50 dark:bg-red-900/20">
                        <div className="text-red-600 dark:text-red-400 text-sm">
                            ❌ {error}
                        </div>
                    </Card>
                )}

                {results.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Color Formats:</h3>
                        
                        {/* Color Preview */}
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-inner"
                                    style={{ backgroundColor: results[0]?.color }}
                                ></div>
                                <div>
                                    <h4 className="font-semibold">Color Preview</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This is how your color looks
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {results.map((result, index) => (
                            <Card key={index} className="p-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 flex items-center gap-3">
                                        <div 
                                            className="w-6 h-6 rounded border border-gray-300"
                                            style={{ backgroundColor: result.color }}
                                        ></div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {result.format}
                                            </div>
                                            <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {result.value}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(result.value)}
                                        className="ml-2"
                                    >
                                        📋 Copy
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    💡 Tips:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• HEX: #FF0000 (hexadecimal format)</li>
                    <li>• RGB: rgb(255, 0, 0) (red, green, blue values)</li>
                    <li>• HSL: hsl(0, 100%, 50%) (hue, saturation, lightness)</li>
                    <li>• All formats are converted and displayed with preview</li>
                </ul>
            </div>
        </div>
    );
}
