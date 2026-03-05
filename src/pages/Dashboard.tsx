import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Building2,
  FileSpreadsheet,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

interface TicketData {
  id: string;
  referenceId: string;
  description: string;
  urgency: string;
  status: string;
  unit?: string;
  createdAt: string;
  property: {
    name: string;
  };
  aiResult?: {
    category: string;
    urgency: string;
  };
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, completed: 0, properties: 0 });
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetch('/api/tickets', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      if (!ticketsRes.ok || !statsRes.ok) throw new Error('Failed to fetch');

      const [ticketsData, statsData] = await Promise.all([
        ticketsRes.json(),
        statsRes.json()
      ]);

      setTickets(ticketsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = io();

    socket.on('connect', () => {
      socket.emit('join-tenant', user.tenantId);
    });

    socket.on('ticket-created', (ticket: TicketData) => {
      setTickets(prev => [ticket, ...prev]);
      setStats(prev => ({ ...prev, open: prev.open + 1 }));
    });

    socket.on('ticket-updated', (updatedTicket: TicketData) => {
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        .then(res => res.json())
        .then(data => setStats(data));
    });

    socket.on('property-added', () => {
      setStats(prev => ({ ...prev, properties: prev.properties + 1 }));
    });

    fetchData();

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'EMERGENCY': return 'text-red-700 bg-red-100 border border-red-200';
      case 'URGENT': return 'text-orange-700 bg-orange-100 border border-orange-200';
      case 'NORMAL': return 'text-blue-700 bg-blue-100 border border-blue-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar - More compact and clean */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">PropCare.</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 ml-3">Menu</div>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium transition-all">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/properties')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
          >
            <Building2 className="w-5 h-5" />
            <span>Properties</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group">
            <Ticket className="w-5 h-5" />
            <span>Reports (Meldungen)</span>
          </button>
          <button
            onClick={() => navigate('/contractors')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
          >
            <Users className="w-5 h-5" />
            <span>Contractors</span>
          </button>
          <button
            onClick={() => navigate('/admin/billing')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
          >
            <CreditCard className="w-5 h-5" />
            <span>Billing & Plan</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm border border-slate-200">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.tenantName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h2>
            <p className="text-slate-500 mt-1">Central management of all tenant requests, repairs, and damages.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Seed Demo
            </button>
            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              New Report
            </button>
          </div>
        </header>

        {/* Compact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: tickets.length, icon: Ticket, color: "text-slate-600", bg: "bg-slate-50", borderColor: "border-slate-200" },
            { label: 'Open', value: stats.open, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200" },
            { label: 'Active', value: stats.inProgress, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", borderColor: "border-yellow-200" },
            { label: 'Resolved', value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", borderColor: "border-emerald-200" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-2xl flex items-center justify-between border ${stat.bg} ${stat.borderColor}`}
            >
              <div>
                <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Compact Ticket List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, building or tenant..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Filter className="w-4 h-4" /> Filter: All Status
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-6 py-4 font-semibold text-slate-500">REFERENCE</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">OBJECT & UNIT</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">PRIORITY</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">STATUS</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading data...</td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">No reports found.</td>
                  </tr>
                ) : tickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => navigate(`/admin/tickets/${ticket.id}`)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">{ticket.referenceId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{ticket.property.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            {ticket.unit || 'Common Area'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide border ${getUrgencyColor(ticket.urgency)}`}>
                        {ticket.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide border flex inline-flex items-center gap-1.5 ${getStatusColor(ticket.status)}`}>
                        <Clock className="w-3 h-3" />
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="p-1.5 bg-white border border-slate-200 rounded-md inline-block group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors group-hover:border-blue-200">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
