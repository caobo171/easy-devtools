import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HashGenerator() {
    const [input, setInput] = useState('');
    const [hashes, setHashes] = useState<Array<{name: string, value: string}>>([]);

    // Simple hash functions (for demonstration - in production, use crypto libraries)
    const generateMD5 = async (text: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null);
        if (!hashBuffer) return 'MD5 not supported in this browser';
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const generateSHA1 = async (text: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const generateSHA256 = async (text: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const generateSHA512 = async (text: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const generateHashes = async () => {
        if (!input.trim()) {
            setHashes([]);
            return;
        }

        const results = [];
        
        try {
            // Try MD5 first (might not be supported in all browsers)
            try {
                const md5 = await generateMD5(input);
                results.push({ name: 'MD5', value: md5 });
            } catch {
                results.push({ name: 'MD5', value: 'Not supported in this browser' });
            }

            const sha1 = await generateSHA1(input);
            results.push({ name: 'SHA-1', value: sha1 });

            const sha256 = await generateSHA256(input);
            results.push({ name: 'SHA-256', value: sha256 });

            const sha512 = await generateSHA512(input);
            results.push({ name: 'SHA-512', value: sha512 });

            setHashes(results);
        } catch (error) {
            setHashes([{ name: 'Error', value: 'Failed to generate hashes' }]);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const clearAll = () => {
        setInput('');
        setHashes([]);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">🔐 Hash Generator</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from your input text.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Input Text
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-generate hashes on input change
                            if (e.target.value.trim()) {
                                generateHashes();
                            } else {
                                setHashes([]);
                            }
                        }}
                        placeholder="Enter text to hash, e.g., 'Hello World!'"
                        className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-2">
                    <Button onClick={generateHashes} className="flex-1">
                        🔐 Generate Hashes
                    </Button>
                    <Button onClick={clearAll} variant="outline">
                        🗑️ Clear
                    </Button>
                </div>

                {hashes.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Generated Hashes:</h3>
                        {hashes.map((hash, index) => (
                            <Card key={index} className="p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {hash.name}
                                        </div>
                                        <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                                            {hash.value}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(hash.value)}
                                        className="ml-2 flex-shrink-0"
                                        disabled={hash.value.includes('not supported') || hash.value.includes('Failed')}
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
                    <li>• MD5 is fast but not cryptographically secure</li>
                    <li>• SHA-1 is deprecated for security applications</li>
                    <li>• SHA-256 and SHA-512 are recommended for security</li>
                    <li>• Hashes are generated automatically as you type</li>
                    <li>• Use for data integrity, passwords, and digital signatures</li>
                </ul>
            </div>
        </div>
    );
}
