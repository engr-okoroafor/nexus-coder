import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top', align = 'center' }) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`absolute z-50 w-max max-w-xs px-4 py-2 text-xs font-semibold text-white bg-black/50 backdrop-blur-md border border-cyan-400/30 rounded-3xl shadow-[0_0_15px_rgba(0,255,255,0.2)] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${positionClasses[position]} ${alignClasses[align]}`}
      >
        {text}
      </div>
    </div>
  );
};
