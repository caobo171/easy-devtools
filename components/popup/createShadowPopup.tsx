import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { browser } from 'wxt/browser';

/**
 * Creates a shadow DOM container and mounts a React component inside it
 * This ensures the popup is isolated from the page's styles
 */
export function createShadowPopup<T>(
  Component: React.ComponentType<T>,
  props: T,
  onClose?: () => void
): { 
  root: ReactDOM.Root; 
  container: HTMLDivElement;
  shadowRoot: ShadowRoot;
  close: () => void;
} {
  // Create container element
  const container = document.createElement('div');
  container.id = 'devtools-extension-popup';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '0';
  container.style.height = '0';
  container.style.zIndex = '2147483647'; // Max z-index
  document.body.appendChild(container);

  // Create shadow root
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Create a container for React inside the shadow root
  const reactContainer = document.createElement('div');
  shadowRoot.appendChild(reactContainer);
  
  // Add styles to the shadow DOM
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    :host {
      font-family: 'Inter', sans-serif;
      color-scheme: light dark;
    }
  `;
  shadowRoot.appendChild(styleElement);
  
  // Create link element for the main CSS
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  // Add CSS directly instead of using getURL
  linkElement.href = 'data:text/css;charset=UTF-8,' + encodeURIComponent(`
    /* Base styles */
    :root {
      --background: #ffffff;
      --foreground: #000000;
      --card: #ffffff;
      --card-foreground: #000000;
      --border: #e2e8f0;
      --input: #e2e8f0;
      --primary: #3b82f6;
      --primary-foreground: #ffffff;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --accent: #f1f5f9;
      --accent-foreground: #0f172a;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --background: #020817;
        --foreground: #ffffff;
        --card: #020817;
        --card-foreground: #ffffff;
        --border: #1e293b;
        --input: #1e293b;
        --primary: #3b82f6;
        --primary-foreground: #ffffff;
        --muted: #0f172a;
        --muted-foreground: #94a3b8;
        --accent: #1e293b;
        --accent-foreground: #ffffff;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--background);
      color: var(--foreground);
    }
    
    /* Button styles */
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: all 0.2s;
      cursor: pointer;
      font-size: 0.875rem;
      height: 2.25rem;
      padding-left: 1rem;
      padding-right: 1rem;
      background-color: var(--primary);
      color: var(--primary-foreground);
      border: none;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    button.ghost {
      background-color: transparent;
      color: var(--foreground);
    }
    
    button.outline {
      background-color: transparent;
      color: var(--foreground);
      border: 1px solid var(--border);
    }
    
    button.sm {
      height: 2rem;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      font-size: 0.75rem;
    }
    
    /* Input styles */
    input {
      display: flex;
      height: 2.5rem;
      width: 100%;
      border-radius: 0.375rem;
      border: 1px solid var(--border);
      background-color: transparent;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      font-size: 0.875rem;
      color: var(--foreground);
    }
    
    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary);
    }
  `);
  
  shadowRoot.appendChild(linkElement);

  // Create React root and render component
  const root = ReactDOM.createRoot(reactContainer);
  
  // Function to close and clean up the popup
  const close = () => {
    root.unmount();
    document.body.removeChild(container);
    if (onClose) onClose();
  };
  
  // Render the component with ThemeProvider
  root.render(
    <ThemeProvider>
      <Component {...props} onClose={close} />
    </ThemeProvider>
  );

  return { root, container, shadowRoot, close };
}
