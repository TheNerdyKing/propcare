'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Calendar,
    ChevronDown,
    Loader2,
    Activity,
    ArrowRight,
    Search,
    PieChart,
    ChevronRight
} from 'lucide-react';

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        emergency: 0,
        avgResolutionTime: '2.4 Tage',
        totalCost: 'CHF 0.00',
        trend: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
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

    const fetchStats = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/reporting/metrics?tenantId=${tenantId}`);
            if (!res.ok) throw new Error('API request failed');
            const data = await res.json();

            setStats({
                total: data.total,
                new: data.new,
                inProgress: data.inProgress,
                completed: data.completed,
                emergency: data.emergency,
                avgResolutionTime: data.avgResolutionTime || '2.4 Tage',
                totalCost: data.totalCost || 'CHF 0.00',
                trend: data.trend || 0
            });

        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { data: tickets, error: expErr } = await supabase
                .from('tickets')
                .select('reference_code, status, urgency, category, tenant_name, createdAt')
                .eq('tenant_id', tenantId);

            if (expErr) throw expErr;
            if (!tickets || tickets.length === 0) return alert('Keine Daten für Export gefunden.');

            const headers = ['Referenz', 'Status', 'Dringlichkeit', 'Kategorie', 'Mieter', 'Datum'];
            const csvContent = [
                headers.join(','),
                ...tickets.map(t => [
                    (t as any).reference_code,
                    t.status,
                    t.urgency,
                    t.category || '-',
                    `"${t.tenant_name}"`,
                    new Date((t as any).createdAt || (t as any).created_at || Date.now()).toLocaleDateString('de-CH')
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `PropCare_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            alert('Export fehlgeschlagen: ' + err.message);
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 bg-indigo-600/10 backdrop-blur-md text-indigo-600 px-5 py-2.5 rounded-2xl border border-indigo-200/50 hover:scale-105 transition-transform">
                            <BarChart3 className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Data Insights & Analytics</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Smart<br/><span className="text-indigo-600">Reporting</span></h1>
                        <p className="text-slate-500 font-medium text-xl max-w-xl italic leading-relaxed">Tiefgehende Analyse Ihrer Portfolio-Performance und Response-Metriken.</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center space-x-6 h-full hover:bg-slate-50 transition-all group">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Zeitraum</p>
                                <div className="flex items-center space-x-2">
                                    <p className="font-black text-slate-900 text-lg">Letzte 30 Tage</p>
                                    <ChevronDown className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </button>
                        
                        <button
                            onClick={handleExport}
                            className="bg-slate-900 text-white px-12 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center shadow-3xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Download className="w-6 h-6 mr-4" />
                            Report Exportieren
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-40 text-center flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
                            <Loader2 className="animate-spin w-20 h-20 text-indigo-600 relative z-10" />
                        </div>
                        <p className="mt-10 text-slate-400 font-black uppercase tracking-[0.4em] text-[12px]">Berechne Datensätze...</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* High-Level KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <MetricCard title="Gesamtvolumen" value={stats.total} icon={Activity} color="white" dark={true} />
                            <MetricCard title="Aktivität" value={stats.new + stats.inProgress} icon={Clock} color="amber" />
                            <MetricCard title="Abschlussrate" value={stats.completed} icon={CheckCircle2} color="emerald" />
                            <MetricCard title="Notfall-Quote" value={stats.emergency} icon={AlertTriangle} color="red" />
                        </div>

                        {/* Detailed Analysis Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Performance Radar */}
                            <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-3xl group">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-16">
                                        <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">Performance Index</h3>
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                            <TrendingUp className="w-8 h-8 text-indigo-400" />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-16">
                                        <div className="flex items-baseline space-x-6 mb-4">
                                            <span className="text-9xl font-black text-white tracking-tighter leading-none">{stats.avgResolutionTime.split(' ')[0]}</span>
                                            <span className="text-3xl font-black text-indigo-400 uppercase tracking-tighter tracking-widest">Tage ➔ Ø</span>
                                        </div>
                                        <p className="text-white/40 text-lg font-medium italic italic">Durchschnittliche Zeit von der Erfassung bis zur vollständigen Behebung.</p>
                                    </div>

                                    <div className={`inline-flex items-center px-8 py-4 rounded-3xl gap-4 font-black uppercase tracking-widest text-[11px] ${stats.trend <= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        <TrendingUp className={`w-5 h-5 ${stats.trend <= 0 ? '' : 'rotate-180'}`} />
                                        {stats.trend <= 0 
                                            ? `${Math.abs(stats.trend)}% schneller als im Vormonat` 
                                            : `${stats.trend}% höhere Last gegenüber Vormonat`}
                                    </div>
                                </div>
                            </div>

                            {/* Status Distribution Visual */}
                            <div className="bg-white/70 backdrop-blur-3xl p-16 rounded-[4rem] shadow-3xl shadow-slate-200/50 border border-slate-100 flex flex-col group">
                                <div className="flex items-center justify-between mb-16">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Status-Mix</h3>
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                        <PieChart className="w-8 h-8" />
                                    </div>
                                </div>
                                <div className="space-y-12 shrink-0">
                                    <ProgressStrip label="Neu eingegangen" value={stats.new} total={stats.total} color="bg-indigo-600" />
                                    <ProgressStrip label="In aktiver Bearbeitung" value={stats.inProgress} total={stats.total} color="bg-amber-500" />
                                    <ProgressStrip label="Erfolgreich abgeschlossen" value={stats.completed} total={stats.total} color="bg-emerald-500" />
                                </div>
                            </div>
                        </div>

                        {/* Financial Analytics Preview Block */}
                        <div className="bg-gradient-to-br from-indigo-700 to-blue-900 rounded-[4.5rem] p-20 text-white relative overflow-hidden shadow-3xl shadow-indigo-900/30 group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                                <div className="max-w-2xl">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <p className="text-[11px] font-black text-indigo-200 uppercase tracking-[0.4em]">Finanzielle Transparenz</p>
                                    </div>
                                    <h2 className="text-6xl font-black tracking-tighter mb-8 uppercase leading-[0.9]">Kosten-Analyse & Budgetierung</h2>
                                    <p className="text-indigo-100/60 text-2xl font-medium leading-relaxed italic">Erhalten Sie volle Einsicht in die Reparaturkosten-Struktur Ihres Portfolios. Automatisch konsolidiert aus allen Handwerker-Belegen.</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-3xl p-14 rounded-[3.5rem] border border-white/10 min-w-[340px] text-center group-hover:scale-105 transition-transform duration-700">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-indigo-200/60">Gesamtaufwand (30T)</p>
                                    <p className="text-6xl font-black tracking-tighter text-white mb-10">{stats.totalCost}</p>
                                    <button className="w-full py-6 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] shadow-xl hover:shadow-2xl transition-all">
                                        Details Einsehen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ title, value, icon: Icon, color, dark = false }: any) {
    if (dark) {
        return (
            <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-3xl shadow-slate-900/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[60px] translate-x-1/4 -translate-y-1/4" />
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                        <Icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[11px] font-black text-indigo-200/40 uppercase tracking-[0.3em] mb-2">{title}</p>
                    <p className="text-5xl font-black text-white tracking-tighter">{value}</p>
                </div>
            </div>
        );
    }
    
    const colors: any = {
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 group hover:shadow-3xl hover:-translate-y-2 transition-all duration-700">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 ${colors[color]} border group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-8 h-8" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{title}</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
}

function ProgressStrip({ label, value, total, color }: any) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
                <span className="text-xl font-black text-slate-900 tracking-tighter">{value} <span className="text-slate-300 ml-2 text-sm font-bold tracking-normal">({Math.round(percentage)}%)</span></span>
            </div>
            <div className="h-6 bg-slate-100/50 rounded-full overflow-hidden border border-slate-200/40 p-1.5 shadow-inner">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-out shadow-lg rounded-full relative group-hover:brightness-110`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </div>
            </div>
        </div>
    );
}
