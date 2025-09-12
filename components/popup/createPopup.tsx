import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { browser } from 'wxt/browser';
import '../../assets/main.css';

/**
 * Creates a normal popup container and mounts a React component inside it
 * This uses the document's DOM directly with Tailwind styles
 */
export function createPopup<T>(
  Component: React.ComponentType<T>,
  props: T,
  onClose?: () => void
): { 
  root: ReactDOM.Root; 
  container: HTMLDivElement;
  close: () => void;
} {
  // Create container element
  const container = document.createElement('div');
  container.id = 'devtools-extension-popup';
  container.className = 'fixed top-0 left-0 w-0 h-0 z-[2147483647]';
  
  // Create a container for React
  const reactContainer = document.createElement('div');
  reactContainer.className = 'devtools-extension-popup-content';
  container.appendChild(reactContainer);
  
  // Make sure the document body is ready
  if (document.body) {
    document.body.appendChild(container);
  } else {
    // If document.body is not available yet, wait for it
    console.log('Waiting for document.body to be available...');
    
    // Create a function to append when body is available
    const appendWhenReady = () => {
      if (document.body) {
        document.body.appendChild(container);
      } else {
        // Try again in a moment
        setTimeout(appendWhenReady, 50);
      }
    };
    
    // Start the process
    appendWhenReady();
  }

  // Add a style tag to ensure the popup has proper z-index and other critical styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    #devtools-extension-popup {
      z-index: 2147483647; /* Max z-index */
    }
    
    .devtools-extension-popup-content {
      font-family: 'Inter', sans-serif;
    }
  `;
  document.head.appendChild(styleElement);

  // Create React root and render component
  const root = ReactDOM.createRoot(reactContainer);
  
  // Function to close and clean up the popup
  const close = () => {
    root.unmount();
    
    // Safely remove the container from document.body
    if (document.body && container.parentNode === document.body) {
      document.body.removeChild(container);
    }
    
    // Remove the style element
    if (styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    if (onClose) onClose();
  };
  
  // Render the component with ThemeProvider
  root.render(
    <ThemeProvider>
      <Component {...props} onClose={close} />
    </ThemeProvider>
  );

  return { root, container, close };
}
