import { useState, useCallback } from 'react';
import { VideoProject, Timeline, VideoClip, AudioClip, ImageClip, TextClip, ClipType } from '../types';

export const useVideoProject = (initialProject?: VideoProject) => {
  const [project, setProject] = useState<VideoProject>(
    initialProject || {
      id: Date.now().toString(),
      name: 'Untitled Project',
      timeline: {
        videoTracks: [],
        audioTracks: [],
        imageTracks: [],
        textTracks: [],
        totalDuration: 0,
      },
      settings: {
        width: 1920,
        height: 1080,
        fps: 30,
        backgroundColor: '#000000',
      },
    }
  );

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipType | null>(null);

  const addVideoClip = useCallback((clipData: Partial<VideoClip>) => {
    const newClip: VideoClip = {
      id: Date.now().toString(),
      src: clipData.src || '',
      name: clipData.name || 'Video Clip',
      duration: clipData.duration || 0,
      startTime: clipData.startTime || 0,
      endTime: clipData.endTime || clipData.duration || 0,
      speed: clipData.speed || 1,
      volume: clipData.volume || 1,
      x: clipData.x || 0,
      y: clipData.y || 0,
      width: clipData.width || project.settings.width,
      height: clipData.height || project.settings.height,
    };

    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        videoTracks: [...prev.timeline.videoTracks, newClip],
        totalDuration: Math.max(prev.timeline.totalDuration, newClip.endTime),
      },
    }));
  }, [project.settings.width, project.settings.height]);

  const addAudioClip = useCallback((clipData: Partial<AudioClip>) => {
    const newClip: AudioClip = {
      id: Date.now().toString(),
      src: clipData.src || '',
      name: clipData.name || 'Audio Clip',
      duration: clipData.duration || 0,
      startTime: clipData.startTime || 0,
      endTime: clipData.endTime || (clipData.startTime || 0) + (clipData.duration || 0),
      speed: clipData.speed || 1,
      volume: clipData.volume || 1,
    };

    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        audioTracks: [...prev.timeline.audioTracks, newClip],
        totalDuration: Math.max(prev.timeline.totalDuration, newClip.endTime),
      },
    }));
  }, []);

  const addImageClip = useCallback((clipData: Partial<ImageClip>) => {
    const newClip: ImageClip = {
      id: Date.now().toString(),
      src: clipData.src || '',
      name: clipData.name || 'Image Clip',
      duration: clipData.duration || 5,
      startTime: clipData.startTime || 0,
      x: clipData.x || 0,
      y: clipData.y || 0,
      width: clipData.width || project.settings.width,
      height: clipData.height || project.settings.height,
      opacity: clipData.opacity || 1,
    };

    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        imageTracks: [...prev.timeline.imageTracks, newClip],
        totalDuration: Math.max(prev.timeline.totalDuration, newClip.startTime + newClip.duration),
      },
    }));
  }, [project.settings.width, project.settings.height]);

  const addTextClip = useCallback((clipData: Partial<TextClip>) => {
    const newClip: TextClip = {
      id: Date.now().toString(),
      text: clipData.text || 'Text',
      duration: clipData.duration || 3,
      startTime: clipData.startTime || currentTime,
      x: clipData.x || project.settings.width / 2,
      y: clipData.y || project.settings.height / 2,
      fontSize: clipData.fontSize || 48,
      color: clipData.color || '#ffffff',
      fontFamily: clipData.fontFamily || 'Arial',
      fontWeight: clipData.fontWeight || 'bold',
      opacity: clipData.opacity || 1,
    };

    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        textTracks: [...prev.timeline.textTracks, newClip],
        totalDuration: Math.max(prev.timeline.totalDuration, newClip.startTime + newClip.duration),
      },
    }));
  }, [currentTime, project.settings.width, project.settings.height]);

  const updateClip = useCallback((clipId: string, updates: Partial<ClipType>) => {
    setProject(prev => {
      const newTimeline = { ...prev.timeline };
      
      // Update in the appropriate track
      ['videoTracks', 'audioTracks', 'imageTracks', 'textTracks'].forEach(trackType => {
        const track = newTimeline[trackType as keyof Timeline] as ClipType[];
        const clipIndex = track.findIndex(clip => clip.id === clipId);
        if (clipIndex !== -1) {
          track[clipIndex] = { ...track[clipIndex], ...updates };
        }
      });

      // Recalculate total duration
      const allClips = [
        ...newTimeline.videoTracks,
        ...newTimeline.audioTracks,
        ...newTimeline.imageTracks,
        ...newTimeline.textTracks,
      ];
      
      newTimeline.totalDuration = Math.max(
        ...allClips.map(clip => 
          'endTime' in clip ? clip.endTime : clip.startTime + clip.duration
        ),
        0
      );

      return {
        ...prev,
        timeline: newTimeline,
      };
    });
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    setProject(prev => {
      const newTimeline = { ...prev.timeline };
      
      // Remove from all tracks
      newTimeline.videoTracks = newTimeline.videoTracks.filter(clip => clip.id !== clipId);
      newTimeline.audioTracks = newTimeline.audioTracks.filter(clip => clip.id !== clipId);
      newTimeline.imageTracks = newTimeline.imageTracks.filter(clip => clip.id !== clipId);
      newTimeline.textTracks = newTimeline.textTracks.filter(clip => clip.id !== clipId);

      // Recalculate total duration
      const allClips = [
        ...newTimeline.videoTracks,
        ...newTimeline.audioTracks,
        ...newTimeline.imageTracks,
        ...newTimeline.textTracks,
      ];
      
      newTimeline.totalDuration = Math.max(
        ...allClips.map(clip => 
          'endTime' in clip ? clip.endTime : clip.startTime + clip.duration
        ),
        0
      );

      return {
        ...prev,
        timeline: newTimeline,
      };
    });

    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
    }
  }, [selectedClip]);

  const splitClip = useCallback((clipId: string, splitTime: number) => {
    setProject(prev => {
      const newTimeline = { ...prev.timeline };
      
      // Find and split the clip
      ['videoTracks', 'audioTracks', 'imageTracks', 'textTracks'].forEach(trackType => {
        const track = newTimeline[trackType as keyof Timeline] as ClipType[];
        const clipIndex = track.findIndex(clip => clip.id === clipId);
        
        if (clipIndex !== -1) {
          const originalClip = track[clipIndex];
          const splitPoint = splitTime - originalClip.startTime;
          
          if (splitPoint > 0 && splitPoint < originalClip.duration) {
            // Create first part
            const firstPart = { ...originalClip };
            firstPart.duration = splitPoint;
            if ('endTime' in firstPart) {
              firstPart.endTime = firstPart.startTime + splitPoint;
            }
            
            // Create second part
            const secondPart = { 
              ...originalClip, 
              id: Date.now().toString(),
              startTime: splitTime,
              duration: originalClip.duration - splitPoint,
            };
            if ('endTime' in secondPart) {
              secondPart.endTime = secondPart.startTime + secondPart.duration;
            }
            
            // Replace original with both parts
            track[clipIndex] = firstPart;
            track.splice(clipIndex + 1, 0, secondPart);
          }
        }
      });

      return {
        ...prev,
        timeline: newTimeline,
      };
    });
  }, []);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const selectClip = (clip: ClipType | null) => {
    setSelectedClip(clip);
  };

  return {
    project,
    setProject,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlayback,
    selectedClip,
    selectClip,
    addVideoClip,
    addAudioClip,
    addImageClip,
    addTextClip,
    updateClip,
    deleteClip,
    splitClip,
  };
};
