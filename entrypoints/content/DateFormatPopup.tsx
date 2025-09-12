import './App.module.css';
import '../../assets/main.css'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmallPopup } from '@/components/popup';
import { browser } from 'wxt/browser';
import ExtMessage, { MessageFrom, MessageType } from '../types';
import { Copy } from 'lucide-react';

interface DateFormatPopupProps {
  initialDate?: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const DateFormatPopup: React.FC<DateFormatPopupProps> = ({ 
  initialDate = '', 
  position, 
  onClose 
}) => {
  const [inputDate, setInputDate] = useState(initialDate);
  const [results, setResults] = useState<Array<{format: string, value: string}>>([]);

  useEffect(() => {
    if (initialDate) {
      formatDate(initialDate);
    }
  }, [initialDate]);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    });
  };

  const openInSidebar = async () => {
    try {      
      // Send the date to the sidebar panel
      const message = new ExtMessage(MessageType.convertToReadableDateToBackground);
      message.content = inputDate;
      message.from = MessageFrom.contentScript;
      await browser.runtime.sendMessage(message);
      
      // Close the popup
      onClose();
    } catch (error) {
      console.error('Failed to open in sidebar:', error);
    }
  };

  return (
    <SmallPopup
      title="Date Format Converter"
      position={position}
      onClose={onClose}
      onOpenInSidebar={openInSidebar}
    >
      <div className="space-y-3">
        <div>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              placeholder="e.g., 2024-01-01 or 1704067200"
              className="flex-1 h-8 text-xs"
            />
            <Button size="sm" className="h-8" onClick={() => formatDate()}>
              Convert
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="bg-muted/50 rounded p-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      {result.format}
                    </div>
                    <div className="text-xs font-mono mt-1 break-all">
                      {result.value}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.value)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SmallPopup>
  );
};
