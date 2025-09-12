import React, { ReactNode } from 'react';
import { PopupContainer, PopupPosition } from './PopupContainer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface SmallPopupProps {
  title: string;
  children: ReactNode;
  position: PopupPosition;
  onClose: () => void;
  onOpenInSidebar?: () => void;
  className?: string;
}

/**
 * Small popup component for focused interactions
 * Appears near the cursor and provides a compact interface
 */
export const SmallPopup: React.FC<SmallPopupProps> = ({
  title,
  children,
  position,
  onClose,
  onOpenInSidebar,
  className = '',
}) => {
  return (
    <PopupContainer position={position} variant="small" onClose={onClose} className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {onOpenInSidebar && (
            <Button variant="ghost" size="sm" onClick={onOpenInSidebar} className="h-6 px-2 text-xs">
              Open in sidebar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </PopupContainer>
  );
};
