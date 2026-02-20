'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Building2, Plus, Download, ChevronRight, MapPin } from 'lucide-react';

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<any>(null);
    const [csvText, setCsvText] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        addressLine1: '',
        zip: '',
        city: '',
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await api.get('/properties');
            // Defensive: Ensure properties is always an array
            setProperties(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch properties', err);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProperty) {
                await api.patch(`/properties/${editingProperty.id}`, formData);
            } else {
                await api.post('/properties', formData);
            }
            setShowModal(false);
            setEditingProperty(null);
            setFormData({ name: '', addressLine1: '', zip: '', city: '' });
            fetchProperties();
        } catch (err) {
            console.error('Failed to save property', err);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/properties/import', { csv: csvText });
            setShowImportModal(false);
            setCsvText('');
            fetchProperties();
            alert('Import successful!');
        } catch (err) {
            console.error('Import failed', err);
            alert('Import failed. Please check CSV format.');
        }
    };

    const safeProperties = Array.isArray(properties) ? properties : [];

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Real Estate Assets</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Inventory and status oversight across your entire managed portfolio.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition shadow-sm flex items-center"
                        >
                            <Download className="w-4 h-4 mr-3" />
                            Batch Input
                        </button>
                        <button
                            onClick={() => {
                                setEditingProperty(null);
                                setFormData({ name: '', addressLine1: '', zip: '', city: '' });
                                setShowModal(true);
                            }}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-600/30 flex items-center"
                        >
                            <Plus className="w-5 h-5 mr-3" />
                            New Asset
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-32 text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-8" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Vault Records...</p>
                        </div>
                    ) : safeProperties.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] shadow-sm">
                            <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-slate-100 shadow-inner">
                                <Building2 className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Zero assets listed</h3>
                            <p className="mt-2 text-slate-500 max-w-sm text-center font-medium text-lg leading-relaxed">
                                Initialize your command center by adding your first property or processing a batch import.
                            </p>
                        </div>
                    ) : (
                        safeProperties.map((p) => (
                            <div key={p.id} className="group bg-white rounded-[3rem] shadow-sm border border-slate-200/60 p-10 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 hover:-translate-y-2">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 shadow-sm border border-indigo-100/50">
                                        <Building2 className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-500" />
                                    </div>
                                    <button onClick={() => {
                                        setEditingProperty(p);
                                        setFormData({ name: p.name || '', addressLine1: p.addressLine1 || '', zip: p.zip || '', city: p.city || '' });
                                        setShowModal(true);
                                    }} className="text-slate-400 hover:text-indigo-600 font-black text-[10px] transition-all uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 opacity-60 hover:opacity-100">
                                        Modify
                                    </button>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 mb-4 truncate leading-tight group-hover:text-indigo-700 transition-colors uppercase tracking-tighter">{p.name || 'Undefined'}</h3>
                                <div className="text-sm text-slate-500 font-black space-y-2 mb-12 uppercase tracking-tight">
                                    <p className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-indigo-50 transition-colors">
                                            <MapPin className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                                        </div>
                                        {p.addressLine1 || '---'}
                                    </p>
                                    <p className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity pl-12 font-mono text-xs">
                                        {p.zip || '---'} {p.city || '---'}
                                    </p>
                                </div>
                                <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex space-x-8">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Capacity</span>
                                            <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{p._count?.units || 0} U</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Activity</span>
                                            <span className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">{p._count?.tickets || 0} T</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-indigo-600 transition-all duration-500 shadow-xl shadow-indigo-600/20 -translate-x-4 group-hover:translate-x-0">
                                        <ChevronRight className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-6 z-50 overflow-y-auto">
                        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] max-w-md w-full p-12 border border-slate-200/50 animate-in zoom-in-95 duration-300 my-8">
                            <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter uppercase">{editingProperty ? 'Edit' : 'Add'} Asset</h2>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Registry Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all"
                                        placeholder="e.g. LUXURY PLAZA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Street Identifier</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all"
                                    />
                                </div>
                                <div className="flex gap-6">
                                    <div className="w-1/3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Post-Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner font-mono text-center transition-all"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Regional Center</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 pt-10 border-t border-slate-100 mt-6">
                                    <button type="submit" className="w-full py-5 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/40 transition-all uppercase tracking-[0.2em] text-[10px]">Record Property</button>
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
