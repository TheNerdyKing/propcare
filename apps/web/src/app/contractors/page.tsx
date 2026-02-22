'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Users, Plus, Star, Phone, Mail, Wrench, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react';

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

    const getTenantId = () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.tenantId || user.tenant_id;
        } catch (e) {
            return null;
        }
    };

    const fetchContractors = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { data, error } = await supabase
                .from('contractors')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });

            if (error) throw error;

            // Map table names to match previous frontend expectations
            const mappedData = data.map(c => ({
                ...c,
                tradeTypes: c.trade_types // Match prisma naming
            }));

            setContractors(mappedData);
        } catch (err) {
            console.error('Failed to fetch contractors', err);
            setContractors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove "${name}" from your network?`)) return;
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { error } = await supabase
                .from('contractors')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);
            if (error) throw error;
            fetchContractors();
        } catch (err: any) {
            console.error('Failed to delete contractor', err);
            alert(`Failed: ${err.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId) return alert('No active session. Please log in again.');

        try {
            const { error } = await supabase
                .from('contractors')
                .insert([{
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    trade_types: formData.tradeTypes,
                    tenant_id: tenantId
                    // Note: contactName is not in the prisma schema I saw earlier, 
                    // checking schema.prisma again if needed but for now sticking to DB fields.
                }]);

            if (error) throw error;
            setShowModal(false);
            setFormData({ name: '', contactName: '', email: '', phone: '', tradeTypes: [] });
            fetchContractors();
        } catch (err: any) {
            console.error('Failed to save contractor', err);
            alert(`Failed to save contractor: ${err.message}`);
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

    const safeContractors = Array.isArray(contractors) ? contractors : [];

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Service Matrix</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Verified network of maintenance specialists and emergency repair teams.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center uppercase tracking-[0.2em] text-[10px]"
                    >
                        <Plus className="w-5 h-5 mr-3" />
                        Authorize Partner
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-32 text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-8" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Scanning Provider Network...</p>
                        </div>
                    ) : safeContractors.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] shadow-sm">
                            <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-slate-100 shadow-inner">
                                <Users className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Empty Database</h3>
                            <p className="mt-2 text-slate-500 max-w-sm text-center font-medium text-lg leading-relaxed">
                                Accelerate maintenance workflows by onboarding your first specialized service provider.
                            </p>
                        </div>
                    ) : (
                        safeContractors.map((c) => (
                            <div key={c.id} className="group bg-white rounded-[3rem] shadow-sm border border-slate-200/60 p-10 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-700 hover:-translate-y-2">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-500 shadow-sm border border-emerald-100/50">
                                        <Wrench className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-500" />
                                    </div>
                                    <div className="flex items-center space-x-2 relative z-10">
                                        <button
                                            onClick={() => handleDelete(c.id, c.name)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100 shadow-sm shadow-amber-600/5">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Verified</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black text-slate-900 mb-2 truncate leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-tighter">{c.name || 'Incognito Entity'}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">{c.contactName || 'Lead Tech 01'}</p>

                                <div className="flex flex-wrap gap-2 mb-10 h-14 overflow-hidden">
                                    {(c.tradeTypes || []).length > 0 ? (c.tradeTypes || []).map((trade: string) => (
                                        <span key={trade} className="px-3 py-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all">
                                            {trade}
                                        </span>
                                    )) : (
                                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">Full-Spectrum Ops</span>
                                    )}
                                </div>

                                <div className="space-y-4 pt-10 border-t border-slate-50">
                                    <div className="flex items-center text-xs font-black text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-emerald-50 transition-colors">
                                            <Mail className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                        </div>
                                        {c.email || 'comm@encrypted.local'}
                                    </div>
                                    <div className="flex items-center text-xs font-black text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-emerald-50 transition-colors">
                                            <Phone className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                        </div>
                                        {c.phone || '+00 000 000 00'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-6 z-50 overflow-y-auto">
                        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] max-w-xl w-full p-12 border border-slate-200/50 animate-in zoom-in-95 duration-300 my-8">
                            <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter uppercase">Commission Partner</h2>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Entity Identifier</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner transition-all uppercase placeholder:italic"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Primary Liaison</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner transition-all uppercase"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Communication Hub</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner transition-all font-mono"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Direct Contact</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner transition-all font-mono"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Operational Specialist Domains</label>
                                    <div className="flex flex-wrap gap-3">
                                        {commonTrades.map(trade => (
                                            <button
                                                key={trade}
                                                type="button"
                                                onClick={() => toggleTrade(trade)}
                                                className={`px-5 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border-2 ${formData.tradeTypes.includes(trade)
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/30'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-emerald-500 hover:text-emerald-600'
                                                    }`}
                                            >
                                                {trade}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-10 border-t border-slate-100 mt-6">
                                    <button type="submit" className="w-full py-5 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-600/40 transition-all uppercase tracking-[0.2em] text-[10px]">Verify & Authorize Partner</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="w-full py-5 font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-[10px]">Abort Process</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
