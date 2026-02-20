'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Users, Plus, Star, Phone, Mail, Wrench } from 'lucide-react';

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        tradeTypes: [] as string[],
    });

    useEffect(() => {
        fetchContractors();
    }, []);

    const fetchContractors = async () => {
        try {
            const response = await api.get('/contractors');
            setContractors(response.data);
        } catch (err) {
            console.error('Failed to fetch contractors', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/contractors', formData);
            setShowModal(false);
            setFormData({ name: '', contactName: '', email: '', phone: '', tradeTypes: [] });
            fetchContractors();
        } catch (err) {
            console.error('Failed to save contractor', err);
        }
    };

    const toggleTrade = (trade: string) => {
        setFormData(prev => ({
            ...prev,
            tradeTypes: prev.tradeTypes.includes(trade)
                ? prev.tradeTypes.filter(t => t !== trade)
                : [...prev.tradeTypes, trade]
        }));
    };

    const commonTrades = ['PLUMBING', 'ELECTRICAL', 'LOCKSMITH', 'HEATING', 'CLEANING', 'PAINTING', 'ROOFING'];

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-7xl mx-auto text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contractors</h1>
                        <p className="text-slate-500 font-medium">Manage your network of service partners and specialists.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-[0_4px_12px_rgba(79,70,229,0.3)] flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Add Partner
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-slate-400 font-medium tracking-tight">Loading partners...</p>
                        </div>
                    ) : contractors.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No partners added</h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-xs text-center font-medium">
                                Start building your contractor network to automate maintenance assignments.
                            </p>
                        </div>
                    ) : (
                        contractors.map((c) => (
                            <div key={c.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 p-7 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                                        <Wrench className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="flex items-center space-x-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        <Star className="w-3 h-3 fill-yellow-700" />
                                        <span>Top Partner</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-1 truncate">{c.name}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">{c.contactName}</p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {(c.tradeTypes || []).map((trade: string) => (
                                        <span key={trade} className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                            {trade}
                                        </span>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-6 border-t border-slate-50">
                                    <div className="flex items-center text-sm text-slate-600 font-medium">
                                        <Mail className="w-4 h-4 mr-3 text-slate-300" />
                                        {c.email}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600 font-medium">
                                        <Phone className="w-4 h-4 mr-3 text-slate-300" />
                                        {c.phone}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Add Service Partner</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Main Contact</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Specializations (Trades)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {commonTrades.map(trade => (
                                            <button
                                                key={trade}
                                                type="button"
                                                onClick={() => toggleTrade(trade)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${formData.tradeTypes.includes(trade)
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {trade}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-50">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
                                    <button type="submit" className="px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition">Add Partner</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
