import { createShadowPopup } from '@/components/popup';
import { ScreenshotPopup } from './ScreenshotPopup';
import { ScreenshotOverlay } from './screenshot-overlay';
import { browser } from 'wxt/browser';
import { MessageType } from '../types';
import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Handles screenshot capture and editing in the content script
 */
export class ScreenshotHandler {
  private static instance: ScreenshotHandler;
  private currentPopup: { close: () => void } | null = null;
  private overlayContainer: HTMLDivElement | null = null;
  private overlayRoot: ReactDOM.Root | null = null;

  private constructor() {
    // Initialize event listeners
    this.initMessageListener();
  }

  public static getInstance(): ScreenshotHandler {
    if (!ScreenshotHandler.instance) {
      ScreenshotHandler.instance = new ScreenshotHandler();
    }
    return ScreenshotHandler.instance;
  }

  private initMessageListener() {
    // Listen for messages to take screenshots
    browser.runtime.onMessage.addListener((message) => {
      if (message.messageType === MessageType.takeScreenshot) {
        this.showScreenshotOverlay();
      }
    });
  }

  private showScreenshotOverlay() {
    // Create overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'devtools-screenshot-overlay';
    document.body.appendChild(this.overlayContainer);
    
    // Create React root
    this.overlayRoot = ReactDOM.createRoot(this.overlayContainer);
    
    // Render overlay component
    this.overlayRoot.render(
      React.createElement(ScreenshotOverlay, {
        onCapture: (imageData: string) => {
          this.removeOverlay();
          this.showScreenshotPopup(imageData);
        },
        onCancel: () => {
          this.removeOverlay();
        }
      })
    );
  }

  private removeOverlay() {
    if (this.overlayRoot) {
      this.overlayRoot.unmount();
      this.overlayRoot = null;
    }
    
    if (this.overlayContainer && this.overlayContainer.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer);
      this.overlayContainer = null;
    }
  }

  public showScreenshotPopup(imageData: string) {
    // Close any existing popup
    if (this.currentPopup) {
      this.currentPopup.close();
      this.currentPopup = null;
    }
    
    // Create the popup
    const { close } = createShadowPopup(
      ScreenshotPopup,
      {
        imageData,
        position: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        },
        onClose: () => {
          this.currentPopup = null;
        }
      },
      () => {
        this.currentPopup = null;
      }
    );
    
    this.currentPopup = { close };
  }
}
