'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ClipboardList, Search, Filter, ChevronRight, Plus, X, Loader2, AlertCircle } from 'lucide-react';
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
            console.warn('No tenantId found for staff tickets');
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

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }

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
            setError('Fehler beim Laden der Tickets.');
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
                    unit_label: formData.unitLabel, // Ensure correct mapping
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
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                            <ClipboardList className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Service Center</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Meldungen</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Echtzeit-Verwaltung aller Anliegen und Tickets.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4.5 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] flex items-center shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1"
                    >
                        <Plus className="w-5 h-5 mr-3" />
                        Meldung erfassen
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full lg:w-[32rem]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Suchen nach Referenz, Gebäude oder Mieter..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-4.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none min-w-[200px]">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-10 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Alle Status</option>
                                <option value="NEW">Neu erfasst</option>
                                <option value="IN_PROGRESS">In Bearbeitung</option>
                                <option value="COMPLETED">Erledigt</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">▼</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden rounded-[3rem]">
                    {error && (
                        <div className="p-8 bg-red-50 text-red-600 flex items-center gap-4 border-b border-red-100">
                            <AlertCircle className="w-6 h-6" />
                            <p className="font-black text-sm uppercase tracking-tight">{error}</p>
                            <button onClick={fetchTickets} className="ml-auto underline font-black text-[10px] uppercase tracking-widest hover:text-red-700">Wiederholen</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-32 text-center">
                            <Loader2 className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-8" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Datenbank wird abgefragt...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-32 text-center text-slate-400 grayscale opacity-40">
                            <ClipboardList className="w-20 h-20 mx-auto mb-8 stroke-1" />
                            <p className="font-black uppercase tracking-[0.3em] text-xs">Aktuell keine Meldungen vorhanden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-auto">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referenz</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liegenschaft / Einheit</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Typ</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priorität</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Datum</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Fokus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50/50">
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <span className="font-mono font-black text-blue-600 text-[10px] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                                                    {ticket.reference_code}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter mb-1">{ticket.property?.name || '---'}</div>
                                                <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{ticket.unit_label || 'Liegenschaft allgemein'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${ticket.type === 'DAMAGE_REPORT' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                                    {ticket.type === 'DAMAGE_REPORT' ? 'Schaden' : 'Anfrage'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                    ticket.urgency === 'EMERGENCY' ? 'text-red-500' : 
                                                    ticket.urgency === 'URGENT' ? 'text-amber-500' : 'text-slate-400 font-bold'
                                                }`}>
                                                    {ticket.urgency === 'EMERGENCY' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                    {ticket.urgency === 'EMERGENCY' ? 'NOTFALL' : 
                                                     ticket.urgency === 'URGENT' ? 'WICHTIG' : 'NORMAL'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(ticket.status)}`}>
                                                    {getStatusText(ticket.status)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                {new Date(ticket.createdAt || ticket.created_at || Date.now()).toLocaleDateString('de-CH')}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link
                                                    href={`/tickets/${ticket.id}`}
                                                    className="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-100 rounded-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/20 group-hover:-translate-x-1 transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] max-w-2xl w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">Neue Meldung</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manuelle Erfassung eines Anliegens</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl flex items-center justify-center transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleManualLog} className="p-10 space-y-8 bg-white overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Gebäude</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                                                value={formData.propertyId}
                                                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                            >
                                                <option value="">Objekt auswählen...</option>
                                                {properties.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Einheit / Wohnung</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="z.B. App. 402"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                            value={formData.unitLabel}
                                            onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Schilderung</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Genaue Fehlerbeschreibung oder Anfrage des Mieters..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Name des Mieters</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            value={formData.tenantName}
                                            onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Dringlichkeit</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                                                value={formData.urgency}
                                                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                            >
                                                <option value="NORMAL">Standard</option>
                                                <option value="URGENT">Wichtig (Eilt)</option>
                                                <option value="EMERGENCY">Notfall (Sofort)</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full h-18 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center disabled:opacity-50 mt-12 mb-4"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-4" /> : null}
                                    Eintrag erstellen ➔
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
