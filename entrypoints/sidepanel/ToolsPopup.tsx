import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tools } from '../types';
import ExtMessage, { MessageType, MessageFrom } from '../types';
import { browser } from 'wxt/browser';
import {
  CalendarIcon,
  PaintBrushIcon,
  LinkIcon,
  LockClosedIcon,
  HashtagIcon,
  SwatchIcon,
  DocumentTextIcon,
  CameraIcon,
  VideoCameraIcon,
  DocumentIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

export type Tool = {
  id: keyof typeof Tools;
  name: string;
  icon: string;
  keywords?: string[];
};

interface ToolsPopupProps {
  tools: Tool[];
  selectedTool: string | null;
  onSelectTool: (toolId: keyof typeof Tools) => void;
}

// Map tool IDs to Heroicons
const getToolIcon = (toolId: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'convertToReadableDate': CalendarIcon,
    'beautifyJSON': PaintBrushIcon,
    'urlEncoder': LinkIcon,
    'base64Encoder': LockClosedIcon,
    'hashGenerator': HashtagIcon,
    'colorConverter': SwatchIcon,
    'markdownPreview': DocumentTextIcon,
    'takeScreenshot': CameraIcon,
    'videoRecording': VideoCameraIcon,
    'generateFile': DocumentIcon,
  };
  
  return iconMap[toolId] || DocumentIcon;
};

export default function ToolsPopup({ tools, selectedTool, onSelectTool }: ToolsPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Add screenshot and video recording tools to the list
  const allTools = [
    ...tools,
    { id: 'takeScreenshot', name: 'Screenshot Tool', icon: '📸', keywords: ['capture', 'image', 'screen', 'crop'] },
    { id: 'videoRecording', name: 'Video Recording', icon: '🎥', keywords: ['record', 'video', 'screen', 'capture'] }
  ];

  // Filter tools based on search query
  const filteredTools = allTools.filter(tool => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.keywords?.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  const togglePopup = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setSearchQuery('');
    }
  };

  const handleToolClick = async (toolId: string) => {
    if (toolId === 'takeScreenshot') {
      // Handle screenshot tool specially
      try {
        const message = new ExtMessage(MessageType.takeScreenshot);
        message.from = MessageFrom.sidePanel;
        
        // Send message to background to trigger screenshot
        browser.runtime.sendMessage(message);
        
        // Close the popup
        setIsVisible(false);
        setSearchQuery('');
      } catch (error) {
        console.error('Failed to trigger screenshot:', error);
      }
    } else if (toolId === 'videoRecording') {
      // Handle video recording tool - open dedicated popup window
      try {
        // Create dedicated popup window for video recording
        await browser.windows.create({
          url: 'video-recording.html',
          type: 'popup',
          width: 450,
          height: 700,
          focused: true
        });

		window.close();

        // Close the sidepanel popup
        setIsVisible(false);
        setSearchQuery('');
      } catch (error) {
        console.error('Failed to open video recording popup window:', error);
      }
    } else {
      // Handle regular tools
      onSelectTool(toolId as keyof typeof Tools);
      setIsVisible(false);
      setSearchQuery('');
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Trigger button in top-right */}
      <button
        ref={triggerRef}
        onClick={togglePopup}
        className="fixed top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer z-40"
      >
        <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Popup */}
      {isVisible && (
        <div
          ref={popupRef}
          className="fixed top-16 right-4 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          {/* Header with search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Tools grid */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              {filteredTools.map((tool) => {
                const IconComponent = getToolIcon(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg text-center transition-all duration-200 hover:scale-105",
                      selectedTool === tool.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-md"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-xs font-medium leading-tight">{tool.name}</span>
                  </button>
                );
              })}
            </div>

            {filteredTools.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <DocumentIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tools found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
