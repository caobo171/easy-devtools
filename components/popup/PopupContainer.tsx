import React, { ReactNode } from 'react';

export interface PopupPosition {
  x: number;
  y: number;
}

export interface PopupContainerProps {
  children: ReactNode;
  position: PopupPosition;
  variant: 'small' | 'large';
  onClose: () => void;
  className?: string;
}

/**
 * Base container for popups that appear in the content script
 * This component handles positioning and styling for both small and large variants
 */
export const PopupContainer: React.FC<PopupContainerProps> = ({
  children,
  position,
  variant,
  onClose,
  className = '',
}) => {
  // Calculate position based on variant
  const getPositionStyle = () => {
    if (variant === 'small') {
      // Small popups appear near the cursor
      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        maxWidth: '320px',
      };
    } else {
      // Large popups are centered on the screen
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        maxHeight: '90vh',
        width: '600px',
      };
    }
  };

  // Base z-index ensures the popup appears above page content
  // but still allows for stacking of multiple popups if needed
  const baseZIndex = 1000000001;

  return (
    <div
      className={`fixed bg-background border border-border rounded-lg shadow-lg ${
        variant === 'small' ? 'p-3' : 'p-4'
      } ${className}`}
      style={{
        ...getPositionStyle(),
        zIndex: baseZIndex,
      }}
    >
      {children}
    </div>
  );
};
