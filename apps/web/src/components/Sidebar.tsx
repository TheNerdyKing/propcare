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
    Shield,
    ChevronRight,
    Circle,
    UserCircle
} from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';
import { useTranslation } from './LanguageProvider';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const { t, language } = useTranslation();

    const navigation = [
        { name: t('sidebar_dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('sidebar_tickets'), href: '/tickets', icon: ClipboardList },
        { name: t('sidebar_properties'), href: '/properties', icon: Building2 },
        { name: t('sidebar_contractors'), href: '/contractors', icon: Users },
        { name: t('sidebar_reporting'), href: '/analytics', icon: BarChart3 },
        { name: t('sidebar_audit'), href: '/audit', icon: Shield },
        // Simple client-side conditional for Admin
        ...(userData?.role === 'SUPER_ADMIN' || userData?.email === 'info@kreativelabs.ch' || userData?.name === 'Kreative LABS' ? [{ name: 'Super Admin', href: '/admin', icon: Shield }] : []),
        { name: t('sidebar_live_portal'), href: '/', icon: ExternalLink },
    ];

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
                className="lg:hidden fixed top-8 left-8 z-50 p-4 bg-white rounded-2xl shadow-2xl text-slate-900 border border-slate-100 hover:scale-110 active:scale-95 transition-all"
                aria-label={language === 'de' ? 'Menü öffnen' : 'Open menu'}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full bg-slate-950 w-80 z-40 transition-all duration-700 ease-in-out transform border-r border-white/5
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.3)]
            `}>
                <div className="px-10 py-12 mb-4">
                    <Logo light showStatus />
                </div>

                <nav className="flex-1 px-6 space-y-1.5">
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
                                    flex items-center px-6 py-4.5 text-[11px] font-black uppercase tracking-[0.15em] rounded-[1.75rem] transition-all duration-500 group relative
                                    ${isActive
                                        ? 'bg-white text-slate-950 shadow-2xl shadow-white/10 scale-[1.02]'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <item.icon className={`
                                    w-5 h-5 mr-5 transition-all duration-500
                                    ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-white group-hover:rotate-6'}
                                `} />
                                {item.name}

                                {isActive && (
                                    <div className="ml-auto flex items-center">
                                        <div className="w-1 h-3 rounded-full bg-blue-600" />
                                    </div>
                                )}

                                {isExternal && (
                                    <ExternalLink className="ml-auto w-3 h-3 text-slate-600 group-hover:text-blue-400" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-8 mt-auto">
                    <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 group hover:bg-white/10 transition-all duration-500">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center border border-blue-500 shadow-xl shadow-blue-600/20">
                                <UserCircle className="w-7 h-7 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black text-white uppercase tracking-tighter truncate">{userData?.name || (language === 'de' ? 'Administrator' : 'Admin')}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{userData?.role === 'STAFF' ? t('sidebar_role_team') : t('sidebar_role_owner')}</p>
                            </div>
                        </div>

                        <button
                            className="flex items-center justify-center w-full px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white transition-all duration-500 group"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
                            {t('sidebar_logout')}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
