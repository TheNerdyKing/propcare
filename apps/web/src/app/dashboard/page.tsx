'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
                <div className="flex space-x-4">
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="border border-gray-300 rounded-md px-4 py-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchTickets()}
                    />
                    <select
                        className="border border-gray-300 rounded-md px-4 py-2"
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

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="p-8 text-center text-gray-500">Loading tickets...</li>
                    ) : tickets.length === 0 ? (
                        <li className="p-8 text-center text-gray-500">No tickets found.</li>
                    ) : (
                        tickets.map((ticket) => (
                            <li key={ticket.id}>
                                <Link href={`/tickets/${ticket.id}`} className="block hover:bg-gray-50 transition-colors">
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-indigo-600 truncate">
                                                {ticket.referenceCode}
                                            </p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                                {ticket.property?.name} - {ticket.unitLabel}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 pb-4 sm:px-6 text-sm text-gray-600 truncate">
                                        {ticket.description}
                                    </div>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
