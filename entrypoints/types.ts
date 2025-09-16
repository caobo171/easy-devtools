export enum MessageType {
    clickExtIcon = "clickExtIcon",
    changeTheme = "changeTheme",
    changeLocale = "changeLocale",


    saveAppState = "saveAppState",
    savePartialAppState = "savePartialAppState",
    loadAppState = "loadAppState",

    openInSidebar = "openInSidebar",
    closeSidepanel = "closeSidepanel",



    translateText = "translateText",
    analyzeText = "analyzeText",

    takeScreenshot = "TAKE_SCREENSHOT",
    openScreenshotEditing = "OPEN_SCREENSHOT_EDITING",
    screenshotCaptured = "SCREENSHOT_CAPTURED",
    captureVisibleTab = "CAPTURE_VISIBLE_TAB",
    openVideoRecording = "OPEN_VIDEO_RECORDING",

    convertToReadableDateInSidepanel = "CONVERT_TO_READABLE_DATE_IN_SIDEPANEL",
    convertToReadableDateInContent = "CONVERT_TO_READABLE_DATE_IN_CONTENT",
    convertToReadableDateToBackground = "CONVERT_TO_READABLE_DATE_TO_BACKGROUND",
};


export const Tools = {
    convertToReadableDate: {
        id: 'convertToReadableDate',
        title: "📅 Convert to readable date",
    },
    takeScreenshot: {
        id: 'takeScreenshot',
        title: "📸 Take screenshot",
    },
    beautifyJSON: {
        id: 'beautifyJSON',
        title: "🎨 Beautify JSON",
    },
    urlEncoder: {
        id: 'urlEncoder',
        title: "🔗 URL Encoder",
    },
    base64Encoder: {
        id: 'base64Encoder',
        title: "🔐 Base64 Encoder",
    },
    hashGenerator: {
        id: 'hashGenerator',
        title: "🔐 Hash Generator",
    },
    colorConverter: {
        id: 'colorConverter',
        title: "🎨 Color Converter",
    },
    markdownPreview: {
        id: 'markdownPreview',
        title: "📝 Markdown Preview",
    },
    videoRecording: {
        id: 'videorecording',
        title: "🎥 Video Recording",
    },
    translate: {
        id: 'translate',
        title: "🌐 Translate",
    },
    generateFile: {
        id: 'generatefile',
        title: "📄 Generate File",
    },
};

export enum MessageFrom {
    contentScript = "contentScript",
    background = "background",
    popUp = "popUp",
    sidePanel = "sidePanel",
}

class ExtMessage {
    content?: string;
    from?: MessageFrom;
    position?: { x: number; y: number };
    requestPendingContent?: boolean;
    target?: string;

    constructor(messageType: MessageType) {
        this.messageType = messageType;
    }

    messageType: MessageType;
}

export default ExtMessage;
