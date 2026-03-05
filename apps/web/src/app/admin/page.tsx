'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Shield, CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';

export default function AdminDashboardPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        // In a real app, this would be protected by a SuperAdmin check
        const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
        if (data) {
            setTenants(data);
        }
        setLoading(false);
    };

    const toggleBlockTenant = async (tenantId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        await supabase.from('tenants').update({ subscription_status: newStatus }).eq('id', tenantId);
        fetchTenants();
    };

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex items-center space-x-4 mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight">Super Admin Übersicht</h1>
                        <p className="text-slate-500 font-medium italic">Kundenverwaltung & Abonnements</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">Registrierte Kunden</h3>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-slate-400 font-bold">Lade Kunden...</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {tenants.map(tenant => (
                                <div key={tenant.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase">{tenant.name}</h4>
                                        <div className="flex items-center space-x-4 mt-2">
                                            <span className="text-xs font-bold text-slate-500">ID: {tenant.id.split('-')[0]}</span>
                                            <span className="text-xs font-bold text-slate-500">
                                                Plan: {tenant.subscription_plan || 'TRIAL'}
                                            </span>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${tenant.subscription_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                    tenant.subscription_status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {tenant.subscription_status || 'TRIAL'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            onClick={() => toggleBlockTenant(tenant.id, tenant.subscription_status)}
                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tenant.subscription_status === 'BLOCKED'
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                        >
                                            {tenant.subscription_status === 'BLOCKED' ? 'Entsperren' : 'Kunde Sperren'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tenants.length === 0 && (
                                <div className="p-10 text-center text-slate-500 italic">Keine Kunden gefunden.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
