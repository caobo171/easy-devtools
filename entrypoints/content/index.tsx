import './style.css';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import {i18nConfig} from "@/components/i18nConfig.ts";
import initTranslations from "@/components/i18n.ts";
import {ThemeProvider} from "@/components/theme-provider.tsx";

export default defineContentScript({
    matches: ['*://*/*'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        initTranslations(i18nConfig.defaultLocale, ["common", "content"])
        const ui = await createShadowRootUi(ctx, {
            name: 'language-learning-content-box',
            position: 'inline',
            onMount: (container) => {
                console.log(container);
                // Create a div element to serve as the React root instead of using container directly
                const appContainer = document.createElement('div');
                appContainer.id = 'devtools-extension-root';
                container.appendChild(appContainer);
                
                const root = ReactDOM.createRoot(appContainer);
                root.render(
                    <ThemeProvider>
                        <App/>
                    </ThemeProvider>
                );
                return root;
            },
            onRemove: (root) => {
                root?.unmount();
            },
        });

        ui.mount();
    },
});
