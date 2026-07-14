import React from 'react';

export const TabkeepLogo = ({ className = "", size = 32 }: { className?: string, size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="topFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" /> {/* blue-400 */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
            </linearGradient>
            <linearGradient id="leftFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" /> {/* purple-500 */}
                <stop offset="100%" stopColor="#7c3aed" /> {/* purple-600 */}
            </linearGradient>
            <linearGradient id="rightFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
                <stop offset="100%" stopColor="#6d28d9" /> {/* purple-700 */}
            </linearGradient>
        </defs>
        <g transform="translate(0, 10)">
            {/* Top Cube */}
            <path d="M100 20 L135 40 L100 60 L65 40 Z" fill="url(#topFace)" />
            <path d="M65 40 L100 60 L100 100 L65 80 Z" fill="url(#leftFace)" />
            <path d="M135 40 L100 60 L100 100 L135 80 Z" fill="url(#rightFace)" />

            {/* Bottom Left Cube */}
            <path d="M65 80 L100 100 L65 120 L30 100 Z" fill="url(#topFace)" />
            <path d="M30 100 L65 120 L65 160 L30 140 Z" fill="url(#leftFace)" />
            <path d="M100 100 L65 120 L65 160 L100 140 Z" fill="url(#rightFace)" />

            {/* Bottom Right Cube */}
            <path d="M135 80 L170 100 L135 120 L100 100 Z" fill="url(#topFace)" />
            <path d="M100 100 L135 120 L135 160 L100 140 Z" fill="url(#leftFace)" />
            <path d="M170 100 L135 120 L135 160 L170 140 Z" fill="url(#rightFace)" />
        </g>
    </svg>
);
