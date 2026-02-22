'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, Search, Plus, ArrowRight, Building2, Users, Rocket, ExternalLink, Sparkles } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function DashboardPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTickets();

        // Real-time updates: Poll every 10 seconds
        const interval = setInterval(() => {
            fetchTickets(false); // background fetch
        }, 10000);

        return () => clearInterval(interval);
    }, [statusFilter]);

    const fetchTickets = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await api.get('/tickets', {
                params: {
                    status: statusFilter || undefined,
                    search: search || undefined,
                },
            });
            setTickets(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const openTickets = safeTickets.filter(t => t.status !== 'COMPLETED').length;
    const resolvedTickets = safeTickets.filter(t => t.status === 'COMPLETED').length;

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Command Center</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Operational overview of your facility maintenance ecosystem.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-32 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-8" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Cloud Data Sync Active...</p>
                    </div>
                ) : safeTickets.length === 0 ? (
                    /* High-End Empty State */
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                            <div className="relative z-10 max-w-3xl">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                                    <Rocket className="w-8 h-8" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter mb-6 leading-tight">Your Command Center is Ready.</h2>
                                <p className="text-indigo-100 text-lg font-medium mb-10 leading-relaxed">We are initializing your workspace environment. If this is your first time here, our autonomous engine is populating your dashboard with premium demo assets and maintenance logs to help you explore the platform.</p>
                                <div className="flex flex-wrap gap-6">
                                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center">
                                        System Sync: Active <Sparkles className="ml-3 w-4 h-4 animate-pulse text-yellow-300" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Link href="/properties" className="group bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-slate-50 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 transition-colors duration-500">
                                    <Building2 className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors duration-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter group-hover:text-indigo-600 transition-colors uppercase">Real Estate Assets</h3>
                                <p className="text-slate-500 font-medium mb-8">View and manage your property portfolio. Track maintenance cycles across units and common areas.</p>
                                <div className="flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                                    View Assets <ArrowRight className="ml-2 w-4 h-4" />
                                </div>
                            </Link>

                            <Link href="/contractors" className="group bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-700 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-slate-50 group-hover:bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 transition-colors duration-500">
                                    <Users className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors duration-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter group-hover:text-emerald-700 transition-colors uppercase">Partner Network</h3>
                                <p className="text-slate-500 font-medium mb-8">Connect with certified contractors and monitor performance metrics across your entire ecosystem.</p>
                                <div className="flex items-center text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                                    Manage Network <ArrowRight className="ml-2 w-4 h-4" />
                                </div>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group relative overflow-hidden">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Aggregate Volume</p>
                                <div className="flex items-baseline space-x-3">
                                    <p className="text-6xl font-black text-slate-900 tracking-tighter">{loading ? '...' : safeTickets.length}</p>
                                    <span className="text-slate-300 font-bold uppercase text-xs tracking-widest">Active Tickets</span>
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-2xl hover:shadow-amber-500/5 group border-t-8 border-t-amber-400">
                                <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.3em] mb-6">Pending Operation</p>
                                <div className="flex items-baseline space-x-3">
                                    <p className="text-6xl font-black text-amber-600 tracking-tighter">{loading ? '...' : openTickets}</p>
                                    <span className="text-amber-200 font-bold uppercase text-xs tracking-widest">Urgent Cases</span>
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-2xl hover:shadow-emerald-500/5 group border-t-8 border-t-emerald-400">
                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.3em] mb-6">Operational Success</p>
                                <div className="flex items-baseline space-x-3">
                                    <p className="text-6xl font-black text-emerald-600 tracking-tighter">{loading ? '...' : resolvedTickets}</p>
                                    <span className="text-emerald-200 font-bold uppercase text-xs tracking-widest">Resolved</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-10 px-4">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Recent Stream</h2>
                            <Link href="/tickets" className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] hover:translate-x-2 transition-transform">
                                Archive Access ➔
                            </Link>
                        </div>

                        <div className="bg-white shadow-2xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden rounded-[3.5rem]">
                            <ul className="divide-y divide-slate-50">
                                {safeTickets.slice(0, 5).map((ticket) => (
                                    <li key={ticket.id} className="group">
                                        <Link href={`/tickets/${ticket.id}`} className="block hover:bg-slate-50/50 transition-all duration-500 px-12 py-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-[11px] font-black text-indigo-500 bg-indigo-50/50 px-4 py-2 rounded-2xl font-mono border border-indigo-100/50">
                                                        {ticket.referenceCode}
                                                    </span>
                                                    <div className={`px-4 py-2 text-[10px] font-black rounded-full uppercase tracking-widest border border-transparent shadow-sm ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                                    {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div className="max-w-xl">
                                                    <h4 className="text-3xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors tracking-tighter uppercase">
                                                        {ticket.property?.name || 'Asset ID: Unknown'}
                                                    </h4>
                                                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.1em]">{ticket.unitLabel || 'Common Environment'}</p>
                                                </div>
                                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-all group-hover:shadow-2xl shadow-indigo-100 -translate-x-4 group-hover:translate-x-0">
                                                    <ArrowRight className="w-7 h-7" />
                                                </div>
                                            </div>
                                            <p className="mt-8 text-slate-600 line-clamp-1 italic font-serif text-lg leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                                "{ticket.description}"
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
