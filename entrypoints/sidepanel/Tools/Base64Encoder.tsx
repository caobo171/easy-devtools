import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Base64Encoder() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [error, setError] = useState('');

    const processBase64 = () => {
        if (!input.trim()) {
            setOutput('');
            setError('');
            return;
        }

        try {
            if (mode === 'encode') {
                setOutput(btoa(input));
                setError('');
            } else {
                setOutput(atob(input));
                setError('');
            }
        } catch (err) {
            setError('Error: Invalid Base64 format');
            setOutput('');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setError('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">🔐 Base64 Encoder/Decoder</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Encode text to Base64 or decode Base64 strings back to plain text.
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
                        Input {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-process on input change
                            if (e.target.value.trim()) {
                                try {
                                    if (mode === 'encode') {
                                        setOutput(btoa(e.target.value));
                                        setError('');
                                    } else {
                                        setOutput(atob(e.target.value));
                                        setError('');
                                    }
                                } catch (err) {
                                    setError('Error: Invalid Base64 format');
                                    setOutput('');
                                }
                            } else {
                                setOutput('');
                                setError('');
                            }
                        }}
                        placeholder={mode === 'encode' 
                            ? 'Enter text to encode, e.g., "Hello World!"' 
                            : 'Enter Base64 string to decode, e.g., "SGVsbG8gV29ybGQh"'
                        }
                        className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-2">
                    <Button onClick={processBase64} className="flex-1">
                        {mode === 'encode' ? '🔒 Encode' : '🔓 Decode'}
                    </Button>
                    <Button onClick={clearAll} variant="outline">
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

                {output && !error && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">
                                Output ({mode === 'encode' ? 'Base64' : 'Plain Text'})
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
                            <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-32 whitespace-pre-wrap break-all">
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
                    <li>• Base64 encoding converts binary data to ASCII text</li>
                    <li>• Commonly used for data transmission and storage</li>
                    <li>• Encoded strings are about 33% larger than original</li>
                    <li>• Processing happens automatically as you type</li>
                </ul>
            </div>
        </div>
    );
}
