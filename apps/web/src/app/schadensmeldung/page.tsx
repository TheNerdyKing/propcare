'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';

const ticketSchema = z.object({
    type: z.enum(['DAMAGE_REPORT', 'GENERAL_INQUIRY']).default('DAMAGE_REPORT'),
    propertyId: z.string().uuid('Please select a property'),
    unitLabel: z.string().min(1, 'Unit number is required'),
    urgency: z.enum(['EMERGENCY', 'URGENT', 'NORMAL', 'UNKNOWN']).default('NORMAL'),
    description: z.string().min(10, 'Please provide a more detailed description'),
    tenantName: z.string().min(2, 'Name is required'),
    tenantEmail: z.string().email('Invalid email address'),
    tenantPhone: z.string().optional(),
    permissionToEnter: z.boolean().default(false),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function TenantReportingPage() {
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [referenceCode, setReferenceCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            type: 'DAMAGE_REPORT',
            urgency: 'NORMAL',
            permissionToEnter: false,
        },
    });

    const selectedType = watch('type');

    useEffect(() => {
        async function fetchProperties() {
            try {
                const response = await api.get('/public/properties');
                setProperties(response.data);
            } catch (err) {
                console.error('Failed to fetch properties', err);
            }
        }
        fetchProperties();
    }, []);

    const onSubmit = async (data: TicketFormValues) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/public/tickets', data);
            setReferenceCode(response.data.referenceCode);
            setSubmitted(true);
        } catch (err: any) {
            setError('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="text-5xl text-green-500 mb-4">✓</div>
                    <h2 className="text-3xl font-bold text-gray-900">Report Submitted!</h2>
                    <p className="text-gray-600">
                        Thank you for your report. We have received it and will process it shortly.
                    </p>
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-green-200">
                        <p className="text-sm text-gray-500 uppercase font-semibold">Reference ID</p>
                        <p className="text-2xl font-mono text-green-700">{referenceCode}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Submit another report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        PropCare <span className="text-indigo-600">Reporting</span>
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Easily report damage or send general inquiries to your property management.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Request Type</label>
                            <div className="mt-2 flex space-x-4">
                                <label className={`flex-1 flex items-center justify-center py-3 px-4 border rounded-md cursor-pointer transition-all ${selectedType === 'DAMAGE_REPORT' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                    <input {...register('type')} type="radio" value="DAMAGE_REPORT" className="sr-only" />
                                    Damage Report
                                </label>
                                <label className={`flex-1 flex items-center justify-center py-3 px-4 border rounded-md cursor-pointer transition-all ${selectedType === 'GENERAL_INQUIRY' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                    <input {...register('type')} type="radio" value="GENERAL_INQUIRY" className="sr-only" />
                                    General Inquiry
                                </label>
                            </div>
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Property</label>
                            <select
                                {...register('propertyId')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Select a property...</option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Unit / Apartment No.</label>
                            <input
                                {...register('unitLabel')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g. A-102"
                            />
                            {errors.unitLabel && <p className="mt-1 text-xs text-red-500">{errors.unitLabel.message}</p>}
                        </div>

                        {selectedType === 'DAMAGE_REPORT' && (
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Urgency</label>
                                <select
                                    {...register('urgency')}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="EMERGENCY">Emergency (Requires immediate attention)</option>
                                    <option value="UNKNOWN">Not sure</option>
                                </select>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Please describe the issue in detail..."
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Your Name</label>
                            <input
                                {...register('tenantName')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {errors.tenantName && <p className="mt-1 text-xs text-red-500">{errors.tenantName.message}</p>}
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                {...register('tenantEmail')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {errors.tenantEmail && <p className="mt-1 text-xs text-red-500">{errors.tenantEmail.message}</p>}
                        </div>

                        {selectedType === 'DAMAGE_REPORT' && (
                            <div className="sm:col-span-2">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            {...register('permissionToEnter')}
                                            type="checkbox"
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-gray-700">Permission to Enter</label>
                                        <p className="text-gray-500">I allow PropCare partner contractors to enter the unit if I am not present.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-5 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center py-4 px-6 border border-transparent shadow-lg text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                        >
                            {loading ? 'Submitting...' : 'Send Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
