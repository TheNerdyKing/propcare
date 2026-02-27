'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { 
    ClipboardList, 
    Search, 
    Filter, 
    ChevronRight, 
    Plus, 
    X, 
    Loader2, 
    AlertCircle, 
    Building2, 
    Clock, 
    CheckCircle2, 
    AlertTriangle,
    Navigation,
    Home,
    Smartphone,
    Mail,
    User,
    ArrowRight,
    Activity
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [properties, setProperties] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useTranslation();

    const [formData, setFormData] = useState({
        propertyId: '',
        unitLabel: '',
        description: '',
        tenantName: '',
        tenantEmail: '',
        tenantPhone: '',
        urgency: 'NORMAL'
    });

    useEffect(() => {
        fetchTickets();
        fetchProperties();
    }, [statusFilter, search]);

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

    const fetchTickets = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('tickets')
                .select('*, property:properties(name)')
                .eq('tenant_id', tenantId);

            if (statusFilter) query = query.eq('status', statusFilter);
            if (search) {
                query = query.or(`reference_code.ilike.%${search}%,description.ilike.%${search}%,tenant_name.ilike.%${search}%,unit_label.ilike.%${search}%`);
            }

            const { data, error: fetchErr } = await query;
            if (fetchErr) throw fetchErr;

            const sortedData = (data || []).sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
                const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
                return dateB - dateA;
            });

            setTickets(sortedData);
        } catch (err: any) {
            console.error('Failed to fetch tickets:', err);
            setError(language === 'de' ? 'Meldungen konnten nicht geladen werden.' : 'Tickets could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        try {
            const { data, error: pErr } = await supabase
                .from('properties')
                .select('id, name')
                .eq('tenant_id', tenantId)
                .order('name');
            if (pErr) throw pErr;
            setProperties(data || []);
        } catch (err) {
            console.error('Failed to fetch properties:', err);
        }
    };

    const handleManualLog = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const ref = `M-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const { error: insErr } = await supabase
                .from('tickets')
                .insert([{
                    tenant_id: tenantId,
                    property_id: formData.propertyId,
                    unit_label: formData.unitLabel,
                    description: formData.description,
                    tenant_name: formData.tenantName,
                    tenant_email: formData.tenantEmail,
                    tenant_phone: formData.tenantPhone,
                    urgency: formData.urgency,
                    reference_code: ref,
                    status: 'NEW'
                }]);

            if (insErr) throw insErr;

            setShowModal(false);
            setFormData({
                propertyId: '',
                unitLabel: '',
                description: '',
                tenantName: '',
                tenantEmail: '',
                tenantPhone: '',
                urgency: 'NORMAL'
            });
            fetchTickets();
        } catch (err: any) {
            alert(`Fehler beim Speichern: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const statsOverview = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'NEW').length,
        active: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        done: tickets.filter(t => t.status === 'COMPLETED').length
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'NEW': return { label: 'Neu erfasst', color: 'blue', icon: Clock };
            case 'IN_PROGRESS': return { label: 'In Bearbeitung', color: 'amber', icon: Navigation };
            case 'COMPLETED': return { label: 'Erledigt', color: 'emerald', icon: CheckCircle2 };
            default: return { label: status, color: 'slate', icon: Clock };
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 bg-blue-600/10 backdrop-blur-md text-blue-600 px-5 py-2.5 rounded-2xl border border-blue-200/50">
                            <ClipboardList className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('sidebar_tickets')}</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">{t('tickets_title').includes(' ') ? t('tickets_title').split(' ').map((word, i) => i === 1 ? <><br/><span key={i} className="text-blue-600">{word}</span></> : word) : t('tickets_title')}</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-xl italic leading-relaxed">{t('tickets_subtitle')}</p>
                    </div>
                    
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-slate-900 text-white px-12 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center shadow-3xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6 mr-4" />
                        {t('tickets_btn_create')}
                    </button>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <StatCard label={t('tickets_stat_total')} count={tickets.length} color="slate" icon={ClipboardList} />
                    <StatCard label={t('tickets_stat_new')} count={tickets.filter(t => t.status === 'NEW').length} color="blue" icon={Clock} />
                    <StatCard label={t('tickets_stat_active')} count={tickets.filter(t => t.status === 'IN_PROGRESS').length} color="amber" icon={Navigation} />
                    <StatCard label={t('tickets_stat_done')} count={tickets.filter(t => ['COMPLETED', 'RESOLVED'].includes(t.status)).length} color="emerald" icon={CheckCircle2} />
                </div>

                {/* Filters Ribbon */}
                <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[3rem] shadow-3xl shadow-slate-200/40 border border-slate-100 mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full lg:w-[36rem]">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder={t('tickets_filter_search')}
                            className="w-full bg-slate-50/50 border border-slate-200/50 rounded-3xl pl-18 pr-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full lg:w-64">
                            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <select
                                className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl pl-14 pr-10 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 appearance-none cursor-pointer focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">{t('tickets_filter_all')}</option>
                                <option value="NEW">{language === 'de' ? 'Neu erfasst' : 'Newly created'}</option>
                                <option value="IN_PROGRESS">{language === 'de' ? 'In Bearbeitung' : 'In progress'}</option>
                                <option value="COMPLETED">{language === 'de' ? 'Erledigt' : 'Done'}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-2xl shadow-3xl shadow-slate-200/50 border border-slate-100 overflow-hidden rounded-[4rem]">
                    {error && (
                        <div className="p-10 bg-red-50 text-red-600 flex items-center gap-6 border-b border-red-100">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <p className="font-black text-lg uppercase tracking-tight">{error}</p>
                            <button onClick={fetchTickets} className="ml-auto bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Erneut versuchen</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-40 text-center flex flex-col items-center">
                            <Loader2 className="animate-spin w-20 h-20 text-blue-600" />
                            <p className="mt-10 text-slate-300 font-black uppercase tracking-[0.4em] text-[12px]">{language === 'de' ? 'Service-Datenbank wird synchronisiert...' : 'Syncing service records...'}</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-40 text-center text-slate-400 grayscale opacity-40">
                            <ClipboardList className="w-32 h-32 mx-auto mb-10 stroke-[0.5]" />
                            <p className="font-black uppercase tracking-[0.3em] text-sm text-slate-900 mb-2">{language === 'de' ? 'Kein Suchergebnis' : 'No results found'}</p>
                            <p className="font-medium italic">{language === 'de' ? 'Versuchen Sie es mit einem anderen Begriff oder Filter.' : 'Try a different search term or filter.'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-auto">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('tickets_table_ref')}</th>
                                        <th className="px-8 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('tickets_table_object')}</th>
                                        <th className="px-8 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('tickets_table_priority')}</th>
                                        <th className="px-8 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('tickets_table_status')}</th>
                                        <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">{t('tickets_table_details')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tickets.map((ticket, index) => {
                                        const status = getStatusConfig(ticket.status);
                                        const StatusIcon = status.icon;

                                        return (
                                            <tr key={ticket.id} className="group hover:bg-blue-50/30 transition-all duration-500 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: `${index * 40}ms` }}>
                                                <td className="px-12 py-10">
                                                    <span className="font-mono font-black text-blue-600 text-[11px] bg-blue-100/50 px-4 py-2 rounded-2xl border border-blue-200/50 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        {ticket.reference_code}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className="flex items-center space-x-6">
                                                        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                                                            <Building2 className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-lg uppercase tracking-tighter mb-1 line-clamp-1">{ticket.property?.name || '---'}</div>
                                                            <div className="text-slate-400 font-black text-[9px] uppercase tracking-widest flex items-center">
                                                                <Home className="w-3 h-3 mr-2" />
                                                                {ticket.unit_label || 'Allgemein'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className={`inline-flex items-center px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 ${
                                                        ticket.urgency === 'EMERGENCY' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                        ticket.urgency === 'URGENT' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}>
                                                        {ticket.urgency === 'EMERGENCY' ? <AlertTriangle className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
                                                        {ticket.urgency === 'EMERGENCY' ? (language === 'de' ? 'Notfall' : 'Emergency') : ticket.urgency === 'URGENT' ? (language === 'de' ? 'Wichtig' : 'Urgent') : (language === 'de' ? 'Normal' : 'Normal')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className={`inline-flex items-center px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 bg-${status.color}-50 text-${status.color}-700 border border-${status.color}-100 shadow-sm`}>
                                                        <StatusIcon className="w-4 h-4" />
                                                        {status.label}
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-right">
                                                    <Link
                                                        href={`/tickets/${ticket.id}`}
                                                        className="inline-flex items-center justify-center w-14 h-14 bg-white border border-slate-100 rounded-[1.5rem] text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800 group-hover:shadow-2xl group-hover:scale-110 group-hover:-translate-x-3 transition-all duration-500 shadow-sm"
                                                    >
                                                        <ArrowRight className="w-7 h-7" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Footer Insight Buffer */}
                <div className="mt-16 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-3xl shadow-indigo-900/40">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl font-black tracking-tighter mb-6 uppercase leading-[0.9]">{language === 'de' ? 'Support & Dokumentation' : 'Support & Documentation'}</h2>
                            <p className="text-blue-100/60 text-lg font-medium leading-relaxed italic">{language === 'de' ? 'Alle Meldungen werden automatisch mit der Mieter-Historie verknüpft und archiviert. Für technische Hilfe kontaktieren Sie unser Support-Team.' : 'All tickets are automatically linked with tenant history and archived. Contact our support team for technical help.'}</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/20">
                                <Activity className="w-8 h-8 text-blue-200" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overhauled Compact Sexy Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-8 z-[100] animate-in fade-in duration-500">
                        <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] max-w-xl w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 relative">
                            <div className="p-12 border-b border-slate-50 flex justify-between items-center relative z-10">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">System-Eintrag</p>
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">MELDUNG AUFNEHMEN</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white rounded-3xl flex items-center justify-center transition-all duration-500 group">
                                    <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <form onSubmit={handleManualLog} className="p-12 space-y-10 bg-white overflow-y-auto max-h-[75vh] relative z-10 custom-scrollbar">
                                <div className="space-y-5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Liegenschaft & Einheit</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all cursor-pointer appearance-none"
                                            value={formData.propertyId}
                                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                        >
                                            <option value="">Objekt...</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text" required
                                            placeholder="z.B. TOP 14"
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all"
                                            value={formData.unitLabel}
                                            onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Anliegen / Beschreibung</label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Beschreiben Sie das Problem..."
                                        className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all min-h-[140px] resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Mieter Name</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all uppercase"
                                            value={formData.tenantName}
                                            onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                            placeholder="MAX MUSTER"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Dringlichkeit</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none"
                                            value={formData.urgency}
                                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                        >
                                            <option value="NORMAL">NORMAL</option>
                                            <option value="URGENT">WICHTIG</option>
                                            <option value="EMERGENCY">NOTFALL</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Mieter E-Mail</label>
                                        <input
                                            type="email" required
                                            placeholder="mieter@email.ch"
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all"
                                            value={formData.tenantEmail}
                                            onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Telefonnummer</label>
                                        <input
                                            type="tel" required
                                            placeholder="+41 44 ..."
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all"
                                            value={formData.tenantPhone}
                                            onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full h-24 rounded-[2.5rem] font-black text-white bg-slate-900 hover:bg-blue-600 shadow-3xl shadow-slate-900/20 transition-all uppercase tracking-[0.3em] text-[12px] flex items-center justify-center disabled:opacity-50 gap-6 group mt-6"
                                >
                                    {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-all" /> MELDUNG ÜBERMITTELN</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, count, color, icon: Icon }: any) {
    const colors: any = {
        slate: 'bg-slate-50 text-slate-900 border-slate-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    
    return (
        <div className={`p-8 rounded-[2.5rem] border ${colors[color]} shadow-xl shadow-slate-200/20 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}>
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black tracking-tighter">{count}</div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 px-1">{label}</p>
        </div>
    );
}
