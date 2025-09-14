import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MediaLibraryProps {
  onVideoAdd: (videoData: string, name: string) => void;
  onAudioAdd: (audioData: string, name: string) => void;
  onImageAdd: (imageData: string, name: string) => void;
  onTextAdd: (text: string) => void;
}

interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  src: string;
  thumbnail?: string;
  duration?: number;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onVideoAdd,
  onAudioAdd,
  onImageAdd,
  onTextAdd,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'video' | 'audio' | 'image'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const mediaItem: MediaItem = {
      id: Date.now().toString(),
      name: file.name,
      type,
      src: url,
    };

    // Generate thumbnail for video/image
    if (type === 'video') {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        mediaItem.duration = video.duration;
        video.currentTime = 1; // Seek to 1 second for thumbnail
      };
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          mediaItem.thumbnail = canvas.toDataURL();
        }
        setMediaItems(prev => [...prev, mediaItem]);
      };
    } else if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Calculate aspect ratio
          const aspectRatio = img.width / img.height;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          
          if (aspectRatio > canvas.width / canvas.height) {
            drawHeight = canvas.width / aspectRatio;
          } else {
            drawWidth = canvas.height * aspectRatio;
          }
          
          const x = (canvas.width - drawWidth) / 2;
          const y = (canvas.height - drawHeight) / 2;
          
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          mediaItem.thumbnail = canvas.toDataURL();
        }
        setMediaItems(prev => [...prev, mediaItem]);
      };
      img.src = url;
    } else if (type === 'audio') {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.onloadedmetadata = () => {
        mediaItem.duration = audio.duration;
        setMediaItems(prev => [...prev, mediaItem]);
      };
    }

    // Reset input
    event.target.value = '';
  };

  const handleMediaItemClick = (item: MediaItem) => {
    switch (item.type) {
      case 'video':
        onVideoAdd(item.src, item.name);
        break;
      case 'audio':
        onAudioAdd(item.src, item.name);
        break;
      case 'image':
        onImageAdd(item.src, item.name);
        break;
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onTextAdd(textInput.trim());
      setTextInput('');
      setShowTextInput(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => {
      const item = prev.find(item => item.id === id);
      if (item) {
        URL.revokeObjectURL(item.src);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Media Library</h3>
          <div className="text-xs text-gray-500">
            {mediaItems.length} items
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => videoInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>🎥</span>
            <span>Video</span>
          </Button>
          
          <Button
            onClick={() => audioInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>🎵</span>
            <span>Audio</span>
          </Button>
          
          <Button
            onClick={() => imageInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>🖼️</span>
            <span>Image</span>
          </Button>
          
          <Button
            onClick={() => setShowTextInput(true)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>📝</span>
            <span>Text</span>
          </Button>
        </div>

        {/* Text Input Modal */}
        {showTextInput && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="space-y-3">
              <label className="block text-sm font-medium">Add Text</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your text..."
                className="w-full p-2 border rounded-lg resize-none"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button onClick={handleTextSubmit} size="sm">
                  Add Text
                </Button>
                <Button
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Media Items Grid */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {mediaItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <p>No media files yet</p>
              <p className="text-xs">Upload videos, audio, or images to get started</p>
            </div>
          ) : (
            mediaItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer group"
                onClick={() => handleMediaItemClick(item)}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-9 bg-gray-200 rounded overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {item.type === 'video' && '🎥'}
                      {item.type === 'audio' && '🎵'}
                      {item.type === 'image' && '🖼️'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span className="capitalize">{item.type}</span>
                    {item.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(item.duration)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMediaItem(item.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  🗑️
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileUpload(e, 'video')}
          className="hidden"
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => handleFileUpload(e, 'audio')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'image')}
          className="hidden"
        />
      </div>
    </Card>
  );
};
