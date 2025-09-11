import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { browser } from 'wxt/browser';
import { MessageType } from '@/entrypoints/types';

export default function VideoRecordingTool() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [recordingQuality, setRecordingQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
    const [includeAudio, setIncludeAudio] = useState(true);
    const [recordingSource, setRecordingSource] = useState<'screen' | 'tab' | 'window'>('screen');
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const uploadVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
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
    }, []);

    const getQualityConstraints = () => {
        switch (recordingQuality) {
            case '720p':
                return { width: 1280, height: 720 };
            case '1080p':
                return { width: 1920, height: 1080 };
            case '4k':
                return { width: 3840, height: 2160 };
            default:
                return { width: 1920, height: 1080 };
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            const constraints = getQualityConstraints();
            
            let stream: MediaStream;
            
            if (recordingSource === 'screen') {
                // @ts-ignore - getDisplayMedia is available in modern browsers
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        ...constraints,
                        frameRate: 30
                    },
                    audio: includeAudio
                });
            } else {
                // For tab recording, we'll use the same API but with different options
                // @ts-ignore
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        ...constraints,
                        frameRate: 30
                    },
                    audio: includeAudio
                });
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
                                onChange={(e) => setRecordingSource(e.target.value as any)}
                                disabled={isRecording}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="screen">Entire Screen</option>
                                <option value="window">Application Window</option>
                                <option value="tab">Browser Tab</option>
                            </select>
                        </div>

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
                    </div>
                </Card>

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
                    <li>• Recordings are saved in WebM format for best compatibility</li>
                </ul>
            </div>
        </div>
    );
}
