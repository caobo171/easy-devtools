import './App.module.css';
import '../../assets/main.css'

import React from 'react';
import { LargePopup } from '@/components/popup';
import ScreenshotTool from '../sidepanel/Tools/ScreenshotTool';

interface ScreenshotPopupProps {
  imageData: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ScreenshotPopup: React.FC<ScreenshotPopupProps> = ({ 
  imageData, 
  position, 
  onClose 
}) => {
  return (
    <LargePopup
      title="Screenshot Editor"
      position={position}
      onClose={onClose}
    >
      <ScreenshotTool 
        initialImage={imageData} 
      />
    </LargePopup>
  );
};
