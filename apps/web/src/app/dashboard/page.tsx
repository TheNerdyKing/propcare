'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Search, ArrowRight, Building2, Users, Rocket, Sparkles, Loader2, AlertCircle, Clock } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function DashboardPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                setLoading(false);
                setError('Verbindung zum Server dauert zu lange.');
            }
        }, 8000);

        fetchData();

        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return () => clearTimeout(timeout);
        }

        const channel = supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                    filter: `tenant_id=eq.${tenantId}`,
                },
                () => {
                    fetchData(false);
                }
            )
            .subscribe();

        return () => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
        };
    }, []);

    const getTenantId = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user.tenantId || 
                   user.tenant_id || 
                   (user.tenants?.id) || 
                   (Array.isArray(user.tenants) ? user.tenants[0]?.id : user.tenants?.id);
        } catch (e) {
            return null;
        }
    };

    const fetchData = async (showLoading = true) => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        if (showLoading) setLoading(true);
        setError(null);

        try {
            const { data, error: fetchErr } = await supabase
                .from('tickets')
                .select('*, property:properties(name)')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (fetchErr) throw fetchErr;

            const safeTickets = data || [];
            setTickets(safeTickets);
            setStats({
                total: safeTickets.length,
                open: safeTickets.filter(t => t.status !== 'COMPLETED').length,
                resolved: safeTickets.filter(t => t.status === 'COMPLETED').length
            });
        } catch (err: any) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Fehler beim Laden des Dashboards.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'NEW': return 'Neu erfasst';
            case 'IN_PROGRESS': return 'In Bearbeitung';
            case 'COMPLETED': return 'Erledigt';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="p-10 flex flex-col items-center justify-center min-h-[70vh]">
                    <div className="relative">
                        <Loader2 className="animate-spin w-16 h-16 text-blue-600" />
                        <div className="absolute inset-0 bg-blue-600/5 blur-2xl rounded-full animate-pulse" />
                    </div>
                    <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">PropCare wird geladen...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="mb-14">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Übersicht</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Kommandozentrale</h1>
                    <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Echtzeit-Überblick über Ihr gesamtes Portfolio.</p>
                </div>

                {error && (
                    <div className="mb-12 p-8 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 flex items-center gap-6 shadow-xl shadow-red-900/5">
                        <AlertCircle className="w-6 h-6" />
                        <p className="font-black text-sm uppercase tracking-tight">{error}</p>
                        <button onClick={() => fetchData()} className="ml-auto underline font-black text-[10px] uppercase tracking-widest hover:text-red-700">Erneut versuchen</button>
                    </div>
                )}

                {tickets.length === 0 ? (
                    <div className="space-y-12">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3.5rem] p-16 text-white relative overflow-hidden shadow-3xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="relative z-10 max-w-2xl">
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center mb-10 shadow-inner">
                                    <Rocket className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-5xl font-black tracking-tighter mb-8 uppercase leading-tight">Willkommen zu Ihrem neuen Dashboard</h2>
                                <p className="text-blue-50/80 text-xl font-medium mb-12 leading-relaxed italic">Beginnen Sie mit der Konfiguration Ihrer Liegenschaften oder teilen Sie das Service-Portal mit Ihren Mietern.</p>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <Link href="/properties" className="inline-flex items-center justify-center bg-white text-blue-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all">
                                        Liegenschaften verwalten
                                    </Link>
                                    <Link href="/schadensmeldung" className="inline-flex items-center justify-center bg-blue-500/30 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-500/50 transition-all">
                                        Vorschau Service-Portal
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                            <MetricCard title="Gesamtvolumen" value={stats.total} icon={Building2} color="blue" />
                            <MetricCard title="Offene Aufgaben" value={stats.open} icon={Clock} color="amber" />
                            <MetricCard title="Abgeschlossen" value={stats.resolved} icon={Sparkles} color="emerald" />
                        </div>

                        <div className="flex items-end justify-between mb-10 px-4">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">Letzte Aktivitäten</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Die neuesten 5 Meldungen im System</p>
                            </div>
                            <Link href="/tickets" className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all">
                                <ArrowRight className="w-6 h-6" />
                            </Link>
                        </div>

                        <div className="bg-white shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden rounded-[3rem]">
                            <ul className="divide-y divide-slate-50">
                                {tickets.slice(0, 5).map((ticket) => (
                                    <li key={ticket.id} className="group">
                                        <Link href={`/tickets/${ticket.id}`} className="block hover:bg-slate-50 transition-all duration-300 px-12 py-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 text-[10px] shadow-sm">
                                                        {ticket.reference_code}
                                                    </span>
                                                    <span className={`px-4 py-2 text-[9px] font-black rounded-xl uppercase tracking-widest border shadow-sm ${getStatusColor(ticket.status)}`}>
                                                        {getStatusText(ticket.status)}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    {new Date(ticket.createdAt || ticket.created_at).toLocaleDateString('de-CH')}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <h4 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tighter truncate max-w-lg">
                                                        {ticket.property?.name || '---'}
                                                    </h4>
                                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">{ticket.unit_label || 'Liegenschaft allgemein'}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-2 transition-all shadow-sm">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    }[color as 'blue' | 'amber' | 'emerald'];

    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className={`w-14 h-14 ${colorClasses} border rounded-2xl flex items-center justify-center mb-10 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">{title}</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
}
