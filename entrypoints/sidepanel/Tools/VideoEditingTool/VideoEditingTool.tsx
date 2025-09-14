import React from 'react';
import { VideoPreview } from './components/VideoPreview';
import { VideoTimeline } from './components/VideoTimeline';
import { MediaLibrary } from './components/MediaLibrary';
import { VideoControls } from './components/VideoControls';
import { VideoExport } from './components/VideoExport';
import { useVideoProject } from './hooks/useVideoProject';

export const VideoEditingTool: React.FC = () => {
  const {
    project,
    currentTime,
    isPlaying,
    selectedClip,
    setCurrentTime,
    togglePlayback,
    selectClip,
    addVideoClip,
    addAudioClip,
    addImageClip,
    addTextClip,
    updateClip,
    deleteClip,
    splitClip,
  } = useVideoProject();

  const handleVideoAdd = (videoData: string, name: string) => {
    // Create a video element to get duration
    const video = document.createElement('video');
    video.src = videoData;
    video.onloadedmetadata = () => {
      addVideoClip({
        src: videoData,
        name,
        duration: video.duration,
        startTime: currentTime,
        endTime: currentTime + video.duration,
        speed: 1,
        volume: 1,
        x: 0,
        y: 0,
        width: project.settings.width,
        height: project.settings.height,
      });
    };
  };

  const handleAudioAdd = (audioData: string, name: string) => {
    const audio = document.createElement('audio');
    audio.src = audioData;
    audio.onloadedmetadata = () => {
      addAudioClip({
        src: audioData,
        name,
        duration: audio.duration,
        startTime: currentTime,
        endTime: currentTime + audio.duration,
        speed: 1,
        volume: 1,
      });
    };
  };

  const handleImageAdd = (imageData: string, name: string) => {
    const img = new Image();
    img.onload = () => {
      addImageClip({
        src: imageData,
        name,
        duration: 5, // Default 5 seconds for images
        startTime: currentTime,
        x: 0,
        y: 0,
        width: Math.min(img.width, project.settings.width),
        height: Math.min(img.height, project.settings.height),
        opacity: 1,
      });
    };
    img.src = imageData;
  };

  const handleTextAdd = (text: string) => {
    addTextClip({
      text,
      duration: 3, // Default 3 seconds for text
      startTime: currentTime,
      x: project.settings.width / 2,
      y: project.settings.height / 2,
      fontSize: 48,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#ffffff',
      opacity: 1,
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Top Section: Preview and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Preview */}
        <div className="lg:col-span-2">
          <VideoPreview
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTimeUpdate={setCurrentTime}
            onPlayPause={togglePlayback}
          />
        </div>

        {/* Media Library */}
        <div>
          <MediaLibrary
            onVideoAdd={handleVideoAdd}
            onAudioAdd={handleAudioAdd}
            onImageAdd={handleImageAdd}
            onTextAdd={handleTextAdd}
          />
        </div>
      </div>

      {/* Middle Section: Timeline */}
      <div className="flex-1 min-h-0">
        <VideoTimeline
          project={project}
          currentTime={currentTime}
          selectedClip={selectedClip}
          onTimeUpdate={setCurrentTime}
          onClipSelect={selectClip}
          onClipUpdate={updateClip}
          onClipDelete={deleteClip}
          onClipSplit={splitClip}
        />
      </div>

      {/* Bottom Section: Controls and Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Video Controls */}
        <div>
          <VideoControls
            selectedClip={selectedClip}
            currentTime={currentTime}
            onClipUpdate={updateClip}
            onClipSplit={splitClip}
            onClipDelete={deleteClip}
          />
        </div>

        {/* Export */}
        <div>
          <VideoExport project={project} />
        </div>
      </div>
    </div>
  );
};
