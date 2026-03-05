'use client';

import React from 'react';

export default function Logo({ className = '', iconOnly = false, light = false }: { className?: string, iconOnly?: boolean, light?: boolean }) {
    // Brand Blue from Screenshot
    const brandBlue = '#0178bc';

    return (
        <div className={`flex items-center space-x-3 md:space-x-4 group ${className}`}>
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                {/* Square Base */}
                <div
                    className="absolute bottom-0 left-0 w-7 h-7 md:w-8 md:h-8 rounded-sm transition-all duration-500 group-hover:scale-110"
                    style={{ backgroundColor: brandBlue }}
                ></div>
                {/* Triangle Cutout/Accent */}
                <div
                    className="absolute top-2 right-2 w-0 h-0 border-l-[14px] md:border-l-[16px] border-l-transparent border-b-[14px] md:border-b-[16px] transition-all duration-700 group-hover:translate-x-1 group-hover:-translate-y-1"
                    style={{ borderBottomColor: brandBlue }}
                ></div>
            </div>
            {!iconOnly && (
                <span className={`text-2xl md:text-3xl font-bold tracking-tight transition-colors duration-500 ${light ? 'text-white' : 'text-[#0a3a5c]'}`}>
                    Prop<span style={{ color: brandBlue }}>Care</span>
                </span>
            )}
        </div>
    );
}
