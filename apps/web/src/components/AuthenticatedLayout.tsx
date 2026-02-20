'use client';

import Sidebar from './Sidebar';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#F1F5F9]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Unified Connector Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 px-10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Systems Operational</span>
                        <span className="text-slate-200 mx-2">|</span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Mainframe 01</span>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
