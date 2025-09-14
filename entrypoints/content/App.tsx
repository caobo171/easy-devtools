import React, {useEffect, useRef, useState} from 'react';
import './App.module.css';
import '../../assets/main.css'
import {Home} from "@/entrypoints/content/home.tsx";
import {SettingsPage} from "@/entrypoints/content/settings.tsx";
import Sidebar, {SidebarType} from "@/entrypoints/sidebar.tsx";
import {browser} from "wxt/browser";
import ExtMessage, {MessageFrom, MessageType, Tools} from "@/entrypoints/types.ts";
import Header from "@/entrypoints/content/header.tsx";
import {useTranslation} from "react-i18next";
import {useTheme} from "@/components/theme-provider.tsx";
import {convertToReadableDate, DateConversionResult} from "@/lib/dateUtils";
import {ScreenshotOverlay} from "@/entrypoints/content/ScreenshotOverlay";
import {DateFormatPopup} from "@/entrypoints/content/DateFormatPopup";
import {ScreenshotPopup} from "@/entrypoints/content/ScreenshotPopup";
import {VideoEditingPopup} from "@/entrypoints/content/VideoEditingPopup";
import {VideoRecordingOverlay} from "@/entrypoints/content/VideoRecordingOverlay";
import { ToolState } from "@/utils/db";

