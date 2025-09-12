import { createPopup } from '@/components/popup';
import { DateFormatPopup } from './DateFormatPopup';
import { browser } from 'wxt/browser';
import { MessageType } from '../types';

/**
 * Handles date format conversion in the content script
 */
export class DateFormatHandler {
  private static instance: DateFormatHandler;
  private currentPopup: { close: () => void } | null = null;

  private constructor() {
    // Initialize event listeners
    this.initContextMenuListener();
    this.initMessageListener();
    this.initSelectionListener();
  }

  public static getInstance(): DateFormatHandler {
    if (!DateFormatHandler.instance) {
      DateFormatHandler.instance = new DateFormatHandler();
    }
    return DateFormatHandler.instance;
  }

  private initContextMenuListener() {
    // Listen for context menu events from the background script
    browser.runtime.onMessage.addListener((message) => {
      console.log('DateFormatHandler received message:', message);
      
      // Handle both direct message objects and ExtMessage instances
      if (message.messageType === MessageType.convertToReadableDate) {
        console.log('Processing convertToReadableDate message');
        
        // Get the current selection and its position
        const selection = window.getSelection();
        let position;
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          position = {
            x: rect.left + (rect.width / 2) + window.scrollX,
            y: rect.bottom + window.scrollY + 10 // Position below the selection with a small gap
          };
        }
        
        // If content is provided, use that directly
        if (message.content) {
          console.log('Using provided content:', message.content);
          this.showDatePopup(message.content, position);
          return;
        }
        
        // Otherwise try to use the current selection
        if (selection && selection.toString().trim()) {
          console.log('Using current selection:', selection.toString().trim());
          this.showDatePopup(selection.toString().trim(), position);
        } else {
          console.log('No content or selection available');
        }
      }
    });
  }

  private initMessageListener() {
    // This is now handled in initContextMenuListener
    // This method is kept for backward compatibility
  }

  private initSelectionListener() {
    // Add double-click listener to detect potential timestamps
    document.addEventListener('dblclick', (event) => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;
      
      const selectedText = selection.toString().trim();
      
      // Check if the selection looks like a timestamp
      if (this.looksLikeTimestamp(selectedText)) {
        // Get the position for the popup
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        this.showDatePopup(
          selectedText, 
          { 
            x: rect.left + (rect.width / 2) + window.scrollX, 
            y: rect.top + window.scrollY 
          }
        );
      }
    });
  }

  private looksLikeTimestamp(text: string): boolean {
    // Check if it's a numeric timestamp
    if (/^\d{10,13}$/.test(text)) {
      return true;
    }
    
    // Check if it's an ISO date format
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      return true;
    }
    
    // Check for common date formats
    if (/^\w{3}\s+\d{1,2},?\s+\d{4}/.test(text)) {
      return true;
    }
    
    return false;
  }

  public showDatePopup(dateText: string, position?: { x: number; y: number }) {
    // Close any existing popup
    if (this.currentPopup) {
      this.currentPopup.close();
      this.currentPopup = null;
    }
    
    // If no position is provided, use the center of the viewport
    const popupPosition = position || {
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    };
    
    // Create the popup
    const { close } = createPopup(
      DateFormatPopup,
      {
        initialDate: dateText,
        position: popupPosition,
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
