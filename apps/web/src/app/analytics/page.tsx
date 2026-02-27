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
    Loader2
} from 'lucide-react';

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        emergency: 0,
        avgResolutionTime: '2.4 Tage'
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
                avgResolutionTime: data.avgResolutionTime,
                // We'll extend stats with trend and cost if needed in the UI
            });

            // Optional: store trend and cost in local state if UI supports it
            (setStats as any)(prev => ({
                ...prev,
                totalCost: data.totalCost,
                trend: data.trend,
                categoryDistribution: data.categoryDistribution
            }));

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
            link.setAttribute('download', `PropCare_Bericht_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Performance Insights</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Reporting</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Automatisierte Analyse Ihrer Immobilien-Performance.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="bg-white border border-slate-100 text-slate-500 px-8 py-4 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] flex items-center shadow-sm hover:shadow-xl transition-all hover:bg-slate-50">
                            <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                            Letzte 30 Tage
                            <ChevronDown className="w-3.5 h-3.5 ml-4 opacity-50" />
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4.5 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] flex items-center shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1"
                        >
                            <Download className="w-4 h-4 mr-3" />
                            CSV Export
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 text-center">
                        <Loader2 className="animate-spin w-16 h-16 text-blue-600 mx-auto mb-10" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Kennzahlen werden berechnet...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Top Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <MetricCard title="Gesamt Meldungen" value={stats.total} icon={BarChart3} color="blue" />
                            <MetricCard title="In Bearbeitung" value={stats.new + stats.inProgress} icon={Clock} color="amber" />
                            <MetricCard title="Abgeschlossen" value={stats.completed} icon={CheckCircle2} color="emerald" />
                            <MetricCard title="Notfälle" value={stats.emergency} icon={AlertTriangle} color="red" />
                            <MetricCard title="Geschätzte Kosten" value={(stats as any).totalCost || 'CHF 0.00'} icon={TrendingUp} color="blue" />
                            <MetricCard title="Entwicklung" value={`${(stats as any).trend || 0}%`} icon={TrendingUp} color={(stats as any).trend > 0 ? 'red' : 'emerald'} />
                        </div>

                        {/* Visual Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Status Distribution */}
                            <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-100">
                                <h3 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-tighter">Status-Verteilung</h3>
                                <div className="space-y-8">
                                    <DistributionBar label="Neu erfasst" value={stats.new} total={stats.total} color="bg-blue-500" />
                                    <DistributionBar label="In Bearbeitung" value={stats.inProgress} total={stats.total} color="bg-amber-500" />
                                    <DistributionBar label="Erledigt" value={stats.completed} total={stats.total} color="bg-emerald-500" />
                                </div>
                            </div>

                            {/* Efficiency Metrics */}
                            <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <TrendingUp className="w-64 h-64 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-tighter">Performance-Index</h3>
                                <div className="flex flex-col h-full justify-between pb-4">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Durchschnittliche Antwortzeit</p>
                                        <div className="flex items-baseline gap-4">
                                            <p className="text-7xl font-black text-blue-600 tracking-tighter">{stats.avgResolutionTime.split(' ')[0]}</p>
                                            <p className="text-2xl font-black text-slate-300 uppercase tracking-tight">Tage</p>
                                        </div>
                                    </div>
                                    <div className={`pt-12 flex items-center gap-4 ${(stats as any).trend <= 0 ? 'text-emerald-500' : 'text-amber-500'} font-bold bg-opacity-10 w-max px-6 py-3 rounded-2xl`}>
                                        <TrendingUp className={`w-5 h-5 ${(stats as any).trend <= 0 ? '' : 'rotate-180'}`} />
                                        <span className="text-xs uppercase tracking-widest font-black">
                                            {(stats as any).trend <= 0 
                                                ? `${Math.abs((stats as any).trend)}% Abnahme gegenüber Vormonat` 
                                                : `${(stats as any).trend}% Zunahme gegenüber Vormonat`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100'
    }[color as 'blue' | 'amber' | 'emerald' | 'red'];

    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 flex flex-col group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className={`w-14 h-14 ${colorClasses} border rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{title}</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );
}

function DistributionBar({ label, value, total, color }: any) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest px-1">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-900">{value} <span className="text-slate-300 ml-2">({Math.round(percentage)}%)</span></span>
            </div>
            <div className="h-4 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner p-1">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-out shadow-lg rounded-full`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
