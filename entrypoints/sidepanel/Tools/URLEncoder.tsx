import React, { useState, useEffect } from 'react';
import { useToolState } from '@/lib/toolStateContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function URLEncoder() {
    const { toolState, updateToolState } = useToolState();
    const [input, setInput] = useState(toolState.urlEncoder.input);
    const [output, setOutput] = useState(toolState.urlEncoder.output);
    const [mode, setMode] = useState<'encode' | 'decode'>(toolState.urlEncoder.mode);
    
    // Update global state when local state changes
    useEffect(() => {
        updateToolState('urlEncoder', { input, output, mode });
    }, [input, output, mode]);

    const processURL = () => {
        if (!input.trim()) {
            setOutput('');
            return;
        }

        try {
            if (mode === 'encode') {
                setOutput(encodeURIComponent(input));
            } else {
                setOutput(decodeURIComponent(input));
            }
        } catch (err) {
            setOutput('Error: Invalid URL format');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">🔗 URL Encoder/Decoder</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Encode or decode URLs and URI components for web development.
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setMode('encode')}
                        variant={mode === 'encode' ? 'default' : 'outline'}
                        className="flex-1"
                    >
                        🔒 Encode
                    </Button>
                    <Button
                        onClick={() => setMode('decode')}
                        variant={mode === 'decode' ? 'default' : 'outline'}
                        className="flex-1"
                    >
                        🔓 Decode
                    </Button>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Input {mode === 'encode' ? 'Plain Text' : 'Encoded URL'}
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-process on input change
                            if (e.target.value.trim()) {
                                try {
                                    if (mode === 'encode') {
                                        setOutput(encodeURIComponent(e.target.value));
                                    } else {
                                        setOutput(decodeURIComponent(e.target.value));
                                    }
                                } catch (err) {
                                    setOutput('Error: Invalid URL format');
                                }
                            } else {
                                setOutput('');
                            }
                        }}
                        placeholder={mode === 'encode' 
                            ? 'Enter text to encode, e.g., "Hello World!"' 
                            : 'Enter encoded URL to decode, e.g., "Hello%20World%21"'
                        }
                        className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-2">
                    <Button onClick={processURL} className="flex-1">
                        {mode === 'encode' ? '🔒 Encode' : '🔓 Decode'}
                    </Button>
                    <Button onClick={clearAll} variant="outline">
                        🗑️ Clear
                    </Button>
                </div>

                {output && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">
                                Output ({mode === 'encode' ? 'Encoded' : 'Decoded'})
                            </label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(output)}
                            >
                                📋 Copy
                            </Button>
                        </div>
                        <Card className="p-3">
                            <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                                {output}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    💡 Tips:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Encoding converts special characters to URL-safe format</li>
                    <li>• Decoding converts %XX sequences back to original characters</li>
                    <li>• Useful for query parameters and URL components</li>
                    <li>• Processing happens automatically as you type</li>
                </ul>
            </div>
        </div>
    );
}
