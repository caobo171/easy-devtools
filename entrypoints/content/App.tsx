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

export default () => {
    const [showContent, setShowContent] = useState(true);
    const [showButton, setShowButton] = useState(false)
    const [showCard, setShowCard] = useState(false)
    const [sidebarType, setSidebarType] = useState<SidebarType>(SidebarType.home);
    const [headTitle, setHeadTitle] = useState("home")
    const [buttonStyle, setButtonStyle] = useState<any>();
    const [cardStyle, setCardStyle] = useState<any>();
    const cardRef = useRef<HTMLDivElement>(null);
    const {i18n} = useTranslation();
    const {theme, toggleTheme} = useTheme();
    
    // Date conversion popup state
    const [datePopup, setDatePopup] = useState<{
        show: boolean;
        result: DateConversionResult | null;
        position: { x: number; y: number };
    }>({
        show: false,
        result: null,
        position: { x: 0, y: 0 }
    });

    async function initI18n() {
        let data = await browser.storage.local.get('i18n');
        if (data.i18n) {
            await i18n.changeLanguage(data.i18n)
        }
    }

    function domLoaded() {
        console.log("dom loaded")
    }

    function handleDateConversion(selectedText: string) {
        // Get the current mouse position or selection position
        const selection = window.getSelection();
        let x = window.innerWidth / 2; // Default to center
        let y = window.innerHeight / 2;
        
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            x = rect.left + (rect.width / 2);
            y = rect.top;
        }
        
        // Convert the selected text to readable date
        const result = convertToReadableDate(selectedText);
        
        // Show the popup with the result
        setDatePopup({
            show: true,
            result: result,
            position: { x, y }
        });
        
        // Auto-hide popup after 10 seconds if successful, 5 seconds if error
        setTimeout(() => {
            setDatePopup(prev => ({ ...prev, show: false }));
        }, result.success ? 10000 : 5000);
    }

    useEffect(() => {

        if (document.readyState === "complete") {
            // load event has already fired, run your code or function here
            console.log("dom complete")
            domLoaded();
        } else {
            // load event hasn't fired, listen for it
            window.addEventListener('load', () => {
                // your code here
                console.log("content load:")
                console.log(window.location.href)
                domLoaded();
            });
        }
        browser.runtime.onMessage.addListener((message: ExtMessage, sender, sendResponse) => {
            console.log('content:')
            console.log(message)
            if (message.messageType == MessageType.clickExtIcon) {
                setShowContent(true);
            } else if (message.messageType == MessageType.changeLocale) {
                i18n.changeLanguage(message.content)
            } else if (message.messageType == MessageType.changeTheme) {
                toggleTheme(message.content)
            } else if (message.messageType == MessageType.convertToReadableDate) {
                handleDateConversion(message.content || '');
            }
        });

        initI18n();

    }, []);


    return (
        <div className={theme}>
            {showContent && <div
                className="fixed top-0 right-0 h-screen w-[400px] bg-background z-[1000000000000] rounded-l-xl shadow-2xl">
                <Header headTitle={headTitle}/>
                <Sidebar closeContent={() => {
                    setShowContent(false)
                }} sideNav={(sidebarType: SidebarType) => {
                    setSidebarType(sidebarType)
                    setHeadTitle(sidebarType)
                }}/>
                <main className="mr-14 grid gap-4 p-4">
                    {sidebarType === SidebarType.home && <Home/>}
                    {sidebarType === SidebarType.settings && <SettingsPage/>}
                </main>
            </div>
            }
            
            {/* Date conversion popup */}
            {datePopup.show && datePopup.result && (
                <DatePopup
                    result={datePopup.result}
                    position={datePopup.position}
                    onClose={() => setDatePopup(prev => ({ ...prev, show: false }))}
                />
            )}
        </div>


    )
};
