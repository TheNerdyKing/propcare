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
        return <div className="flex h-screen bg-[#F8FAFC] items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div></div>;
    }

    if (accessState === 'BLOCKED' || accessState === 'TRIAL_EXPIRED') {
        return (
            <div className="flex h-screen bg-[#F8FAFC] overflow-hidden items-center justify-center p-6">
                <div className="bg-white rounded-[3rem] p-16 max-w-2xl w-full text-center shadow-2xl border border-slate-100">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
                        {accessState === 'BLOCKED' ? 'Zugang Gesperrt' : 'Testphase Abgelaufen'}
                    </h1>

                    <p className="text-slate-500 font-medium text-lg italic mb-12">
                        {accessState === 'BLOCKED'
                            ? 'Ihr Account wurde aufgrund unbezahlter Rechnungen vorübergehend gesperrt. Bitte kontaktieren Sie den Support.'
                            : 'Ihre 5-tägige kostenlose Testphase ist abgelaufen. Um weiterhin Zugriff auf Ihre Objekte zu haben, müssen Sie ein Abonnement abschließen.'}
                    </p>

                    {accessState === 'TRIAL_EXPIRED' && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Zahlungsmethode Wählen</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => alert('Weiterleitung zu Stripe Checkout...')} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl font-black tracking-widest text-[11px] uppercase transition-all shadow-xl shadow-blue-600/20">
                                    <CreditCard className="w-5 h-5 mr-3" /> Kreditkarte hinterlegen
                                </button>
                                <button onClick={() => alert('Rechnungsanforderung gesendet.')} className="flex items-center justify-center bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 p-6 rounded-2xl font-black tracking-widest text-[11px] uppercase transition-all shadow-sm">
                                    <FileText className="w-5 h-5 mr-3" /> Zahlung per Rechnung
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
                        Sitzung Beenden / Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden notranslate" translate="no">
            {/* Sticky Sidebar */}
            <div className="flex-shrink-0 h-full">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Visual Connector Header - Unifies the layout */}
                <header className="h-14 bg-white/70 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0 px-10 flex items-center justify-between z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cloud Sync Aktiv</span>
                        <span className="text-slate-200 mx-2 text-xs">/</span>
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Verwaltungsportal</span>
                    </div>

                    {/* Display Days Remaining if in trial */}
                    {daysRemaining !== null && daysRemaining <= 5 && (
                        <div className="flex items-center bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100">
                            <span className="text-[9px] font-black uppercase text-amber-700 tracking-widest">Testphase: {daysRemaining} Tage übrig</span>
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
