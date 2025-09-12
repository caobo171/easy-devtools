import React, { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { convertToReadableDate } from '@/lib/dateUtils';
import './App.css';

export default function App() {
    const [timestamp, setTimestamp] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    // Get selected text from the inspected window
    const getSelectedText = () => {
        browser.devtools.inspectedWindow.eval(
            'window.getSelection().toString()',
            (result: string, exceptionInfo: any) => {
                if (exceptionInfo) {
                    // Fallback: try to get from clipboard
                    navigator.clipboard.readText().then(text => {
                        setTimestamp(text.trim());
                        setError('');
                    }).catch(() => {
                        setError('Could not get selected text. Try copying the timestamp and clicking "Get Selected Text" again.');
                    });
                } else if (result && result.trim()) {
                    setTimestamp(result.trim());
                    setError('');
                } else {
                    // Try clipboard as fallback
                    navigator.clipboard.readText().then(text => {
                        if (text && text.trim()) {
                            setTimestamp(text.trim());
                            setError('');
                        } else {
                            setError('No text selected. Please select a timestamp in the console first.');
                        }
                    }).catch(() => {
                        setError('No text selected and clipboard access denied. Please manually enter the timestamp.');
                    });
                }
            }
        );
    };

    // Convert the timestamp
    const convertDate = () => {
        if (!timestamp.trim()) {
            setError('Please enter a timestamp first.');
            return;
        }

        const conversionResult = convertToReadableDate(timestamp);
        
        if (conversionResult.success) {
            setResult(conversionResult);
            setError('');
            
            // Copy the readable date to clipboard
            navigator.clipboard.writeText(conversionResult.convertedDate || '').then(() => {
                console.log('Readable date copied to clipboard');
            }).catch(() => {
                console.log('Could not copy to clipboard');
            });
        } else {
            setError(conversionResult.error || 'Conversion failed');
            setResult(null);
        }
    };

    // Clear all fields
    const clearAll = () => {
        setTimestamp('');
        setResult(null);
        setError('');
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            convertDate();
        }
    };

    // Listen for messages from background script
    useEffect(() => {
        const messageListener = (message: any) => {
            if (message.messageType === 'convertToReadableDate' && message.content) {
                setTimestamp(message.content);
                const conversionResult = convertToReadableDate(message.content);
                if (conversionResult.success) {
                    setResult(conversionResult);
                    setError('');
                } else {
                    setError(conversionResult.error || 'Conversion failed');
                }
            }
        };

        browser.runtime.onMessage.addListener(messageListener);
        return () => {
            browser.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    // Create devtools panel on mount
    useEffect(() => {
        browser.devtools.panels.create(
            "Date Converter",
            "/icon/32.png",
            "/entrypoints/devtools/index.html",
            (panel: any) => {
                console.log('Devtools panel created');
            }
        );
    }, []);

    return (
        <div className="devtools-container">
            <div className="devtools-panel">
                <h2>🕒 Date Converter</h2>
                
                <div className="instructions">
                    <strong>How to use:</strong><br/>
                    1. Select a timestamp in the console<br/>
                    2. Click "Get Selected Text" to auto-fill<br/>
                    3. Or manually paste/type a timestamp<br/>
                    4. Click "Convert" to see readable date
                </div>

                <div className="input-group">
                    <label htmlFor="timestamp">Timestamp:</label>
                    <input 
                        type="text" 
                        id="timestamp"
                        value={timestamp}
                        onChange={(e) => setTimestamp(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., 1704067200 or 1704067200000"
                    />
                </div>

                <div className="button-group">
                    <button onClick={getSelectedText}>📋 Get Selected Text</button>
                    <button onClick={convertDate}>🔄 Convert</button>
                    <button onClick={clearAll}>🗑️ Clear</button>
                </div>

                {error && (
                    <div className="result error">
                        ❌ {error}
                    </div>
                )}

                {result && (
                    <div className="result success">
                        <h3>✅ Conversion Successful</h3>
                        <p><strong>Original:</strong> {result.originalInput}</p>
                        <p><strong>Local Time:</strong> {result.convertedDate}</p>
                        <p><strong>ISO String:</strong> {result.isoString}</p>
                        <p><strong>UTC String:</strong> {result.utcString}</p>
                        <p><strong>Timestamp (ms):</strong> {result.timestampMs}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
