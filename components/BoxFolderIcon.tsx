import React from 'react';

export const BoxFolderIcon = ({ size = 24, className = "", strokeWidth = 2 }: { size?: number, className?: string, strokeWidth?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <g transform="scale(1.15) translate(-1.5, -1.5)">
            {/* The Folder inside */}
            <path d="M4 10V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v4" />
            {/* The Box */}
            <rect x="2" y="10" width="20" height="12" rx="2" />
            {/* The handle on the box */}
            <rect x="9" y="14" width="6" height="4" rx="1" />
        </g>
    </svg>
);
