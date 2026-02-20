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
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-indigo-600 transition-colors"
                aria-label="Toggle navigation"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full bg-[#0F172A] text-slate-400 w-64 z-40 transition-transform duration-300 transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static flex flex-col border-r border-white/5 shadow-2xl
            `}>
                <div className="p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/20">
                            PC
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            Prop<span className="text-indigo-500">Care</span>
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <item.icon className={`
                                    w-5 h-5 mr-3 transition-colors
                                    ${isActive ? 'text-white' : 'group-hover:text-indigo-400'}
                                `} />
                                {item.name}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-200" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-white/5 bg-black/10">
                    <button
                        className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                        onClick={() => {
                            localStorage.removeItem('accessToken');
                            window.location.href = '/login';
                        }}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
