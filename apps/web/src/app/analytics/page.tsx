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
    const [stats, setStats] = useState<any>({
        total: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        emergency: 0,
        avgResolutionTime: '0 Tage',
        totalCost: 0,
        avgCost: 0,
        trend: 0,
        timeSeriesData: [],
        categoryData: [],
        propertyCount: 0,
        efficiency: 0
    });
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperties();
        fetchStats();
    }, [selectedPropertyId]);

    const getTenantId = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user.tenantId || user.tenant_id || user.tenants?.id || (Array.isArray(user.tenants) ? user.tenants[0]?.id : user.tenants?.id);
        } catch (e) {
            return null;
        }
    };

    const fetchProperties = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        try {
            const { data, error } = await supabase.from('properties').select('id, name').eq('tenant_id', tenantId);
            if (!error && data) setProperties(data);
        } catch (err) {
            console.error('Failed to fetch properties', err);
        }
    };

    const fetchStats = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/reporting/metrics?tenantId=${tenantId}&propertyId=${selectedPropertyId}`);
            if (!res.ok) throw new Error('API request failed');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-[1400px] mx-auto font-sans text-slate-900 print:p-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 print:mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reporting</h1>
                        <p className="text-slate-500 font-medium">Auswertungen und Statistiken</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 print:hidden">
                        <div className="relative min-w-[240px]">
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-bold text-slate-900 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="all">Alle Liegenschaften</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="bg-white text-slate-900 border border-slate-200 px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <Download className="w-4 h-4 mr-3 text-slate-400" />
                            Report Exportieren
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center">
                        <Loader2 className="animate-spin w-12 h-12 text-blue-600 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Lade Berichtsdaten...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Top KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Offene Meldungen"
                                value={stats.new + stats.inProgress}
                                subtext={`${stats.new} neu, ${stats.inProgress} in Bearbeitung`}
                                icon={Clock}
                            />
                            <StatCard
                                title="Erledigt"
                                value={stats.completed}
                                subtext={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% aller Meldungen`}
                                icon={CheckCircle2}
                            />
                            <StatCard
                                title="Notfälle"
                                value={stats.emergency}
                                subtext="Dringende Meldungen"
                                icon={AlertTriangle}
                            />
                            <StatCard
                                title="Ø Kosten"
                                value={`CHF ${Math.round(stats.avgCost)}`}
                                subtext="Pro Meldung (geschätzt)"
                                icon={Activity}
                            />
                        </div>

                        {/* Middle Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartCard title="Meldungen nach Kategorie" sub="Verteilung der Schadensmeldungen">
                                <SimpleBarChart data={stats.categoryData} />
                            </ChartCard>
                            <ChartCard title="Meldungen über Zeit" sub="Letzte 7 Tage">
                                <SimpleLineChart data={stats.timeSeriesData} />
                            </ChartCard>
                        </div>

                        {/* Bottom KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Liegenschaften"
                                value={stats.propertyCount}
                                subtext="Verwaltete Objekte"
                            />
                            <StatCard
                                title="Gesamtkosten"
                                value={`CHF ${Math.round(stats.totalCost).toLocaleString('de-CH')}`}
                                subtext="Geschätzte Reparaturkosten"
                            />
                            <StatCard
                                title="Effizienz"
                                value={`${stats.efficiency}%`}
                                subtext="Erledigungsrate"
                            />
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; }
                    body { background: white; }
                    .AuthenticatedLayout_main { padding: 0 !important; margin: 0 !important; }
                    aside, nav, .print-hidden { display: none !important; }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, subtext, icon: Icon }: any) {
    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-start min-h-[160px] hover:border-blue-500/30 transition-all duration-500">
            <div className="flex items-center justify-between w-full mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-300" />}
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter mb-1.5">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtext}</p>
        </div>
    );
}

function ChartCard({ title, sub, children }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col h-[400px]">
            <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sub}</p>
            </div>
            <div className="flex-1 w-full relative">
                {children}
            </div>
        </div>
    );
}

function SimpleBarChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.count), 5);

    return (
        <div className="h-full w-full flex items-end justify-between px-4 pb-12 pt-4">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-12 flex flex-col justify-end h-full">
                        <div
                            className="bg-slate-100 rounded-xl w-full transition-all duration-1000 group-hover:bg-blue-600 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            style={{ height: `${(d.count / max) * 100}%` }}
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                                {d.count}
                            </div>
                        </div>
                    </div>
                    <span className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest transform -rotate-45 origin-top-left -ml-2 whitespace-nowrap">
                        {d.name}
                    </span>
                </div>
            ))}
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-12 pt-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-t border-dashed border-slate-900" />
                ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 border-l border-slate-100" />
            <div className="absolute left-0 right-0 bottom-12 border-b border-slate-900 opacity-20" />
        </div>
    );
}

function SimpleLineChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.count), 5);
    const width = 600;
    const height = 240;
    const padding = 40;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((d.count / max) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
        <div className="h-full w-full flex flex-col">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Area Background */}
                <polyline
                    points={areaPoints}
                    fill="url(#area-gradient)"
                    className="opacity-10"
                />
                <defs>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[...Array(5)].map((_, i) => (
                    <line
                        key={i}
                        x1={padding} y1={padding + (i * (height - padding * 2) / 4)}
                        x2={width - padding} y2={padding + (i * (height - padding * 2) / 4)}
                        stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}

                {/* Main Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_4px_10px_rgba(37,99,235,0.3)] transition-all duration-1000"
                    style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}
                />

                {/* Points */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
                    const y = height - ((d.count / max) * (height - padding * 2)) - padding;
                    return (
                        <g key={i} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="6" fill="#2563eb" className="group-hover:r-8 transition-all" />
                            <circle cx={x} cy={y} r="12" fill="#2563eb" fillOpacity="0.1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            <text x={x} y={y - 15} textAnchor="middle" className="opacity-0 group-hover:opacity-100 text-[10px] font-black fill-slate-900 transition-opacity">
                                {d.count}
                            </text>
                            <text x={x} y={height - 10} textAnchor="middle" className="text-[9px] font-black fill-slate-400 tracking-tighter uppercase">
                                {d.date}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#0f172a" strokeWidth="2" strokeOpacity="0.1" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#0f172a" strokeWidth="2" strokeOpacity="0.1" />
            </svg>
        </div>
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
