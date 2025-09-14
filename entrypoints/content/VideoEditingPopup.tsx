import './App.module.css';
import '../../assets/main.css'

import React from 'react';
import { LargePopup } from '@/components/popup';
import VideoRecordingTool from '../sidepanel/Tools/VideoRecordingTool';

interface VideoEditingPopupProps {
  videoData?: string | null;
  videoType?: 'recorded' | 'uploaded';
  videoFileName?: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const VideoEditingPopup: React.FC<VideoEditingPopupProps> = ({ 
  videoData, 
  videoType,
  videoFileName,
  position, 
  onClose 
}) => {
  return (
    <LargePopup
      title="Video Recording & Editing Tool"
      position={position}
      onClose={onClose}
    >
      <VideoRecordingTool 
        initialVideoData={videoData}
        initialVideoType={videoType}
        initialVideoFileName={videoFileName}
      />
    </LargePopup>
  );
};
