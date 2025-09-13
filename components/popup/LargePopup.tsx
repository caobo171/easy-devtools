import React, { ReactNode } from 'react';
import { PopupContainer, PopupPosition } from './PopupContainer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface LargePopupProps {
  title?: string; // Made optional since we're removing the header
  children: ReactNode;
  position: PopupPosition;
  onClose: () => void;
  onOpenInSidebar?: () => void;
  onOpenInNewTab?: () => void;
  className?: string;
}

/**
 * Large popup component for comprehensive interactions
 * Appears centered on the screen with a clean, maximized interface
 * No header to maximize space for content, close button in top-right corner
 */
export const LargePopup: React.FC<LargePopupProps> = ({
  children,
  position,
  onClose,
  onOpenInSidebar,
  onOpenInNewTab,
  className = '',
}) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[1000000000]" 
        onClick={onClose}
      />
      
      {/* Close button positioned outside the popup in the top-right corner */}
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onClose} 
        className="fixed right-2 top-2 z-[1000000002] rounded-full bg-gray-800 hover:bg-gray-700 shadow-lg"
      >
        <X className="h-4 w-4" />
      </Button>
      
      {/* Optional sidebar/new tab buttons positioned at the top */}
      {(onOpenInSidebar || onOpenInNewTab) && (
        <div className="fixed right-14 top-2 z-[1000000002] flex gap-2">
          {onOpenInSidebar && (
            <Button variant="secondary" size="sm" onClick={onOpenInSidebar} className="bg-gray-800 hover:bg-gray-700">
              Open in sidebar
            </Button>
          )}
          {onOpenInNewTab && (
            <Button variant="secondary" size="sm" onClick={onOpenInNewTab} className="bg-gray-800 hover:bg-gray-700">
              Open in new tab
            </Button>
          )}
        </div>
      )}
      
      <PopupContainer position={position} variant="large" onClose={onClose} className={`z-[1000000001] w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh] p-0 ${className}`}>
        {/* Content area - no fixed height, adapts to content */}
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </PopupContainer>
    </>
  );
};
