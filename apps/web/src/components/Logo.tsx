'use client';

import React from 'react';

export default function Logo({ className = '', iconOnly = false }: { className?: string, iconOnly?: boolean }) {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <div className="relative w-10 h-10 flex-shrink-0">
                <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 transform -rotate-6 transition-transform group-hover:rotate-0 duration-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm9 3l-4 4-2-2-1 1 3 3 5-5-1-1z" />
                    </svg>
                </div>
            </div>
            {!iconOnly && (
                <span className="text-2xl font-black text-slate-900 tracking-tighter">
                    Prop<span className="text-blue-600">Care</span>
                </span>
            )}
        </div>
    );
}
