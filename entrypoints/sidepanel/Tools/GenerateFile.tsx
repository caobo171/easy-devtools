import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// File type options
interface FileTypeOption {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

// Size unit options
interface SizeUnit {
  id: string;
  name: string;
  bytes: number;
}

export default function GenerateFile() {
  // State
  const [fileType, setFileType] = useState<string>('binary');
  const [fileName, setFileName] = useState<string>('test-file');
  const [fileSize, setFileSize] = useState<number>(1);
  const [sizeUnit, setSizeUnit] = useState<string>('mb');
  const [generating, setGenerating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  // Available file types
  const fileTypes: FileTypeOption[] = [
    {
      id: 'binary',
      name: 'Binary File',
      extension: 'bin',
      mimeType: 'application/octet-stream'
    },
    {
      id: 'text',
      name: 'Text File',
      extension: 'txt',
      mimeType: 'text/plain'
    },
    {
      id: 'json',
      name: 'JSON File',
      extension: 'json',
      mimeType: 'application/json'
    },
    {
      id: 'csv',
      name: 'CSV File',
      extension: 'csv',
      mimeType: 'text/csv'
    },
    {
      id: 'xml',
      name: 'XML File',
      extension: 'xml',
      mimeType: 'application/xml'
    }
  ];

  // Size units
  const sizeUnits: SizeUnit[] = [
    { id: 'kb', name: 'KB', bytes: 1024 },
    { id: 'mb', name: 'MB', bytes: 1024 * 1024 },
    { id: 'gb', name: 'GB', bytes: 1024 * 1024 * 1024 }
  ];

  // Generate random binary data
  const generateRandomBinaryData = (sizeInBytes: number): Uint8Array => {
    // For large files, generate in chunks to avoid memory issues
    const maxChunkSize = 10 * 1024 * 1024; // 10MB chunks
    if (sizeInBytes <= maxChunkSize) {
      return crypto.getRandomValues(new Uint8Array(sizeInBytes));
    } else {
      // For larger files, create a blob with random data
      const chunks: Uint8Array[] = [];
      let remaining = sizeInBytes;
      
      while (remaining > 0) {
        const chunkSize = Math.min(remaining, maxChunkSize);
        chunks.push(crypto.getRandomValues(new Uint8Array(chunkSize)));
        remaining -= chunkSize;
      }
      
      // Combine chunks
      const result = new Uint8Array(sizeInBytes);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    }
  };

  // Generate random text
  const generateRandomText = (sizeInBytes: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \n\t';
    let result = '';
    
    // Generate in chunks to avoid memory issues
    const chunkSize = 1024 * 1024; // 1MB chunks
    let remaining = sizeInBytes;
    
    while (remaining > 0) {
      const currentChunkSize = Math.min(chunkSize, remaining);
      let chunk = '';
      
      for (let i = 0; i < currentChunkSize; i++) {
        chunk += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      result += chunk;
      remaining -= currentChunkSize;
    }
    
    return result;
  };

  // Generate file and trigger download
  const generateFile = async () => {
    try {
      setMessage('');
      setGenerating(true);
      
      // Get selected file type and size unit
      const selectedFileType = fileTypes.find(type => type.id === fileType);
      const selectedUnit = sizeUnits.find(unit => unit.id === sizeUnit);
      
      if (!selectedFileType || !selectedUnit) {
        throw new Error('Invalid file type or size unit');
      }
      
      // Calculate size in bytes
      const sizeInBytes = fileSize * selectedUnit.bytes;
      
      // Check if size is reasonable (limit to 2GB)
      if (sizeInBytes > 2 * 1024 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 2GB');
      }
      
      // Generate file content based on type
      let fileContent: Uint8Array | string;
      
      switch (fileType) {
        case 'binary':
          fileContent = generateRandomBinaryData(sizeInBytes);
          break;
        case 'text':
        case 'json':
        case 'csv':
        case 'xml':
          fileContent = generateRandomText(sizeInBytes);
          break;
        default:
          fileContent = generateRandomBinaryData(sizeInBytes);
      }
      
      // Create blob and download
      const blob = new Blob(
        [fileContent], 
        { type: selectedFileType.mimeType }
      );
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.${selectedFileType.extension}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      setMessage(`File "${fileName}.${selectedFileType.extension}" (${(sizeInBytes / 1024 / 1024).toFixed(2)} MB) generated successfully!`);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          File Generator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate test files with specific types and sizes for development and testing purposes.
        </p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              File Type
            </label>
            <select 
              value={fileType} 
              onChange={(e) => setFileType(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              {fileTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} (.{type.extension})
                </option>
              ))}
            </select>
          </div>

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              File Name (without extension)
            </label>
            <Input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
            />
          </div>

          {/* File Size */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                File Size
              </label>
              <Input
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(parseFloat(e.target.value) || 1)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Unit
              </label>
              <select
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {sizeUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateFile} 
            disabled={generating || !fileName || fileSize <= 0}
            className="w-full mt-4"
          >
            {generating ? 'Generating...' : 'Generate and Download File'}
          </Button>

          {/* Status Message */}
          {message && (
            <div className={`p-3 rounded-md mt-4 ${message.startsWith('Error') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
              {message}
            </div>
          )}
        </div>
      </Card>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 Tips:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Generate binary files for testing upload limits</li>
          <li>• Use text files for testing text processing functions</li>
          <li>• Be careful with very large files as they may use significant memory</li>
          <li>• Maximum file size is limited to 2GB to prevent browser crashes</li>
        </ul>
      </div>
    </div>
  );
}