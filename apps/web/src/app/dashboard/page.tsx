'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
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
            setTickets(response.data);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
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
            case 'NEW': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Dashboard</h1>
                        <p className="text-slate-500 font-medium">Manage and track property maintenance requests.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Tickets</p>
                        <p className="text-4xl font-black text-indigo-950 mt-2">{loading ? '...' : tickets.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Open Tickets</p>
                        <p className="text-4xl font-black text-indigo-600 mt-2">
                            {loading ? '...' : tickets.filter(t => t.status !== 'COMPLETED').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Resolved</p>
                        <p className="text-4xl font-black text-emerald-600 mt-2">
                            {loading ? '...' : tickets.filter(t => t.status === 'COMPLETED').length}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchTickets()}
                        />
                        <select
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="NEW">New</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white shadow-sm border border-slate-200/60 overflow-hidden rounded-2xl">
                    <ul className="divide-y divide-slate-100">
                        {loading ? (
                            <li className="p-12 text-center text-slate-400 font-medium">
                                <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                                Loading tickets...
                            </li>
                        ) : tickets.length === 0 ? (
                            <li className="p-16 text-center text-slate-400 flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <ClipboardList className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No tickets found</h3>
                                <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">Get started by seeding some demo data or creating a new ticket.</p>
                                <button
                                    onClick={seedDemoData}
                                    className="mt-8 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                                >
                                    Seed Demo Data
                                </button>
                            </li>
                        ) : (
                            tickets.map((ticket) => (
                                <li key={ticket.id} className="group">
                                    <Link href={`/tickets/${ticket.id}`} className="block hover:bg-slate-50/80 transition-all duration-200 px-6 py-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono bg-indigo-50 px-2 py-0.5 rounded">
                                                    {ticket.referenceCode}
                                                </span>
                                                <div className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900">
                                                    {ticket.property?.name || 'Unknown Property'}
                                                </h4>
                                                <p className="text-sm text-slate-500 font-medium">{ticket.unitLabel || 'Common Area'}</p>
                                            </div>
                                            <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                                <span className="text-sm font-bold mr-1">View Details</span> ➔
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-slate-600 line-clamp-1 italic font-light">
                                            "{ticket.description}"
                                        </p>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
