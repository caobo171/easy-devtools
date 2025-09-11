import React, { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import ScreenshotTool from '../sidepanel/Tools/ScreenshotTool';
import VideoRecordingTool from '../sidepanel/Tools/VideoEditingTool';
import { Button } from '@/components/ui/button';
import { ToolStateProvider } from '@/lib/toolStateContext';

export default function App() {
    const [imageData, setImageData] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<string | null>(null);
    const [videoType, setVideoType] = useState<'recorded' | 'uploaded'>('recorded');
    const [videoFileName, setVideoFileName] = useState<string>('');
    const [mediaType, setMediaType] = useState<'screenshot' | 'video' | null>(null);

    useEffect(() => {
        // Get media data from URL parameters or storage
        const urlParams = new URLSearchParams(window.location.search);
        const imageParam = urlParams.get('image');
        
        if (imageParam) {
            try {
                const decodedImage = decodeURIComponent(imageParam);
                setImageData(decodedImage);
                setMediaType('screenshot');
            } catch (error) {
                console.error('Failed to decode image data:', error);
            }
        } else {
            // Try to get from storage as fallback
            browser.storage.local.get(['screenshotData', 'videoData', 'videoType', 'videoFileName']).then((result) => {
                if (result.screenshotData) {
                    setImageData(result.screenshotData);
                    setMediaType('screenshot');
                    // Clear the storage after use
                    browser.storage.local.remove('screenshotData');
                } else if (result.videoData) {
                    setVideoData(result.videoData);
                    setVideoType(result.videoType || 'recorded');
                    setVideoFileName(result.videoFileName || '');
                    setMediaType('video');
                    // Clear the storage after use
                    browser.storage.local.remove(['videoData', 'videoType', 'videoFileName']);
                }
            });
        }

    }, []);

    const goBack = () => {
        window.close();
    };

    return (
        <ToolStateProvider>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="border-b bg-card">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button 
                                    onClick={goBack}
                                    variant="outline"
                                    size="sm"
                                >
                                    ← Back
                                </Button>
                                <h1 className="text-xl font-semibold">
                                    {mediaType === 'video' ? '🎥 Video Editor' : '📸 Screenshot Editor'}
                                </h1>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Full-screen editing mode
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-6">
                    {mediaType === 'video' ? (
                        <VideoRecordingTool 
                            initialVideoData={videoData}
                            initialVideoType={videoType}
                            initialVideoFileName={videoFileName}
                        />
                    ) : (
                        <ScreenshotTool initialImage={imageData} />
                    )}
                </div>
            </div>
        </ToolStateProvider>
    );
}
