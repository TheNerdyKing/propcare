'use client';

import Sidebar from './Sidebar';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Visual Connector Header - Unifies the layout */}
                <header className="h-16 bg-white border-b border-slate-200/60 hidden lg:block sticky top-0 z-10">
                    <div className="h-full px-8 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Staff Portal</span>
                            <span className="text-slate-200">/</span>
                            <span className="text-indigo-600">Production Environment</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
