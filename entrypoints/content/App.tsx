import React, {useEffect, useRef, useState} from 'react';
import './App.module.css';
import '../../assets/main.css'
import {Home} from "@/entrypoints/content/home.tsx";
import {SettingsPage} from "@/entrypoints/content/settings.tsx";
import Sidebar, {SidebarType} from "@/entrypoints/sidebar.tsx";
import {browser} from "wxt/browser";
import ExtMessage, {MessageType} from "@/entrypoints/types.ts";
import Header from "@/entrypoints/content/header.tsx";
import {useTranslation} from "react-i18next";
import {useTheme} from "@/components/theme-provider.tsx";
import {convertToReadableDate, DateConversionResult} from "@/lib/dateUtils";
import {ScreenshotOverlay} from "@/entrypoints/content/ScreenshotOverlay";
import {DateFormatPopup} from "@/entrypoints/content/DateFormatPopup";
import {ScreenshotPopup} from "@/entrypoints/content/ScreenshotPopup";

export default () => {
    const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);
    const [showDateFormatPopup, setShowDateFormatPopup] = useState(false);
    const [showScreenshotPopup, setShowScreenshotPopup] = useState(false);
    const [dateFormatInput, setDateFormatInput] = useState('');
    const [screenshotImageData, setScreenshotImageData] = useState('');
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const {i18n} = useTranslation();
    const {theme, toggleTheme} = useTheme();
    
    useEffect(() => {
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
                sendResponse({ success: true });
                return true;
            }
            
            if (message.messageType === MessageType.takeScreenshot) {
                setShowScreenshotOverlay(true);
                sendResponse({ success: true });
                return true;
            }
            
            return false;
        };

        browser.runtime.onMessage.addListener(messageListener);

        return () => {
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
        </div>
    )
};
