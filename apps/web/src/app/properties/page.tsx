'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { 
    Building2, 
    Plus, 
    Download, 
    ChevronRight, 
    MapPin, 
    X, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    Trash2,
    Search,
    Filter,
    ArrowRight,
    Home,
    Map
} from 'lucide-react';

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        addressLine1: '',
        zip: '',
        city: '',
    });

    useEffect(() => {
        fetchProperties();
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

    const fetchProperties = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('properties')
                .select(`*, units(count), tickets(count)`)
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });

            if (error) throw error;

            const mappedData = (data || []).map(p => ({
                ...p,
                addressLine1: p.address_line1,
                _count: {
                    units: p.units?.[0]?.count || 0,
                    tickets: p.tickets?.[0]?.count || 0
                }
            }));

            setProperties(mappedData);
        } catch (err) {
            console.error('Failed to fetch properties', err);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Sind Sie sicher, dass Sie "${name}" löschen möchten? Alle Einheiten und Tickets werden ebenfalls gelöscht.`)) return;
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);
            if (error) throw error;
            await fetchProperties();
        } catch (err: any) {
            alert(`Fehler: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const dbData = {
                name: formData.name,
                address_line1: formData.addressLine1,
                zip: formData.zip,
                city: formData.city,
                tenant_id: tenantId
            };

            if (editingProperty) {
                const { error } = await supabase
                    .from('properties')
                    .update(dbData)
                    .eq('id', editingProperty.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('properties')
                    .insert([dbData]);
                if (error) throw error;
            }
            setShowModal(false);
            setEditingProperty(null);
            setFormData({ name: '', addressLine1: '', zip: '', city: '' });
            await fetchProperties();
        } catch (err: any) {
            alert(`Fehler beim Speichern: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredProperties = properties.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address_line1.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 bg-blue-600/10 backdrop-blur-md text-blue-600 px-5 py-2.5 rounded-2xl border border-blue-200/50">
                            <Building2 className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Portfolio Manager</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Ihre<br/><span className="text-blue-600">Objekte</span></h1>
                        <p className="text-slate-500 font-medium text-xl max-w-xl italic leading-relaxed">Strategische Übersicht und Verwaltung Ihrer Liegenschaften und Wohneinheiten.</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-white/70 backdrop-blur-xl text-slate-500 border border-slate-200/50 px-10 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Download className="w-6 h-6 mr-4 text-blue-600" />
                            CSV Import
                        </button>
                        <button
                            onClick={() => {
                                setEditingProperty(null);
                                setFormData({ name: '', addressLine1: '', zip: '', city: '' });
                                setShowModal(true);
                            }}
                            className="bg-slate-900 text-white px-12 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center shadow-3xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-6 h-6 mr-4" />
                            Objekt Hinzufügen
                        </button>
                    </div>
                </div>

                {/* Search & Stats Strip */}
                <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[3rem] shadow-3xl shadow-slate-200/40 border border-slate-100 mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full lg:w-[32rem]">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Suchen nach Name oder Adresse..."
                            className="w-full bg-slate-50/50 border border-slate-200/50 rounded-3xl pl-18 pr-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-10 px-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Portfolio</p>
                            <p className="text-2xl font-black text-slate-900">{properties.length}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Einheiten</p>
                            <p className="text-2xl font-black text-blue-600">{properties.reduce((acc, p) => acc + p._count.units, 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-48 text-center flex flex-col items-center">
                            <Loader2 className="animate-spin w-20 h-20 text-blue-600 mb-8" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[12px]">Portfolio wird katalogisiert...</p>
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-48 bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[4rem] shadow-3xl shadow-slate-200/20 text-slate-300 grayscale opacity-40">
                            <Building2 className="w-32 h-32 mb-10 stroke-[0.5]" />
                            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Keine Ergebnisse</h3>
                            <p className="font-medium italic">Erfassen Sie Ihr erstes Objekt oben rechts.</p>
                        </div>
                    ) : (
                        filteredProperties.map((p, index) => (
                            <div key={p.id} className="group bg-white rounded-[4rem] shadow-xl shadow-slate-200/30 border border-slate-50 p-12 hover:shadow-3xl hover:shadow-blue-600/10 transition-all duration-700 hover:-translate-y-3 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex justify-between items-start mb-12">
                                    <div className="w-18 h-18 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-700">
                                        <Building2 className="w-9 h-9" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleDelete(p.id, p.name)} 
                                            className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-500"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setEditingProperty(p);
                                                setFormData({ name: p.name || '', addressLine1: p.address_line1 || '', zip: p.zip || '', city: p.city || '' });
                                                setShowModal(true);
                                            }} 
                                            className="h-12 px-6 flex items-center justify-center bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white rounded-2xl transition-all duration-500"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tighter truncate leading-none group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                
                                <div className="space-y-3 mb-12">
                                    <div className="flex items-center text-slate-400 font-bold text-sm italic italic">
                                        <MapPin className="w-4 h-4 mr-3 text-blue-500" />
                                        {p.address_line1}
                                    </div>
                                    <div className="pl-7 text-slate-400 font-bold text-sm">
                                        {p.zip} {p.city}
                                    </div>
                                </div>
                                
                                <div className="pt-10 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex gap-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Einheiten</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{p._count?.units || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Offen</p>
                                            <p className="text-2xl font-black text-blue-600 tracking-tighter">{p._count?.tickets || 0}</p>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800 group-hover:shadow-3xl group-hover:translate-x-2 transition-all duration-500 shadow-sm">
                                        <ArrowRight className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Overhauled Compact Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-8 z-[100] animate-in fade-in duration-500">
                        <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] max-w-lg w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 relative">
                            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">System-Eintrag</p>
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editingProperty ? 'Objekt Editieren' : 'Neues Objekt'}</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-slate-50 border border-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 group">
                                    <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-12 space-y-8 bg-white">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 px-1">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objektbezeichnung</label>
                                    </div>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all uppercase placeholder:text-slate-200"
                                        placeholder="HAUS AM SEE"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 px-1">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strasse / Nr.</label>
                                    </div>
                                    <input
                                        type="text" required
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all uppercase placeholder:text-slate-200"
                                        placeholder="SCHULSTRASSE 5"
                                    />
                                </div>

                                <div className="grid grid-cols-5 gap-6">
                                    <div className="col-span-2 space-y-4">
                                        <div className="flex items-center space-x-3 px-1">
                                            <Map className="w-4 h-4 text-blue-600" />
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PLZ</label>
                                        </div>
                                        <input
                                            type="text" required
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all text-center"
                                            placeholder="8000"
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-4">
                                        <div className="flex items-center space-x-3 px-1">
                                            <div className="w-4" />
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ort</label>
                                        </div>
                                        <input
                                            type="text" required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all uppercase"
                                            placeholder="ZÜRICH"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full h-20 rounded-[2rem] font-black text-white bg-slate-900 hover:bg-blue-600 shadow-3xl shadow-slate-900/20 transition-all uppercase tracking-[0.3em] text-[11px] mt-6 flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Objekt Speichern</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
