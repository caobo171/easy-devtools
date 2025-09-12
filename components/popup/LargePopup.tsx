import React, { ReactNode } from 'react';
import { PopupContainer, PopupPosition } from './PopupContainer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface LargePopupProps {
  title: string;
  children: ReactNode;
  position: PopupPosition;
  onClose: () => void;
  onOpenInSidebar?: () => void;
  onOpenInNewTab?: () => void;
  className?: string;
}

/**
 * Large popup component for comprehensive interactions
 * Appears centered on the screen and provides a full-featured interface
 */
export const LargePopup: React.FC<LargePopupProps> = ({
  title,
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
      
      <PopupContainer position={position} variant="large" onClose={onClose} className={`z-[1000000001] ${className}`}>
        <div className="flex items-center justify-between mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            {onOpenInSidebar && (
              <Button variant="outline" size="sm" onClick={onOpenInSidebar}>
                Open in sidebar
              </Button>
            )}
            {onOpenInNewTab && (
              <Button variant="outline" size="sm" onClick={onOpenInNewTab}>
                Open in new tab
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </PopupContainer>
    </>
  );
};
