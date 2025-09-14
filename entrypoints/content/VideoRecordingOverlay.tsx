import React, { useState, useRef, useCallback, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { MessageType } from '../types';
import { Button } from '@/components/ui/button';

interface VideoRecordingOverlayProps {
  onRecordingComplete: (videoData: string) => void;
  onCancel: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onRecordingStateChange: (recording: boolean) => void;
}

export const VideoRecordingOverlay: React.FC<VideoRecordingOverlayProps> = ({ onRecordingComplete, onCancel, isVisible, onToggleVisibility, onRecordingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeCursor, setIncludeCursor] = useState(true);
  
  // Use effect to call onRecordingStateChange when recording state changes
  useEffect(() => {
    onRecordingStateChange(isRecording);
  }, [isRecording, onRecordingStateChange]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getQualityConstraints = () => {
    const baseConstraints = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };
    
    return baseConstraints[recordingQuality] || baseConstraints['1080p'];
  };

  const startRecording = async () => {
    try {
      setError(null);
      const constraints = getQualityConstraints();
      
      const displayMediaOptions: any = {
        video: {
          ...constraints,
          frameRate: 30,
          cursor: includeCursor ? 'always' : 'never'
        },
        audio: includeAudio
      };

      // @ts-ignore - getDisplayMedia is available in modern browsers
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        onRecordingComplete(videoUrl);
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please make sure you grant screen sharing permission.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  console.log('VideoRecordingOverlay render:', { isRecording, isVisible });
  
  // Show minimal recording indicator when hidden during recording
  if (isRecording && !isVisible) {
    console.log('Showing minimal indicator');
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
          <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
          <span className="text-xs">Press Cmd+Shift+7 to show controls</span>
        </div>
      </div>
    );
  }

  // Don't render anything if not visible and not recording
  if (!isVisible && !isRecording) {
    console.log('Not rendering - not visible and not recording');
    return null;
  }
  
  console.log('Showing full overlay');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">🎥 Screen Recording</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {!isRecording ? 'Configure your recording settings and start recording.' : 'Recording in progress...'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-600 dark:text-red-400 text-sm">
              ❌ {error}
            </div>
          </div>
        )}

        {/* Recording Settings */}
        {!isRecording && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <select
                value={recordingQuality}
                onChange={(e) => setRecordingQuality(e.target.value as any)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="4k">4K (Ultra HD)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAudio"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeAudio" className="text-sm font-medium">
                  🎤 Include Audio
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeCursor"
                  checked={includeCursor}
                  onChange={(e) => setIncludeCursor(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeCursor" className="text-sm font-medium">
                  🖱️ Show Cursor
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Recording Status */}
        {isRecording && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-mono text-red-500">
                  {formatTime(recordingTime)}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="text-sm font-medium">
                    {isPaused ? 'Paused' : 'Recording'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <>
              <Button onClick={startRecording} className="flex-1">
                🎬 Start Recording
              </Button>
              <Button onClick={onCancel} variant="outline" className="flex-1">
                ❌ Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={pauseRecording} variant="outline" className="flex-1">
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </Button>
              <Button onClick={stopRecording} variant="destructive" className="flex-1">
                ⏹️ Stop & Edit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
