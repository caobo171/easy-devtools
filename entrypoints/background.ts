import { browser } from "wxt/browser";
import ExtMessage, { MessageFrom, MessageType } from "@/entrypoints/types.ts";
import { db, type AppState, type ToolState } from "@/utils/db";

export default defineBackground(() => {
    console.log('Hello background!', { id: browser.runtime.id });// background.js

    // @ts-ignore
    browser.sidePanel.setPanelBehavior({ 
        openPanelOnActionClick: true 
    }).catch((error: any) => console.error(error));

    // Create context menu items - these work in devtools too
    browser.contextMenus.create({
        id: "devtools-parent",
        title: "Easy devtools",
        contexts: ["selection", "page"],
        documentUrlPatterns: ["*://*/*", "devtools://*/*"]
    });

    browser.contextMenus.create({
        id: "analyzeText",
        parentId: "devtools-parent",
        title: "🔍 Analyze text",
        contexts: ["selection", "page", "editable", "frame", "link", "image"],
        documentUrlPatterns: ["*://*/*", "devtools://*/*"]
    });

    browser.contextMenus.create({
        id: "convertToReadableDate",
        parentId: "devtools-parent",
        title: "📅 Convert to readable date",
        contexts: ["selection", "page", "editable", "frame", "link", "image"],
        documentUrlPatterns: ["*://*/*", "devtools://*/*"]
    });

    browser.contextMenus.create({
        id: "openInSidebar",
        parentId: "devtools-parent",
        title: "📋 Open in sidebar",
        contexts: ["selection", "page", "editable", "frame", "link", "image"],
        documentUrlPatterns: ["*://*/*", "devtools://*/*"]
    });

    browser.contextMenus.create({
        id: "takeScreenshot",
        parentId: "devtools-parent",
        title: "📸 Take screenshot",
        contexts: ["selection", "page", "editable", "frame", "link", "image"],
        documentUrlPatterns: ["*://*/*", "devtools://*/*"]
    });

    //monitor the event from extension icon click
    browser.action.onClicked.addListener((tab) => {
        // 发送消息给content-script.js
        console.log("click icon")
        console.log(tab)
        browser.tabs.sendMessage(tab.id!, { messageType: MessageType.clickExtIcon });
    });

    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(async (info, tab) => {
        if (!tab?.id) return;

        // Create message based on which menu item was clicked
        let message;
        
        switch (info.menuItemId) {
            case MessageType.convertToReadableDate:
                message = new ExtMessage(MessageType.convertToReadableDate);
                message.content = info.selectionText || '';
                message.from = MessageFrom.background;
                break;
                
            case MessageType.analyzeText:
                message = new ExtMessage(MessageType.analyzeText);
                message.content = info.selectionText || '';
                message.from = MessageFrom.background;
                break;
                
            case MessageType.openInSidebar:
                message = new ExtMessage(MessageType.openInSidebar);
                message.content = info.selectionText || '';
                message.from = MessageFrom.background;
                break;
                
            case MessageType.takeScreenshot:
                message = new ExtMessage(MessageType.takeScreenshot);
                message.from = MessageFrom.background;
                break;
                
            default:
                console.log('Unknown menu item clicked:', info.menuItemId);
                return;
        }
        
        // Send the message to the content script
        browser.tabs.sendMessage(tab.id!, message);
    });

    // Use a non-async listener to ensure we can return true synchronously
    browser.runtime.onMessage.addListener((message: ExtMessage, sender, sendResponse: (message: any) => void) => {
        if (message.messageType === MessageType.clickExtIcon) {
            console.log(message)
            return true;
        } else if (message.messageType === MessageType.changeTheme || message.messageType === MessageType.changeLocale) {
            // Handle theme/locale changes asynchronously
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                console.log(`tabs:${tabs.length}`)
                if (tabs) {
                    tabs.forEach(tab => {
                        browser.tabs.sendMessage(tab.id!, message);
                    });
                }
            });
            return true;
        } else if (message.messageType === MessageType.saveAppState) {
            // Save app state to IndexedDB
            // Parse the JSON string from message.content
            let appState: AppState;
            try {
                appState = JSON.parse(message.content as string) as AppState;
                console.log('Successfully parsed app state:', appState);
            } catch (parseError) {
                if (message.content) {
                    console.log(message.content);
                }
                console.error('Failed to parse app state JSON:', parseError);
                sendResponse({ success: false, error: 'Invalid JSON data' });
                return true;
            }

            appState.updatedAt = new Date();

            // Use promises instead of await
            db.appState.orderBy('updatedAt').reverse().limit(1).toArray().then(existingStates => {
                const existingState = existingStates[0];

                if (existingState) {
                    // Update existing state
                    db.appState.update(existingState.id!, appState).then(() => {
                        console.log(`Updated state: ${existingState.id}`);
                        sendResponse({ success: true, id: existingState.id });
                    }).catch(error => {
                        console.error('Failed to update state:', error);
                        sendResponse({ success: false, error: String(error) });
                    });
                } else {
                    // Create new state
                    db.appState.add(appState).then(id => {
                        console.log(`Created state: ${id}`);
                        sendResponse({ success: true, id });
                    }).catch(error => {
                        console.error('Failed to add state:', error);
                        sendResponse({ success: false, error: String(error) });
                    });
                }
            }).catch(error => {
                console.error('Failed to query existing states:', error);
                sendResponse({ success: false, error: String(error) });
            });

            return true; // Keep the message channel open for the async response
        } else if (message.messageType === MessageType.loadAppState) {
            // Load app state from IndexedDB using promises instead of await
            db.appState.orderBy('updatedAt').reverse().limit(1).toArray().then(states => {
                console.log('Loading state:', states);
                if (states.length > 0) {
                    sendResponse({ success: true, state: states[0] });
                } else {
                    sendResponse({ success: false, error: 'No saved state found' });
                }
            }).catch(error => {
                console.error('Failed to load app state:', error);
                sendResponse({ success: false, error: String(error) });
            });

            return true; // Keep the message channel open for the async response
        } else if (message.messageType === MessageType.closeSidepanel) {
            // Handle closing the sidepanel
            if (sender.tab?.id) {
                try {
                    // We can't directly close the sidepanel, but we can collapse it
                    // by opening an empty one or toggling it
                    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                        if (tabs[0]?.id) {
                            // Toggle the sidepanel by opening it again (which will collapse it if already open)
                            browser.sidePanel.open({ tabId: tabs[0].id }).then(() => {
                                console.log('Sidepanel toggled to close');
                                sendResponse({ success: true });
                            }).catch(error => {
                                console.error('Failed to toggle sidepanel:', error);
                                sendResponse({ success: false, error: String(error) });
                            });
                        }
                    });
                } catch (error) {
                    console.error('Error handling closeSidepanel message:', error);
                    sendResponse({ success: false, error: String(error) });
                }
            }
            return true;
        } else if (message.messageType === MessageType.captureVisibleTab) {

            // This is an asynchronous operation
            browser.tabs.captureVisibleTab(
                { format: 'png' },
                (imageDataUrl) => {
                    if (browser.runtime.lastError) {
                        // If an error occurs, send it back
                        sendResponse({ error: browser.runtime.lastError.message });
                    } else {
                        // Send the successful capture back to the content script
                        sendResponse({ imageDataUrl });
                    }
                }
            );

            // Return true to indicate that you will send a response asynchronously
            return true;
        } else if (message.messageType === MessageType.convertToReadableDate) {
            // If this is a request from the sidepanel for pending date content
            if (message.from === MessageFrom.sidePanel && message.requestPendingContent) {
                const pendingContent = (globalThis as any).pendingDateContent;
                if (pendingContent) {
                    // Clear the pending content after sending it
                    (globalThis as any).pendingDateContent = null;
                    sendResponse({ success: true, content: pendingContent });
                } else {
                    sendResponse({ success: false, error: 'No pending date content' });
                }
                return true;
            }
            
            // Otherwise, this is a request to convert a date
            try {
                // First open the sidebar
                browser.sidePanel.open({
                   tabId: sender.tab?.id!
                }).then(async () => {
                    // Store the date content in a global variable that will be accessed when the sidepanel connects
                    (globalThis as any).pendingDateContent = message.content;
                    
                    // We'll rely on the sidepanel to request this data when it's ready
                    // This avoids the "receiving end does not exist" error
                }).catch(error => {
                    console.error('Error opening sidepanel:', error);
                });
                
                // Send response back to the content script
                sendResponse({ success: true });
            } catch (error) {
                console.error('Error handling convertToReadableDate message:', error);
                sendResponse({ success: false, error: String(error) });
            }
            return true;
        }
    });
});
