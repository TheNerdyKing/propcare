'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, HelpCircle } from 'lucide-react';

const inquirySchema = z.object({
    propertyId: z.string().uuid('Bitte wählen Sie ein Gebäude aus'),
    unitLabel: z.string().optional(),
    description: z.string().min(10, 'Bitte beschreiben Sie Ihr Anliegen (mind. 10 Zeichen)'),
    tenantName: z.string().min(2, 'Name ist erforderlich'),
    tenantEmail: z.string().email('Ungültige E-Mail-Adresse'),
    tenantPhone: z.string().optional(),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export default function AllgemeinPage() {
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingProps, setFetchingProps] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<InquiryFormValues>({
        resolver: zodResolver(inquirySchema),
    });

    useEffect(() => {
        async function fetchProperties() {
            try {
                setFetchingProps(true);
                const response = await api.get('public/properties');
                setProperties(response.data || []);
            } catch (err: any) {
                console.error('Failed to fetch properties', err);
                setError('Laden der Gebäudeliste fehlgeschlagen.');
            } finally {
                setFetchingProps(false);
            }
        }
        fetchProperties();
    }, []);

    const onSubmit = async (data: InquiryFormValues) => {
        setLoading(true);
        setError(null);
        try {
            // We use the same endpoint but treat it as a general inquiry
            await api.post('public/tickets', {
                ...data,
                type: 'GENERAL_INQUIRY',
                urgency: 'NORMAL'
            });
            setSubmitted(true);
        } catch (err: any) {
            console.error('Submission error:', err);
            setError('Übermittlung fehlgeschlagen.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
                <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-blue-100/50 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Anfrage gesendet</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                        Vielen Dank für Ihre Nachricht. Wir werden uns so schnell wie möglich bei Ihnen melden.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full px-8 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform"
                    >
                        Zurück zum Mieterportal ➔
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Allgemeine Anfrage</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
                        Vermieter <span className="text-blue-600">Kontaktieren</span>
                    </h1>
                    <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto italic">
                        Haben Sie eine Frage oder ein administratives Anliegen? Wir helfen Ihnen gerne weiter.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-12">
                    {error && (
                        <div className="flex items-center space-x-3 p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-bold text-sm tracking-tight">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Liegenschaft</label>
                            <div className="relative">
                                <select
                                    {...register('propertyId')}
                                    disabled={fetchingProps}
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                >
                                    <option value="">Objekt auswählen...</option>
                                    {properties.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    {fetchingProps ? <Loader2 className="w-4 h-4 animate-spin" /> : '▼'}
                                </div>
                            </div>
                            {errors.propertyId && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.propertyId.message}</p>}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Wohnung (Optional)</label>
                            <input
                                {...register('unitLabel')}
                                placeholder="z.B. A-102"
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ihr Name</label>
                            <input
                                {...register('tenantName')}
                                placeholder="Vollständiger Name"
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            {errors.tenantName && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.tenantName.message}</p>}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">E-Mail Adresse</label>
                            <input
                                {...register('tenantEmail')}
                                placeholder="beispiel@email.ch"
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            {errors.tenantEmail && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.tenantEmail.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ihre Nachricht</label>
                        <textarea
                            {...register('description')}
                            rows={5}
                            placeholder="Beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-8 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-lg leading-relaxed"
                        />
                        {errors.description && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.description.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || fetchingProps}
                        className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-[1.01] active:translate-y-0.5 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            'Nachricht absenden'
                        )}
                    </button>

                    <div className="flex flex-col items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-slate-200" />
                            <span>Sicher übermittelt via PropCare SSL</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
