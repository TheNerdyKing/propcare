'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { History, User } from 'lucide-react';

export default function PublicStatusPage() {
    const { referenceCode } = useParams();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messageContent, setMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [referenceCode]);

    const fetchTicket = async () => {
        try {
            const response = await api.get(`public/tickets/${referenceCode}`);
            setTicket(response.data);
        } catch (err) {
            console.error('Failed to fetch ticket status', err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!messageContent.trim() || isSending) return;
        setIsSending(true);
        try {
            await api.post(`public/tickets/${referenceCode}/messages`, { content: messageContent });
            setMessageContent('');
            fetchTicket();
        } catch (err) {
            console.error('Failed to send message', err);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Status...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Ticket Not Found</h1>
                    <p className="text-gray-500 mb-6 font-medium">We couldn't find a maintenance report with that reference code. Please check the code and try again.</p>
                    <a href="/" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
                        Back to Home
                    </a>
                </div>
            </div>
        );
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'NEW': return 'Neu erfasst';
            case 'IN_PROGRESS': return 'In Bearbeitung';
            case 'COMPLETED': return 'Abgeschlossen';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto space-y-10">
                {/* Header */}
                <div className="bg-white shadow-2xl shadow-slate-200/50 rounded-[3rem] p-10 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20 transform -rotate-6">
                                PC
                            </div>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Status <span className="text-blue-600">Portal</span></span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tighter uppercase mb-2">Service-Meldung</h1>
                        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Referenz: <span className="text-blue-600 font-black">{referenceCode}</span></p>
                    </div>
                    <div className={`px-8 py-4 rounded-2xl border font-black uppercase tracking-[0.2em] text-[10px] shadow-sm ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Summary */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white shadow-xl shadow-slate-200/30 rounded-[2.5rem] p-8 border border-slate-100">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Zusammenfassung</h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Eingereicht am</p>
                                    <p className="text-slate-900 font-bold text-sm">{new Date((ticket as any).createdAt || (ticket as any).created_at || new Date()).toLocaleDateString('de-CH', { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Liegenschaft</p>
                                    <p className="text-slate-900 font-bold text-sm uppercase tracking-tight">{ticket.property?.name || '---'}</p>
                                    {(ticket.unitLabel || ticket.unit_label) && <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Einheit: {ticket.unitLabel || ticket.unit_label}</p>}
                                </div>
                                <div className="pt-6 border-t border-slate-50">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 text-blue-600">Beschreibung</p>
                                    <p className="text-slate-600 text-sm leading-relaxed font-medium italic">"{ticket.description}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-600/20">
                            <h3 className="font-black mb-3 text-lg uppercase tracking-tight">Unterstützung</h3>
                            <p className="text-blue-100 text-xs mb-6 font-medium leading-relaxed">Unser Team bearbeitet Ihr Anliegen schnellstmöglich. Bei dringenden Rückfragen wenden Sie sich bitte an die Notfall-Nummer.</p>
                            <div className="bg-blue-500/50 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 backdrop-blur-sm">
                                📞 Notfall: +41 00 000 00 00
                            </div>
                        </div>
                    </div>

                    {/* Right: Activity Log */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-2xl shadow-slate-200/30 rounded-[2.5rem] border border-slate-100 flex flex-col min-h-[500px]">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30 rounded-t-[2.5rem] flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Verlauf & Kommunikation</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Status-Updates und Rückmeldungen</p>
                                </div>
                                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                            </div>

                            <div className="flex-1 p-8 space-y-10">
                                {(!ticket.messages || ticket.messages.length === 0) ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                            <History className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="font-black text-slate-900 text-sm uppercase tracking-widest">Warten auf Bearbeitung</p>
                                        <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mt-2 uppercase tracking-tight">Sobald unser Team mit der Bearbeitung beginnt, finden Sie hier Updates.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {ticket.messages.map((msg: any) => (
                                            <div key={msg.id} className="flex gap-6 items-start">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.senderType === 'TENANT' ? 'bg-blue-50 text-blue-600' : 'bg-slate-900 text-white'}`}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            {msg.senderType === 'TENANT' ? 'Ihre Nachricht' : 'Hausverwaltung'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-300">
                                                            {new Date((msg as any).createdAt || (msg as any).created_at || new Date()).toLocaleString('de-CH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl rounded-tl-none border border-slate-100">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center italic">
                                    Dies ist ein automatisches Status-Portal. Alle Änderungen werden in Echtzeit synchronisiert.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
