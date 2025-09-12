import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { browser } from 'wxt/browser';
import ExtMessage, { MessageType } from '@/entrypoints/types';
import { useToolState } from '@/lib/toolStateContext';

export default function DateFormat() {
    const { toolState, updateToolState } = useToolState();
    const inputDate = toolState.convertToReadableDate?.input || '';
    const [results, setResults] = useState<Array<{format: string, value: string}>>([]);

    const formatDate = (dateInput?: string) => {
        const inputToUse = dateInput || inputDate;
        if (!inputToUse.trim()) return;

        let date: Date;
        
        // Try to parse the input as different formats
        if (/^\d+$/.test(inputToUse)) {
            // Unix timestamp (seconds or milliseconds)
            const timestamp = parseInt(inputToUse);
            date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
        } else {
            // Regular date string
            date = new Date(inputToUse);
        }

        if (isNaN(date.getTime())) {
            setResults([{format: 'Error', value: 'Invalid date format'}]);
            return;
        }

        const formats = [
            { format: 'ISO String', value: date.toISOString() },
            { format: 'Local String', value: date.toString() },
            { format: 'Date Only', value: date.toDateString() },
            { format: 'Time Only', value: date.toTimeString() },
            { format: 'UTC String', value: date.toUTCString() },
            { format: 'Unix Timestamp (s)', value: Math.floor(date.getTime() / 1000).toString() },
            { format: 'Unix Timestamp (ms)', value: date.getTime().toString() },
            { format: 'Locale String', value: date.toLocaleString() },
            { format: 'Locale Date', value: date.toLocaleDateString() },
            { format: 'Locale Time', value: date.toLocaleTimeString() },
        ];

        setResults(formats);
    };

    useEffect(() => {
        const messageListener = (message: ExtMessage) => {
            if (message.messageType === MessageType.convertToReadableDateInSidepanel && message.content) {
                // Auto-fill the input with selected text
                updateToolState('convertToReadableDate', { input: message.content });
                // Auto-run the conversion
                formatDate(message.content);
            }
        };

        browser.runtime.onMessage.addListener(messageListener);

        return () => {
            browser.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">📅 Date Format Converter</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Convert dates between different formats. Enter a date, timestamp, or date string.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Input Date/Timestamp
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={inputDate}
                            onChange={(e) => updateToolState('convertToReadableDate', { input: e.target.value })}
                            placeholder="e.g., 2024-01-01, 1704067200, or Jan 1 2024"
                            className="flex-1"
                        />
                        <Button onClick={() => formatDate(inputDate)}>
                            Convert
                        </Button>
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Results:</h3>
                        {results.map((result, index) => (
                            <Card key={index} className="p-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {result.format}
                                        </div>
                                        <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                                            {result.value}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(result.value)}
                                        className="ml-2"
                                    >
                                        Copy
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
                    <li>• Enter Unix timestamps (with or without milliseconds)</li>
                    <li>• Use standard date formats like "2024-01-01" or "Jan 1, 2024"</li>
                    <li>• Click "Copy" to copy any format to your clipboard</li>
                </ul>
            </div>
        </div>
    );
}