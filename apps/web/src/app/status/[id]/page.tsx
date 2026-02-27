'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowLeft,
    Building2,
    Loader2,
    ClipboardList,
    MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function TenantStatusPage() {
    const { id } = useParams();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchTicketData();
    }, [id]);

    useEffect(() => {
        if (!ticket?.id) return;

        // Subscribe to ticket changes
        const ticketSubscription = supabase
            .channel(`public-ticket-${ticket.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tickets',
                filter: `id=eq.${ticket.id}`
            }, (payload) => {
                setTicket((prev: any) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ticketSubscription);
        };
    }, [ticket?.id]);

    const fetchTicketData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`public/tickets/${id}`);
            setTicket(response.data);
        } catch (err: any) {
            console.error('Error fetching status:', err);
            setError(err.response?.status === 404 
                ? 'Meldung nicht gefunden. Bitte prüfen Sie den Link oder die Referenznummer.' 
                : 'Fehler beim Laden der Daten.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
    );

    if (error || !ticket) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
            <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Nicht gefunden</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
                <Link href="/schadensmeldung" className="text-indigo-600 font-black text-xs uppercase tracking-widest border-b-2 border-indigo-100 pb-1">
                    Neue Meldung erfassen ➔
                </Link>
            </div>
        </div>
    );

    const getStatusText = (status: string) => {
        switch (status) {
            case 'NEW': return 'Eingegangen';
            case 'IN_PROGRESS': return 'In Bearbeitung';
            case 'COMPLETED': return 'Abgeschlossen';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-700';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                Ticket #{ticket.reference_code}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                {getStatusText(ticket.status)}
                            </span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                            Status-<span className="text-indigo-600">Tracking</span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Ticket Details */}
                    <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-10">
                        <div className="flex items-start space-x-5">
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Meldung</h3>
                                <p className="font-bold text-slate-700 leading-relaxed text-sm">
                                    {ticket.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-5">
                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Objekt</h3>
                                <p className="font-bold text-slate-800">{ticket.property?.name}</p>
                                <p className="text-xs font-medium text-slate-500">{ticket.property?.address_line1}, {ticket.property?.zip} {ticket.property?.city}</p>
                                <p className="text-xs font-black text-indigo-600 mt-2 uppercase tracking-widest">Einheit: {ticket.unit_label || '---'}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-5">
                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Erfasst am</h3>
                                <p className="font-bold text-slate-800">{new Date((ticket as any).createdAt || (ticket as any).created_at || new Date()).toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative flex flex-col justify-between overflow-hidden shadow-2xl shadow-indigo-900/20">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 flex items-center">
                                <Clock className="w-6 h-6 mr-3 text-indigo-400" />
                                Fortschritt
                            </h2>
                            
                            <div className="space-y-12">
                                <div className="flex gap-6 relative">
                                    <div className="absolute left-3 top-8 bottom-[-48px] w-0.5 bg-slate-800" />
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${ticket.status === 'NEW' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Eingegangen</p>
                                        <p className="text-sm font-medium text-slate-300">Ihre Meldung wurde erfolgreich im System erfasst.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 relative">
                                    <div className="absolute left-3 top-8 bottom-[-48px] w-0.5 bg-slate-800" />
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ticket.status === 'COMPLETED' ? 'bg-slate-700' : 'bg-slate-800'}`}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${ticket.status === 'IN_PROGRESS' ? 'text-amber-400' : 'text-slate-500'}`}>In Bearbeitung</p>
                                        <p className="text-sm font-medium text-slate-300">Ein Mitarbeiter oder Handwerker wurde mit der Prüfung beauftragt.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 relative">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${ticket.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${ticket.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`}>Abgeschlossen</p>
                                        <p className="text-sm font-medium text-slate-300">Das Anliegen wurde erfolgreich behoben.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 relative z-10">
                            <Link href="/schadensmeldung" className="inline-flex items-center text-indigo-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                                Zurück zur Startseite
                            </Link>
                        </div>

                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full translate-x-32 translate-y-32 blur-3xl pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
