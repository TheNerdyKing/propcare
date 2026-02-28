'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { 
    Search, 
    ArrowRight, 
    Building2, 
    Users, 
    Rocket, 
    Sparkles, 
    Loader2, 
    AlertCircle, 
    Clock, 
    Navigation, 
    CheckCircle2, 
    Shield, 
    Bell, 
    Activity,
    ChevronRight
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useTranslation } from '@/components/LanguageProvider';

export default function DashboardPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetchData();

        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
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
                const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
                const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
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
            setError('Dashboard konnte nicht aktualisiert werden.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'NEW': return { label: 'Neu erfasst', color: 'blue', icon: Clock };
            case 'IN_PROGRESS': return { label: 'In Bearbeitung', color: 'amber', icon: Navigation };
            case 'COMPLETED': return { label: 'Erledigt', color: 'emerald', icon: CheckCircle2 };
            default: return { label: status, color: 'slate', icon: Activity };
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 bg-blue-600/10 backdrop-blur-md text-blue-600 px-5 py-2.5 rounded-2xl border border-blue-200/50">
                            <Rocket className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.25em]">Kontrollzentrum</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">{t('dashboard_welcome_title')}</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-xl italic leading-relaxed">{t('dashboard_welcome_subtitle')}</p>
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-48 space-y-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
                            <Loader2 className="w-20 h-20 text-blue-600 animate-spin relative z-10" />
                        </div>
                        <p className="text-slate-400 font-black text-[12px] uppercase tracking-[0.4em]">Synchronisiere Terminal-Daten...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-[3rem] p-16 text-center max-w-3xl mx-auto shadow-2xl shadow-red-200/20">
                        <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-8" />
                        <h2 className="text-3xl font-black text-red-900 uppercase tracking-tight mb-4">{error}</h2>
                        <p className="text-red-600/60 font-medium mb-10 italic">Die Verbindung zum Datenbank-Cluster wurde unterbrochen.</p>
                        <button 
                            onClick={() => fetchData()}
                            className="bg-red-600 text-white px-14 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
                        >
                            Verbindung Wiederholen
                        </button>
                    </div>
                )}

                {!loading && !error && tickets.length === 0 ? (
                    <div className="space-y-12">
                        <div className="bg-slate-900 rounded-[4rem] p-24 text-white relative overflow-hidden shadow-3xl group">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] group-hover:bg-blue-600/30 transition-all duration-1000" />
                            <div className="relative z-10 max-w-3xl">
                                <div className="w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center mb-12 shadow-inner border border-white/10 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-12 h-12 text-blue-400" />
                                </div>
                                <h2 className="text-6xl font-black tracking-tighter mb-10 uppercase leading-[0.9]">Startklar für Ihre Verwaltung</h2>
                                <p className="text-blue-100/60 text-2xl font-medium mb-16 leading-relaxed italic">Dies ist Ihr zentrales Nervensystem. Beginnen Sie mit der Konfiguration Ihrer Objekte oder nutzen Sie das KI-Service-Portal.</p>
                                <div className="flex flex-wrap gap-8">
                                    <Link href="/properties" className="inline-flex items-center justify-center bg-white text-slate-900 px-12 py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                        Objekte Anlegen
                                    </Link>
                                    <Link href="/schadensmeldung" className="inline-flex items-center justify-center bg-white/5 backdrop-blur-xl text-white border border-white/10 px-12 py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/10 transition-all">
                                        Portal-Vorschau ➔
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !loading && !error && (
                    <>
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
                            <MetricCard title={t('dashboard_metrics_total')} value={stats.total} icon={Activity} color="white" dark={true} />
                            <MetricCard title={t('dashboard_metrics_open')} value={stats.open} icon={Navigation} color="amber" />
                            <MetricCard title={t('dashboard_metrics_resolved')} value={stats.resolved} icon={CheckCircle2} color="emerald" />
                        </div>

                        {/* Recent Activity Table */}
                        <div className="bg-white/70 backdrop-blur-3xl rounded-[4rem] shadow-3xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="p-14 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('dashboard_recent_activity')}</h3>
                                </div>
                                <Link href="/tickets" className="bg-slate-50 text-slate-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all duration-500 flex items-center">
                                    {t('dashboard_see_all')} <ChevronRight className="w-5 h-5 ml-2" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {tickets.slice(0, 6).map((ticket, index) => {
                                    const status = getStatusConfig(ticket.status);
                                    const StatusIcon = status.icon;
                                    
                                    return (
                                        <Link 
                                            key={ticket.id} 
                                            href={`/tickets/${ticket.id}`}
                                            className="flex items-center p-12 hover:bg-blue-50/40 transition-all group animate-in slide-in-from-left-4 duration-700"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-white transition-colors duration-500 mr-10 group-hover:scale-110">
                                                <Building2 className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <span className="font-mono font-black text-blue-600 text-[10px] tracking-widest uppercase">{ticket.reference_code || '---'}</span>
                                                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm bg-${status.color}-50 text-${status.color}-600 border-${status.color}-100 flex items-center`}>
                                                        <StatusIcon className="w-3 h-3 mr-2" />
                                                        {status.label}
                                                    </div>
                                                </div>
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors mb-1 truncate">{ticket.property?.name || 'Liegenschaft'}</h4>
                                                <p className="text-slate-400 font-medium text-sm line-clamp-1 italic">{ticket.description || 'Keine Beschreibung hinterlegt.'}</p>
                                            </div>
                                            
                                            <div className="text-right ml-10 hidden sm:block">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 flex items-center justify-end">
                                                    <Clock className="w-3 h-3 mr-2" />
                                                    Eingang
                                                </p>
                                                <p className="text-lg font-black text-slate-900 tracking-tighter">
                                                    {new Date(ticket.createdAt || ticket.created_at || Date.now()).toLocaleDateString('de-CH')}
                                                </p>
                                            </div>
                                            
                                            <div className="ml-10 w-16 h-16 bg-white border border-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800 group-hover:shadow-3xl group-hover:-translate-x-3 transition-all duration-500 shadow-sm shrink-0">
                                                <ArrowRight className="w-8 h-8" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ title, value, icon: Icon, color, dark = false }: any) {
    if (dark) {
        return (
            <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-3xl shadow-slate-900/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px] translate-x-1/4 -translate-y-1/4" />
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                        <Icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[11px] font-black text-blue-200/40 uppercase tracking-[0.3em] mb-2">{title}</p>
                    <p className="text-5xl font-black text-white tracking-tighter">{value}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 group hover:shadow-3xl hover:-translate-y-2 transition-all duration-700">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 bg-${color}-50 text-${color}-600 border border-${color}-100 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-8 h-8" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{title}</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
}
