import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MessageType } from '../types';

interface ScreenshotOverlayProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

type SelectionMode = 'selecting' | 'moving' | 'resizing' | 'complete';
type ResizeHandle = 'top' | 'right' | 'bottom' | 'left' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null;

type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({ onCapture, onCancel }) => {
  // Selection state
  const [mode, setMode] = useState<SelectionMode>('selecting');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const overlayRef = useRef<HTMLDivElement>(null);

  // Helper to get mouse position relative to overlay
  const getMousePosition = useCallback((e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Check if mouse is over a resize handle
  const getResizeHandle = useCallback((x: number, y: number): ResizeHandle => {
    if (mode !== 'complete' || !selectionRect) return null;

    const handleSize = 10;
    const { x: rectX, y: rectY, width, height } = selectionRect;

    // Check corner handles first (they have priority)
    if (Math.abs(x - rectX) <= handleSize && Math.abs(y - rectY) <= handleSize) return 'topLeft';
    if (Math.abs(x - (rectX + width)) <= handleSize && Math.abs(y - rectY) <= handleSize) return 'topRight';
    if (Math.abs(x - rectX) <= handleSize && Math.abs(y - (rectY + height)) <= handleSize) return 'bottomLeft';
    if (Math.abs(x - (rectX + width)) <= handleSize && Math.abs(y - (rectY + height)) <= handleSize) return 'bottomRight';

    // Check edge handles
    if (Math.abs(y - rectY) <= handleSize && x > rectX && x < rectX + width) return 'top';
    if (Math.abs(x - (rectX + width)) <= handleSize && y > rectY && y < rectY + height) return 'right';
    if (Math.abs(y - (rectY + height)) <= handleSize && x > rectX && x < rectX + width) return 'bottom';
    if (Math.abs(x - rectX) <= handleSize && y > rectY && y < rectY + height) return 'left';

    return null;
  }, [mode, selectionRect]);

  // Check if mouse is inside the selection rectangle
  const isInsideSelection = useCallback((x: number, y: number): boolean => {
    if (!selectionRect) return false;
    const { x: rectX, y: rectY, width, height } = selectionRect;
    return x >= rectX && x <= rectX + width && y >= rectY && y <= rectY + height;
  }, [selectionRect]);

  // Handle mouse down event
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getMousePosition(e);
    if (mode === 'selecting') {
      // Start a new selection
      setStartPos({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
      console.log('Start selection at:', x, y);
    } else if (mode === 'complete') {
      // Check if we're on a resize handle
      const handle = getResizeHandle(x, y);
      if (handle) {
        setActiveHandle(handle);
        setMode('resizing');
        setDragStart({ x, y });
        return;
      }

      // Check if we're inside the selection (for moving)
      if (isInsideSelection(x, y) && selectionRect) {
        setMode('moving');
        setDragOffset({
          x: x - selectionRect.x,
          y: y - selectionRect.y
        });
        return;
      }

      // Otherwise start a new selection
      setMode('selecting');
      setStartPos({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
    }
  }, [mode, getMousePosition, getResizeHandle, isInsideSelection, selectionRect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getMousePosition(e);
    if (!selectionRect) return;


    // Update cursor based on position
    if (mode === 'complete') {
      const handle = getResizeHandle(x, y);
      const element = e.currentTarget as HTMLDivElement;

      if (handle) {
        // Set appropriate cursor for resize handles
        switch (handle) {
          case 'top': case 'bottom':
            element.style.cursor = 'ns-resize';
            break;
          case 'left': case 'right':
            element.style.cursor = 'ew-resize';
            break;
          case 'topLeft': case 'bottomRight':
            element.style.cursor = 'nwse-resize';
            break;
          case 'topRight': case 'bottomLeft':
            element.style.cursor = 'nesw-resize';
            break;
        }
      } else if (isInsideSelection(x, y)) {
        element.style.cursor = 'move';
      } else {
        element.style.cursor = 'crosshair';
      }
    }

    if (mode === 'selecting') {
      // Update selection rectangle while dragging
      const minX = Math.min(startPos.x, x);
      const minY = Math.min(startPos.y, y);
      const width = Math.abs(x - startPos.x);
      const height = Math.abs(y - startPos.y);

      // Only create a selection if there's an actual area selected
      setSelectionRect({ x: minX, y: minY, width, height });
    } else if (mode === 'moving' && selectionRect) {
      // Move the selection rectangle
      setSelectionRect({
        ...selectionRect,
        x: x - dragOffset.x,
        y: y - dragOffset.y
      });
    } else if (mode === 'resizing' && activeHandle && selectionRect) {
      // Resize the selection rectangle based on the active handle
      let newRect = { ...selectionRect };

      switch (activeHandle) {
        case 'top':
          newRect.y = y;
          newRect.height = selectionRect.height + (selectionRect.y - y);
          break;
        case 'right':
          newRect.width = x - selectionRect.x;
          break;
        case 'bottom':
          newRect.height = y - selectionRect.y;
          break;
        case 'left':
          newRect.x = x;
          newRect.width = selectionRect.width + (selectionRect.x - x);
          break;
        case 'topLeft':
          newRect.x = x;
          newRect.y = y;
          newRect.width = selectionRect.width + (selectionRect.x - x);
          newRect.height = selectionRect.height + (selectionRect.y - y);
          break;
        case 'topRight':
          newRect.y = y;
          newRect.width = x - selectionRect.x;
          newRect.height = selectionRect.height + (selectionRect.y - y);
          break;
        case 'bottomLeft':
          newRect.x = x;
          newRect.width = selectionRect.width + (selectionRect.x - x);
          newRect.height = y - selectionRect.y;
          break;
        case 'bottomRight':
          newRect.width = x - selectionRect.x;
          newRect.height = y - selectionRect.y;
          break;
      }

      // Ensure width and height are positive
      if (newRect.width < 0) {
        newRect.x = newRect.x + newRect.width;
        newRect.width = Math.abs(newRect.width);
      }
      if (newRect.height < 0) {
        newRect.y = newRect.y + newRect.height;
        newRect.height = Math.abs(newRect.height);
      }

      // Only update if we have a valid selection
      setSelectionRect(newRect);
    }
  }, [mode, startPos, getMousePosition, dragOffset, activeHandle, selectionRect, getResizeHandle, isInsideSelection]);

  const handleMouseUp = useCallback(() => {
    if (mode === 'selecting') {
      // Finished drawing the selection
      if (!selectionRect || selectionRect.width < 5 || selectionRect.height < 5) {
        // Ignore tiny or null selections
        setSelectionRect(null);
        return;
      }

      // Switch to complete mode where user can adjust or confirm
      setMode('complete');
    } else if (mode === 'moving' || mode === 'resizing') {
      // Finished moving or resizing, go back to complete mode
      if (selectionRect && selectionRect.width >= 5 && selectionRect.height >= 5) {
        setMode('complete');
      } else {
        // If selection became too small during resize/move, reset it
        setSelectionRect(null);
        setMode('selecting');
      }
      setActiveHandle(null);
    }
  }, [mode, selectionRect]);

  // Handle taking the actual screenshot
  const takeScreenshot = useCallback(async () => {
    if (!selectionRect) {
      console.error('Cannot take screenshot: no selection');
      return;
    }

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
      });
    } catch (error) {
      console.error('Error sending message to background script:', error);
      onCancel();

      // Make sure overlay is visible again in case of error
      if (overlayRef.current) {
        overlayRef.current.style.display = 'block';
      }
    }
  }, [selectionRect, onCapture, onCancel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (mode === 'complete') {
        // If we have a selection, cancel the selection first
        setMode('selecting');
        setSelectionRect(null);
      } else {
        // Otherwise cancel the whole screenshot
        onCancel();
      }
    } else if (e.key === 'Enter' && mode === 'complete' && selectionRect) {
      // Enter key to confirm screenshot
      takeScreenshot();
    }
  }, [mode, onCancel, takeScreenshot, selectionRect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Render resize handles when selection is complete
  const renderResizeHandles = () => {
    if (mode !== 'complete' || !selectionRect) return null;

    const handleSize = 8;
    const handles = [
      { position: 'topLeft', style: { top: -handleSize / 2, left: -handleSize / 2 } },
      { position: 'top', style: { top: -handleSize / 2, left: '50%', transform: 'translateX(-50%)' } },
      { position: 'topRight', style: { top: -handleSize / 2, right: -handleSize / 2 } },
      { position: 'right', style: { top: '50%', right: -handleSize / 2, transform: 'translateY(-50%)' } },
      { position: 'bottomRight', style: { bottom: -handleSize / 2, right: -handleSize / 2 } },
      { position: 'bottom', style: { bottom: -handleSize / 2, left: '50%', transform: 'translateX(-50%)' } },
      { position: 'bottomLeft', style: { bottom: -handleSize / 2, left: -handleSize / 2 } },
      { position: 'left', style: { top: '50%', left: -handleSize / 2, transform: 'translateY(-50%)' } },
    ];

    return handles.map(handle => (
      <div
        key={handle.position}
        className="absolute bg-white border border-blue-500 rounded-full"
        style={{
          width: handleSize,
          height: handleSize,
          ...handle.style,
          cursor: handle.position.includes('top') || handle.position.includes('bottom')
            ? handle.position.includes('Left') || handle.position.includes('Right')
              ? handle.position === 'topLeft' || handle.position === 'bottomRight' ? 'nwse-resize' : 'nesw-resize'
              : 'ns-resize'
            : 'ew-resize',
          zIndex: 9999999
        }}
      />
    ));
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999999]"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        cursor: mode === 'selecting' ? 'crosshair' : 'default'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Selection rectangle */}
      {selectionRect && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20"
          style={{
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            zIndex: 9999998
          }}
        >
          {/* Render resize handles when selection is complete */}
          {renderResizeHandles()}
        </div>
      )}

      {/* Controls when selection is complete */}
      {mode === 'complete' && selectionRect && (
        <div
          className="absolute bg-black bg-opacity-75 text-white px-4 py-4 rounded-lg flex items-center gap-2"
          style={{
            top: selectionRect.y + selectionRect.height - 100,
            left: selectionRect.x + selectionRect.width / 2,
            transform: 'translateX(-50%)',
            zIndex: 9999999
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              takeScreenshot();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0 flex items-center gap-2"
          >
            <CameraIcon className="w-4 h-4" />
            Capture
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setMode('selecting');
              setSelectionRect(null);
            }}
            className="bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 backdrop-blur-sm flex items-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      )}

      {/* Instructions */}
      {mode === 'selecting' && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm">Click and drag to select an area to screenshot</p>
          <p className="text-xs text-gray-300">Press ESC to cancel</p>
        </div>
      )}

      {mode === 'complete' && selectionRect && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm">Adjust selection by dragging or resize handles</p>
          <p className="text-xs text-gray-300">Press Enter to capture, ESC to reset</p>
        </div>
      )}
    </div>
  );
};
