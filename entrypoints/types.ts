export enum MessageType {
    clickExtIcon = "clickExtIcon",
    changeTheme = "changeTheme",
    changeLocale = "changeLocale",
    convertToReadableDate = "convertToReadableDate",
    showDatePopup = "showDatePopup",
    openInSidebar = "openInSidebar",
    closeSidepanel = "closeSidepanel",
    translateText = "translateText",
    analyzeText = "analyzeText",
    saveAppState = "saveAppState",
    loadAppState = "loadAppState",
    takeScreenshot = "TAKE_SCREENSHOT",
    screenshotCaptured = "SCREENSHOT_CAPTURED",
    captureVisibleTab = "CAPTURE_VISIBLE_TAB"
}

export enum MessageFrom {
    contentScript = "contentScript",
    background = "background",
    popUp = "popUp",
    sidePanel = "sidePanel",
}

class ExtMessage {
    content?: string;
    from?: MessageFrom;

    constructor(messageType: MessageType) {
        this.messageType = messageType;
    }

    messageType: MessageType;
}

export default ExtMessage;
