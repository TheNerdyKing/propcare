'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import api from '@/lib/api';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useTranslation } from '@/components/LanguageProvider';
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
    Loader2
} from 'lucide-react';

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [draftEmail, setDraftEmail] = useState('');
    const [draftRecipient, setDraftRecipient] = useState('');
    const [draftSubject, setDraftSubject] = useState('');
    const [reprocessing, setReprocessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useTranslation();

    useEffect(() => {
        if (!id) return;
        fetchTicket();

        // Real-time updates
        const ticketSubscription = supabase
            .channel(`staff-ticket-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tickets',
                filter: `id=eq.${id}`
            }, () => {
                fetchTicket();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ticketSubscription);
        };
    }, [id]);

    const getTenantId = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user.tenantId ||
                user.tenant_id ||
                (user.tenants?.id) ||
                (Array.isArray(user.tenants) ? user.tenants[0]?.id : user.tenants?.id);
        } catch (e) {
            return null;
        }
    };

    const fetchTicket = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchErr } = await supabase
                .from('tickets')
                .select(`
                    *,
                    property:properties(*),
                    results:ai_results(*),
                    auditLogs:audit_logs(*)
                `)
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single();

            if (fetchErr) throw fetchErr;

            const aiResults = data.results || [];
            const latestResult = [...aiResults].sort((a: any, b: any) =>
                new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
            )[0];

            const result = latestResult?.output_json || {};

            setTicket({
                ...data,
                aiStatus: data.ai_status,
                aiClassification: result.classification?.category || null,
                aiUrgency: result.classification?.urgency || null,
                aiEmailDraft: result.draftEmail?.bodyText || '',
                aiEmailSubject: result.draftEmail?.subject || '',
                aiMissingInfo: result.missingInfo || [],
                aiContractors: result.recommendedContractors || [],
                auditLogs: (data.auditLogs || []).sort((a: any, b: any) =>
                    new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
                )
            });

            if (result.draftEmail) {
                setDraftEmail(result.draftEmail.bodyText);
                setDraftSubject(result.draftEmail.subject || `Anfrage: ${data.reference_code}`);
            }
            setDraftRecipient(result.recommendedContractors?.[0]?.email || '');

        } catch (err: any) {
            console.error('Fetch error:', err);
            setError('Ticket konnte nicht geladen werden.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status: string) => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        try {
            const { error: updErr } = await supabase
                .from('tickets')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (updErr) throw updErr;

            await supabase.from('audit_logs').insert({
                tenant_id: tenantId,
                action: 'STATUS_CHANGED',
                target_type: 'TICKET',
                target_id: id,
                metadata_json: {
                    newStatus: status,
                    details: `Status manuell auf ${status} geändert.`
                }
            });

            fetchTicket();
        } catch (err: any) {
            alert(`Fehler: ${err.message}`);
        }
    };

    const reprocessAi = async () => {
        setReprocessing(true);
        try {
            await api.post(`tickets/${id}/analyze`);
            fetchTicket();
        } catch (err: any) {
            alert(`KI-Analyse fehlgeschlagen: ${err.message}`);
        } finally {
            setReprocessing(false);
        }
    };

    const sendContractorEmail = async () => {
        if (!draftRecipient) return alert('Bitte Empfänger-E-Mail angeben.');
        setSendingEmail(true);
        try {
            await api.post(`tickets/${id}/send-draft`, {
                toEmail: draftRecipient,
                subject: draftSubject,
                message: draftEmail
            });
            alert('E-Mail erfolgreich versendet!');
            fetchTicket();
        } catch (err: any) {
            alert('Versand fehlgeschlagen.');
        } finally {
            setSendingEmail(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'NEW': return language === 'de' ? 'Neu' : 'New';
            case 'IN_PROGRESS': return language === 'de' ? 'In Bearbeitung' : 'In Progress';
            case 'COMPLETED': return language === 'de' ? 'Abgeschlossen' : 'Completed';
            default: return status;
        }
    };

    if (loading) return (
        <AuthenticatedLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
            </div>
        </AuthenticatedLayout>
    );

    if (error || !ticket) return (
        <AuthenticatedLayout>
            <div className="p-20 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">{error || (language === 'de' ? 'Ticket nicht gefunden' : 'Ticket not found')}</p>
            </div>
        </AuthenticatedLayout>
    );

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.back()} className="flex items-center text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1">
                        <ChevronLeft className="w-4 h-4 mr-1.5" />
                        {t('ticket_back')}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('ticket_live_view')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Header Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-12">
                            <div className="flex items-center justify-between mb-10">
                                <span className="font-mono font-black text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl text-[10px] uppercase border border-blue-100">
                                    {ticket.reference_code}
                                </span>
                                <div className="relative group">
                                    <select
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-blue-600/10 cursor-pointer appearance-none pr-12 transition-all hover:bg-slate-900 hover:text-white"
                                        value={ticket.status}
                                        onChange={(e) => updateStatus(e.target.value)}
                                    >
                                        <option value="NEW">{t('ticket_status_new')}</option>
                                        <option value="IN_PROGRESS">{t('ticket_status_in_progress')}</option>
                                        <option value="COMPLETED">{t('ticket_status_completed')}</option>
                                    </select>
                                    <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 leading-none">
                                {ticket.property?.name || 'Unbekannt'}
                            </h1>
                            <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-12">
                                {t('ticket_unit')}: {ticket.unit_label || (language === 'de' ? 'Allgemein' : 'General')}
                            </p>

                            <div className="grid grid-cols-3 gap-8 py-10 border-y border-slate-50">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 font-sans">{t('ticket_urgency')}</p>
                                    <p className={`font-black text-xs uppercase tracking-tight ${ticket.urgency === 'EMERGENCY' ? 'text-red-500' : 'text-slate-700'}`}>{ticket.urgency}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 font-sans">{t('ticket_category')}</p>
                                    <p className="font-black text-slate-700 text-xs uppercase tracking-tight">{ticket.category || 'Maintenance'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 font-sans">{t('ticket_created_at')}</p>
                                    <p className="font-black text-slate-700 text-xs uppercase tracking-tight">{new Date((ticket as any).createdAt || (ticket as any).created_at || new Date()).toLocaleDateString(language === 'de' ? 'de-CH' : 'en-GB')}</p>
                                </div>
                            </div>

                            <div className="mt-12">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                                    <span className="w-8 h-[1px] bg-slate-100 mr-4" />
                                    {t('ticket_description')}
                                    <span className="w-full h-[1px] bg-slate-100 ml-4" />
                                </h3>
                                <div className="bg-slate-50 rounded-[2rem] p-8 italic text-slate-600 leading-relaxed font-medium text-lg border border-slate-100 shadow-inner">
                                    "{ticket.description}"
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-12 px-8 border-b border-slate-100">
                            <button onClick={() => setActiveTab('details')} className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>
                                {t('ticket_tab_ai')}
                            </button>
                            <button onClick={() => setActiveTab('audit')} className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>
                                {t('ticket_tab_history')}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-12">
                            {activeTab === 'details' && (
                                <div className="space-y-12">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center text-blue-600">
                                            <Sparkles className="w-5 h-5 mr-3" />
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">{t('ticket_ai_intelligence')}</h2>
                                        </div>
                                        <button onClick={reprocessAi} disabled={reprocessing} className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center hover:text-blue-600 transition-all group">
                                            <RefreshCw className={`w-3.5 h-3.5 mr-2 group-hover:rotate-180 transition-transform duration-500 ${reprocessing ? 'animate-spin' : ''}`} />
                                            {t('ticket_ai_reprocess')}
                                        </button>
                                    </div>

                                    {ticket.aiStatus === 'PROCESSING' || reprocessing ? (
                                        <div className="py-24 text-center">
                                            <Loader2 className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-6" />
                                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">{t('ticket_ai_processing')}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:bg-white hover:shadow-xl hover:scale-[1.02]">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('ticket_ai_suggested_category')}</p>
                                                    <p className="text-xl font-black uppercase tracking-tight text-slate-900">{ticket.aiClassification || (language === 'de' ? 'Unbekannt' : 'Unknown')}</p>
                                                </div>
                                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:bg-white hover:shadow-xl hover:scale-[1.02]">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('ticket_ai_suggested_urgency')}</p>
                                                    <p className="text-xl font-black uppercase tracking-tight text-blue-600">{ticket.aiUrgency || (language === 'de' ? 'Unbekannt' : 'Unknown')}</p>
                                                </div>
                                            </div>

                                            {ticket.aiMissingInfo?.length > 0 && (
                                                <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] shadow-sm">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t('ticket_ai_missing_info')}</p>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        {ticket.aiMissingInfo.map((info: string, i: number) => (
                                                            <li key={i} className="text-sm font-bold text-slate-700 flex items-center bg-white/50 p-3 rounded-xl border border-amber-100/50">
                                                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-3" />
                                                                {info}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {ticket.aiContractors?.length > 0 && (
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('ticket_ai_suggested_contractors')}</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {ticket.aiContractors.map((c: any, i: number) => (
                                                            <div key={i} className={`p-6 rounded-2xl border ${c.source === 'INTERNAL' ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <p className="font-black text-sm uppercase tracking-tight text-slate-900">{c.name}</p>
                                                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${c.source === 'INTERNAL' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                        {c.source}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mb-4">{c.reason}</p>
                                                                {c.source === 'GOOGLE' && (
                                                                    <a
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ticket.aiClassification} ${ticket.property?.city || 'Zürich'}`)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                                                    >
                                                                        Auf Google Maps suchen ➔
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {ticket.aiEmailDraft && (
                                                <div className="space-y-8 pt-12 border-t border-slate-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-black uppercase tracking-tight">{t('ticket_ai_email_draft')}</h3>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('ticket_ai_email_purpose')}</p>
                                                        </div>
                                                        <button
                                                            onClick={sendContractorEmail}
                                                            disabled={sendingEmail}
                                                            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                                                        >
                                                            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : t('ticket_ai_send_to_contractor')}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="relative">
                                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            <input
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                                                value={draftRecipient}
                                                                onChange={(e) => setDraftRecipient(e.target.value)}
                                                                placeholder="handwerker@email.ch"
                                                            />
                                                        </div>
                                                        <textarea
                                                            className="w-full bg-slate-900 text-blue-100 p-10 rounded-[2rem] font-mono text-sm leading-relaxed border border-slate-800 shadow-2xl min-h-[300px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                            value={draftEmail}
                                                            onChange={(e) => setDraftEmail(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div className="space-y-10">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 flex items-center">
                                        <History className="w-6 h-6 mr-3 text-blue-600" />
                                        {t('ticket_system_log')}
                                    </h2>
                                    <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                                        {(ticket.auditLogs || []).map((log: any) => (
                                            <div key={log.id} className="flex gap-8 relative">
                                                <div className="w-6 h-6 bg-white border-2 border-slate-100 rounded-full flex-shrink-0 z-10 flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                                </div>
                                                <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-600 transition-colors mb-2">{new Date(log.createdAt || log.created_at).toLocaleString((language === 'de' ? 'de-CH' : 'en-GB'))}</p>
                                                    <p className="font-bold text-sm text-slate-700 leading-snug">{log.metadata_json?.details || log.details || log.action}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Info Sidebar */}
                    <div className="space-y-10">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center flex items-center">
                                <span className="w-full h-[1px] bg-slate-50 mr-4" />
                                {t('ticket_sidebar_tenant')}
                                <span className="w-full h-[1px] bg-slate-50 ml-4" />
                            </h3>
                            <div className="space-y-8">
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 border-b border-slate-50 pb-4">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 font-sans">Name</p>
                                        <p className="font-black text-sm uppercase tracking-tight text-slate-900">{ticket.tenant_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 border-b border-slate-50 pb-4">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 font-sans">{language === 'de' ? 'E-Mail Adresse' : 'Email Address'}</p>
                                        <p className="font-black text-xs break-all text-slate-900">{ticket.tenant_email}</p>
                                    </div>
                                </div>
                                {ticket.tenant_phone && (
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                            <HelpCircle className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 font-sans">{t('ticket_sidebar_phone')}</p>
                                            <p className="font-black text-sm uppercase tracking-tight text-slate-900">{ticket.tenant_phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-600/30">
                            <Sparkles className="w-10 h-10 text-white/30 mb-6" />
                            <h3 className="font-black mb-4 text-xl uppercase tracking-tighter">{t('ticket_sidebar_automation_title')}</h3>
                            <p className="text-sm font-medium leading-relaxed text-blue-100 opacity-90 italic">
                                {t('ticket_sidebar_automation_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
