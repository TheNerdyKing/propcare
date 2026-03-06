'use client';

import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldAlert, CreditCard, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const [accessState, setAccessState] = useState<'LOADING' | 'GRANTED' | 'TRIAL_EXPIRED' | 'BLOCKED'>('LOADING');
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const checkAccess = async () => {
            // Let admins bypass trial blocks
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === 'SUPER_ADMIN' || user.email === 'info@kreativelabs.ch' || user.name === 'Kreative LABS') {
                    setAccessState('GRANTED');
                    return;
                }
            }

            const getTenantId = () => {
                try {
                    const u = JSON.parse(userStr || '{}');
                    return u.tenantId || u.tenant_id || u.tenants?.id || (Array.isArray(u.tenants) ? u.tenants[0]?.id : null);
                } catch { return null; }
            };

            const tenantId = getTenantId();
            if (!tenantId) {
                setAccessState('GRANTED');
                return;
            }

            const { data: tenant } = await supabase.from('tenants').select('created_at, subscription_status').eq('id', tenantId).single();
            if (!tenant) {
                setAccessState('GRANTED');
                return;
            }

            if (tenant.subscription_status === 'BLOCKED') {
                setAccessState('BLOCKED');
                return;
            }

            if (tenant.subscription_status === 'ACTIVE') {
                setAccessState('GRANTED');
                return;
            }

            // Calculate 5-day trial limits
            const createdAt = new Date(tenant.created_at || new Date());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdAt.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const remaining = Math.max(0, 5 - diffDays);
            setDaysRemaining(remaining);

            if (diffDays > 5 && tenant.subscription_status !== 'ACTIVE') {
                setAccessState('TRIAL_EXPIRED');
            } else {
                setAccessState('GRANTED');
            }
        };

        checkAccess();
    }, [pathname]);

    if (accessState === 'LOADING') {
        return <div className="flex h-screen bg-[#1e293b] items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div></div>;
    }

    if (accessState === 'BLOCKED' || accessState === 'TRIAL_EXPIRED') {
        return (
            <div className="flex h-screen bg-[#1e293b] overflow-hidden items-center justify-center p-4">
                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] p-10 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/5 ring-1 ring-white/10">
                    <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-3 leading-tight">
                        {accessState === 'BLOCKED' ? 'Zugang Gesperrt' : 'Testphase Abgelaufen'}
                    </h1>

                    <p className="text-slate-400 font-medium text-xs italic mb-8 leading-relaxed">
                        {accessState === 'BLOCKED'
                            ? 'Ihr Account wurde vorübergehend gesperrt. Bitte kontaktieren Sie den Support.'
                            : 'Ihre Testphase ist abgelaufen. Bitte wählen Sie ein Abonnement.'}
                    </p>

                    {accessState === 'TRIAL_EXPIRED' && (
                        <div className="space-y-4">
                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Zahlungsmethode</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <button onClick={() => alert('Stripe Checkout...')} className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white h-11 rounded-lg font-black tracking-widest text-[9px] uppercase transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                    <CreditCard className="w-4 h-4 mr-2" /> Karte hinterlegen
                                </button>
                                <button onClick={() => alert('Rechnung gesendet.')} className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 h-11 rounded-lg font-black tracking-widest text-[9px] uppercase transition-all">
                                    <FileText className="w-4 h-4 mr-2" /> Per Rechnung
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#1e293b] overflow-hidden notranslate" translate="no">
            {/* Sticky Sidebar */}
            <div className="flex-shrink-0 h-full">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Visual Connector Header - Unifies the layout */}
                <header className="h-10 bg-blue-950/40 backdrop-blur-md border-b border-white/5 flex-shrink-0 px-8 flex items-center justify-between z-10">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Status</span>
                        <span className="text-white/10 mx-1.5 text-xs">/</span>
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Management Portal</span>
                    </div>

                    {/* Display Days Remaining if in trial */}
                    {daysRemaining !== null && daysRemaining <= 5 && (
                        <div className="flex items-center bg-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20">
                            <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Testphase: {daysRemaining} Tage</span>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
