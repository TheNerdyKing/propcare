'use client';

import React from 'react';

export default function Logo({ className = '', iconOnly = false, light = false, showStatus = false }: { className?: string, iconOnly?: boolean, light?: boolean, showStatus?: boolean }) {
    // Exact colors from PropCare screenshot
    const brandBlue = '#0178bc';
    const textColor = light ? 'text-white' : 'text-[#0a3a5c]';

    return (
        <div className={`flex flex-col ${className}`}>
            <div className={`flex items-center space-x-3 md:space-x-4 group`}>
                <div className="relative w-10 h-10 md:w-11 md:h-11 flex-shrink-0">
                    {/* Main Blue Square with clip effect */}
                    <div
                        className="absolute inset-0 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: brandBlue }}
                    >
                        {/* The 'Clipped' slash effect seen in logo */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 rotate-45 transform" />
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black/10 rotate-45 transform" />
                    </div>
                </div>

                {!iconOnly && (
                    <span className={`text-2xl md:text-[2.2rem] font-black tracking-tight transition-colors duration-500 flex items-baseline`}>
                        <span className={textColor}>Prop</span>
                        <span style={{ color: brandBlue }}>Care</span>
                    </span>
                )}
            </div>

            {showStatus && (
                <div className="flex items-center space-x-2 mt-3 ml-1 animate-in fade-in slide-in-from-left-2 duration-1000">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">System Active</span>
                </div>
            )}
        </div>
    );
}
