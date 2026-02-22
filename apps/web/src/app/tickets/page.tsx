'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ClipboardList, Search, Filter, ArrowRight, ChevronRight } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTickets();
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
                // Refined search across multiple fields
                query = query.or(`reference_code.ilike.%${search}%,description.ilike.%${search}%,tenant_name.ilike.%${search}%,unit_label.ilike.%${search}%`);
                // Note: RELATIONAL filtering (property name) in a single 'or' is complex in PostgREST unless using !inner.
                // For simplicity and correctness with the existing schema, we search main fields.
            }

            const { data, error } = await query;
            if (error) throw error;

            // Map snake_case from DB to camelCase for UI
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
                <div className="mb-12">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Service Queue</h1>
                    <p className="text-slate-500 font-medium text-xl max-w-2xl">Access and manage the full history of maintenance and repair requests across all properties.</p>
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
                            <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto">Refine your search parameters or check alternative status categories.</p>
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
            </div>
        </AuthenticatedLayout>
    );
}
