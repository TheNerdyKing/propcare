'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Users, Plus, Star, Phone, Mail, Wrench, ChevronRight, ShieldCheck, Trash2, X, Loader2 } from 'lucide-react';

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
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
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user.tenantId || 
                   user.tenant_id || 
                   (user.tenants?.id) || 
                   (Array.isArray(user.tenants) ? user.tenants[0]?.id : user.tenants?.id);
        } catch (e) {
            return null;
        }
    };

    const fetchContractors = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('contractors')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });

            if (error) throw error;
            setContractors(data || []);
        } catch (err) {
            console.error('Failed to fetch contractors', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Möchten Sie "${name}" wirklich aus dem Netzwerk entfernen?`)) return;
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
            alert(`Fehler: ${err.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('contractors')
                .insert([{
                    name: formData.name,
                    contact_name: formData.contactName,
                    email: formData.email,
                    phone: formData.phone,
                    trade_types: formData.tradeTypes,
                    tenant_id: tenantId
                }]);

            if (error) throw error;
            setShowModal(false);
            setFormData({ name: '', contactName: '', email: '', phone: '', tradeTypes: [] });
            fetchContractors();
        } catch (err: any) {
            alert(`Fehler beim Speichern: ${err.message}`);
        } finally {
            setActionLoading(false);
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

    const commonTrades: Record<string, string> = {
        'PLUMBING': 'Sanitär',
        'ELECTRICAL': 'Elektro',
        'LOCKSMITH': 'Schlüsseldienst',
        'HEATING': 'Heizung',
        'CLEANING': 'Reinigung',
        'PAINTING': 'Maler',
        'ROOFING': 'Dachdecker'
    };

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                            <Users className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Netzwerk</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Handwerker</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Verifiziertes Netzwerk spezialisierter Fachpartner.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-8 py-4.5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 flex items-center hover:-translate-y-1"
                    >
                        <Plus className="w-5 h-5 mr-3" />
                        Partner Hinzufügen
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-40 text-center">
                            <Loader2 className="animate-spin w-16 h-16 text-blue-600 mx-auto mb-10" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Netzwerk wird synchronisiert...</p>
                        </div>
                    ) : contractors.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/40">
                            <Users className="w-20 h-20 text-slate-100 mb-10" />
                            <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Keine Partner</h3>
                            <p className="text-slate-400 font-medium text-lg italic max-w-sm text-center">Integrieren Sie Ihre bewährten Handwerker in das System.</p>
                        </div>
                    ) : (
                        contractors.map((c) => (
                            <div key={c.id} className="group bg-white rounded-[3rem] shadow-xl shadow-slate-200/30 border border-slate-50 p-10 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 shadow-sm">
                                        <Wrench className="w-8 h-8 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDelete(c.id, c.name)} className="text-slate-200 hover:text-red-500 p-2.5 transition-colors bg-slate-50 rounded-xl">
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Aktiv
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter truncate leading-none">{c.name}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-10">{c.contact_name || 'Hauptansprechpartner'}</p>

                                <div className="flex flex-wrap gap-2 mb-10 h-10 overflow-hidden">
                                    {(c.trade_types || []).map((trade: string) => (
                                        <span key={trade} className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
                                            {commonTrades[trade] || trade}
                                        </span>
                                    ))}
                                </div>

                                <div className="space-y-3.5 pt-8 border-t border-slate-50 font-bold text-xs uppercase text-slate-500">
                                    <div className="flex items-center tracking-tight"><Mail className="w-4 h-4 mr-3 text-slate-200" /> {c.email}</div>
                                    <div className="flex items-center tracking-tight"><Phone className="w-4 h-4 mr-3 text-slate-200" /> {c.phone || 'KEINE NUMMER'}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] max-w-2xl w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Partner hinzufügen</h2>
                                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl flex items-center justify-center transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Unternehmensname</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all placeholder:text-slate-300 shadow-inner"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="z.B. BAU-PROFIS AG"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Ansprechpartner</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all placeholder:text-slate-300 shadow-inner"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            placeholder="MAX MUSTER"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">E-Mail Adresse</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-inner"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="OFFICE@BAU-PROFIS.CH"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Telefon</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-inner"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+41 44 ..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Gewerbe / Fachrichtung</label>
                                    <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
                                        {Object.entries(commonTrades).map(([key, label]) => (
                                            <button
                                                key={key} type="button"
                                                onClick={() => toggleTrade(key)}
                                                className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border ${formData.tradeTypes.includes(key)
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30'
                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-blue-500 shadow-sm'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={actionLoading} className="w-full h-20 rounded-[1.5rem] font-black text-white bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all uppercase tracking-[0.2em] text-[11px] mt-10">
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'PARTNER JETZT AUTORISIEREN ➔'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
            </div>
        </AuthenticatedLayout>
    );
}
