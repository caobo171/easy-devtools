import React from 'react';
import '../../assets/main.css'
import './App.css';
import VideoRecordingTool from '../sidepanel/Tools/VideoEditingTool';

function App() {
    return (
        <div className="video-recording-container">
            <VideoRecordingTool />
        </div>
    );
}

export default App;