export default () => {
    const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);
    const [showDateFormatPopup, setShowDateFormatPopup] = useState(false);
    const [showScreenshotPopup, setShowScreenshotPopup] = useState(false);
    const [showVideoEditingPopup, setShowVideoEditingPopup] = useState(false);
    const [showVideoRecordingOverlay, setShowVideoRecordingOverlay] = useState(false);
    const [isRecordingOverlayVisible, setIsRecordingOverlayVisible] = useState(true);
    const [isCurrentlyRecording, setIsCurrentlyRecording] = useState(false);
    const [dateFormatInput, setDateFormatInput] = useState('');
    const [screenshotImageData, setScreenshotImageData] = useState('');
    const [videoData, setVideoData] = useState<string | null>(null);
    const [videoType, setVideoType] = useState<'recorded' | 'uploaded'>('recorded');
    const [videoFileName, setVideoFileName] = useState<string>('');
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const {i18n} = useTranslation();
    const {theme, toggleTheme} = useTheme();
    
    // Function to save partial state when a tool is selected
    const savePartialState = (toolId: string, toolState: any) => {
        // Create a partial app state with just the selected tool and its state
        const partialState = {
            currentSelectedTool: toolId,
            toolState: {
                [toolId]: toolState
            }
        };
        
        // Send the partial state to the background script
        const message = new ExtMessage(MessageType.savePartialAppState);
        message.content = JSON.stringify(partialState);
        message.from = MessageFrom.contentScript;
        
        browser.runtime.sendMessage(message).catch(error => {
            console.error('Failed to save partial state:', error);
        });
    };
    
    useEffect(() => {
        // Add keyboard shortcut listeners
        const handleKeyDown = (event: KeyboardEvent) => {
            console.log('Key pressed:', event.key, event.shiftKey, event.metaKey, event.ctrlKey);
            
            // Check for Cmd+Shift+6 (Mac) or Ctrl+Shift+6 (Windows/Linux) - Screenshot
            if (event.shiftKey && event.key === '6') {
                event.preventDefault();
                const correctModifier = event.metaKey;
                
                console.log('Correct modifier:', correctModifier);
                if (correctModifier) {
                    event.preventDefault();
                    setShowScreenshotOverlay(true);
                }
            }
            
            // Check for Cmd+Shift+7 (Mac) or Ctrl+Shift+7 (Windows/Linux) - Video Recording
            if (event.shiftKey && event.key === '7') {
                event.preventDefault();
                const correctModifier = event.metaKey;
                
                console.log('Video recording shortcut triggered:', correctModifier);
                if (correctModifier) {
                    event.preventDefault();
                    if (!showVideoRecordingOverlay) {
                        // Open video recording overlay first
                        setShowVideoRecordingOverlay(true);
                        setIsRecordingOverlayVisible(true);
                        
                        // Save partial state for the video recording tool
                        savePartialState('videoRecording', { started: true });
                    } else if (isCurrentlyRecording) {
                        // Toggle visibility during recording
                        setIsRecordingOverlayVisible(!isRecordingOverlayVisible);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Listen for messages from background script
        const messageListener = (message: ExtMessage, sender: any, sendResponse: (response?: any) => void) => {
            console.log('Content script received message:', message);
            
            if (message.messageType === MessageType.convertToReadableDateInContent) {
                // Handle date conversion request
                console.log('Converting date:', message.content);
                
                // Show date format popup near the cursor or at a default position
                const position = message.position || { 
                    x: window.innerWidth / 2 - 150, 
                    y: window.innerHeight / 2 - 200 
                };
                
                setDateFormatInput(message.content || '');
                setPopupPosition(position);
                setShowDateFormatPopup(true);
                
                // Save partial state for the date format tool
                savePartialState('convertToReadableDate', { input: message.content || '' });
                
                sendResponse({ success: true });
                return true;
            }
            
            if (message.messageType === MessageType.takeScreenshot) {
                setShowScreenshotOverlay(true);
                sendResponse({ success: true });
                return true;
            }
            
            if (message.messageType === MessageType.openVideoEditor) {
                // Open video recording overlay first
                setShowVideoRecordingOverlay(true);
                
                // Save partial state for the video recording tool
                savePartialState('videoRecording', { started: true });
                
                sendResponse({ success: true });
                return true;
            }
            
            return false;
        };

        browser.runtime.onMessage.addListener(messageListener);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            browser.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    const handleScreenshotCapture = (imageData: string) => {
        // Show the screenshot popup with the captured image
        setScreenshotImageData(imageData);
        setPopupPosition({ 
            x: window.innerWidth / 2 - 200, 
            y: window.innerHeight / 2 - 250 
        });
        setShowScreenshotOverlay(false);
        setShowScreenshotPopup(true);
        
        // Save partial state for the screenshot tool
        savePartialState('takeScreenshot', { imageData });
    };

    const handleScreenshotCancel = () => {
        setShowScreenshotOverlay(false);
    };
    
    const handleDateFormatPopupClose = () => {
        setShowDateFormatPopup(false);
    };
    
    const handleScreenshotPopupClose = () => {
        setShowScreenshotPopup(false);
    };
    
    const handleVideoEditingPopupClose = () => {
        setShowVideoEditingPopup(false);
    };
    
    const handleVideoRecordingComplete = (videoData: string) => {
        // Set video data and show editing popup
        setVideoData(videoData);
        setVideoType('recorded');
        setVideoFileName(`screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`);
        setPopupPosition({ 
            x: window.innerWidth / 2 - 300, 
            y: window.innerHeight / 2 - 250 
        });
        setShowVideoRecordingOverlay(false);
        setShowVideoEditingPopup(true);
        
        // Save partial state for the video editing tool
        savePartialState('videoRecording', { videoData, completed: true });
    };
    
    const handleVideoRecordingCancel = () => {
        setShowVideoRecordingOverlay(false);
        setIsCurrentlyRecording(false);
        setIsRecordingOverlayVisible(true);
    };
    
    const handleToggleOverlayVisibility = () => {
        setIsRecordingOverlayVisible(!isRecordingOverlayVisible);
    };
    
    const handleRecordingStateChange = (recording: boolean) => {
        console.log('handleRecordingStateChange called:', recording);
        setIsCurrentlyRecording(recording);
        if (recording) {
            // Hide overlay when recording starts
            console.log('Setting overlay visible to false');
            setIsRecordingOverlayVisible(false);
        }
    };

    return (
        <div className={theme}>
           {/* Content script UI can be added here if needed */}
           {showScreenshotOverlay && (
               <ScreenshotOverlay
                   onCapture={handleScreenshotCapture}
                   onCancel={handleScreenshotCancel}
               />
           )}
           
           {showDateFormatPopup && (
               <DateFormatPopup
                   initialDate={dateFormatInput}
                   position={popupPosition}
                   onClose={handleDateFormatPopupClose}
               />
           )}
           
           {showScreenshotPopup && (
               <ScreenshotPopup
                   imageData={screenshotImageData}
                   position={popupPosition}
                   onClose={handleScreenshotPopupClose}
               />
           )}
           
           {showVideoRecordingOverlay && (
               <VideoRecordingOverlay
                   onRecordingComplete={handleVideoRecordingComplete}
                   onCancel={handleVideoRecordingCancel}
                   isVisible={isRecordingOverlayVisible}
                   onToggleVisibility={handleToggleOverlayVisibility}
                   onRecordingStateChange={handleRecordingStateChange}
               />
           )}
           {/* Debug info */}
           {showVideoRecordingOverlay && (
               <div className="fixed bottom-4 left-4 bg-black text-white p-2 text-xs z-50">
                   Debug: visible={isRecordingOverlayVisible.toString()}, recording={isCurrentlyRecording.toString()}
               </div>
           )}
           
           {showVideoEditingPopup && (
               <VideoEditingPopup
                   videoData={videoData}
                   videoType={videoType}
                   videoFileName={videoFileName}
                   position={popupPosition}
                   onClose={handleVideoEditingPopupClose}
               />
           )}
        </div>
    )
};
