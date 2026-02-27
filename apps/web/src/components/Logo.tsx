'use client';

import React from 'react';

export default function Logo({ className = '', iconOnly = false, light = false }: { className?: string, iconOnly?: boolean, light?: boolean }) {
    return (
        <div className={`flex items-center space-x-3 group ${className}`}>
            <div className="relative w-12 h-12 flex-shrink-0">
                <div className="absolute inset-0 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-600/30 transform -rotate-12 group-hover:rotate-0 transition-all duration-700"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3L4 9V21H20V9L12 3ZM10 19H8V11H10V19ZM16 19H14V11H16V19Z" />
                    </svg>
                </div>
            </div>
            {!iconOnly && (
                <span className={`text-3xl font-black tracking-tighter transition-colors duration-500 ${light ? 'text-white' : 'text-slate-900'}`}>
                    Prop<span className="text-blue-600">Care</span>
                </span>
            )}
        </div>
    );
}
