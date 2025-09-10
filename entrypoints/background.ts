import {browser} from "wxt/browser";
import ExtMessage, {MessageFrom, MessageType} from "@/entrypoints/types.ts";

export default defineBackground(() => {
    console.log('Hello background!', {id: browser.runtime.id});// background.js

    // @ts-ignore
    browser.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch((error: any) => console.error(error));

    // Create context menu items
    browser.contextMenus.create({
        id: "devtools-parent",
        title: "Easy devtools",
        contexts: ["selection"]
    });

    browser.contextMenus.create({
        id: "convertToReadableDate",
        parentId: "devtools-parent",
        title: "📅 Convert to readable date",
        contexts: ["selection"]
    });

    browser.contextMenus.create({
        id: "openInSidebar",
        parentId: "devtools-parent", 
        title: "📋 Open in sidebar",
        contexts: ["selection"]
    });

    browser.contextMenus.create({
        id: "analyzeText",
        parentId: "devtools-parent",
        title: "🔍 Analyze text",
        contexts: ["selection"]
    });

    //monitor the event from extension icon click
    browser.action.onClicked.addListener((tab) => {
        // 发送消息给content-script.js
        console.log("click icon")
        console.log(tab)
        browser.tabs.sendMessage(tab.id!, {messageType: MessageType.clickExtIcon});
    });

    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(async (info, tab) => {
        if (!info.selectionText || !tab?.id) return;

        const message = new ExtMessage(MessageType.convertToReadableDate);
        message.content = info.selectionText;
        message.from = MessageFrom.background;

        switch (info.menuItemId) {
            case "convertToReadableDate":
                message.messageType = MessageType.convertToReadableDate;
                // Open sidepanel first
                await browser.sidePanel.open({ tabId: tab.id });
                break;
            case "openInSidebar":
                message.messageType = MessageType.openInSidebar;
                // Open sidepanel first
                await browser.sidePanel.open({ tabId: tab.id });
                break;
            case "analyzeText":
                message.messageType = MessageType.analyzeText;
                // Open sidepanel first
                await browser.sidePanel.open({ tabId: tab.id });
                break;
            default:
                return;
        }

        // Wait a bit for sidepanel to load, then send message
        setTimeout(() => {
            browser.runtime.sendMessage(message);
        }, 100);

        try {
            await browser.tabs.sendMessage(tab.id, message);
        } catch (error) {
            console.log('Content script not ready, message already sent to sidepanel:', error);
        }
    });

    // background.js
    browser.runtime.onMessage.addListener(async (message: ExtMessage, sender, sendResponse: (message: any) => void) => {
        console.log("background:")
        console.log(message)
        if (message.messageType === MessageType.clickExtIcon) {
            console.log(message)
            return true;
        } else if (message.messageType === MessageType.changeTheme || message.messageType === MessageType.changeLocale) {
            let tabs = await browser.tabs.query({active: true, currentWindow: true});
            console.log(`tabs:${tabs.length}`)
            if (tabs) {
                for (const tab of tabs) {
                    await browser.tabs.sendMessage(tab.id!, message);
                }
            }

        }
    });


});
