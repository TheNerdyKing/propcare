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
    ClipboardList,
    ExternalLink,
    BarChart3,
    Shield
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meldungen', href: '/tickets', icon: ClipboardList },
    { name: 'Liegenschaften', href: '/properties', icon: Building2 },
    { name: 'Handwerker', href: '/contractors', icon: Users },
    { name: 'Reporting', href: '/analytics', icon: BarChart3 },
    { name: 'Systemprotokoll', href: '/audit', icon: Shield },
    { name: 'Öffentliches Portal', href: '/', icon: ExternalLink },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-white rounded-xl shadow-xl text-blue-600 border border-slate-100"
                aria-label="Menü öffnen"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full bg-white w-72 z-40 transition-all duration-500 ease-in-out transform border-r border-slate-200/60
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.02)]
            `}>
                <div className="p-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-blue-600/20 transform -rotate-6">
                            PC
                        </div>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">
                            Prop<span className="text-blue-600">Care</span>
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-2 mt-6">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/');
                        const isExternal = item.href === '/';
                        
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                target={isExternal ? "_blank" : undefined}
                                className={`
                                    flex items-center px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-300 group relative
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                <item.icon className={`
                                    w-5 h-5 mr-4 transition-all duration-300
                                    ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-blue-500'}
                                `} />
                                {item.name}
                                {isActive && !isExternal && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                )}
                                {isExternal && (
                                    <ExternalLink className="ml-auto w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/30">
                    <button
                        className="flex items-center w-full px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all duration-300 group"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-4 group-hover:rotate-12 transition-transform" />
                        Sitzung Beenden
                    </button>
                </div>
            </aside>
        </>
    );
}
