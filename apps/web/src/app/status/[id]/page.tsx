'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Clock,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Send,
    ShieldCheck,
    Calendar,
    MapPin,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function TenantStatusPage() {
    const { id } = useParams();
    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
                setTicket(prev => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        // Subscribe to messages
        const messageSubscription = supabase
            .channel(`public-messages-${ticket.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ticket_messages',
                filter: `ticket_id=eq.${ticket.id}`
            }, (payload) => {
                const newMsg = payload.new;
                setMessages(prev => [...prev || [], newMsg].sort(
                    (a: any, b: any) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime()
                ));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ticketSubscription);
            supabase.removeChannel(messageSubscription);
        };
    }, [ticket?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchTicketData = async () => {
        try {
            // Fetch Ticket - Try by exact ID (UUID) first
            let { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select('*, property:properties(name)')
                .eq('id', id)
                .single();

            // Fallback: Try by reference_code if ID fails (e.g. if link used reference code)
            if (ticketError || !ticketData) {
                console.log(`Ticket not found by ID [${id}], trying by reference_code...`);
                const { data: refData, error: refError } = await supabase
                    .from('tickets')
                    .select('*, property:properties(name)')
                    .eq('reference_code', id)
                    .single();

                if (refError) {
                    console.error('Ticket not found by reference_code either:', refError);
                    throw new Error('Maintenance request not found. Please check your reference code.');
                }
                ticketData = refData;
            }

            setTicket(ticketData);

            // Fetch Messages - Use snake_case for DB query ordering
            const { data: messageData, error: messageError } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketData.id)
                .order('createdAt', { ascending: true }); // Supabase query needs snake_case

            if (messageError) throw messageError;
            setMessages(messageData || []);

        } catch (err: any) {
            console.error('Error fetching status:', err);
            setError('Could not find this maintenance request. Please verify your link.');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !ticket) return;
        setSending(true);
        try {
            const { error } = await supabase
                .from('ticket_messages')
                .insert({
                    tenant_id: ticket.tenant_id || ticket.tenantId,
                    ticket_id: ticket.id,
                    sender_type: 'TENANT',
                    content: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Could not send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );

    if (error || !ticket) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Not Found</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
                <Link href="/report" className="text-indigo-600 font-black text-xs uppercase tracking-widest border-b-2 border-indigo-100 pb-1">
                    Submit New Report ➔
                </Link>
            </div>
        </div>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-700';
            case 'AI_READY': return 'bg-indigo-100 text-indigo-700';
            case 'SENT': return 'bg-amber-100 text-amber-700';
            case 'CLOSED': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest mt-0.5">
                                Ticket #{ticket.reference_code}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                            Maintenance <span className="text-indigo-600">Status</span>
                        </h1>
                    </div>
                    <Link href="/report" className="flex items-center text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                        Report Another Issue
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Request Summary</h3>

                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 mt-1">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Location</p>
                                        <p className="font-bold text-slate-700 mt-1">{ticket.property?.name || 'Main Office'}</p>
                                        <p className="text-xs font-medium text-slate-400">Unit: {ticket.unit_label}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 mt-1">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reported</p>
                                        <p className="font-bold text-slate-700 mt-1">{new Date(ticket.createdAt || ticket.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 mt-1">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Description</p>
                                        <p className="font-medium text-slate-600 mt-2 text-sm leading-relaxed italic">
                                            "{ticket.description}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <ShieldCheck className="absolute top-4 right-4 text-indigo-400/10 w-16 h-16 pointer-events-none" />
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">PropCare Safety</h3>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed mb-4">
                                This is a secure channel. Only you and authorized management staff can access this conversation.
                            </p>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 italic">Automation Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Chat */}
                    <div className="lg:col-span-2 flex flex-col h-[600px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50/20">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                                    <MessageSquare className="w-10 h-10 mb-4 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                        Management is reviewing your request.<br />You can send updates here.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.sender_type === 'TENANT' || msg.senderType === 'TENANT' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm text-sm leading-relaxed ${(msg.sender_type === 'TENANT' || msg.senderType === 'TENANT')
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 font-medium'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2 opacity-60">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                                    {(msg.sender_type === 'TENANT' || msg.senderType === 'TENANT') ? 'You (Tenant)' : 'Management (Staff)'}
                                                </span>
                                                <span className="text-[9px] font-medium ml-4">
                                                    {new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="font-bold">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-8 bg-white border-t border-slate-100">
                            <div className="flex gap-4">
                                <textarea
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none h-16 transition-all"
                                    placeholder="Type a message to management..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={sending || !newMessage.trim()}
                                    className="self-end w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
                                >
                                    <Send className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Re-using Building2 from sidebar
function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}
