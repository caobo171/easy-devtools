import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoProject } from '../types';
import { ffmpegService } from '../services/ffmpegService';

interface VideoExportProps {
  project: VideoProject;
}

interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '480p' | '720p' | '1080p' | '4k' | 'custom';
  customWidth?: number;
  customHeight?: number;
  fps: number;
  bitrate: number;
}

export const VideoExport: React.FC<VideoExportProps> = ({ project }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: 'high',
    resolution: '1080p',
    fps: project.settings.fps,
    bitrate: 5000,
  });

  const qualityPresets = {
    low: { bitrate: 1000, description: 'Small file size, lower quality' },
    medium: { bitrate: 2500, description: 'Balanced size and quality' },
    high: { bitrate: 5000, description: 'High quality, larger file' },
    ultra: { bitrate: 10000, description: 'Maximum quality, very large file' },
  };

  const resolutionPresets = {
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 },
  };

  const getExportDimensions = () => {
    if (exportSettings.resolution === 'custom') {
      return {
        width: exportSettings.customWidth || project.settings.width,
        height: exportSettings.customHeight || project.settings.height,
      };
    }
    return resolutionPresets[exportSettings.resolution];
  };

  const getEstimatedFileSize = () => {
    const dimensions = getExportDimensions();
    const duration = project.timeline.totalDuration;
    const bitrate = exportSettings.bitrate;
    
    // Rough estimation: (bitrate in kbps * duration in seconds) / 8 / 1024 = MB
    const estimatedMB = (bitrate * duration) / 8 / 1024;
    
    if (estimatedMB < 1024) {
      return `~${Math.round(estimatedMB)} MB`;
    } else {
      return `~${(estimatedMB / 1024).toFixed(1)} GB`;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Prepare clips for FFmpeg processing
      const clips = [];
      
      // Add video clips
      for (const videoClip of project.timeline.videoTracks) {
        if (videoClip.src) {
          const response = await fetch(videoClip.src);
          const file = await response.blob();
          clips.push({
            type: 'video' as const,
            file,
            startTime: videoClip.startTime,
            duration: videoClip.duration,
            speed: videoClip.speed,
          });
        }
      }
      
      // Add audio clips
      for (const audioClip of project.timeline.audioTracks) {
        if (audioClip.src) {
          const response = await fetch(audioClip.src);
          const file = await response.blob();
          clips.push({
            type: 'audio' as const,
            file,
            startTime: audioClip.startTime,
            duration: audioClip.duration,
          });
        }
      }
      
      // Add image clips
      for (const imageClip of project.timeline.imageTracks) {
        if (imageClip.src) {
          const response = await fetch(imageClip.src);
          const file = await response.blob();
          clips.push({
            type: 'image' as const,
            file,
            startTime: imageClip.startTime,
            duration: imageClip.duration,
            x: imageClip.x,
            y: imageClip.y,
          });
        }
      }
      
      // Add text clips
      for (const textClip of project.timeline.textTracks) {
        clips.push({
          type: 'text' as const,
          startTime: textClip.startTime,
          duration: textClip.duration,
          x: textClip.x,
          y: textClip.y,
          text: textClip.text,
          fontSize: textClip.fontSize,
          color: textClip.color,
        });
      }

      const dimensions = getExportDimensions();
      const outputSettings = {
        width: dimensions.width,
        height: dimensions.height,
        fps: exportSettings.fps,
        format: exportSettings.format,
        quality: exportSettings.quality,
      };

      // Use FFmpeg to render the final video
      const outputBlob = await ffmpegService.renderFinalVideo(
        clips,
        outputSettings,
        (progress) => setExportProgress(progress)
      );

      // Download the rendered video
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-export-${Date.now()}.${exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check the console for details.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Export Video</h3>
          <div className="text-xs text-gray-500">
            Duration: {Math.floor(project.timeline.totalDuration / 60)}:
            {Math.floor(project.timeline.totalDuration % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Export Settings */}
        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <div className="flex space-x-2">
              {(['mp4', 'webm', 'mov'] as const).map((format) => (
                <Button
                  key={format}
                  onClick={() => setExportSettings(prev => ({ ...prev, format }))}
                  variant={exportSettings.format === format ? "default" : "outline"}
                  size="sm"
                >
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quality</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(qualityPresets) as Array<keyof typeof qualityPresets>).map((quality) => (
                <Button
                  key={quality}
                  onClick={() => setExportSettings(prev => ({ 
                    ...prev, 
                    quality,
                    bitrate: qualityPresets[quality].bitrate 
                  }))}
                  variant={exportSettings.quality === quality ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col items-start p-2 h-auto"
                >
                  <span className="font-medium capitalize">{quality}</span>
                  <span className="text-xs opacity-75">
                    {qualityPresets[quality].description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Resolution Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(resolutionPresets) as Array<keyof typeof resolutionPresets>).map((resolution) => (
                <Button
                  key={resolution}
                  onClick={() => setExportSettings(prev => ({ ...prev, resolution }))}
                  variant={exportSettings.resolution === resolution ? "default" : "outline"}
                  size="sm"
                >
                  {resolution} ({resolutionPresets[resolution].width}×{resolutionPresets[resolution].height})
                </Button>
              ))}
              <Button
                onClick={() => setExportSettings(prev => ({ ...prev, resolution: 'custom' }))}
                variant={exportSettings.resolution === 'custom' ? "default" : "outline"}
                size="sm"
              >
                Custom
              </Button>
            </div>
            
            {exportSettings.resolution === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs text-gray-500">Width</label>
                  <input
                    type="number"
                    value={exportSettings.customWidth || project.settings.width}
                    onChange={(e) => setExportSettings(prev => ({ 
                      ...prev, 
                      customWidth: parseInt(e.target.value) 
                    }))}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Height</label>
                  <input
                    type="number"
                    value={exportSettings.customHeight || project.settings.height}
                    onChange={(e) => setExportSettings(prev => ({ 
                      ...prev, 
                      customHeight: parseInt(e.target.value) 
                    }))}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Frame Rate</label>
              <select
                value={exportSettings.fps}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  fps: parseInt(e.target.value) 
                }))}
                className="w-full p-2 border rounded"
              >
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Bitrate (kbps)</label>
              <input
                type="number"
                value={exportSettings.bitrate}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  bitrate: parseInt(e.target.value) 
                }))}
                className="w-full p-2 border rounded"
                min={500}
                max={50000}
                step={500}
              />
            </div>
          </div>
        </div>

        {/* Export Info */}
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Output Resolution:</span>
            <span>{getExportDimensions().width}×{getExportDimensions().height}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Estimated File Size:</span>
            <span>{getEstimatedFileSize()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Format:</span>
            <span>{exportSettings.format.toUpperCase()}</span>
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exporting...</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || project.timeline.totalDuration === 0}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Exporting...
            </>
          ) : (
            <>
              📥 Export Video
            </>
          )}
        </Button>

        {/* Export Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Higher quality settings result in larger file sizes</li>
            <li>MP4 format offers the best compatibility</li>
            <li>Export time depends on video length and quality</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
