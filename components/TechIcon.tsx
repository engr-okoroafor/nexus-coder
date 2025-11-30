import React from 'react';

// This is a placeholder component.
// In a real application, you might use this to display icons for different technologies.
export const TechIcon: React.FC<{ tech: string }> = ({ tech }) => {
  return (
    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white">
      {tech.substring(0, 2).toUpperCase()}
    </div>
  );
};