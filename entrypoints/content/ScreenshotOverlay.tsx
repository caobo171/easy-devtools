import React, { useState, useRef, useCallback, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { MessageType } from '../types';

interface ScreenshotOverlayProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({ onCapture, onCancel }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;

    setStartPos({ x, y });
    setSelectionRect({ x, y, width: 0, height: 0 });
    setIsSelecting(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;

    const minX = Math.min(startPos.x, x);
    const minY = Math.min(startPos.y, y);
    const width = Math.abs(x - startPos.x);
    const height = Math.abs(y - startPos.y);

    setSelectionRect({ x: minX, y: minY, width, height });
  }, [isSelecting, startPos]);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting) {
      return;
    }
    
    if (selectionRect.width < 5 || selectionRect.height < 5) {
      // Ignore tiny selections
      setIsSelecting(false);
      return;
    }
    
    setIsSelecting(false);
    
    // Store selection rect before hiding overlay
    const selectedArea = { ...selectionRect };
    
    try {
      // Temporarily hide the overlay before taking screenshot
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }
      
      // Wait a tiny bit for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 1. Send a message to the background script
      browser.runtime.sendMessage({ messageType: MessageType.captureVisibleTab }, (response) => {
        if (response.error) {
          console.error('Screenshot capture failed:', response.error);
          onCancel();
          return;
        }

        const imageData = response.imageDataUrl;
        if (!imageData) {
          console.error('Did not receive image data from background script.');
          onCancel();
          return;
        }

        // 2. The rest of your logic now goes inside this callback
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('Failed to get canvas context');
            onCancel();
            return;
          }
          
          // Calculate scaling factors between the screenshot image and the visible viewport
          const devicePixelRatio = window.devicePixelRatio || 1;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const scaleX = img.width / viewportWidth;
          const scaleY = img.height / viewportHeight;
          
          console.log('Debug - Image dimensions:', img.width, 'x', img.height);
          console.log('Debug - Viewport dimensions:', viewportWidth, 'x', viewportHeight);
          console.log('Debug - Device pixel ratio:', devicePixelRatio);
          console.log('Debug - Scale factors:', scaleX, scaleY);
          console.log('Debug - Selection rect:', selectionRect);
          
          // Adjust selection coordinates based on scaling
          const scaledX = Math.round(selectionRect.x * scaleX);
          const scaledY = Math.round(selectionRect.y * scaleY);
          const scaledWidth = Math.round(selectionRect.width * scaleX);
          const scaledHeight = Math.round(selectionRect.height * scaleY);
          
          console.log('Debug - Scaled selection:', scaledX, scaledY, scaledWidth, scaledHeight);

          // Set canvas size to selection area
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;

          // Draw only the selected portion from the full screenshot
          ctx.drawImage(
            img,
            scaledX,
            scaledY,
            scaledWidth,
            scaledHeight,
            0,
            0,
            scaledWidth,
            scaledHeight
          );

          // Convert to data URL and call your onCapture function
          const croppedImageData = canvas.toDataURL('image/png');
          onCapture(croppedImageData);
          console.log('Cropped and captured!');
          
          // Make sure overlay is visible again
          if (overlayRef.current) {
            overlayRef.current.style.display = 'block';
          }
        };

        img.onerror = () => {
          console.error('Failed to load captured image');
          onCancel();
          // Show overlay again in case of error
          if (overlayRef.current) {
            overlayRef.current.style.display = 'block';
          }
        };

        // Set the source to the captured image received from the background script
        img.src = imageData;
        
        // Show overlay again after screenshot is taken
        if (overlayRef.current) {
          overlayRef.current.style.display = 'block';
        }
      });
    } catch (error) {
      console.error('Error sending message to background script:', error);
      onCancel();
      
      // Make sure overlay is visible again in case of error
      if (overlayRef.current) {
        overlayRef.current.style.display = 'block';
      }
    }
  }, [isSelecting, selectionRect, onCapture, onCancel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999999] cursor-crosshair"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Selection rectangle */}
      <div
        className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-none"
        style={{
          left: selectionRect.x,
          top: selectionRect.y,
          width: selectionRect.width,
          height: selectionRect.height,
          display: isSelecting ? 'block' : 'none',
          zIndex: 9999999
        }}
      />

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
        <p className="text-sm">Click and drag to select an area to screenshot</p>
        <p className="text-xs text-gray-300">Press ESC to cancel</p>
      </div>
    </div>
  );
};
