import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface JSONTreeProps {
    data: any;
    name?: string;
    level?: number;
}

const JSONTree: React.FC<JSONTreeProps> = ({ data, name, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
    
    const indent = level * 20;
    
    const getValueType = (value: any): string => {
        if (value === null) return 'null';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return 'unknown';
    };
    
    const getValueColor = (type: string): string => {
        switch (type) {
            case 'string': return 'text-green-600 dark:text-green-400';
            case 'number': return 'text-blue-600 dark:text-blue-400';
            case 'boolean': return 'text-purple-600 dark:text-purple-400';
            case 'null': return 'text-gray-500 dark:text-gray-400';
            default: return 'text-gray-800 dark:text-gray-200';
        }
    };
    
    const renderValue = (value: any, key?: string) => {
        const type = getValueType(value);
        const colorClass = getValueColor(type);
        
        if (type === 'object' && value !== null) {
            const keys = Object.keys(value);
            return (
                <div>
                    <div 
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1"
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ paddingLeft: `${indent}px` }}
                    >
                        <span className="mr-2 text-gray-500 select-none">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                        {key && (
                            <span className="text-blue-800 dark:text-blue-300 font-medium">
                                "{key}":
                            </span>
                        )}
                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {isExpanded ? '{' : `{ ${keys.length} items }`}
                        </span>
                    </div>
                    {isExpanded && (
                        <div>
                            {keys.map((objKey, index) => (
                                <JSONTree 
                                    key={objKey} 
                                    data={value[objKey]} 
                                    name={objKey} 
                                    level={level + 1} 
                                />
                            ))}
                            <div style={{ paddingLeft: `${indent + 20}px` }} className="text-gray-600 dark:text-gray-400">
                                {'}'}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        
        if (type === 'array') {
            return (
                <div>
                    <div 
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1"
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ paddingLeft: `${indent}px` }}
                    >
                        <span className="mr-2 text-gray-500 select-none">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                        {key && (
                            <span className="text-blue-800 dark:text-blue-300 font-medium">
                                "{key}":
                            </span>
                        )}
                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {isExpanded ? '[' : `[ ${value.length} items ]`}
                        </span>
                    </div>
                    {isExpanded && (
                        <div>
                            {value.map((item: any, index: number) => (
                                <JSONTree 
                                    key={index} 
                                    data={item} 
                                    name={index.toString()} 
                                    level={level + 1} 
                                />
                            ))}
                            <div style={{ paddingLeft: `${indent + 20}px` }} className="text-gray-600 dark:text-gray-400">
                                ]
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        
        // Primitive values
        return (
            <div 
                className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1"
                style={{ paddingLeft: `${indent}px` }}
            >
                <span className="mr-2 text-transparent select-none">▶</span>
                {key && (
                    <span className="text-blue-800 dark:text-blue-300 font-medium">
                        "{key}":
                    </span>
                )}
                <span className={`ml-1 ${colorClass}`}>
                    {type === 'string' ? `"${value}"` : String(value)}
                </span>
            </div>
        );
    };
    
    return renderValue(data, name);
};

export default function BeautifyJSON() {
    const [input, setInput] = useState('');
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'tree' | 'text'>('tree');

    const processJSON = () => {
        if (!input.trim()) {
            setError('Please enter JSON to process');
            setParsedData(null);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            setParsedData(parsed);
            setError('');
        } catch (err) {
            setError('Invalid JSON format');
            setParsedData(null);
        }
    };

    const getFormattedJSON = () => {
        if (!parsedData) return '';
        return JSON.stringify(parsedData, null, 2);
    };

    const getMinifiedJSON = () => {
        if (!parsedData) return '';
        return JSON.stringify(parsedData);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const clearAll = () => {
        setInput('');
        setParsedData(null);
        setError('');
    };

    const loadSample = () => {
        const sampleJSON = {
            "name": "John Doe",
            "age": 30,
            "isActive": true,
            "address": {
                "street": "123 Main St",
                "city": "New York",
                "zipCode": "10001",
                "coordinates": {
                    "lat": 40.7128,
                    "lng": -74.0060
                }
            },
            "hobbies": ["reading", "swimming", "coding"],
            "projects": [
                {
                    "name": "Project A",
                    "status": "completed",
                    "technologies": ["React", "Node.js", "MongoDB"]
                },
                {
                    "name": "Project B", 
                    "status": "in-progress",
                    "technologies": ["Vue.js", "Express", "PostgreSQL"]
                }
            ],
            "metadata": null
        };
        setInput(JSON.stringify(sampleJSON));
        setParsedData(sampleJSON);
        setError('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">🎨 Interactive JSON Viewer</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Parse and explore JSON with interactive tree view, syntax highlighting, and collapsible sections.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Input JSON
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='Enter JSON here, e.g., {"name":"John","age":30}'
                        className="w-full h-40 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-2">
                    <Button onClick={processJSON} className="flex-1">
                        🔍 Parse JSON
                    </Button>
                    <Button onClick={loadSample} variant="outline">
                        📄 Load Sample
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

                {parsedData && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">
                                Interactive JSON Tree
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    variant={viewMode === 'tree' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('tree')}
                                >
                                    🌳 Tree
                                </Button>
                                <Button
                                    variant={viewMode === 'text' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('text')}
                                >
                                    📄 Text
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(getFormattedJSON())}
                                >
                                    📋 Copy Formatted
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(getMinifiedJSON())}
                                >
                                    📦 Copy Minified
                                </Button>
                            </div>
                        </div>
                        <Card className="p-3">
                            {viewMode === 'tree' ? (
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
                                    <JSONTree data={parsedData} />
                                </div>
                            ) : (
                                <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-96">
                                    {getFormattedJSON()}
                                </pre>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    💡 Interactive Features:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Tree View:</strong> Click ▶/▼ to expand/collapse objects and arrays</li>
                    <li>• <strong>Syntax Highlighting:</strong> Different colors for strings, numbers, booleans, null</li>
                    <li>• <strong>Hover Effects:</strong> Interactive elements highlight on hover</li>
                    <li>• <strong>Copy Options:</strong> Copy as formatted or minified JSON</li>
                    <li>• <strong>Auto-expand:</strong> First 2 levels expand automatically for better visibility</li>
                </ul>
            </div>
        </div>
    );
}