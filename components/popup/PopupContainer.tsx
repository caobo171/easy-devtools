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
 * Now using Tailwind classes directly
 */
export const PopupContainer: React.FC<PopupContainerProps> = ({
  children,
  position,
  variant,
  onClose,
  className = '',
}) => {
  // Generate position classes based on variant
  const getPositionClasses = () => {
    if (variant === 'small') {
      // Small popups appear near the cursor
      return `absolute transform -translate-x-1/2 -translate-y-full max-w-[320px]`;
    } else {
      // Large popups are centered on the screen
      return `fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[90vw] max-h-[90vh] w-[600px]`;
    }
  };

  // Combine all classes
  const containerClasses = `
    ${getPositionClasses()}
    bg-background border border-border rounded-lg shadow-lg
    ${variant === 'small' ? 'p-3' : 'p-4'}
    ${className}
    z-[1000000001]
  `;

  return (
    <div
      className={containerClasses}
      style={{
        left: variant === 'small' ? `${position.x}px` : undefined,
        top: variant === 'small' ? `${position.y}px` : undefined,
      }}
    >
      {children}
    </div>
  );
};
