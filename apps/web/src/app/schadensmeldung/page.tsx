'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck, Upload, HelpCircle } from 'lucide-react';

const ticketSchema = z.object({
    type: z.enum(['DAMAGE_REPORT', 'GENERAL_INQUIRY']).default('DAMAGE_REPORT'),
    propertyId: z.string().uuid('Bitte wählen Sie ein Gebäude aus'),
    unitLabel: z.string().min(1, 'Wohnungs- oder Zimmernummer ist erforderlich'),
    urgency: z.enum(['EMERGENCY', 'URGENT', 'NORMAL', 'UNKNOWN']).default('NORMAL'),
    description: z.string().min(10, 'Bitte beschreiben Sie das Problem ausführlicher (mind. 10 Zeichen)'),
    tenantName: z.string().min(2, 'Name ist erforderlich'),
    tenantEmail: z.string().email('Ungültige E-Mail-Adresse'),
    tenantPhone: z.string().optional(),
    permissionToEnter: z.boolean().default(false),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function SchadensmeldungPage() {
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [referenceCode, setReferenceCode] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingProps, setFetchingProps] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);

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
                setFetchingProps(true);
                const response = await api.get('public/properties');
                setProperties(response.data || []);
            } catch (err: any) {
                console.error('Failed to fetch properties', err);
                setError('Laden der Gebäudeliste fehlgeschlagen. Bitte laden Sie die Seite neu.');
            } finally {
                setFetchingProps(false);
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

    const onSubmit = async (data: TicketFormValues) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('public/tickets', data);
            const ticketData = response.data;
            
            // Handle image uploads if any
            if (files.length > 0) {
                const tId = ticketData.id;
                const tenantId = ticketData.tenant_id || ticketData.tenantId;

                for (const file of files) {
                    const filePath = `${tenantId}/${tId}/${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('damage-reports')
                        .upload(filePath, file);

                    if (!uploadError) {
                        await supabase.from('attachments').insert({
                            tenant_id: tenantId,
                            ticket_id: tId,
                            file_key: filePath,
                            file_name: file.name,
                            content_type: file.type,
                            size_bytes: file.size,
                        });
                    } else {
                        console.error('File upload failed:', uploadError);
                    }
                }
            }

            setReferenceCode(ticketData.reference_code || ticketData.referenceCode);
            setTicketId(ticketData.id);
            setSubmitted(true);
        } catch (err: any) {
            console.error('Submission error:', err);
            setError('Übermittlung fehlgeschlagen. Bitte überprüfen Sie Ihre Verbindung.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
                <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-blue-100/50 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Erfolgreich gesendet</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                        Vielen Dank. Ihre Meldung wurde erfolgreich übermittelt. Sie können den Status jederzeit online verfolgen.
                    </p>

                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Ihre Referenznummer</p>
                        <p className="text-4xl font-mono font-black text-blue-600 tracking-widest">{referenceCode}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <a
                            href={`/status/${ticketId}`}
                            className="w-full sm:w-auto px-8 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform"
                        >
                            Status verfolgen ➔
                        </a>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                        >
                            Neue Meldung
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Sicheres Service-Portal</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
                        Service <span className="text-blue-600">Meldung</span>
                    </h1>
                    <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto italic">
                        Senden Sie Ihre Anfrage oder Schadensmeldung direkt an die zuständige Hausverwaltung.
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
                        {/* Type selection */}
                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Anliegen-Typ</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center justify-center h-16 rounded-2xl border-2 transition-all cursor-pointer font-bold text-sm ${selectedType === 'DAMAGE_REPORT' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-600/5' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-blue-100 hover:text-blue-400'}`}>
                                    <input {...register('type')} type="radio" value="DAMAGE_REPORT" className="sr-only" />
                                    Schadensmeldung
                                </label>
                                <label className={`flex items-center justify-center h-16 rounded-2xl border-2 transition-all cursor-pointer font-bold text-sm ${selectedType === 'GENERAL_INQUIRY' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-600/5' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-blue-100 hover:text-blue-400'}`}>
                                    <input {...register('type')} type="radio" value="GENERAL_INQUIRY" className="sr-only" />
                                    Vermieter kontaktieren
                                </label>
                            </div>
                        </div>

                        {/* Building */}
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

                        {/* Unit */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Wohnung / Einheit</label>
                            <input
                                {...register('unitLabel')}
                                placeholder="z.B. 1. Stock Links"
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            {errors.unitLabel && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.unitLabel.message}</p>}
                        </div>

                        {/* Name */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ihr Name</label>
                            <input
                                {...register('tenantName')}
                                placeholder="Max Mustermann"
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            {errors.tenantName && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.tenantName.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">E-Mail Adresse</label>
                            <input
                                {...register('tenantEmail')}
                                placeholder="beispiel@email.ch"
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            {errors.tenantEmail && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.tenantEmail.message}</p>}
                        </div>

                        {/* Urgency */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dringlichkeit</label>
                            <div className="relative">
                                <select
                                    {...register('urgency')}
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="NORMAL">Standard</option>
                                    <option value="URGENT">Eilt</option>
                                    <option value="EMERGENCY">DRINGEND (Soforthilfe nötig)</option>
                                    <option value="UNKNOWN">Unklar</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>

                        {/* Photos */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Anhänge (Optional)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full h-14 bg-slate-50 border border-slate-100 border-dashed rounded-2xl px-6 flex items-center justify-between group-hover:bg-slate-100 transition-colors">
                                    <span className="text-slate-400 font-bold text-sm">
                                        {files.length > 0 ? `${files.length} Bilder ausgewählt` : 'Bilder hinzufügen...'}
                                    </span>
                                    <Upload className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ihr Anliegen</label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            placeholder="Beschreiben Sie den Sachverhalt möglichst präzise..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-8 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-lg leading-relaxed"
                        />
                        {errors.description && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.description.message}</p>}
                    </div>

                    {selectedType === 'DAMAGE_REPORT' && (
                        <div className="bg-blue-50/50 rounded-[2rem] p-8 border border-blue-100 flex items-start space-x-6 hover:bg-blue-50 transition-colors duration-500">
                            <div className="flex items-center h-6">
                                <input
                                    {...register('permissionToEnter')}
                                    type="checkbox"
                                    className="w-6 h-6 rounded-lg text-blue-600 border-slate-200 focus:ring-blue-500 transition-all cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-black text-blue-900 tracking-tight cursor-pointer">Zutrittserlaubnis</label>
                                <p className="text-blue-700/60 text-sm font-medium leading-relaxed">
                                    Ich erlaube beauftragten Handwerkern den Zutritt zur Wohnung, auch wenn ich nicht anwesend bin. Dies beschleunigt die Behebung des Schadens erheblich.
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || fetchingProps}
                        className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-[1.01] active:translate-y-0.5 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            'Übermittlung starten'
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
