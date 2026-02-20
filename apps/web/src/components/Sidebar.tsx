'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    ClipboardList
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tickets', href: '/tickets', icon: ClipboardList },
    { name: 'Properties', href: '/properties', icon: Building2 },
    { name: 'Contractors', href: '/contractors', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-white rounded-xl shadow-xl text-indigo-600 hover:scale-110 active:scale-95 transition-all"
                aria-label="Toggle navigation"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full bg-[#0F172A] text-slate-400 w-72 z-40 transition-all duration-500 ease-in-out transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static flex flex-col border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.1)]
            `}>
                <div className="p-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-[1rem] flex items-center justify-center font-black text-white shadow-2xl shadow-indigo-600/40 transform -rotate-6 group-hover:rotate-0 transition-transform">
                            PC
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter">
                            Prop<span className="text-indigo-500">Care</span>
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-2 mt-6">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    flex items-center px-5 py-4 text-sm font-black rounded-2xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 translate-x-1'
                                        : 'hover:bg-white/5 hover:text-white hover:translate-x-1'}
                                `}
                            >
                                <item.icon className={`
                                    w-5 h-5 mr-4 transition-all duration-300
                                    ${isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-indigo-400 group-hover:scale-110'}
                                `} />
                                {item.name}
                                {isActive && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
                    <button
                        className="flex items-center w-full px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-[0.2em] rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
                        onClick={() => {
                            localStorage.removeItem('accessToken');
                            window.location.href = '/login';
                        }}
                    >
                        <LogOut className="w-4 h-4 mr-4 group-hover:rotate-180 transition-transform duration-500" />
                        Term. Session
                    </button>
                </div>
            </aside>
        </>
    );
}
