import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/auto-icons'],
    manifest: {
        permissions: [
            "activeTab",
            "scripting",
            "sidePanel", 
            "storage", 
            "tabs", 
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
    },
    vite: () => ({
        plugins: [react()],
    }),
});
