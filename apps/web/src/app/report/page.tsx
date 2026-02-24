'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle2, AlertCircle, Upload, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const reportSchema = z.object({
    propertyId: z.string().uuid('Please select a property'),
    unitLabel: z.string().min(1, 'Unit or Apartment number is required'),
    urgency: z.enum(['EMERGENCY', 'URGENT', 'NORMAL', 'UNKNOWN']).default('NORMAL'),
    description: z.string().min(10, 'Please provide more details (min 10 characters)'),
    tenantName: z.string().min(2, 'Contact name is required'),
    tenantEmail: z.string().email('Valid email address is required'),
    tenantPhone: z.string().optional(),
    permissionToEnter: z.boolean().default(false),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function PublicReportPage() {
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [ticket, setTicket] = useState<any>(null);
    const [referenceCode, setReferenceCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            urgency: 'NORMAL',
            permissionToEnter: false,
        },
    });

    useEffect(() => {
        async function fetchProperties() {
            try {
                const response = await api.get('public/properties');
                setProperties(response.data || []);
            } catch (err) {
                console.error('Failed to fetch properties', err);
            }
        }
        fetchProperties();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).slice(0, 5);
            setFiles(newFiles);
        }
    };

    const onSubmit = async (values: ReportFormValues) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('public/tickets', values);
            const ticketData = response.data;

            // 3. Upload Attachments if any
            if (files.length > 0) {
                const tenantId = ticketData.tenantId || ticketData.tenant_id;
                for (const file of files) {
                    const filePath = `${tenantId}/${ticketData.id}/${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('damage-reports')
                        .upload(filePath, file);

                    if (!uploadError) {
                        await supabase.from('attachments').insert({
                            tenant_id: tenantId,
                            ticket_id: ticketData.id,
                            file_key: filePath,
                            file_name: file.name,
                            content_type: file.type,
                            size_bytes: file.size,
                        });
                    }
                }
            }

            setTicket(ticketData);
            setReferenceCode(ticketData.referenceCode || ticketData.reference_code);
            setSubmitted(true);
        } catch (err: any) {
            console.error('Submission failed:', err);
            setError(err.message || 'Failed to submit report. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
                <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-12 shadow-2xl shadow-indigo-100/50 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">REPORT SUBMITTED</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                        Thank you for your report. Your request has been received and assigned to building management for review.
                    </p>

                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Reference Identifier</p>
                        <p className="text-4xl font-mono font-black text-indigo-600 tracking-widest">{referenceCode}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href={`/status/${ticket?.id || ''}`}
                            className="w-full sm:w-auto px-8 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:scale-105 transition-transform"
                        >
                            Track Status & Chat ➔
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                        >
                            Submit another report
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full mb-6">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Secure Reporting Portal</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
                        PropCare <span className="text-indigo-600">Assistance</span>
                    </h1>
                    <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto">
                        Submit your maintenance request directly to your building management team.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-12">
                    {error && (
                        <div className="flex items-center space-x-3 p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-bold text-sm tracking-tight">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Property Selection */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Facility / Building</label>
                            <select
                                {...register('propertyId')}
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select building...</option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.propertyId && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.propertyId.message}</p>}
                        </div>

                        {/* Unit Label */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Unit / Room No.</label>
                            <input
                                {...register('unitLabel')}
                                placeholder="e.g. 104 / Suite B"
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                            {errors.unitLabel && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.unitLabel.message}</p>}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input
                                {...register('tenantName')}
                                placeholder="Your name"
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                            {errors.tenantName && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.tenantName.message}</p>}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                            <input
                                {...register('tenantEmail')}
                                type="email"
                                placeholder="your@email.com"
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                            {errors.tenantEmail && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.tenantEmail.message}</p>}
                        </div>

                        {/* Urgency */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Urgency Level</label>
                            <select
                                {...register('urgency')}
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="NORMAL">Normal</option>
                                <option value="URGENT">Urgent</option>
                                <option value="EMERGENCY">Emergency (Requires immediate attention)</option>
                                <option value="UNKNOWN">Not sure</option>
                            </select>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Photos (Optional)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full h-16 bg-slate-50 border border-slate-100 border-dashed rounded-2xl px-6 flex items-center justify-between group-hover:bg-slate-100 transition-colors">
                                    <span className="text-slate-400 font-bold text-sm">
                                        {files.length > 0 ? `${files.length} files selected` : 'Click to select images...'}
                                    </span>
                                    <Upload className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Issue Description</label>
                        <textarea
                            {...register('description')}
                            rows={5}
                            placeholder="Please explain the problem clearly. For example: 'The kitchen faucet is leaking heavily from the handle.'"
                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-8 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed"
                        />
                        {errors.description && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.description.message}</p>}
                    </div>

                    {/* Permission to Enter */}
                    <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/50 flex items-start space-x-6">
                        <div className="flex items-center h-6">
                            <input
                                {...register('permissionToEnter')}
                                type="checkbox"
                                className="w-6 h-6 rounded-lg text-indigo-600 border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-black text-indigo-900 tracking-tight cursor-pointer">Permission to Enter</label>
                            <p className="text-indigo-600/60 text-sm font-medium">I allow certified PropCare contractors to enter the apartment/unit if I am not present to resolve the issue promptly.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-20 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-indigo-600/30 flex items-center justify-center transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            'Submit Maintenance Request'
                        )}
                    </button>

                    <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <HelpCircle className="w-3 h-3" />
                        <span>Instant Support Channel</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
