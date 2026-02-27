'use client';

import React from 'react';

export default function Logo({ className = '', iconOnly = false, light = false }: { className?: string, iconOnly?: boolean, light?: boolean }) {
    // Brand Blue from Screenshot
    const brandBlue = '#0178bc';

    return (
        <div className={`flex items-center space-x-4 group ${className}`}>
            <div className="relative w-12 h-12 flex-shrink-0">
                {/* Square Base */}
                <div 
                    className="absolute bottom-0 left-0 w-8 h-8 rounded-sm transition-all duration-500 group-hover:scale-110"
                    style={{ backgroundColor: brandBlue }}
                ></div>
                {/* Triangle Cutout/Accent */}
                <div 
                    className="absolute top-2 right-2 w-0 h-0 border-l-[16px] border-l-transparent border-b-[16px] transition-all duration-700 group-hover:translate-x-1 group-hover:-translate-y-1"
                    style={{ borderBottomColor: brandBlue }}
                ></div>
            </div>
            {!iconOnly && (
                <span className={`text-3xl font-bold tracking-tight transition-colors duration-500 ${light ? 'text-white' : 'text-[#0a3a5c]'}`}>
                    Prop<span style={{ color: brandBlue }}>Care</span>
                </span>
            )}
        </div>
    );
}
