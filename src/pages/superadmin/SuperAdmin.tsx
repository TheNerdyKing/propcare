import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    Building2,
    Search,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    LogOut,
    ShieldAlert,
    CreditCard,
    Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdmin() {
    const navigate = useNavigate();
    // MOCK TENANTS
    const [tenants, setTenants] = useState([
        {
            id: 'ten-001',
            name: 'PropCare Demo Agency',
            subdomain: 'demo',
            status: 'TRIALING',
            daysLeft: 3,
            properties: 12,
            tickets: 45,
            blocked: false
        },
        {
            id: 'ten-002',
            name: 'Swiss Alps Real Estate',
            subdomain: 'swissalps',
            status: 'ACTIVE',
            daysLeft: null,
            properties: 84,
            tickets: 312,
            blocked: false
        },
        {
            id: 'ten-003',
            name: 'Lakeview Properties',
            subdomain: 'lakeview',
            status: 'PAST_DUE',
            daysLeft: -2,
            properties: 26,
            tickets: 89,
            blocked: true
        }
    ]);

    const toggleBlock = (id: string) => {
        setTenants(prev => prev.map(t => t.id === id ? { ...t, blocked: !t.blocked } : t));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Super Admin Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <ShieldAlert className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">SuperAdmin.</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 ml-3">Platform</div>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-800 text-white rounded-lg font-medium transition-all">
                        <Building2 className="w-5 h-5" />
                        <span>Tenant Agencies</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-all group">
                        <CreditCard className="w-5 h-5" />
                        <span>Stripe Connect</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Secure Exit</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-10 overflow-y-auto w-full max-w-[1200px] mx-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Global Tenants <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Internal Use Only</span>
                        </h2>
                        <p className="text-slate-500 mt-1">Manage platform access, billing states, and overrides globally.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search agencies..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 shadow-sm"
                        />
                    </div>
                </header>

                {/* Agencies Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Agency / Subdomain</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Usage (Props / Reports)</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Billing Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Platform Access</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-500 uppercase tracking-wide text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-900">{tenant.name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-1">{tenant.subdomain}.propcare.ch</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <p className="font-bold text-slate-700">{tenant.properties}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400">Props</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-slate-700">{tenant.tickets}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400">Reports</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {tenant.status === 'ACTIVE' && (
                                            <span className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg w-fit">
                                                <CheckCircle2 className="w-4 h-4" /> Active Sub
                                            </span>
                                        )}
                                        {tenant.status === 'TRIALING' && (
                                            <span className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wide bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-fit">
                                                <ClockIcon className="w-4 h-4" /> Trial ({tenant.daysLeft}d left)
                                            </span>
                                        )}
                                        {tenant.status === 'PAST_DUE' && (
                                            <span className="flex items-center gap-2 text-orange-700 font-bold text-xs uppercase tracking-wide bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg w-fit">
                                                <AlertTriangle className="w-4 h-4" /> Past Due ({-tenant.daysLeft}d)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        {tenant.blocked ? (
                                            <span className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wide">
                                                <XCircle className="w-4 h-4" /> Blocked Access
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                                                <CheckCircle2 className="w-4 h-4" /> Allowed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => toggleBlock(tenant.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ml-auto font-bold text-xs uppercase tracking-wider transition-colors ${tenant.blocked
                                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                                    : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                }`}
                                        >
                                            <Ban className="w-4 h-4" /> {tenant.blocked ? 'Unblock' : 'Block Agency'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
