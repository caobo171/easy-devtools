import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoProject, VideoClip, ImageClip, TextClip } from '../types';
import { ffmpegService } from '../services/ffmpegService';

interface VideoPreviewProps {
  project: VideoProject;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  project,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get active clips at current time
  const getActiveClips = () => {
    const activeVideoClips = project.timeline.videoTracks.filter(
      clip => currentTime >= clip.startTime && currentTime <= clip.endTime
    );
    const activeImageClips = project.timeline.imageTracks.filter(
      clip => currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration
    );
    const activeTextClips = project.timeline.textTracks.filter(
      clip => currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration
    );

    return { activeVideoClips, activeImageClips, activeTextClips };
  };

  // Render frame at current time
  const renderFrame = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = project.settings.width;
    canvas.height = project.settings.height;

    // Clear canvas with background color
    ctx.fillStyle = project.settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { activeVideoClips, activeImageClips, activeTextClips } = getActiveClips();

    // Render video clips
    for (const clip of activeVideoClips) {
      try {
        const video = document.createElement('video');
        video.src = clip.src;
        video.currentTime = (currentTime - clip.startTime) * clip.speed;
        
        await new Promise((resolve) => {
          video.onloadeddata = resolve;
          video.onerror = resolve;
        });

        if (video.videoWidth > 0) {
          ctx.drawImage(video, clip.x, clip.y, clip.width, clip.height);
        }
      } catch (error) {
        console.error('Error rendering video clip:', error);
      }
    }

    // Render image clips
    for (const clip of activeImageClips) {
      try {
        const img = new Image();
        img.src = clip.src;
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        ctx.globalAlpha = clip.opacity;
        ctx.drawImage(img, clip.x, clip.y, clip.width, clip.height);
        ctx.globalAlpha = 1;
      } catch (error) {
        console.error('Error rendering image clip:', error);
      }
    }

    // Render text clips
    for (const clip of activeTextClips) {
      ctx.fillStyle = clip.color;
      ctx.font = `${clip.fontWeight} ${clip.fontSize}px ${clip.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clip.text, clip.x, clip.y);
    }
  };

  // Animation loop for playback
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        onTimeUpdate(currentTime + 1 / project.settings.fps);
        renderFrame();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderFrame();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, project]);

  // Render frame when time changes
  useEffect(() => {
    if (!isPlaying) {
      renderFrame();
    }
  }, [currentTime, project]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      canvasRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * project.settings.fps);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Preview Canvas */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-96"
            style={{ aspectRatio: `${project.settings.width}/${project.settings.height}` }}
          />
          
          {/* Overlay Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
              {formatTime(currentTime)} / {formatTime(project.timeline.totalDuration)}
            </div>
            
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              ⛶
            </Button>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 1))}
            variant="outline"
            size="sm"
          >
            ⏮️
          </Button>
          
          <Button
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 1/project.settings.fps))}
            variant="outline"
            size="sm"
          >
            ⏪
          </Button>
          
          <Button
            onClick={onPlayPause}
            variant="default"
            size="lg"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </Button>
          
          <Button
            onClick={() => onTimeUpdate(Math.min(project.timeline.totalDuration, currentTime + 1/project.settings.fps))}
            variant="outline"
            size="sm"
          >
            ⏩
          </Button>
          
          <Button
            onClick={() => onTimeUpdate(Math.min(project.timeline.totalDuration, currentTime + 1))}
            variant="outline"
            size="sm"
          >
            ⏭️
          </Button>
        </div>

        {/* Time Scrubber */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={project.timeline.totalDuration}
            step={1 / project.settings.fps}
            value={currentTime}
            onChange={(e) => onTimeUpdate(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0:00.00</span>
            <span>{formatTime(project.timeline.totalDuration)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
