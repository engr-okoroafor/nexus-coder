import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top', align = 'center' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 300; // max-w-xs approximate width
      
      let top = position === 'top' ? rect.top - 40 : rect.bottom + 8;
      let left = rect.left;
      
      if (align === 'center') {
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (align === 'end') {
        left = rect.right - tooltipWidth;
      }
      
      // Ensure tooltip stays within viewport
      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      if (left < 10) {
        left = 10;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [isVisible, position, align]);

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className="fixed z-[99999] w-max max-w-xs px-4 py-2 text-xs font-semibold text-white bg-black/90 backdrop-blur-md border border-cyan-400/30 rounded-3xl shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-opacity duration-300 pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};
