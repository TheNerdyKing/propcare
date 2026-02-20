'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Building2, Plus, Download } from 'lucide-react';

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
            setProperties(response.data);
        } catch (err) {
            console.error('Failed to fetch properties', err);
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

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Properties</h1>
                        <p className="text-slate-500 font-medium">Manage your real estate portfolio and unit assignments.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm flex items-center"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Bulk Import
                        </button>
                        <button
                            onClick={() => {
                                setEditingProperty(null);
                                setFormData({ name: '', addressLine1: '', zip: '', city: '' });
                                setShowModal(true);
                            }}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-[0_4px_12px_rgba(79,70,229,0.3)] flex items-center"
                        >
                            <Plus className="w-5 h-5 mr-1" />
                            Add Property
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-slate-400 font-medium tracking-tight">Loading properties...</p>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Building2 className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No properties yet</h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-xs text-center font-medium">
                                Start by adding your first property or importing many at once via CSV.
                            </p>
                        </div>
                    ) : (
                        properties.map((p) => (
                            <div key={p.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 p-7 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                                        <Building2 className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <button onClick={() => {
                                        setEditingProperty(p);
                                        setFormData({ name: p.name, addressLine1: p.addressLine1, zip: p.zip, city: p.city });
                                        setShowModal(true);
                                    }} className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors uppercase tracking-widest">
                                        Edit
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{p.name}</h3>
                                <div className="text-sm text-slate-500 font-medium space-y-1 mb-8">
                                    <p className="flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                                        {p.addressLine1}
                                    </p>
                                    <p className="flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                                        {p.zip} {p.city}
                                    </p>
                                </div>
                                <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex space-x-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Units</span>
                                            <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">{p._count?.units || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tickets</span>
                                            <span className="text-lg font-black text-indigo-600 font-mono tracking-tighter">{p._count?.tickets || 0}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-indigo-600">➔</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingProperty ? 'Edit' : 'Add'} Property</h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Property Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                        placeholder="e.g. Riverbank Apartments"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <div className="w-1/3">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ZIP</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner font-mono"
                                        />
                                    </div>
                                    <div className="w-2/3">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-50 mt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 tracking-tight transition">Save Property</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showImportModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-2 font-black">Bulk Import</h2>
                            <p className="text-slate-500 font-medium mb-6">Paste CSV content below. Headers required: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">name, address, zip, city</code></p>
                            <form onSubmit={handleImport} className="space-y-6">
                                <textarea
                                    rows={10}
                                    required
                                    className="w-full bg-slate-50 border-none rounded-2xl p-6 font-mono text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                    placeholder="name,address,zip,city&#10;Lakeview,Main St 1,8000,Zurich&#10;Oak Park,Second Ave 5,3000,Bern"
                                    value={csvText}
                                    onChange={(e) => setCsvText(e.target.value)}
                                />
                                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-50">
                                    <button type="button" onClick={() => setShowImportModal(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
                                    <button type="submit" className="px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition">Start Batch Import</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
