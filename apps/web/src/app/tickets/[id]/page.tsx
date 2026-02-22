'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import api from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import {
    ChevronLeft,
    Clock,
    MapPin,
    User,
    AlertTriangle,
    CheckCircle2,
    MessageSquare,
    Send,
    Mail,
    Sparkles,
    History,
    RefreshCw,
    Wrench,
} from 'lucide-react';

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'conversation' | 'audit'>('details');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [reprocessing, setReprocessing] = useState(false);

    useEffect(() => {
        if (id) fetchTicket();
    }, [id]);

    const getTenantId = () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.tenantId || user.tenant_id;
        } catch (e) {
            return null;
        }
    };

    const fetchTicket = async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    property:properties(*),
                    contractor:contractors(*),
                    messages:ticket_messages(*),
                    results:ai_results(*),
                    auditLogs:audit_logs(*)
                `)
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single();

            if (error) throw error;

            // Map common properties for easy access
            const result = data.results?.[0]?.output_json || {};
            setTicket({
                ...data,
                aiClassification: result.category || 'General',
                aiUrgency: result.urgency || 'Normal',
                aiEmailDraft: result.responseDraft || '',
                messages: (data.messages || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
                auditLogs: (data.auditLogs || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            });
        } catch (err) {
            console.error('Failed to fetch ticket', err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { error } = await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: id,
                    tenant_id: tenantId,
                    content: newMessage,
                    sender_type: 'STAFF'
                }]);
            if (error) throw error;

            setNewMessage('');
            fetchTicket();
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const updateStatus = async (status: string) => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status })
                .eq('id', id)
                .eq('tenant_id', tenantId);
            if (error) throw error;
            fetchTicket();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const reprocessAi = async () => {
        setReprocessing(true);
        try {
            await api.post(`/tickets/${id}/reprocess`);
            await fetchTicket();
        } catch (err) {
            console.error('Reprocess failed', err);
        } finally {
            setReprocessing(false);
        }
    };

    const sendContractorEmail = async () => {
        setSendingEmail(true);
        try {
            await api.post(`/tickets/${id}/send-contractor-email`);
            alert('Email sent successfully!');
            fetchTicket();
        } catch (err) {
            console.error('Failed to send email', err);
            alert('Failed to send email.');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) return (
        <AuthenticatedLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        </AuthenticatedLayout>
    );

    if (!ticket) return (
        <AuthenticatedLayout>
            <div className="p-8 text-center text-slate-500">Ticket not found</div>
        </AuthenticatedLayout>
    );

    return (
        <AuthenticatedLayout>
            <div className="p-8 max-w-6xl mx-auto text-slate-900">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-slate-500 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors uppercase tracking-widest"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </button>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1 space-y-8">
                        {/* Header Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono bg-indigo-50 px-3 py-1 rounded-lg">
                                        {ticket.referenceCode}
                                    </span>
                                    <h1 className="text-2xl font-black text-slate-900">
                                        {ticket.property?.name} • {ticket.unitLabel || 'Common Area'}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                        value={ticket.status}
                                        onChange={(e) => updateStatus(e.target.value)}
                                    >
                                        <option value="NEW">New</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="COMPLETED">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-y border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Urgency</p>
                                    <div className="flex items-center text-sm font-bold text-slate-700">
                                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                        {ticket.urgency}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Property</p>
                                    <div className="flex items-center text-sm font-bold text-slate-700">
                                        <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                                        {ticket.property?.name}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Creator</p>
                                    <div className="flex items-center text-sm font-bold text-slate-700">
                                        <User className="w-4 h-4 mr-2 text-amber-500" />
                                        Tenant
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</p>
                                    <div className="flex items-center text-sm font-bold text-indigo-600">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {ticket.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Issue Description</h3>
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 italic text-slate-700 leading-relaxed font-light">
                                    "{ticket.description}"
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center space-x-8 border-b border-slate-100 px-2">
                            {[
                                { id: 'details', label: 'Processing', icon: Sparkles },
                                { id: 'conversation', label: 'Chat', icon: MessageSquare },
                                { id: 'audit', label: 'Audit Log', icon: History }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center py-4 text-sm font-bold transition-all relative ${activeTab === tab.id
                                        ? 'text-indigo-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden min-h-[400px]">
                            {activeTab === 'details' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* AI Overview */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center text-indigo-600">
                                            <Sparkles className="w-5 h-5 mr-3 fill-indigo-50" />
                                            <h2 className="text-xl font-black tracking-tight">AI Assistance Results</h2>
                                        </div>
                                        <button
                                            onClick={reprocessAi}
                                            disabled={reprocessing}
                                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${reprocessing ? 'animate-spin' : ''}`} />
                                            {reprocessing ? 'Processing...' : 'Reprocess AI'}
                                        </button>
                                    </div>

                                    {!ticket.aiClassification ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <Sparkles className="w-12 h-12 mb-4 animate-pulse opacity-50" />
                                            <p className="font-bold">Waiting for AI assessment...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Classification</p>
                                                    <p className="text-lg font-black text-slate-900">{ticket.aiClassification}</p>
                                                </div>
                                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Urgency Score</p>
                                                    <p className="text-lg font-black text-indigo-600">{ticket.aiUrgency}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Suggested Contractor</p>
                                                {ticket.contractor ? (
                                                    <div className="flex items-center justify-between p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                                        <div className="flex items-center">
                                                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                                                                <Wrench className="w-6 h-6 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900">{ticket.contractor.name}</h4>
                                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{ticket.contractor.tradeTypes?.join(', ')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-medium text-slate-500">{ticket.contractor.email}</p>
                                                            <p className="text-xs font-medium text-slate-500">{ticket.contractor.phone}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center py-8 text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
                                                        <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                                        <p className="text-sm font-bold">No contractor matched your criteria.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {ticket.aiEmailDraft && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Communication Draft</p>
                                                        <button
                                                            onClick={sendContractorEmail}
                                                            disabled={sendingEmail || !ticket.contractor}
                                                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                                                        >
                                                            <Mail className="w-3.5 h-3.5 mr-2" />
                                                            {sendingEmail ? 'Sending...' : 'Approve & Send Email'}
                                                        </button>
                                                    </div>
                                                    <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl font-mono text-sm leading-relaxed border border-slate-800 shadow-inner">
                                                        <pre className="whitespace-pre-wrap">{ticket.aiEmailDraft}</pre>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'conversation' && (
                                <div className="flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50/30">
                                        {(ticket.messages || []).map((msg: any) => (
                                            <div key={msg.id} className={`flex ${msg.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.senderType === 'STAFF'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2 opacity-70">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{msg.senderType}</span>
                                                        <span className="text-[10px] font-medium ml-4">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="font-medium">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                                        <textarea
                                            className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none h-20"
                                            placeholder="Type your message to the tenant..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            className="self-end p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">System Audit Log</h3>
                                    <div className="space-y-0 relative border-l-2 border-slate-100 ml-3">
                                        {(ticket.auditLogs || []).map((log: any, idx: number) => (
                                            <div key={log.id} className="mb-10 ml-8 relative group">
                                                <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full border-4 border-white bg-slate-300 group-hover:bg-indigo-600 transition-colors" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()}</p>
                                                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md tracking-widest">{log.action}</span>
                                                </div>
                                                <p className="text-slate-800 font-bold mb-1">{log.details}</p>
                                                <p className="text-xs font-medium text-slate-500">System generated via automation.</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <div className="lg:w-80 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Quick Status Update</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => updateStatus('NEW')}
                                    className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${ticket.status === 'NEW' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    Mark as New
                                </button>
                                <button
                                    onClick={() => updateStatus('IN_PROGRESS')}
                                    className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    In Progress
                                </button>
                                <button
                                    onClick={() => updateStatus('COMPLETED')}
                                    className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${ticket.status === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    Resolve Ticket
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                            <Sparkles className="absolute top-4 right-4 text-indigo-400/20 w-16 h-16 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Automation Hub</h3>
                            <p className="text-sm font-medium text-slate-400 mb-6 leading-relaxed">
                                Our AI system is monitoring this ticket activity. It will suggest next steps based on chat messages.
                            </p>
                            <div className="p-4 bg-indigo-600/10 border border-indigo-400/20 rounded-2xl flex items-center">
                                <Sparkles className="w-5 h-5 mr-3 text-indigo-400" />
                                <span className="text-xs font-bold text-indigo-200">System standing by...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
