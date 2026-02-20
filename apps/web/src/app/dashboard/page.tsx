'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, Search, Plus, ArrowRight } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function DashboardPage() {
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
            // Defensive: ensure tickets is always an array
            setTickets(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const seedDemoData = async () => {
        setLoading(true);
        try {
            await api.post('/public/seed-demo-data');
            await fetchTickets();
        } catch (err) {
            console.error('Failed to seed demo data', err);
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

    // Safe stats calculation
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const openTickets = safeTickets.filter(t => t.status !== 'COMPLETED').length;
    const resolvedTickets = safeTickets.filter(t => t.status === 'COMPLETED').length;

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Staff Dashboard</h1>
                        <p className="text-slate-500 font-medium text-lg italic">Welcome back. Here is what requires your attention today.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Request Volume</p>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{loading ? '...' : safeTickets.length}</p>
                            <span className="text-slate-300 font-bold">tickets</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-xl hover:shadow-amber-500/5 group border-l-4 border-l-amber-400">
                        <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-4">Action Required</p>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-5xl font-black text-amber-600 tracking-tighter">{loading ? '...' : openTickets}</p>
                            <span className="text-amber-200 font-bold">open</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group border-l-4 border-l-emerald-400">
                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-4">Success Rate</p>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-5xl font-black text-emerald-600 tracking-tighter">{loading ? '...' : resolvedTickets}</p>
                            <span className="text-emerald-200 font-bold">resolved</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-white border-none rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner w-64"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && fetchTickets()}
                            />
                        </div>
                        <Link href="/tickets">
                            <button className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                                View All Tickets
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="bg-white shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden rounded-[2.5rem]">
                    <ul className="divide-y divide-slate-50">
                        {loading ? (
                            <li className="p-24 text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-6" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing data...</p>
                            </li>
                        ) : safeTickets.length === 0 ? (
                            <li className="p-24 text-center flex flex-col items-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 italic">
                                    <ClipboardList className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Zero tickets active</h3>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10">Your maintenance queue is currently empty. Ready to start fresh?</p>
                                <button
                                    onClick={seedDemoData}
                                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/30"
                                >
                                    Seed Demo Data Package
                                </button>
                            </li>
                        ) : (
                            safeTickets.slice(0, 5).map((ticket) => (
                                <li key={ticket.id} className="group">
                                    <Link href={`/tickets/${ticket.id}`} className="block hover:bg-indigo-50/30 transition-all duration-300 px-10 py-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl font-mono border border-indigo-100">
                                                    {ticket.referenceCode}
                                                </span>
                                                <div className={`px-3 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <h4 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                                    {ticket.property?.name || 'Unassigned Property'}
                                                </h4>
                                                <p className="text-sm text-slate-500 font-bold">{ticket.unitLabel || 'Common Area • Facility'}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-all group-hover:shadow-lg shadow-indigo-100">
                                                <ArrowRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="mt-6 text-sm text-slate-600 line-clamp-1 italic font-light font-serif">
                                            "{ticket.description}"
                                        </p>
                                    </Link>
                                </li>
                            ))
                        )}
                        {safeTickets.length > 5 && (
                            <li className="bg-slate-50/50 p-6 text-center">
                                <Link href="/tickets" className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-800 transition-colors">
                                    View all {safeTickets.length} tickets ➔
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
