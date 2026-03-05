import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Plus,
  MapPin,
  Search,
  X,
  Loader2,
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  GripVertical,
  MoreHorizontal,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

interface Property {
  id: string;
  name: string;
  address: string;
  zipCode: string;
  city: string;
  createdAt: string;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: '', address: '', zipCode: '', city: '' });
  const [submitting, setSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProperties(data);
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

    socket.on('property-added', (property: Property) => {
      setProperties(prev => [property, ...prev]);
    });

    fetchProperties();

    return () => {
      socket.disconnect();
    };
  }, [user.tenantId]);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) await fetchProperties();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;
    setIsSeeding(true);
    try {
      const res = await fetch('/api/demo/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) await fetchProperties();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newProperty)
      });
      if (!res.ok) throw new Error('Failed to create');
      setIsModalOpen(false);
      setNewProperty({ name: '', address: '', zipCode: '', city: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar - Shared compact style */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">PropCare.</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 ml-3">Menu</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium transition-all">
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
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Properties</h2>
            <p className="text-slate-500 mt-1">Manage and organize your real estate portfolio.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search properties..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>

            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              Seed Demo
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </header>

        {/* Property Compact List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-12 text-slate-400"></th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Property Name</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Address</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">City</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">Date Added</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading portfolio...</td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No properties added</h3>
                    <p className="text-slate-500 mb-6">Get started by creating a new property or seeding demo data.</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                      Add Property
                    </button>
                  </td>
                </tr>
              ) : properties.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 text-center">
                    <GripVertical className="w-4 h-4 text-slate-300 cursor-grab hover:text-slate-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-900">{property.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-600 gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {property.zipCode} {property.city}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Property Modal */}
      <AnimatePresence>
        {isModalOpen && (
          // Modal Logic goes here - keeping it mostly the same structurally but updating classes
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 overflow-hidden"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">New Property</h3>
                <p className="text-slate-500 text-sm">Register a new asset to your portfolio.</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Property Name</label>
                  <input
                    required value={newProperty.name} onChange={e => setNewProperty({ ...newProperty, name: e.target.value })} placeholder="e.g. Sunset Apartments"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Street Address</label>
                  <input
                    required value={newProperty.address} onChange={e => setNewProperty({ ...newProperty, address: e.target.value })} placeholder="e.g. Zürichstrasse 45"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Zip Code</label>
                    <input
                      required value={newProperty.zipCode} onChange={e => setNewProperty({ ...newProperty, zipCode: e.target.value })} placeholder="8001"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">City</label>
                    <input
                      required value={newProperty.city} onChange={e => setNewProperty({ ...newProperty, city: e.target.value })} placeholder="Zürich"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <button disabled={submitting} className="w-full mt-2 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Property'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
