import React, { useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoProject, ClipType, VideoClip, AudioClip, ImageClip, TextClip } from '../types';

interface VideoTimelineProps {
  project: VideoProject;
  currentTime: number;
  selectedClip: ClipType | null;
  onTimeUpdate: (time: number) => void;
  onClipSelect: (clip: ClipType | null) => void;
  onClipUpdate: (clipId: string, updates: Partial<ClipType>) => void;
  onClipDelete: (clipId: string) => void;
  onClipSplit: (clipId: string, splitTime: number) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  project,
  currentTime,
  selectedClip,
  onTimeUpdate,
  onClipSelect,
  onClipUpdate,
  onClipDelete,
  onClipSplit,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClip, setDragClip] = useState<ClipType | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const PIXELS_PER_SECOND = 100;
  const TRACK_HEIGHT = 60;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getClipColor = (clip: ClipType) => {
    if ('src' in clip && clip.src.includes('video')) return 'bg-blue-500';
    if ('src' in clip && clip.src.includes('audio')) return 'bg-green-500';
    if ('src' in clip && clip.src.includes('image')) return 'bg-purple-500';
    if ('text' in clip) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / PIXELS_PER_SECOND;
    onTimeUpdate(Math.max(0, Math.min(project.timeline.totalDuration, time)));
  };

  const handleClipMouseDown = (e: React.MouseEvent, clip: ClipType) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragClip(clip);
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset(e.clientX - rect.left - (clip.startTime * PIXELS_PER_SECOND));
    }
    
    onClipSelect(clip);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragClip || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset;
    const newStartTime = Math.max(0, x / PIXELS_PER_SECOND);
    
    const updates: Partial<ClipType> = { startTime: newStartTime };
    if ('endTime' in dragClip) {
      updates.endTime = newStartTime + dragClip.duration;
    }
    
    onClipUpdate(dragClip.id, updates);
  }, [isDragging, dragClip, dragOffset, onClipUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragClip(null);
    setDragOffset(0);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderClip = (clip: ClipType, trackIndex: number) => {
    const width = clip.duration * PIXELS_PER_SECOND;
    const left = clip.startTime * PIXELS_PER_SECOND;
    const isSelected = selectedClip?.id === clip.id;

    return (
      <div
        key={clip.id}
        className={`absolute h-12 rounded cursor-move border-2 ${
          isSelected ? 'border-yellow-400' : 'border-transparent'
        } ${getClipColor(clip)} text-white text-xs p-1 overflow-hidden`}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          top: `${trackIndex * TRACK_HEIGHT + 8}px`,
        }}
        onMouseDown={(e) => handleClipMouseDown(e, clip)}
        onDoubleClick={() => onClipSplit(clip.id, currentTime)}
      >
        <div className="font-medium truncate">
          {'name' in clip ? clip.name : 'text' in clip ? clip.text : 'Clip'}
        </div>
        <div className="text-xs opacity-75">
          {formatTime(clip.duration)}
        </div>
        
        {isSelected && (
          <div className="absolute top-0 right-0 p-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClipDelete(clip.id);
              }}
              size="sm"
              variant="destructive"
              className="h-4 w-4 p-0 text-xs"
            >
              ×
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTimeRuler = () => {
    const ticks = [];
    const duration = Math.ceil(project.timeline.totalDuration);
    
    for (let i = 0; i <= duration; i++) {
      ticks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${i * PIXELS_PER_SECOND}px` }}
        >
          <div className="w-px h-4 bg-gray-400" />
          <span className="text-xs text-gray-600 mt-1">{formatTime(i)}</span>
        </div>
      );
    }
    
    return ticks;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Timeline Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Timeline</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onTimeUpdate(0)}
              variant="outline"
              size="sm"
            >
              ⏮️ Start
            </Button>
            <Button
              onClick={() => onTimeUpdate(project.timeline.totalDuration)}
              variant="outline"
              size="sm"
            >
              End ⏭️
            </Button>
          </div>
        </div>

        {/* Time Ruler */}
        <div className="relative h-8 border-b border-gray-200">
          {renderTimeRuler()}
          
          {/* Playhead */}
          <div
            className="absolute top-0 w-px h-full bg-red-500 z-10"
            style={{ left: `${currentTime * PIXELS_PER_SECOND}px` }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Timeline Tracks */}
        <div
          ref={timelineRef}
          className="relative bg-gray-50 rounded-lg p-2 overflow-x-auto"
          style={{ 
            minHeight: `${Math.max(4, 
              project.timeline.videoTracks.length + 
              project.timeline.audioTracks.length + 
              project.timeline.imageTracks.length + 
              project.timeline.textTracks.length
            ) * TRACK_HEIGHT}px`,
            minWidth: `${project.timeline.totalDuration * PIXELS_PER_SECOND + 100}px`
          }}
          onClick={handleTimelineClick}
        >
          {/* Track Labels */}
          <div className="absolute left-0 top-0 w-20 bg-white border-r border-gray-200 z-20">
            {project.timeline.videoTracks.map((_, index) => (
              <div
                key={`video-${index}`}
                className="h-15 flex items-center justify-center text-xs font-medium border-b border-gray-100"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                Video {index + 1}
              </div>
            ))}
            {project.timeline.audioTracks.map((_, index) => (
              <div
                key={`audio-${index}`}
                className="h-15 flex items-center justify-center text-xs font-medium border-b border-gray-100"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                Audio {index + 1}
              </div>
            ))}
            {project.timeline.imageTracks.map((_, index) => (
              <div
                key={`image-${index}`}
                className="h-15 flex items-center justify-center text-xs font-medium border-b border-gray-100"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                Image {index + 1}
              </div>
            ))}
            {project.timeline.textTracks.map((_, index) => (
              <div
                key={`text-${index}`}
                className="h-15 flex items-center justify-center text-xs font-medium border-b border-gray-100"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                Text {index + 1}
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div className="ml-20">
            {/* Video Clips */}
            {project.timeline.videoTracks.map((clip, index) => renderClip(clip, index))}
            
            {/* Audio Clips */}
            {project.timeline.audioTracks.map((clip, index) => 
              renderClip(clip, project.timeline.videoTracks.length + index)
            )}
            
            {/* Image Clips */}
            {project.timeline.imageTracks.map((clip, index) => 
              renderClip(clip, project.timeline.videoTracks.length + project.timeline.audioTracks.length + index)
            )}
            
            {/* Text Clips */}
            {project.timeline.textTracks.map((clip, index) => 
              renderClip(clip, project.timeline.videoTracks.length + project.timeline.audioTracks.length + project.timeline.imageTracks.length + index)
            )}
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Total Duration: {formatTime(project.timeline.totalDuration)}
          </div>
          <div>
            Current Time: {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </Card>
  );
};
