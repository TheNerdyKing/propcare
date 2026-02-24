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
    HelpCircle,
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
    const [draftEmail, setDraftEmail] = useState('');
    const [draftRecipient, setDraftRecipient] = useState('');
    const [draftSubject, setDraftSubject] = useState('');
    const [reprocessing, setReprocessing] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchTicket();

        // Subscribe to ticket changes
        const ticketSubscription = supabase
            .channel(`staff-ticket-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tickets',
                filter: `id=eq.${id}`
            }, (payload) => {
                const newStatus = payload.new.internal_status || payload.new.status;

                // CRITICAL: Preserve derived AI fields from previous state if they exist
                setTicket(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        ...payload.new,
                        internalStatus: payload.new.internal_status,
                        // Preserve these fields which are joined from other tables
                        aiClassification: prev.aiClassification,
                        aiUrgency: prev.aiUrgency,
                        aiEmailDraft: prev.aiEmailDraft,
                        contractor: prev.contractor
                    };
                });

                // If AI finished or Email sent, re-fetch the full joined data
                if (newStatus === 'AI_READY' || newStatus === 'FAILED' || newStatus === 'SENT') {
                    console.log(`State transition to ${newStatus} detected via Realtime, re-fetching full record...`);
                    fetchTicket();
                }
            })
            .subscribe();

        // Subscribe to messages
        const messageSubscription = supabase
            .channel(`staff-messages-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ticket_messages',
                filter: `ticket_id=eq.${id}`
            }, (payload) => {
                const newMsg = payload.new;
                setTicket(prev => {
                    if (!prev) return null;
                    // Standardize sort with fallback for Supabase created_at vs Prisma createdAt
                    const updatedMessages = [...(prev.messages || []), newMsg].sort(
                        (a: any, b: any) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime()
                    );
                    return { ...prev, messages: updatedMessages };
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ticketSubscription);
            supabase.removeChannel(messageSubscription);
        };
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
                    messages:ticket_messages(*),
                    results:ai_results(*),
                    auditLogs:audit_logs(*)
                `)
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single();

            if (error) throw error;

            // Map common properties for easy access
            const aiResults = data.results || data.ai_results || [];
            const latestResultRaw = [...aiResults].sort((a: any, b: any) =>
                new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
            )[0];

            const result = latestResultRaw?.output_json || {};

            setTicket({
                ...data,
                referenceCode: data.reference_code,
                unitLabel: data.unit_label,
                tenantName: data.tenant_name,
                urgency: data.urgency,
                status: data.status,
                internalStatus: data.internal_status,
                aiClassification: result.category || null,
                aiUrgency: result.urgency || null,
                aiEmailDraft: result.emailDraft || '',
                errorMessage: result.errorMessage || data.error_message || null,
                messages: (data.messages || []).sort((a: any, b: any) =>
                    new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime()
                ),
                auditLogs: (data.auditLogs || data.audit_logs || []).sort((a: any, b: any) =>
                    new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
                )
            });

            if (result.emailDraft) {
                setDraftEmail(result.emailDraft);
                setDraftSubject(`Maintenance Request: ${data.referenceCode} - ${data.property?.name || 'Inquiry'}`);
            }

            // Try to find a suggested contractor email
            const suggestedEmail = result.contractors?.[0]?.email || '';
            setDraftRecipient(suggestedEmail);
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
            // No need to call fetchTicket() here as Realtime will pick up the insert
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const updateStatus = async (status: string) => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            // 1. Update status
            const { error: updateError } = await supabase
                .from('tickets')
                .update({
                    status,
                    updatedAt: new Date().toISOString()
                })
                .eq('id', id)
                .eq('tenant_id', tenantId);
            if (updateError) throw updateError;

            // 2. Create Audit Log
            await supabase
                .from('audit_logs')
                .insert([{
                    tenant_id: tenantId,
                    action: 'STATUS_CHANGED',
                    target_type: 'TICKET',
                    target_id: id,
                    details: `Status updated to ${status} via Staff Portal`,
                    metadata_json: { newStatus: status }
                }]);

            fetchTicket();
        } catch (err: any) {
            console.error('Failed to update status', err);
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const reprocessAi = async () => {
        setReprocessing(true);
        const tenantId = getTenantId();
        if (!tenantId) {
            setReprocessing(false);
            return;
        }

        // 1. FRONTEND GUARD: Prevent infinite loading for empty/short tickets
        if (!ticket.description || ticket.description.trim().length < 10) {
            console.log('Short description detected. Setting NEEDS_ATTENTION instantly.');
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update({
                        internal_status: 'NEEDS_ATTENTION',
                        status: 'NEEDS_ATTENTION',
                        updatedAt: new Date().toISOString()
                    })
                    .eq('id', id)
                    .eq('tenant_id', tenantId);

                if (error) throw error;
                await fetchTicket();
                return;
            } catch (err) {
                console.error('Guard update failed', err);
            } finally {
                setReprocessing(false);
            }
            return;
        }

        try {
            // 2. Update internal_status directly in Supabase to trigger the Webhook
            const { error } = await supabase
                .from('tickets')
                .update({
                    internal_status: 'AI_PROCESSING',
                    updatedAt: new Date().toISOString()
                })
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (error) throw error;

            alert('AI Analysis requested. Results will appear in seconds.');
            await fetchTicket();
        } catch (err: any) {
            console.error('Reprocess failed', err);
            alert(`Failed to request AI analysis: ${err.message || 'Unknown error'}`);
        } finally {
            setReprocessing(false);
        }
    };

    const sendContractorEmail = async () => {
        if (!draftRecipient) {
            alert('Please provide a recipient email address.');
            return;
        }
        setSendingEmail(true);
        try {
            await api.post(`/tickets/${id}/send-email`, {
                to: draftRecipient,
                subject: draftSubject,
                body: draftEmail
            });
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
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors uppercase tracking-widest"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </button>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        Deployment v2.6-auto-restored
                    </span>
                </div>

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
                                { id: 'details', label: 'AI Analysis', icon: Sparkles },
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

                                    {reprocessing ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-indigo-50/20 rounded-[2rem] border border-dashed border-indigo-100">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100/50 mb-6 font-bold text-indigo-500">
                                                <RefreshCw className="w-8 h-8 animate-spin" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 mb-2">Analyzing Request...</h3>
                                            <p className="text-sm font-medium text-slate-500 max-w-sm mb-6">
                                                PropCare AI is lightning fast. Your results will appear in a second or two.
                                            </p>

                                            {/* Watchdog/Reset after 5 seconds to prevent hanging */}
                                            <button
                                                onClick={() => {
                                                    supabase.from('tickets').update({ internal_status: 'NEW' }).eq('id', id);
                                                    setTicket(prev => prev ? ({ ...prev, internalStatus: 'NEW' }) : null);
                                                }}
                                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                            >
                                                Take too long? Reset & Try Again
                                            </button>
                                        </div>
                                    ) : ticket.internalStatus === 'NEEDS_ATTENTION' ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-amber-50 rounded-[2rem] border border-dashed border-amber-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100 mb-6">
                                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                                            </div>
                                            <h3 className="text-lg font-black text-amber-900 mb-2">Insufficient Details</h3>
                                            <p className="text-sm font-medium text-amber-600 mb-8 max-w-sm">
                                                The description is too short for a reliable AI assessment. Please add more details and click reprocess.
                                            </p>
                                            <button
                                                onClick={reprocessAi}
                                                disabled={reprocessing}
                                                className="px-8 py-4 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:scale-105 transition-all disabled:opacity-50 flex items-center"
                                            >
                                                <RefreshCw className={`w-4 h-4 mr-3 ${reprocessing ? 'animate-spin' : ''}`} />
                                                {reprocessing ? 'Processing...' : 'Try Again'}
                                            </button>
                                        </div>
                                    ) : (ticket.internalStatus === 'FAILED' || ticket.errorMessage) ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-red-50 rounded-[2rem] border border-dashed border-red-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 mb-6">
                                                <AlertTriangle className="w-8 h-8 text-red-500" />
                                            </div>
                                            <h3 className="text-lg font-black text-red-900 mb-2">AI Analysis Failed</h3>
                                            <p className="text-sm font-medium text-red-600 mb-8 max-w-sm">
                                                {ticket.errorMessage || "The AI system encountered an unexpected error while processing this ticket."}
                                            </p>
                                            <button
                                                onClick={reprocessAi}
                                                disabled={reprocessing}
                                                className="px-8 py-4 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:scale-105 transition-all disabled:opacity-50 flex items-center"
                                            >
                                                <RefreshCw className={`w-4 h-4 mr-3 ${reprocessing ? 'animate-spin' : ''}`} />
                                                {reprocessing ? 'Trying again...' : 'Retry Analysis'}
                                            </button>
                                        </div>
                                    ) : !ticket.aiClassification ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                                <Sparkles className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 mb-2">
                                                {ticket.internalStatus === 'AI_PROCESSING' ? 'AI Analysis In Progress' : 'Ready for Analysis'}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm">
                                                {ticket.internalStatus === 'AI_PROCESSING'
                                                    ? 'PropCare AI is currently analyzing this request in the background. Results will appear automatically.'
                                                    : 'This ticket is awaiting an AI assessment. Click below to generate a classification and email draft.'}
                                            </p>
                                            <button
                                                onClick={reprocessAi}
                                                disabled={reprocessing}
                                                className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all disabled:opacity-50 flex items-center"
                                            >
                                                <RefreshCw className={`w-4 h-4 mr-3 ${reprocessing || ticket.internalStatus === 'AI_PROCESSING' ? 'animate-spin' : ''}`} />
                                                {reprocessing || ticket.internalStatus === 'AI_PROCESSING' ? 'Analyzing...' : 'Start AI Analysis'}
                                            </button>
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
                                                <div id="email-draft-area" className="space-y-6 pt-6 border-t border-slate-100 mt-6">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review & Send AI Draft</p>
                                                        <button
                                                            onClick={sendContractorEmail}
                                                            disabled={sendingEmail || !draftRecipient}
                                                            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 disabled:opacity-50"
                                                        >
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            {sendingEmail ? 'Sending...' : 'Send to Contractor'}
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Recipient</label>
                                                            <input
                                                                type="email"
                                                                value={draftRecipient}
                                                                onChange={(e) => setDraftRecipient(e.target.value)}
                                                                placeholder="contractor@email.com"
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Subject</label>
                                                            <input
                                                                type="text"
                                                                value={draftSubject}
                                                                onChange={(e) => setDraftSubject(e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        value={draftEmail}
                                                        onChange={(e) => setDraftEmail(e.target.value)}
                                                        rows={10}
                                                        className="w-full bg-slate-900 text-slate-300 p-8 rounded-[2rem] font-mono text-sm leading-relaxed border border-slate-800 shadow-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                                    />
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
                                            <div key={msg.id} className={`flex ${msg.sender_type === 'STAFF' || msg.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender_type === 'STAFF' || msg.senderType === 'STAFF'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2 opacity-70">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{msg.sender_type || msg.senderType}</span>
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
                                        {(ticket.auditLogs || []).map((log: any) => {
                                            const getAuditMessage = () => {
                                                const meta = log.metadataJson || {};
                                                switch (log.action) {
                                                    case 'AI_START': return `AI analysis started using ${meta.model || 'gpt-4o-mini'}.`;
                                                    case 'AI_SUCCESS': return `AI analysis completed: Classified as ${meta.category} with ${meta.urgency} urgency.`;
                                                    case 'AI_FAILED': return `AI analysis failed: ${meta.error || 'Unknown error'}.`;
                                                    case 'AI_SKIPPED': return `AI analysis skipped: ${meta.reason === 'insufficient_description' ? 'Insufficient details to analyze.' : meta.reason}`;
                                                    case 'EMAIL_SENT': return `Contractor email sent to ${meta.to || 'recipient'}. Subject: ${meta.subject || '(no subject)'}`;
                                                    case 'STATUS_CHANGED': return `Internal status manually changed to ${meta.newStatus}.`;
                                                    case 'EXTERNAL_SYNC_SUCCESS': return `Successfully synced with external system (ID: ${meta.externalTicketId}).`;
                                                    case 'EXTERNAL_SYNC_FAILED': return `External synchronization failed: ${meta.error || 'Unknown error'}.`;
                                                    default: return `Action recorded: ${log.action.replace(/_/g, ' ')}.`;
                                                }
                                            };

                                            return (
                                                <div key={log.id} className="mb-10 ml-8 relative group">
                                                    <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full border-4 border-white bg-slate-300 group-hover:bg-indigo-600 transition-colors" />
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()}</p>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md tracking-widest">{log.action}</span>
                                                    </div>
                                                    <p className="text-slate-800 font-bold mb-1">{getAuditMessage()}</p>
                                                    <p className="text-xs font-medium text-slate-500">System generated via automation.</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <div className="lg:w-80 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Workflow Actions</h3>

                            {/* Primary Contextual Action */}
                            <div className="mb-10">
                                {ticket.status === 'NEW' && (
                                    <button
                                        onClick={reprocessAi}
                                        disabled={reprocessing}
                                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center"
                                    >
                                        {reprocessing ? <RefreshCw className="w-4 h-4 mr-3 animate-spin" /> : <Sparkles className="w-4 h-4 mr-3" />}
                                        {reprocessing ? 'Processing...' : 'Run AI Analysis ➔'}
                                    </button>
                                )}

                                {ticket.status === 'AI_READY' && (
                                    <button
                                        onClick={() => {
                                            setActiveTab('details');
                                            // Small delay to ensure tab content is rendered before scrolling
                                            setTimeout(() => {
                                                const el = document.getElementById('email-draft-area');
                                                if (el) {
                                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    el.classList.add('ring-4', 'ring-indigo-500/20', 'ring-offset-8');
                                                    setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500/20', 'ring-offset-8'), 2000);
                                                }
                                            }, 300);
                                        }}
                                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center"
                                    >
                                        <Mail className="w-4 h-4 mr-3" />
                                        Review & Email Draft ➔
                                    </button>
                                )}

                                {ticket.status === 'SENT' && (
                                    <button
                                        onClick={() => setActiveTab('conversation')}
                                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-3" />
                                        Chat with Tenant ➔
                                    </button>
                                )}

                                {ticket.status === 'CLOSED' && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
                                        <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Case Resolved</span>
                                    </div>
                                )}
                            </div>

                            {/* Secondary Manual Overrides */}
                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Manual Override</h3>
                                    <div className="group relative">
                                        <HelpCircle className="w-3.5 h-3.5 text-slate-200 cursor-help" />
                                        <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-2xl z-50 leading-relaxed">
                                            These buttons manually change the status label for your internal tracking.
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => updateStatus('NEW')}
                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ticket.status === 'NEW' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        New
                                    </button>
                                    <button
                                        onClick={() => updateStatus('AI_READY')}
                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ticket.status === 'AI_READY' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Ready
                                    </button>
                                    <button
                                        onClick={() => updateStatus('SENT')}
                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ticket.status === 'SENT' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Sent
                                    </button>
                                    <button
                                        onClick={() => updateStatus('CLOSED')}
                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ticket.status === 'CLOSED' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Resolve
                                    </button>
                                </div>
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
