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
                .eq('tenant_id', tenantId);

            if (fetchErr) throw fetchErr;

            const safeTickets = (data || []).sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.created_at || new Date()).getTime();
                const dateB = new Date(b.createdAt || b.created_at || new Date()).getTime();
                return dateB - dateA;
            });

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

    const MetricCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:shadow-2xl transition-all">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
                <Icon className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                            <Rocket className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Verwaltungsportal</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Dashboard</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Willkommen zurück. Hier ist die Übersicht Ihrer aktuellen Anliegen.</p>
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Daten werden geladen...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-[2rem] p-10 text-center max-w-2xl mx-auto">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                        <p className="text-red-900 font-black text-lg mb-8 uppercase tracking-tight">{error}</p>
                        <button 
                            onClick={() => fetchData()}
                            className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-600/20 hover:scale-105 transition-all"
                        >
                            Erneut versuchen
                        </button>
                    </div>
                )}

                {!loading && !error && tickets.length === 0 ? (
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
                ) : !loading && !error && (
                    <>
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                            <MetricCard title="Gesamtvolumen" value={stats.total} icon={Building2} color="blue" />
                            <MetricCard title="Offene Aufgaben" value={stats.open} icon={Clock} color="amber" />
                            <MetricCard title="Abgeschlossen" value={stats.resolved} icon={Sparkles} color="emerald" />
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Letzte Aktivitäten</h3>
                                <Link href="/tickets" className="text-blue-600 font-black uppercase tracking-widest text-[10px] hover:translate-x-1 transition-transform flex items-center">
                                    Alle Tickets <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {tickets.slice(0, 5).map((ticket) => (
                                    <Link 
                                        key={ticket.id} 
                                        href={`/tickets/${ticket.id}`}
                                        className="flex items-center p-10 hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{ticket.reference_code || ticket.referenceCode}</span>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{ticket.property?.name || 'Unbekanntes Objekt'}</p>
                                            <p className="text-slate-500 font-medium text-sm line-clamp-1 italic">{ticket.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Eingang</p>
                                            <p className="text-sm font-bold text-slate-900">
                                                {new Date(ticket.createdAt || ticket.created_at || Date.now()).toLocaleDateString('de-CH')}
                                            </p>
                                        </div>
                                        <div className="ml-8 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg transition-all">
                                            <ArrowRight className="w-6 h-6" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
