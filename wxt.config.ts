import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

// See https://wxt.dev/api/config.html
export default defineConfig({
    manifest: {
        permissions: [
            "activeTab",
            "scripting",
            "sidePanel", 
            "storage", 
            "tabs", 
            "declarativeNetRequest", 
            "declarativeNetRequestFeedback", 
            "contextMenus"
        ],
        host_permissions: [
            "<all_urls>"
        ],
        action: {},
        name: '__MSG_extName__',
        description: '__MSG_extDescription__',
        default_locale: "en",
        // devtools_page: "entrypoints/devtools.html",
        commands: {
            "convert-timestamp": {
                "suggested_key": {
                    "default": "Ctrl+Shift+D",
                    "mac": "Command+Shift+D"
                },
                "description": "Convert selected timestamp to readable date"
            }
        },
        // Removed newtab override to prevent conflicts with custom media viewer
    },
    vite: () => ({
        plugins: [react()],
    }),
});
