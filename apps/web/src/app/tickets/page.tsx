'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, Search, Filter, ArrowRight } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tickets', {
                params: {
                    status: statusFilter || undefined,
                    search: search || undefined,
                },
            });
            setTickets(response.data || []);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
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

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Service Tickets</h1>
                    <p className="text-slate-500 font-medium text-lg">Detailed view of all active and historical maintenance requests.</p>
                </div>

                {/* Filters Bar */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, property or unit..."
                            className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchTickets()}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-10 py-3 text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner appearance-none cursor-pointer font-bold text-slate-700"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="NEW">New Requests</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Successfully Resolved</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                ▾
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden rounded-[2rem]">
                    {loading ? (
                        <div className="p-24 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Tickets...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                <ClipboardList className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">No tickets found</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Property & Unit</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id} className="group hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <span className="font-mono font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl text-xs">
                                                    {ticket.referenceCode}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-slate-900 text-lg">{ticket.property?.name || '---'}</div>
                                                <div className="text-slate-500 font-bold text-sm">{ticket.unitLabel || 'Common Area'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                                {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link
                                                    href={`/tickets/${ticket.id}`}
                                                    className="inline-flex items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
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
