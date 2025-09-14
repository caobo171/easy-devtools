import React from 'react';
import { VideoEditingTool } from './VideoEditingTool/VideoEditingTool';

interface VideoRecordingToolProps {
    initialVideoData?: string | null;
    initialVideoType?: 'recorded' | 'uploaded';
    initialVideoFileName?: string;
}

export default function VideoRecordingTool({ initialVideoData, initialVideoType, initialVideoFileName }: VideoRecordingToolProps = {}) {
    return <VideoEditingTool />;
}
