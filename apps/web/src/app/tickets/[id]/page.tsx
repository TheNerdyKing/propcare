'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messageContent, setMessageContent] = useState('');
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'CONVERSATION'>('DETAILS');
    const [selectedContractor, setSelectedContractor] = useState<any>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [showEmailEditor, setShowEmailEditor] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    useEffect(() => {
        if (ticket?.aiResults?.[0]?.outputJson) {
            const ai = ticket.aiResults[0].outputJson;
            if (ai.contractors?.length > 0 && !selectedContractor) {
                handleContractorSelect(ai.contractors[0]);
            }
        }
    }, [ticket]);

    const fetchTicket = async () => {
        try {
            const response = await api.get(`/tickets/${id}`);
            setTicket(response.data);
        } catch (err) {
            console.error('Failed to fetch ticket', err);
        } finally {
            setLoading(false);
        }
    };

    const handleContractorSelect = (c: any) => {
        setSelectedContractor(c);
        const ai = ticket?.aiResults?.[0]?.outputJson;
        setEmailSubject(`Maintenance Request: ${ticket?.referenceCode} - ${ai?.category || 'General'}`);
        setEmailBody(ai?.emailDraft || '');
        setShowEmailEditor(true);
    };

    const sendContractorEmail = async () => {
        if (!selectedContractor) return;
        setIsSendingEmail(true);
        try {
            await api.post(`/tickets/${id}/send-contractor-email`, {
                to: selectedContractor.email || 'contractor@example.com',
                subject: emailSubject,
                body: emailBody,
            });
            alert('Email sent successfully!');
            setShowEmailEditor(false);
            fetchTicket();
        } catch (err) {
            console.error('Failed to send email', err);
            alert('Failed to send email.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            await api.patch(`/tickets/${id}`, { status: newStatus });
            fetchTicket();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const sendMessage = async () => {
        if (!messageContent.trim()) return;
        try {
            await api.post(`/tickets/${id}/messages`, { content: messageContent });
            setMessageContent('');
            fetchTicket();
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const reprocessAi = async () => {
        try {
            await api.post(`/tickets/${id}/reprocess-ai`);
            alert('AI reprocessing started!');
            fetchTicket();
        } catch (err) {
            console.error('Failed to reprocess AI', err);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading ticket details...</div>;
    if (!ticket) return <div className="p-8 text-center text-gray-500 font-medium">Ticket not found.</div>;

    const aiResult = ticket.aiResults?.[0]?.outputJson;

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-indigo-600 font-semibold flex items-center transition-colors">
                    <span className="mr-2">←</span> Back to Dashboard
                </button>
                <div className="flex items-center space-x-3">
                    <div className="flex bg-white rounded-lg shadow-sm border p-1 mr-4">
                        <button
                            onClick={() => setActiveTab('DETAILS')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'DETAILS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Report Details
                        </button>
                        <button
                            onClick={() => setActiveTab('CONVERSATION')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'CONVERSATION' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Conversation ({ticket.messages?.length || 0})
                        </button>
                    </div>

                    <button
                        onClick={() => updateStatus('IN_PROGRESS')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500 text-white shadow-md shadow-yellow-100' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                    >
                        In Progress
                    </button>
                    <button
                        onClick={() => updateStatus('COMPLETED')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ticket.status === 'COMPLETED' ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'bg-white border text-gray-700 hover:bg-gray-50 shadow-sm'}`}
                    >
                        Mark Completed
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'DETAILS' ? (
                        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl p-8 border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 border-b border-gray-100 pb-4">Tenant Report</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Reference Code</p>
                                    <p className="font-mono text-lg font-bold text-indigo-600">{ticket.referenceCode}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Current Status</p>
                                    <p className="text-lg font-bold text-gray-800">{ticket.status}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Property & Address</p>
                                    <p className="font-bold text-gray-800 text-base">{ticket.property?.name || 'N/A'}</p>
                                    <p className="text-gray-500">{ticket.unitLabel ? `Unit: ${ticket.unitLabel}` : 'Main Property'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-1">Tenant Information</p>
                                    <p className="font-bold text-gray-800 text-base">{ticket.tenantName}</p>
                                    <p className="text-gray-500">{ticket.tenantEmail}</p>
                                    <p className="text-gray-500">{ticket.tenantPhone || 'No phone provided'}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-2">Description of Issue</p>
                                <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-50">
                                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base italic">"{ticket.description}"</p>
                                </div>
                            </div>

                            {ticket.attachments && ticket.attachments.length > 0 && (
                                <div>
                                    <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-4">Attached Documents</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {ticket.attachments.map((att: any) => (
                                            <div key={att.id} className="group aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-center p-4">
                                                <div className="text-center">
                                                    <div className="text-2xl mb-1">📄</div>
                                                    <div className="text-[10px] font-bold text-gray-500 truncate max-w-full uppercase">{att.fileName}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 flex flex-col h-[700px]">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                                <h2 className="text-xl font-black text-gray-900">Tenant Communication</h2>
                                <p className="text-sm text-gray-500">Messages sent here will be visible to the tenant on their status page.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {ticket.messages?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="font-bold text-gray-900">No messages yet</p>
                                        <p className="text-sm">Start a conversation with the tenant.</p>
                                    </div>
                                ) : (
                                    ticket.messages.map((msg: any) => (
                                        <div key={msg.id} className={`flex ${msg.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.senderType === 'STAFF' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                <div className="flex items-center justify-between mb-1 gap-4">
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                                                        {msg.senderType === 'STAFF' ? 'Our Team' : 'Tenant'}
                                                    </span>
                                                    <span className="text-[9px] opacity-70">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                                <div className="relative">
                                    <textarea
                                        className="w-full border-gray-200 rounded-2xl pr-24 pl-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                                        placeholder="Type your message to the tenant..."
                                        rows={3}
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="absolute right-3 bottom-3 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showEmailEditor && (
                        <div className="bg-white shadow-2xl shadow-indigo-100/50 rounded-2xl p-8 border-2 border-indigo-100 animate-in zoom-in-95 duration-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <span className="mr-2">✉</span> Email to {selectedContractor?.name}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Subject</label>
                                    <input
                                        type="text"
                                        className="w-full border-gray-300 rounded-md text-sm"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Message Content</label>
                                    <textarea
                                        rows={10}
                                        className="w-full border-gray-300 rounded-md text-sm font-mono"
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowEmailEditor(false)}
                                        className="px-4 py-2 text-gray-600 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={sendContractorEmail}
                                        disabled={isSendingEmail}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        {isSendingEmail ? 'Sending...' : 'Send Contractor Email'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: AI Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 shadow-sm sticky top-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                                <span className="mr-2">✨</span> AI Assistance
                            </h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ticket.aiResults?.length > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                {ticket.aiResults?.length > 0 ? 'Ready' : 'Processing'}
                            </span>
                        </div>

                        {!aiResult ? (
                            <p className="text-indigo-600 text-sm animate-pulse">Running analysis job...</p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-indigo-800 text-xs font-bold uppercase mb-1">Classification</p>
                                    <p className="text-indigo-900 font-medium capitalize bg-white px-3 py-2 rounded border border-indigo-200">
                                        {aiResult.category || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-indigo-800 text-xs font-bold uppercase mb-1">Urgency</p>
                                    <p className={`font-bold px-3 py-2 rounded border ${aiResult.urgency === 'EMERGENCY' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-indigo-900 border-indigo-200'}`}>
                                        {aiResult.urgency || 'Normal'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-indigo-800 text-xs font-bold uppercase mb-2">Suggested Contractors</p>
                                    {aiResult.contractors?.length > 0 ? (
                                        <ul className="space-y-2">
                                            {aiResult.contractors.map((c: any, idx: number) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => handleContractorSelect(c)}
                                                    className={`bg-white p-3 rounded border shadow-sm flex items-center justify-between hover:border-indigo-400 transition-all cursor-pointer ${selectedContractor?.id === c.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-indigo-200'}`}
                                                >
                                                    <div>
                                                        <p className="font-bold text-indigo-900">{c.name}</p>
                                                        <p className="text-xs text-indigo-700">{c.trade} • {c.matchScore}% Match</p>
                                                    </div>
                                                    <span className="text-xl">➔</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-indigo-600 italic">No matching contractors found.</p>
                                    )}
                                </div>

                                <div className="pt-4 mt-4 border-t border-indigo-200">
                                    <button
                                        onClick={() => setShowEmailEditor(!showEmailEditor)}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center"
                                    >
                                        <span className="mr-2">✉</span> {showEmailEditor ? 'Hide Editor' : 'Proceed to Email'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {ticket.auditLogs && ticket.auditLogs.length > 0 && (
                        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Audit Log</h2>
                            <div className="space-y-4">
                                {ticket.auditLogs.map((log: any) => (
                                    <div key={log.id} className="text-xs border-l-2 border-gray-200 pl-3 py-1">
                                        <p className="font-semibold text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                                        <p className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
