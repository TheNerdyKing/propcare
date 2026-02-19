'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                    >
                        Bulk Import (CSV)
                    </button>
                    <button
                        onClick={() => {
                            setEditingProperty(null);
                            setFormData({ name: '', addressLine1: '', zip: '', city: '' });
                            setShowModal(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        + Add Property
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading properties...</div>
                ) : properties.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                        No properties found. Start by adding one or importing via CSV.
                    </div>
                ) : (
                    properties.map((p) => (
                        <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 truncate">{p.name}</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => {
                                        setEditingProperty(p);
                                        setFormData({ name: p.name, addressLine1: p.addressLine1, zip: p.zip, city: p.city });
                                        setShowModal(true);
                                    }} className="text-gray-400 hover:text-indigo-600">Edit</button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{p.addressLine1}</p>
                                <p>{p.zip} {p.city}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-500 font-medium font-mono">
                                <span>{p._count?.units || 0} Units</span>
                                <span>{p._count?.tickets || 0} Tickets</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">{editingProperty ? 'Edit' : 'Add'} Property</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Property Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="e.g. Riverbank Apartments"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.addressLine1}
                                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700">ZIP</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.zip}
                                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm text-gray-700 bg-white">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-md text-sm text-white bg-indigo-600">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Bulk Import Properties</h2>
                        <p className="text-sm text-gray-500 mb-4">Paste CSV content below. Headers required: name, address, zip, city</p>
                        <form onSubmit={handleImport} className="space-y-4">
                            <textarea
                                rows={10}
                                required
                                className="w-full border-gray-300 rounded-md shadow-sm font-mono text-xs p-4"
                                placeholder="name,address,zip,city&#10;Lakeview,Main St 1,8000,Zurich&#10;Oak Park,Second Ave 5,3000,Bern"
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                            />
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-md text-sm text-gray-700 bg-white">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-md text-sm text-white bg-indigo-600">Start Import</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
