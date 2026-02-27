'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Loader2, AlertCircle, History, User, Tag } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

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
            const { data, error: fetchErr } = await supabase
                .from('audit_logs')
                .select('*, user:users(name)')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (fetchErr) throw fetchErr;
            setLogs(data || []);
        } catch (err: any) {
            console.error('Failed to fetch audit logs:', err);
            setError('Fehler beim Laden der Systemprotokolle.');
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'TICKET_CREATED': return 'Ticket erstellt';
            case 'AI_CLASSIFIED': return 'KI-Analyse';
            case 'STATUS_CHANGED': return 'Status geändert';
            case 'EMAIL_SENT': return 'E-Mail gesendet';
            case 'EXTERNAL_SYNC_LOGGED': return 'Externer Sync';
            default: return action;
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="mb-10">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sicherheit & Compliance</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Systemprotokoll</h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl italic">Vollständige Transparenz über alle Aktivitäten und KI-Prozesse.</p>
                </div>

                {error && (
                    <div className="mb-8 p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-4">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-bold text-sm">{error}</p>
                        <button onClick={fetchLogs} className="ml-auto underline font-black text-[10px] uppercase tracking-widest">Wiederholen</button>
                    </div>
                )}

                <div className="bg-white shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden rounded-[2.5rem]">
                    {loading ? (
                        <div className="p-20 text-center">
                            <Loader2 className="animate-spin w-10 h-10 text-blue-600 mx-auto mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Protokoll wird geladen...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-6 opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-xs">Noch keine Aktivitäten protokolliert</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Zeitpunkt</th>
                                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aktion</th>
                                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akteur</th>
                                        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ziel-ID</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-6 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {new Date(log.created_at || log.createdAt || Date.now()).toLocaleDateString('de-CH')}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    {new Date(log.created_at || log.createdAt || Date.now()).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border border-blue-100 inline-block">
                                                    {getActionLabel(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{log.user?.name || (log.actor_user_id ? 'System' : 'Gast')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center space-x-2">
                                                    <Tag className="w-3 h-3 text-slate-300" />
                                                    <span className="font-mono text-[10px] text-slate-400">{log.target_id?.slice(0, 8)}...</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="text-xs font-medium text-slate-500 max-w-xs truncate">
                                                    {log.metadata_json ? JSON.stringify(log.metadata_json) : '---'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
