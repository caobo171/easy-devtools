import './App.module.css';
import '../../assets/main.css'

import React, { useState, useRef, useEffect } from 'react';
import { LargePopup } from '@/components/popup';
import { Button } from '@/components/ui/button';
import { browser } from 'wxt/browser';
import { MessageType } from '../types';
import { Copy, Download, PanelRight, ExternalLink } from 'lucide-react';

interface ScreenshotPopupProps {
  imageData: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ScreenshotPopup: React.FC<ScreenshotPopupProps> = ({ 
  imageData, 
  position, 
  onClose 
}) => {
  const [capturedImage, setCapturedImage] = useState<string>(imageData);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (capturedImage) {
      drawImageWithAnnotations();
    }
  }, [capturedImage, annotations]);

  const drawImageWithAnnotations = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !capturedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw annotations (if implemented)
    // annotations.forEach(annotation => drawAnnotation(ctx, annotation));
  };

  const copyToClipboard = async () => {
    if (!capturedImage) return;

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadImage = () => {
    if (!capturedImage) return;

    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openInSidebar = async () => {
    try {
      // Open the sidebar panel and send the screenshot data to the sidepanel
      await browser.runtime.sendMessage({
        messageType: MessageType.openInSidebar,
      });
      
      // Send the captured image to the sidepanel
      await browser.runtime.sendMessage({
        messageType: MessageType.screenshotCaptured,
        content: capturedImage
      });
      
      // Close the popup
      onClose();
    } catch (error) {
      console.error('Failed to open in sidebar:', error);
    }
  };

  const openInNewTab = async () => {
    try {
      // Store the image data in browser storage
      await browser.storage.local.set({ screenshotData: capturedImage });
      
      // Open the new tab with the media viewer URL
      const newTab = await browser.tabs.create({
        url: '/media-viewer.html?type=screenshot'
      });
      
      console.log('Opened screenshot editor in new tab:', newTab.id);
      
      // Close the popup
      onClose();
    } catch (error) {
      console.error('Failed to open in new tab:', error);
    }
  };

  return (
    <LargePopup
      title="Screenshot Editor"
      position={position}
      onClose={onClose}
      onOpenInSidebar={openInSidebar}
      onOpenInNewTab={openInNewTab}
    >
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={copyToClipboard} size="sm" className="flex items-center gap-1">
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <Button onClick={downloadImage} size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button onClick={openInSidebar} size="sm" className="flex items-center gap-1">
            <PanelRight className="h-4 w-4" /> Edit in Sidebar
          </Button>
          <Button onClick={openInNewTab} size="sm" className="flex items-center gap-1">
            <ExternalLink className="h-4 w-4" /> Open in New Tab
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            width={800}
            height={600}
          />
          
          {/* Hidden image element for loading */}
          <img
            ref={imageRef}
            src={capturedImage}
            alt="Screenshot"
            className="hidden"
            onLoad={() => {
              const canvas = canvasRef.current;
              const image = imageRef.current;
              if (canvas && image) {
                // Adjust canvas size to maintain aspect ratio
                const maxWidth = 800;
                const maxHeight = 600;
                const aspectRatio = image.naturalWidth / image.naturalHeight;
                
                let canvasWidth = maxWidth;
                let canvasHeight = maxWidth / aspectRatio;
                
                if (canvasHeight > maxHeight) {
                  canvasHeight = maxHeight;
                  canvasWidth = maxHeight * aspectRatio;
                }
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                
                drawImageWithAnnotations();
              }
            }}
          />
        </div>
      </div>
    </LargePopup>
  );
};
