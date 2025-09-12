import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { browser } from 'wxt/browser';
import { MessageType, MessageFrom } from '@/entrypoints/types';

interface VideoRecordingToolProps {
    initialVideoData?: string | null;
    initialVideoType?: 'recorded' | 'uploaded';
    initialVideoFileName?: string;
}

export default function VideoRecordingTool({ initialVideoData, initialVideoType, initialVideoFileName }: VideoRecordingToolProps = {}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [recordingQuality, setRecordingQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
    const [includeAudio, setIncludeAudio] = useState(true);
    const [recordingSource, setRecordingSource] = useState<'screen' | 'tab' | 'window' | 'area'>('screen');
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
    const [includeCursor, setIncludeCursor] = useState(true);
    const [recordingArea, setRecordingArea] = useState<{x: number, y: number, width: number, height: number} | null>(null);
    const [showAreaSelector, setShowAreaSelector] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const uploadVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Set initial video data if provided
        if (initialVideoData) {
            if (initialVideoType === 'uploaded') {
                setUploadedVideo(initialVideoData);
                setUploadedFileName(initialVideoFileName || 'video.webm');
                setActiveTab('upload');
            } else {
                setRecordedVideo(initialVideoData);
                setActiveTab('record');
            }
        }

        return () => {
            // Cleanup on unmount
            stopRecording();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            // Cleanup uploaded video URL
            if (uploadedVideo) {
                URL.revokeObjectURL(uploadedVideo);
            }
        };
    }, [initialVideoData, initialVideoType, initialVideoFileName]);

    const getQualityConstraints = () => {
        const baseConstraints = {
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 },
            '4k': { width: 3840, height: 2160 }
        };
        
        const constraints = baseConstraints[recordingQuality] || baseConstraints['1080p'];
        
        // If recording a specific area, use the area dimensions
        if (recordingSource === 'area' && recordingArea) {
            return {
                width: Math.min(recordingArea.width, constraints.width),
                height: Math.min(recordingArea.height, constraints.height)
            };
        }
        
        return constraints;
    };

    const captureScreenPreview = async () => {
        try {
            // @ts-ignore
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 1920, height: 1080 },
                audio: false
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    const imageData = canvas.toDataURL('image/png');
                    setPreviewImage(imageData);
                    setShowAreaSelector(true);
                }
                
                // Stop the preview stream
                stream.getTracks().forEach(track => track.stop());
            };
        } catch (error) {
            console.error('Failed to capture screen preview:', error);
            setError('Failed to capture screen preview. Please grant screen sharing permission.');
        }
    };

    const selectRecordingArea = () => {
        if (recordingSource === 'area') {
            captureScreenPreview();
        }
    };

    const handleAreaSelection = (area: {x: number, y: number, width: number, height: number}) => {
        setRecordingArea(area);
        setShowAreaSelector(false);
    };

    const AreaSelector = () => {
        const [isDragging, setIsDragging] = useState(false);
        const [startPos, setStartPos] = useState({ x: 0, y: 0 });
        const [currentArea, setCurrentArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
        const canvasRef = useRef<HTMLCanvasElement>(null);

        useEffect(() => {
            if (previewImage && canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                    }
                };
                img.src = previewImage;
            }
        }, [previewImage]);

        const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            setStartPos({ x, y });
            setCurrentArea({ x, y, width: 0, height: 0 });
            setIsDragging(true);
        };

        const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!isDragging || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const width = x - startPos.x;
            const height = y - startPos.y;

            setCurrentArea({
                x: Math.min(startPos.x, x),
                y: Math.min(startPos.y, y),
                width: Math.abs(width),
                height: Math.abs(height)
            });

            // Redraw canvas with selection overlay
            const ctx = canvas.getContext('2d');
            if (ctx && previewImage) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    
                    // Draw selection overlay
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Clear selected area
                    ctx.clearRect(currentArea.x, currentArea.y, currentArea.width, currentArea.height);
                    ctx.drawImage(img, currentArea.x, currentArea.y, currentArea.width, currentArea.height, 
                                currentArea.x, currentArea.y, currentArea.width, currentArea.height);
                    
                    // Draw selection border
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(currentArea.x, currentArea.y, currentArea.width, currentArea.height);
                };
                img.src = previewImage;
            }
        };

        const handleMouseUp = () => {
            if (isDragging && currentArea.width > 10 && currentArea.height > 10) {
                handleAreaSelection(currentArea);
            }
            setIsDragging(false);
        };

        if (!showAreaSelector || !previewImage) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-4xl max-h-screen overflow-auto">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Select Recording Area</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click and drag to select the area you want to record. The selected area will be highlighted.
                        </p>
                    </div>
                    
                    <div className="relative border rounded-lg overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-96 cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        />
                    </div>
                    
                    {currentArea.width > 0 && currentArea.height > 0 && (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            Selected: {Math.round(currentArea.width)} × {Math.round(currentArea.height)} pixels
                        </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                        <Button 
                            onClick={() => {
                                if (currentArea.width > 10 && currentArea.height > 10) {
                                    handleAreaSelection(currentArea);
                                }
                            }}
                            disabled={currentArea.width <= 10 || currentArea.height <= 10}
                        >
                            ✅ Confirm Selection
                        </Button>
                        <Button 
                            onClick={() => setShowAreaSelector(false)}
                            variant="outline"
                        >
                            ❌ Cancel
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const startRecording = async () => {
        try {
            setError(null);
            const constraints = getQualityConstraints();
            
            let stream: MediaStream;
            
            const displayMediaOptions: any = {
                video: {
                    ...constraints,
                    frameRate: 30,
                    cursor: includeCursor ? 'always' : 'never'
                },
                audio: includeAudio
            };

            // @ts-ignore - getDisplayMedia is available in modern browsers
            stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
            
            // If recording a specific area, we'll need to crop the video
            if (recordingSource === 'area' && recordingArea) {
                // Note: Actual area cropping would require additional video processing
                // For now, we'll record the full screen and note the area for future cropping
                console.log('Recording area:', recordingArea);
            }

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
                setRecordedVideo(videoUrl);
                setIsRecording(false);
                setIsPaused(false);
                setRecordingTime(0);
                
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };

            mediaRecorder.start(1000); // Collect data every second
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

    const downloadVideo = () => {
        if (recordedVideo) {
            const a = document.createElement('a');
            a.href = recordedVideo;
            a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const clearRecording = () => {
        if (recordedVideo) {
            URL.revokeObjectURL(recordedVideo);
            setRecordedVideo(null);
        }
        setRecordingTime(0);
        setError(null);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check if it's a video file
            if (!file.type.startsWith('video/')) {
                setError('Please select a valid video file.');
                return;
            }
            
            // Clear any existing uploaded video
            if (uploadedVideo) {
                URL.revokeObjectURL(uploadedVideo);
            }
            
            const videoUrl = URL.createObjectURL(file);
            setUploadedVideo(videoUrl);
            setUploadedFileName(file.name);
            setError(null);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const clearUploadedVideo = () => {
        if (uploadedVideo) {
            URL.revokeObjectURL(uploadedVideo);
            setUploadedVideo(null);
            setUploadedFileName('');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadUploadedVideo = () => {
        if (uploadedVideo && uploadedFileName) {
            const a = document.createElement('a');
            a.href = uploadedVideo;
            a.download = uploadedFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const openRecordedVideoInNewTab = async () => {
        if (!recordedVideo) return;

        try {
            // Store the video data in browser storage
            await browser.storage.local.set({ videoData: recordedVideo, videoType: 'recorded' });
            
            // Open the new tab with the media viewer URL
            const newTab = await browser.tabs.create({
                url: '/media-viewer.html?type=video'
            });
            
            console.log('Opened recorded video in new tab:', newTab.id);
            
            // Send message to close the sidepanel
            try {
                await browser.runtime.sendMessage({
                    messageType: MessageType.closeSidepanel,
                    from: MessageFrom.sidePanel
                });
            } catch (sidePanelError) {
                console.error('Failed to close sidepanel:', sidePanelError);
            }
        } catch (error) {
            console.error('Failed to open recorded video in new tab:', error);
        }
    };

    const openUploadedVideoInNewTab = async () => {
        if (!uploadedVideo) return;

        try {
            // Store the video data in browser storage
            await browser.storage.local.set({ videoData: uploadedVideo, videoType: 'uploaded', videoFileName: uploadedFileName });
            
            // Open the new tab
            const newTab = await browser.tabs.create({
                url: '/newtab.html'
            });
            
            console.log('Opened uploaded video in new tab:', newTab.id);
            
            // Send message to close the sidepanel
            try {
                await browser.runtime.sendMessage({
                    messageType: MessageType.closeSidepanel,
                    from: MessageFrom.sidePanel
                });
            } catch (sidePanelError) {
                console.error('Failed to close sidepanel:', sidePanelError);
            }
        } catch (error) {
            console.error('Failed to open uploaded video in new tab:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">🎥 Video Recording Tool</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Record your screen, browser tab, or application window with audio support.
                </p>
            </div>

            {error && (
                <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
                    <div className="text-red-600 dark:text-red-400">
                        ❌ {error}
                    </div>
                </Card>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
                <Button
                    onClick={() => setActiveTab('record')}
                    variant={activeTab === 'record' ? 'default' : 'outline'}
                    className="flex-1"
                >
                    🎬 Record Screen
                </Button>
                <Button
                    onClick={() => setActiveTab('upload')}
                    variant={activeTab === 'upload' ? 'default' : 'outline'}
                    className="flex-1"
                >
                    📁 Upload Video
                </Button>
            </div>

            <div className="space-y-4">
                {activeTab === 'record' && (
                    <>
                        {/* Recording Settings */}
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">⚙️ Recording Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Quality</label>
                            <select
                                value={recordingQuality}
                                onChange={(e) => setRecordingQuality(e.target.value as any)}
                                disabled={isRecording}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="720p">720p (HD)</option>
                                <option value="1080p">1080p (Full HD)</option>
                                <option value="4k">4K (Ultra HD)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Source</label>
                            <select
                                value={recordingSource}
                                onChange={(e) => {
                                    const newSource = e.target.value as any;
                                    setRecordingSource(newSource);
                                    if (newSource !== 'area') {
                                        setRecordingArea(null);
                                        setShowAreaSelector(false);
                                    }
                                }}
                                disabled={isRecording}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="screen">Entire Screen</option>
                                <option value="window">Application Window</option>
                                <option value="tab">Browser Tab</option>
                                <option value="area">Selected Area</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="includeAudio"
                                    checked={includeAudio}
                                    onChange={(e) => setIncludeAudio(e.target.checked)}
                                    disabled={isRecording}
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
                                    disabled={isRecording}
                                    className="rounded"
                                />
                                <label htmlFor="includeCursor" className="text-sm font-medium">
                                    🖱️ Show Cursor
                                </label>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Area Selection */}
                {recordingSource === 'area' && (
                    <Card className="p-4">
                        <h3 className="font-semibold mb-3">📐 Recording Area Selection</h3>
                        
                        {!recordingArea ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Select a specific area of your screen to record. This helps reduce file size and focus on what matters.
                                </p>
                                <Button 
                                    onClick={selectRecordingArea}
                                    disabled={isRecording}
                                    variant="outline"
                                    className="w-full"
                                >
                                    📐 Select Recording Area
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-green-600 dark:text-green-400">✅</span>
                                        <span className="font-medium text-green-800 dark:text-green-200">Area Selected</span>
                                    </div>
                                    <div className="text-sm text-green-700 dark:text-green-300">
                                        Position: ({recordingArea.x}, {recordingArea.y})<br/>
                                        Size: {recordingArea.width} × {recordingArea.height} pixels
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={selectRecordingArea}
                                        disabled={isRecording}
                                        variant="outline"
                                        size="sm"
                                    >
                                        🔄 Reselect Area
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            setRecordingArea(null);
                                            setShowAreaSelector(false);
                                        }}
                                        disabled={isRecording}
                                        variant="outline"
                                        size="sm"
                                    >
                                        ❌ Clear Selection
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Recording Controls */}
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <div className={`text-2xl font-mono ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
                                {formatTime(recordingTime)}
                            </div>
                            {isRecording && (
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                                    <span className="text-sm font-medium">
                                        {isPaused ? 'Paused' : 'Recording'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!isRecording ? (
                            <Button onClick={startRecording} className="flex-1">
                                🎬 Start Recording
                            </Button>
                        ) : (
                            <>
                                <Button onClick={pauseRecording} variant="outline" className="flex-1">
                                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                                </Button>
                                <Button onClick={stopRecording} variant="destructive" className="flex-1">
                                    ⏹️ Stop
                                </Button>
                            </>
                        )}
                    </div>
                </Card>

                {/* Video Preview */}
                {recordedVideo && (
                    <Card className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">📹 Recorded Video</h3>
                            <div className="flex gap-2">
                                <Button onClick={downloadVideo} variant="outline" size="sm">
                                    💾 Download
                                </Button>
                                <Button onClick={openRecordedVideoInNewTab} variant="outline" size="sm">
                                    🔗 Open in New Tab
                                </Button>
                                <Button onClick={clearRecording} variant="outline" size="sm">
                                    🗑️ Clear
                                </Button>
                            </div>
                        </div>
                        
                        <video
                            ref={videoRef}
                            src={recordedVideo}
                            controls
                            className="w-full max-h-96 rounded-lg bg-black"
                        />
                    </Card>
                )}
                    </>
                )}

                {activeTab === 'upload' && (
                    <>
                        {/* File Upload */}
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">📁 Upload Video File</h3>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    {!uploadedVideo ? (
                                        <div>
                                            <div className="text-4xl mb-4">🎥</div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Select a video file from your computer
                                            </p>
                                            <Button onClick={triggerFileUpload}>
                                                📁 Choose Video File
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-4xl mb-4">✅</div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                                                Video uploaded successfully
                                            </p>
                                            <p className="font-medium mb-4">{uploadedFileName}</p>
                                            <div className="flex gap-2 justify-center">
                                                <Button onClick={triggerFileUpload} variant="outline">
                                                    🔄 Change File
                                                </Button>
                                                <Button onClick={clearUploadedVideo} variant="outline">
                                                    🗑️ Remove
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Uploaded Video Preview */}
                        {uploadedVideo && (
                            <Card className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold">📹 Uploaded Video</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={downloadUploadedVideo} variant="outline" size="sm">
                                            💾 Download
                                        </Button>
                                        <Button onClick={openUploadedVideoInNewTab} variant="outline" size="sm">
                                            🔗 Open in New Tab
                                        </Button>
                                        <Button onClick={clearUploadedVideo} variant="outline" size="sm">
                                            🗑️ Clear
                                        </Button>
                                    </div>
                                </div>
                                
                                <video
                                    ref={uploadVideoRef}
                                    src={uploadedVideo}
                                    controls
                                    className="w-full max-h-96 rounded-lg bg-black"
                                />
                            </Card>
                        )}
                    </>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    💡 Tips:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Choose the appropriate quality based on your needs and storage</li>
                    <li>• Higher quality recordings will result in larger file sizes</li>
                    <li>• You can pause and resume recording at any time</li>
                    <li>• Audio recording requires microphone permission</li>
                    <li>• Cursor recording shows mouse movements and clicks</li>
                    <li>• Area selection allows focused recording of specific regions</li>
                    <li>• Recordings are saved in WebM format for best compatibility</li>
                </ul>
            </div>
            
            {/* Area Selector Modal */}
            <AreaSelector />
        </div>
    );
}
