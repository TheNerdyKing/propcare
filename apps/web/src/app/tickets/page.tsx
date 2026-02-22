'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ClipboardList, Search, Filter, ArrowRight, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [properties, setProperties] = useState<any[]>([]);

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
    }, [statusFilter]);

    const getTenantId = () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.tenantId || user.tenant_id;
        } catch (e) {
            return null;
        }
    };

    const fetchTickets = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        setLoading(true);
        try {
            let query = supabase
                .from('tickets')
                .select('*, property:properties(name)')
                .eq('tenant_id', tenantId)
                .order('createdAt', { ascending: false });

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }

            if (search) {
                query = query.or(`reference_code.ilike.%${search}%,description.ilike.%${search}%,tenant_name.ilike.%${search}%,unit_label.ilike.%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mappedData = (data || []).map(t => ({
                ...t,
                referenceCode: t.reference_code,
                unitLabel: t.unit_label,
                tenantName: t.tenant_name,
                urgency: t.urgency,
                status: t.status
            }));

            setTickets(mappedData);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('id, name')
                .eq('tenant_id', tenantId)
                .order('name');
            if (error) throw error;
            setProperties(data || []);
        } catch (err) {
            console.error('Failed to fetch properties', err);
        }
    };

    const handleManualLog = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const referenceCode = `M-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const { error } = await supabase
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
                    reference_code: referenceCode,
                    status: 'NEW'
                }]);

            if (error) throw error;

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
            alert(`Failed to log ticket: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const safeTickets = Array.isArray(tickets) ? tickets : [];

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Service Queue</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl">Access and manage the full history of maintenance and repair requests across all properties.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                        <Plus className="w-4 h-4 mr-3" />
                        Manual Log
                    </button>
                </div>

                {/* Advanced Search & Filter Bar */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full lg:w-[32rem]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by reference, property, or specific unit..."
                            className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchTickets()}
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                className="w-full lg:w-64 bg-slate-50 border-none rounded-2xl pl-12 pr-10 py-4 text-sm font-black text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Lifecycle Stages</option>
                                <option value="NEW">New Requests</option>
                                <option value="IN_PROGRESS">Active Operations</option>
                                <option value="COMPLETED">Resolved Cases</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                ▾
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden rounded-[3rem]">
                    {loading ? (
                        <div className="p-32 text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-8" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Database Archive...</p>
                        </div>
                    ) : safeTickets.length === 0 ? (
                        <div className="p-32 text-center">
                            <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-slate-100 shadow-inner">
                                <ClipboardList className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No records found</h3>
                            <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto mb-10">Refine your search parameters or check alternative status categories.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all shadow-xl"
                            >
                                Log First Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ref ID</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Location</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Archived On</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Navigation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50/50">
                                    {safeTickets.map((ticket) => (
                                        <tr key={ticket.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                                            <td className="px-10 py-8">
                                                <span className="font-mono font-black text-indigo-500 bg-indigo-50/50 px-4 py-2 rounded-xl text-xs border border-indigo-100/50">
                                                    {ticket.referenceCode}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-900 text-xl tracking-tight mb-0.5 group-hover:text-indigo-600 transition-colors uppercase">{ticket.property?.name || '---'}</div>
                                                <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">{ticket.unitLabel || 'Main Facility'}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-sm font-black text-slate-400 uppercase tracking-tighter">
                                                {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <Link
                                                    href={`/tickets/${ticket.id}`}
                                                    className="inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-xl group-hover:shadow-indigo-600/30 transition-all group-hover:-translate-x-2"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
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
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-6 z-50 overflow-y-auto">
                        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] max-w-2xl w-full p-12 border border-slate-200/50 animate-in zoom-in-95 duration-300 my-8">
                            <div className="flex justify-between items-start mb-10">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-mono italic">Manual Maintenance Log</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleManualLog} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Select Property</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all appearance-none"
                                            value={formData.propertyId}
                                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                        >
                                            <option value="">Choose Property...</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Unit / Facility</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Suite 402"
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all uppercase"
                                            value={formData.unitLabel}
                                            onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Issue Description</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Detailed description of the requirement..."
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Tenant Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all"
                                            value={formData.tenantName}
                                            onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Urgency Level</label>
                                        <select
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all"
                                            value={formData.urgency}
                                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                        >
                                            <option value="NORMAL">NORMAL</option>
                                            <option value="URGENT">URGENT</option>
                                            <option value="EMERGENCY">EMERGENCY</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all font-mono"
                                            value={formData.tenantEmail}
                                            onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                                            placeholder="tenant@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all font-mono"
                                            value={formData.tenantPhone}
                                            onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                                            placeholder="+41 00 000 00 00"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-6 rounded-[2rem] font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/40 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : null}
                                    Archive Maintenance Request
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
