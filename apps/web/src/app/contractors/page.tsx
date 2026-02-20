'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Users, Plus, Star, Phone, Mail, Wrench, ChevronRight } from 'lucide-react';

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
            setContractors(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch contractors', err);
            setContractors([]);
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Service Network</h1>
                        <p className="text-slate-500 font-medium text-lg">Manage your verified partners and specialized contractors.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Partner
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading network...</p>
                        </div>
                    ) : contractors.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100">
                                <Users className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">No partners added</h3>
                            <p className="mt-2 text-slate-500 max-w-xs text-center font-medium">
                                Start building your contractor network to automate maintenance assignments.
                            </p>
                        </div>
                    ) : (
                        contractors.map((c) => (
                            <div key={c.id} className="group bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-300 shadow-sm">
                                        <Wrench className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm shadow-amber-600/5">
                                        <Star className="w-3.5 h-3.5 fill-amber-700" />
                                        <span>Verified</span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-1 truncate leading-tight group-hover:text-emerald-700 transition-colors">{c.name}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">{c.contactName || 'Primary Contact'}</p>

                                <div className="flex flex-wrap gap-2 mb-8 h-12 overflow-hidden">
                                    {(c.tradeTypes || []).length > 0 ? (c.tradeTypes || []).map((trade: string) => (
                                        <span key={trade} className="px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-colors">
                                            {trade}
                                        </span>
                                    )) : (
                                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic">General Maintenance</span>
                                    )}
                                </div>

                                <div className="space-y-4 pt-8 border-t border-slate-50">
                                    <div className="flex items-center text-sm text-slate-600 font-bold group-hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-emerald-50">
                                            <Mail className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                                        </div>
                                        {c.email}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600 font-bold group-hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-emerald-50">
                                            <Phone className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                                        </div>
                                        {c.phone || 'No phone listed'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 border border-slate-100 animate-in zoom-in-95 duration-200 my-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Add Service Partner</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Company Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Main Contact</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Phone Number</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Specializations (Trades)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {commonTrades.map(trade => (
                                            <button
                                                key={trade}
                                                type="button"
                                                onClick={() => toggleTrade(trade)}
                                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${formData.tradeTypes.includes(trade)
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                                    }`}
                                            >
                                                {trade}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-8 border-t border-slate-50 mt-4">
                                    <button type="submit" className="w-full py-4 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all uppercase tracking-[0.2em] text-sm">Onboard Partner</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 font-black text-slate-400 hover:text-slate-600 transition uppercase tracking-widest text-xs">Nevermind, cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
