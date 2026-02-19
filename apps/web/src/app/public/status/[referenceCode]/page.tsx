'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';

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
            const response = await api.get(`/public/tickets/${referenceCode}`);
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
            await api.post(`/public/tickets/${referenceCode}/messages`, { content: messageContent });
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white shadow-xl shadow-gray-200/50 rounded-3xl p-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-indigo-600 font-black text-2xl uppercase tracking-tighter">PropCare</span>
                            <span className="h-6 w-[2px] bg-gray-200"></span>
                            <span className="text-gray-400 font-bold text-sm tracking-widest uppercase">Status Portal</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight"> Maintenance Report</h1>
                        <p className="text-gray-500 font-mono text-sm mt-1">Ref: <span className="text-indigo-600 font-bold">{referenceCode}</span></p>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl border-2 text-center font-black uppercase tracking-widest text-sm shadow-sm ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace(/_/g, ' ')}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Report Summary</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Created On</p>
                                    <p className="text-gray-800 font-bold">{new Date(ticket.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Property</p>
                                    <p className="text-gray-800 font-bold">{ticket.property?.name || 'Main Residence'}</p>
                                    {ticket.unitLabel && <p className="text-gray-500 text-sm">Unit: {ticket.unitLabel}</p>}
                                </div>
                                <div className="pt-4 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Description</p>
                                    <p className="text-gray-600 text-sm leading-relaxed italic">"{ticket.description}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                            <h3 className="font-black mb-2 text-lg">Need Help?</h3>
                            <p className="text-indigo-100 text-sm mb-4 leading-relaxed">If you have urgent questions, please use the chat or contact your property manager directly.</p>
                            <div className="bg-indigo-500/50 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                                <span className="text-xl">📞</span> Emergency: +41 00 000 00 00
                            </div>
                        </div>
                    </div>

                    {/* Right: Conversation */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 flex flex-col h-[600px]">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Communication Thread</h2>
                                    <p className="text-sm text-gray-500 font-medium">Support team interactive chat</p>
                                </div>
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                                {ticket.messages?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                        <div className="text-6xl mb-4">📨</div>
                                        <p className="font-extrabold text-gray-900 text-lg">No messages yet</p>
                                        <p className="text-sm max-w-[200px] mx-auto">Feel free to send a message to the facility manager.</p>
                                    </div>
                                ) : (
                                    ticket.messages.map((msg: any) => (
                                        <div key={msg.id} className={`flex ${msg.senderType === 'TENANT' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md border ${msg.senderType === 'TENANT' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'}`}>
                                                <div className="flex items-center justify-between mb-1 gap-6">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${msg.senderType === 'TENANT' ? 'opacity-80' : 'text-indigo-600'}`}>
                                                        {msg.senderType === 'TENANT' ? 'You' : 'Staff Member'}
                                                    </span>
                                                    <span className={`text-[9px] font-bold ${msg.senderType === 'TENANT' ? 'opacity-60' : 'text-gray-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl">
                                <div className="relative group">
                                    <textarea
                                        className="w-full border-2 border-gray-100 rounded-2xl pr-28 pl-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all resize-none group-hover:border-gray-200"
                                        placeholder="Type your reply here..."
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
                                        disabled={isSending || !messageContent.trim()}
                                        className="absolute right-3 bottom-3 bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-1"
                                    >
                                        {isSending ? 'Sending' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
