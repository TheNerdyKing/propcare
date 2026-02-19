'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingContractor, setEditingContractor] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        tradeTypes: [] as string[],
        propertyIds: [] as string[],
    });

    useEffect(() => {
        fetchContractors();
        fetchProperties();
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

    const fetchProperties = async () => {
        try {
            const response = await api.get('/public/properties');
            setProperties(response.data);
        } catch (err) {
            console.error('Failed to fetch properties', err);
        }
    };

    const handleEdit = (contractor: any) => {
        setEditingContractor(contractor);
        setFormData({
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone || '',
            tradeTypes: contractor.tradeTypes || [],
            propertyIds: contractor.properties?.map((p: any) => p.propertyId) || [],
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contractor?')) return;
        try {
            await api.delete(`/contractors/${id}`);
            fetchContractors();
        } catch (err) {
            console.error('Failed to delete contractor', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContractor) {
                await api.patch(`/contractors/${editingContractor.id}`, formData);
            } else {
                await api.post('/contractors', formData);
            }
            setShowModal(false);
            setEditingContractor(null);
            setFormData({ name: '', email: '', phone: '', tradeTypes: [], propertyIds: [] });
            fetchContractors();
        } catch (err) {
            console.error('Failed to save contractor', err);
        }
    };

    const toggleProperty = (propertyId: string) => {
        setFormData((prev) => ({
            ...prev,
            propertyIds: prev.propertyIds.includes(propertyId)
                ? prev.propertyIds.filter((id) => id !== propertyId)
                : [...prev.propertyIds, propertyId],
        }));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Contractors</h1>
                <button
                    onClick={() => {
                        setEditingContractor(null);
                        setFormData({ name: '', email: '', phone: '', tradeTypes: [], propertyIds: [] });
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                    + Add Contractor
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Properties</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                        ) : contractors.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No contractors found.</td></tr>
                        ) : (
                            contractors.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {c.tradeTypes?.join(', ') || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {c.email}<br /><span className="text-xs">{c.phone}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {c.properties?.length || 0} assigned
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">{editingContractor ? 'Edit' : 'Add'} Contractor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Trades (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Plumbing, Electrical"
                                        value={formData.tradeTypes.join(', ')}
                                        onChange={(e) => setFormData({ ...formData, tradeTypes: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Properties</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                    {properties.map((p) => (
                                        <label key={p.id} className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.propertyIds.includes(p.id)}
                                                onChange={() => toggleProperty(p.id)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="truncate">{p.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Save Contractor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
