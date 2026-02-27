'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    Shield, 
    Loader2, 
    AlertCircle, 
    History, 
    User, 
    Tag, 
    Cpu, 
    FileText, 
    Mail, 
    RefreshCcw, 
    ArrowRight,
    Search,
    Clock,
    CheckCircle2,
    Activity
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useTranslation } from '@/components/LanguageProvider';

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const { t, language } = useTranslation();

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleExport = () => {
        setExporting(true);
        setTimeout(() => {
            setExporting(false);
            window.print();
        }, 1500);
    };

    const getTenantId = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user.tenantId || user.tenant_id || (user.tenants?.id) || (Array.isArray(user.tenants) ? user.tenants[0]?.id : user.tenants?.id);
        } catch (e) {
            return null;
        }
    };

    const fetchLogs = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*, user:users(name)')
                .eq('tenant_id', tenantId);

            const { data, error: fetchErr } = await query.limit(100);

            if (fetchErr) throw fetchErr;

            const safeLogs = (data || []).sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
                const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
                return dateB - dateA;
            });

            setLogs(safeLogs);
        } catch (err: any) {
            console.error('Failed to fetch audit logs:', err);
            setError(language === 'de' ? 'Systemprotokoll konnte nicht geladen werden.' : 'System audit logs could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    const getActionConfig = (action: string) => {
        switch (action) {
            case 'TICKET_CREATED': return { label: language === 'de' ? 'Neuzugang' : 'New Entry', icon: FileText, color: 'blue' };
            case 'AI_CLASSIFIED': return { label: language === 'de' ? 'KI-Analyse' : 'AI Analysis', icon: Cpu, color: 'indigo' };
            case 'STATUS_CHANGED': return { label: language === 'de' ? 'Bearbeitung' : 'Processing', icon: RefreshCcw, color: 'amber' };
            case 'EMAIL_SENT': return { label: language === 'de' ? 'Korrespondenz' : 'Correspondence', icon: Mail, color: 'emerald' };
            case 'EXTERNAL_SYNC_LOGGED': return { label: language === 'de' ? 'Datensynchronisation' : 'Data Sync', icon: Activity, color: 'slate' };
            case 'AI_START': return { label: language === 'de' ? 'KI-Start' : 'AI Start', icon: Cpu, color: 'indigo' };
            default: return { label: action, icon: Activity, color: 'slate' };
        }
    };

    const renderLogDetails = (log: any) => {
        const meta = log.metadata_json || {};
        const action = log.action;

        if (action === 'TICKET_CREATED') {
            const source = meta.source === 'PUBLIC_PORTAL' 
                ? (language === 'de' ? 'Mieter-Portal' : 'Tenant Portal') 
                : (language === 'de' ? 'Verwaltung' : 'Admin');
            return language === 'de' 
                ? `Ein neues Ticket wurde über das ${source} erstellt.` 
                : `A new ticket was created via the ${source}.`;
        }
        if (action === 'AI_CLASSIFIED' || action === 'AI_START') {
            const model = meta.model || 'GPT-4';
            return language === 'de'
                ? `KI-Modell (${model}) hat das Anliegen analysiert und kategorisiert.`
                : `AI Model (${model}) has analyzed and categorized the request.`;
        }
        if (action === 'STATUS_CHANGED') {
            return language === 'de'
                ? `Der Status wurde von "${meta.from_status || 'Unbekannt'}" auf "${meta.to_status || 'Neu'}" geändert.`
                : `Status changed from "${meta.from_status || 'Unknown'}" to "${meta.to_status || 'New'}".`;
        }
        if (action === 'EMAIL_SENT') {
            return language === 'de'
                ? `Benachrichtigung erfolgreich an ${meta.to_email || 'den Empfänger'} versendet.`
                : `Notification successfully sent to ${meta.to_email || 'the recipient'}.`;
        }
        
        if (meta.details) return meta.details;

        return language === 'de' ? 'Systemprozess erfolgreich ausgeführt.' : 'System process executed successfully.';
    };

    return (
        <AuthenticatedLayout>
            <div className="p-12 max-w-7xl mx-auto font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 bg-blue-600/10 backdrop-blur-md text-blue-600 px-5 py-2.5 rounded-2xl border border-blue-200/50 hover:scale-105 transition-transform">
                            <Shield className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('audit_badge')}</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">{t('audit_title').includes(' ') ? t('audit_title').split(' ').map((word, i) => i === 1 ? <><br/><span key={i} className="text-blue-600">{word}</span></> : word) : t('audit_title')}</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-xl italic leading-relaxed">{t('audit_subtitle')}</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center space-x-6 h-full">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <Activity className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('audit_live_status')}</p>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <p className="font-black text-slate-900 text-lg">{t('audit_system_active')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-12 p-10 bg-red-50 text-red-600 rounded-[3rem] border border-red-100 flex flex-col items-center gap-6 shadow-2xl shadow-red-200/20">
                        <AlertCircle className="w-16 h-16 text-red-500" />
                        <div className="text-center">
                            <p className="font-black text-2xl uppercase tracking-tight mb-2">{error}</p>
                            <p className="text-red-400 font-medium">Es scheint ein Problem mit der Datenbankverbindung vorzuliegen.</p>
                        </div>
                        <button 
                            onClick={fetchLogs} 
                            className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-red-600/30"
                        >
                            Verbindung Wiederholen
                        </button>
                    </div>
                )}

                <div className="bg-white/70 backdrop-blur-3xl shadow-3xl shadow-slate-200/60 border border-slate-100 overflow-hidden rounded-[4rem]">
                    {loading ? (
                        <div className="p-32 text-center flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
                                <Loader2 className="animate-spin w-20 h-20 text-blue-600 relative z-10" />
                            </div>
                            <p className="mt-10 text-slate-400 font-black uppercase tracking-[0.4em] text-[12px]">{language === 'de' ? 'Lade Protokoll-Daten...' : 'Loading audit data...'}</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-32 text-center text-slate-400">
                            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 border border-slate-100">
                                <History className="w-16 h-16 opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-sm text-slate-900 mb-2">{language === 'de' ? 'Kein Verlauf gefunden' : 'No history found'}</p>
                            <p className="font-medium italic text-slate-400">{language === 'de' ? 'Aktuell wurden noch keine Aktionen im System registriert.' : 'No actions have been registered in the system yet.'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100 group">
                                        <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('audit_header_timeline')}</th>
                                        <th className="px-8 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('audit_header_type')}</th>
                                        <th className="px-8 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('audit_header_actor')}</th>
                                        <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('audit_header_details')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map((log, index) => {
                                        const config = getActionConfig(log.action);
                                        const Icon = config.icon;
                                        
                                        return (
                                            <tr 
                                                key={log.id} 
                                                className="hover:bg-blue-50/30 transition-all duration-500 group"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <td className="px-12 py-12 whitespace-nowrap">
                                                    <div className="flex items-center space-x-6">
                                                        <div className={`w-12 h-12 bg-${config.color}-50 text-${config.color}-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-${config.color}-100 group-hover:scale-110 transition-transform duration-500`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-black text-slate-900 tracking-tight">
                                                                {new Date(log.created_at || log.createdAt || Date.now()).toLocaleDateString(language === 'de' ? 'de-CH' : 'en-GB')}
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1 flex items-center">
                                                                <Clock className="w-3 h-3 mr-2" />
                                                                {new Date(log.created_at || log.createdAt || Date.now()).toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-12">
                                                    <span className={`px-4 py-2 bg-${config.color}-50 text-${config.color}-700 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border border-${config.color}-200/50 inline-flex items-center shadow-sm`}>
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-12">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors duration-500 group-hover:text-white">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.user?.name || (log.actor_user_id ? 'System' : (language === 'de' ? 'Gast' : 'Guest'))}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{t('audit_identity')}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-12">
                                                    <div className="max-w-md">
                                                        <p className="text-sm font-bold text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                                                            {renderLogDetails(log)}
                                                        </p>
                                                        {log.target_id && (
                                                            <div className="flex items-center mt-3 text-[10px] font-black text-blue-600/50 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                                                                <Tag className="w-3 h-3 mr-2 shrink-0" />
                                                                {t('audit_reference')}: {log.target_id.slice(0, 8)}...
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                <div className="mt-16 bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden shadow-3xl shadow-slate-900/40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-black tracking-tighter mb-6 uppercase">{t('audit_export_title')}</h2>
                            <p className="text-blue-100/60 text-lg font-medium leading-relaxed italic">{t('audit_export_subtitle')}</p>
                        </div>
                        <button 
                            disabled={exporting}
                            onClick={handleExport}
                            className="bg-white text-slate-900 px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-4 disabled:opacity-50"
                        >
                            {exporting ? (
                                t('audit_btn_generating')
                            ) : (
                                t('audit_btn_export')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
