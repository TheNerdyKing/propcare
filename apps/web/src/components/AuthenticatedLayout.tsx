'use client';

import Sidebar from './Sidebar';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Sticky Sidebar */}
            <div className="flex-shrink-0 h-full">
                <Sidebar />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Visual Connector Header - Unifies the layout */}
                <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0 px-10 flex items-center justify-between z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cloud Sync Aktiv</span>
                        <span className="text-slate-200 mx-2">/</span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Partner Portal</span>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
