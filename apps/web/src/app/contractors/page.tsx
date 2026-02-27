'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { 
    Users, 
    Plus, 
    Star, 
    Phone, 
    Mail, 
    Wrench, 
    ChevronRight, 
    ShieldCheck, 
    Trash2, 
    X, 
    Loader2,
    Activity,
    Search,
    CheckCircle2,
    Briefcase
} from 'lucide-react';

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredContractors = contractors.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 bg-blue-600/10 backdrop-blur-md text-blue-600 px-5 py-2.5 rounded-2xl border border-blue-200/50">
                            <Users className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Service-Netzwerk</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Unsere<br/><span className="text-blue-600">Partner</span></h1>
                        <p className="text-slate-500 font-medium text-xl max-w-xl italic leading-relaxed">Verifiziertes Netzwerk spezialisierter Handwerker und regionaler Fachpartner.</p>
                    </div>
                    
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-slate-900 text-white px-12 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center shadow-3xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6 mr-4" />
                        Handwerker Einladen
                    </button>
                </div>

                {/* Filter Strip */}
                <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[3rem] shadow-3xl shadow-slate-200/40 border border-slate-100 mb-10">
                    <div className="relative w-full max-w-2xl">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Suchen nach Unternehmen oder Ansprechpartner..."
                            className="w-full bg-slate-50/50 border border-slate-200/50 rounded-3xl pl-18 pr-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-48 text-center flex flex-col items-center">
                            <Loader2 className="animate-spin w-20 h-20 text-blue-600 mb-8" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[12px]">Netzwerk wird katalogisiert...</p>
                        </div>
                    ) : filteredContractors.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-48 bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[4rem] shadow-3xl shadow-slate-200/20 text-slate-300 grayscale opacity-40">
                            <Users className="w-32 h-32 mb-10 stroke-[0.5]" />
                            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Keine Partner</h3>
                            <p className="font-medium italic">Fügen Sie Ihre ersten Fachpartner hinzu.</p>
                        </div>
                    ) : (
                        filteredContractors.map((c, index) => (
                            <div key={c.id} className="group bg-white rounded-[4rem] shadow-xl shadow-slate-200/30 border border-slate-50 p-12 hover:shadow-3xl hover:shadow-blue-600/10 transition-all duration-700 hover:-translate-y-3 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex justify-between items-start mb-12">
                                    <div className="w-18 h-18 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-700">
                                        <Wrench className="w-9 h-9" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleDelete(c.id, c.name)} 
                                            className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-500"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <div className="h-10 px-4 flex items-center bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 rounded-xl shadow-sm">
                                            <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                            Aktiv
                                        </div>
                                    </div>
                                </div>
                                
                                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter truncate leading-none group-hover:text-blue-600 transition-colors">{c.name}</h3>
                                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mb-10 italic">{c.contact_name || 'Hauptverwaltung'}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-12 h-10 overflow-hidden">
                                    {(c.trade_types || []).map((trade: string) => (
                                        <span key={trade} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-white transition-colors shadow-sm">
                                            {commonTrades[trade] || trade}
                                        </span>
                                    ))}
                                </div>
                                
                                <div className="pt-10 border-t border-slate-50 space-y-4">
                                    <div className="flex items-center text-slate-400 font-bold text-sm tracking-tight truncate">
                                        <Mail className="w-4 h-4 mr-4 text-blue-500" />
                                        {c.email}
                                    </div>
                                    <div className="flex items-center text-slate-400 font-bold text-sm tracking-tight">
                                        <Phone className="w-4 h-4 mr-4 text-blue-500" />
                                        {c.phone || 'KEINE NUMMER'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Overhauled Compact Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-8 z-[100] animate-in fade-in duration-500">
                        <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] max-w-xl w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 relative">
                            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Partner-Registrierung</p>
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Neuer Partner</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 group">
                                    <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-12 space-y-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Firma</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all uppercase placeholder:text-slate-200"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="BAU-PROFIS AG"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kontaktperson</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all uppercase placeholder:text-slate-200"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            placeholder="MAX MUSTER"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">E-Mail</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-200"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="OFFICE@PROVIDER.CH"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Telefon</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-200"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+41 44 ..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 px-1">
                                        <Briefcase className="w-4 h-4 text-blue-600" />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gewerbe / Fachrichtung</label>
                                    </div>
                                    <div className="flex flex-wrap gap-3 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                        {Object.entries(commonTrades).map(([key, label]) => (
                                            <button
                                                key={key} type="button"
                                                onClick={() => toggleTrade(key)}
                                                className={`px-6 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border ${formData.tradeTypes.includes(key)
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-blue-500 shadow-sm'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={actionLoading} className="w-full h-24 rounded-[2.5rem] font-black text-white bg-slate-900 hover:bg-blue-600 shadow-3xl shadow-slate-900/20 transition-all uppercase tracking-[0.3em] text-[12px] mt-6 flex items-center justify-center gap-6 disabled:opacity-50 group">
                                    {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" /> Partner Jetzt Bestätigen</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
