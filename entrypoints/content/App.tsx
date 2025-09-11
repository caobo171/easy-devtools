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
import {DatePopup} from "@/entrypoints/content/date-popup.tsx";
import {convertToReadableDate, DateConversionResult} from "@/lib/dateUtils";
import {ScreenshotOverlay} from "@/entrypoints/content/screenshot-overlay.tsx";

export default () => {
    const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const {i18n} = useTranslation();
    const {theme, toggleTheme} = useTheme();
    
    useEffect(() => {
        // Listen for messages from background script
        const messageListener = (message: ExtMessage, sender: any, sendResponse: (response?: any) => void) => {
            console.log('Content script received message:', message);
            
            if (message.messageType === MessageType.convertToReadableDate) {
                // Handle date conversion request
                console.log('Converting date:', message.content);
                
                // Send message to sidepanel to show DateFormat tool
                browser.runtime.sendMessage({
                    messageType: MessageType.convertToReadableDate,
                    content: message.content
                });
                
                sendResponse({ success: true });
                return true;
            }
            
            if (message.messageType === MessageType.takeScreenshot) {

                console.log('takeScreenshot')
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
        // Send the captured image to the sidepanel
        browser.runtime.sendMessage({
            messageType: MessageType.screenshotCaptured,
            content: imageData
        });
        setShowScreenshotOverlay(false);
    };

    const handleScreenshotCancel = () => {
        setShowScreenshotOverlay(false);
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
        </div>
    )
};
