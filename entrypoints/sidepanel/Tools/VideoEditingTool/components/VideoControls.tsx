import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClipType, VideoClip, AudioClip, ImageClip, TextClip } from '../types';
import { ffmpegService } from '../services/ffmpegService';

interface VideoControlsProps {
  selectedClip: ClipType | null;
  currentTime: number;
  onClipUpdate: (clipId: string, updates: Partial<ClipType>) => void;
  onClipSplit: (clipId: string, splitTime: number) => void;
  onClipDelete: (clipId: string) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  selectedClip,
  currentTime,
  onClipUpdate,
  onClipSplit,
  onClipDelete,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleSpeedChange = async (speed: number) => {
    if (selectedClip && 'speed' in selectedClip && 'src' in selectedClip) {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        // Fetch the original video file
        const response = await fetch(selectedClip.src);
        const videoFile = await response.blob();
        
        // Use FFmpeg to change speed
        const processedVideo = await ffmpegService.changeSpeed(
          videoFile,
          speed,
          (progress) => setProcessingProgress(progress)
        );
        
        // Create new URL for processed video
        const newSrc = URL.createObjectURL(processedVideo);
        
        // Update clip with new source and speed
        onClipUpdate(selectedClip.id, { 
          speed,
          src: newSrc,
          duration: selectedClip.duration / speed // Adjust duration based on speed
        });
        
      } catch (error) {
        console.error('Speed change failed:', error);
        alert('Failed to change video speed. Please try again.');
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    } else if (selectedClip && 'speed' in selectedClip) {
      // For non-video clips, just update the speed property
      onClipUpdate(selectedClip.id, { speed });
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (selectedClip && 'volume' in selectedClip) {
      onClipUpdate(selectedClip.id, { volume });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (selectedClip && 'opacity' in selectedClip) {
      onClipUpdate(selectedClip.id, { opacity });
    }
  };

  const handlePositionChange = (x: number, y: number) => {
    if (selectedClip && 'x' in selectedClip && 'y' in selectedClip) {
      onClipUpdate(selectedClip.id, { x, y });
    }
  };

  const handleSizeChange = (width: number, height: number) => {
    if (selectedClip && 'width' in selectedClip && 'height' in selectedClip) {
      onClipUpdate(selectedClip.id, { width, height });
    }
  };

  const handleTextPropertiesChange = (updates: Partial<TextClip>) => {
    if (selectedClip && 'text' in selectedClip) {
      onClipUpdate(selectedClip.id, updates);
    }
  };

  const getClipTypeName = (clip: ClipType) => {
    if ('src' in clip) {
      if (clip.src.includes('video')) return 'Video';
      if (clip.src.includes('audio')) return 'Audio';
      if (clip.src.includes('image')) return 'Image';
    }
    if ('text' in clip) return 'Text';
    return 'Clip';
  };

  if (!selectedClip) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎛️</div>
          <p>Select a clip to edit</p>
          <p className="text-xs">Click on any clip in the timeline to start editing</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {getClipTypeName(selectedClip)} Controls
            </h3>
            <p className="text-xs text-gray-500">
              {'name' in selectedClip ? selectedClip.name : 'text' in selectedClip ? selectedClip.text : 'Selected clip'}
            </p>
          </div>
          <Button
            onClick={() => onClipDelete(selectedClip.id)}
            variant="destructive"
            size="sm"
          >
            🗑️ Delete
          </Button>
        </div>

        {/* Basic Controls */}
        <div className="space-y-3">
          {/* Split Clip */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Split Clip</span>
            <Button
              onClick={() => onClipSplit(selectedClip.id, currentTime)}
              variant="outline"
              size="sm"
            >
              ✂️ Split at Current Time
            </Button>
          </div>

          {/* Speed Control (for video/audio clips) */}
          {'speed' in selectedClip && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Speed</span>
                <span className="text-xs text-gray-500">{selectedClip.speed}x</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleSpeedChange(0.25)}
                  variant={selectedClip.speed === 0.25 ? "default" : "outline"}
                  size="sm"
                >
                  0.25x
                </Button>
                <Button
                  onClick={() => handleSpeedChange(0.5)}
                  variant={selectedClip.speed === 0.5 ? "default" : "outline"}
                  size="sm"
                >
                  0.5x
                </Button>
                <Button
                  onClick={() => handleSpeedChange(1)}
                  variant={selectedClip.speed === 1 ? "default" : "outline"}
                  size="sm"
                >
                  1x
                </Button>
                <Button
                  onClick={() => handleSpeedChange(1.5)}
                  variant={selectedClip.speed === 1.5 ? "default" : "outline"}
                  size="sm"
                >
                  1.5x
                </Button>
                <Button
                  onClick={() => handleSpeedChange(2)}
                  variant={selectedClip.speed === 2 ? "default" : "outline"}
                  size="sm"
                >
                  2x
                </Button>
              </div>
              <input
                type="range"
                min={0.1}
                max={4}
                step={0.1}
                value={selectedClip.speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Volume Control (for audio clips) */}
          {'volume' in selectedClip && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-xs text-gray-500">{Math.round(selectedClip.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedClip.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Opacity Control (for image/text clips) */}
          {'opacity' in selectedClip && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Opacity</span>
                <span className="text-xs text-gray-500">{Math.round(selectedClip.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedClip.opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Advanced Controls Toggle */}
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="ghost"
          size="sm"
          className="w-full"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Controls
        </Button>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            {/* Position Controls (for visual clips) */}
            {'x' in selectedClip && 'y' in selectedClip && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Position</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedClip.x}
                      onChange={(e) => handlePositionChange(parseInt(e.target.value), selectedClip.y)}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedClip.y}
                      onChange={(e) => handlePositionChange(selectedClip.x, parseInt(e.target.value))}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Size Controls (for visual clips) */}
            {'width' in selectedClip && 'height' in selectedClip && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Size</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={selectedClip.width}
                      onChange={(e) => handleSizeChange(parseInt(e.target.value), selectedClip.height)}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={selectedClip.height}
                      onChange={(e) => handleSizeChange(selectedClip.width, parseInt(e.target.value))}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Text Properties (for text clips) */}
            {'text' in selectedClip && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Text Content</label>
                  <textarea
                    value={selectedClip.text}
                    onChange={(e) => handleTextPropertiesChange({ text: e.target.value })}
                    className="w-full p-2 border rounded text-sm mt-1"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Font Size</label>
                    <input
                      type="number"
                      value={selectedClip.fontSize}
                      onChange={(e) => handleTextPropertiesChange({ fontSize: parseInt(e.target.value) })}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Color</label>
                    <input
                      type="color"
                      value={selectedClip.color}
                      onChange={(e) => handleTextPropertiesChange({ color: e.target.value })}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Font Family</label>
                    <select
                      value={selectedClip.fontFamily}
                      onChange={(e) => handleTextPropertiesChange({ fontFamily: e.target.value })}
                      className="w-full p-1 border rounded text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Font Weight</label>
                    <select
                      value={selectedClip.fontWeight}
                      onChange={(e) => handleTextPropertiesChange({ fontWeight: e.target.value })}
                      className="w-full p-1 border rounded text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
