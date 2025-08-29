import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-0 mb-2 w-max max-w-xs p-2.5 text-xs font-semibold text-white bg-gray-900 dark:bg-black rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        {text}
        <svg className="absolute text-gray-900 dark:text-black h-2 w-4 left-2 top-full" viewBox="0 0 16 8">
          <polygon className="fill-current" points="0,0 16,0 8,8"/>
        </svg>
      </div>
    </div>
  );
};

export default Tooltip;
