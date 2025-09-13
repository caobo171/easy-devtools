import './App.module.css';
import '../../assets/main.css'

import React, { useState } from 'react';
import { SmallPopup } from '@/components/popup';
import { browser } from 'wxt/browser';
import ExtMessage, { MessageFrom, MessageType } from '../types';
import DateFormatTool from '@/entrypoints/sidepanel/Tools/DateFormatTool';

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
      <div className="max-h-[70vh] overflow-y-auto">
        <DateFormatTool 
          displayMode="compact" 
          initialDate={initialDate}
          onInputChange={setInputDate}
        />
      </div>
    </SmallPopup>
  );
};
