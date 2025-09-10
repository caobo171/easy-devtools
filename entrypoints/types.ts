export enum MessageType {
    clickExtIcon = "clickExtIcon",
    changeTheme = "changeTheme",
    changeLocale = "changeLocale",
    convertToReadableDate = "convertToReadableDate",
    showDatePopup = "showDatePopup",
    openInSidebar = "openInSidebar",
    translateText = "translateText",
    analyzeText = "analyzeText",
    saveAppState = "saveAppState",
    loadAppState = "loadAppState"
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
