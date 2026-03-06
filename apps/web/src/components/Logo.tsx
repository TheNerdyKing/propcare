'use client';

import React from 'react';

export default function Logo({ className = '', iconOnly = false, light = false, showStatus = false }: { className?: string, iconOnly?: boolean, light?: boolean, showStatus?: boolean }) {
    // Exact colors from PropCare screenshot
    const brandBlue = '#0178bc';
    const textColor = light ? 'text-white' : 'text-slate-100'; // Default to light text for our dark blue theme

    return (
        <div className={`flex flex-col ${className}`}>
            <div className={`flex items-center space-x-2 group`}>
                <div className="relative w-6 h-6 flex-shrink-0">
                    <div
                        className="absolute inset-0 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: brandBlue }}
                    >
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white/10 rotate-45 transform" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black/10 rotate-45 transform" />
                    </div>
                </div>

                {!iconOnly && (
                    <span className={`text-[13px] leading-none font-black tracking-tight transition-colors duration-500 flex items-baseline`}>
                        <span className={textColor}>Prop</span>
                        <span style={{ color: brandBlue }}>Care</span>
                    </span>
                )}
            </div>

            <div className="flex items-center space-x-1.5 mt-1.5 ml-0.5 animate-in fade-in slide-in-from-left-2 duration-1000">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6] animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-400">System Aktiv</span>
            </div>
        </div>
    );
}
