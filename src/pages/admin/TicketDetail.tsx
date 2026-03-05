import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Send,
  History,
  Bot,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Email Draft state
  const [draftTo, setDraftTo] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");

  useEffect(() => {
    fetch(`/api/tickets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTicket(data);
        setIsLoading(false);
        if (data.aiResult) {
          setDraftSubject(data.aiResult.draftEmailSubject || "");
          setDraftBody(data.aiResult.draftEmailBody || "");
          setDraftTo("contractor@example.com"); // Placeholder or dynamically chosen
        }
      })
      .catch(console.error);
  }, [id, token]);

  const sendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/tickets/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: draftTo, subject: draftSubject, body: draftBody })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("Auf propcare-api.vercel.app wird Folgendes angezeigt:\n\nFailed to send email: Request failed with status code " + res.status + ".\n\n" + (data.warning || data.error));
      } else {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000);
      }
    } catch (e: any) {
      alert("Failed to send email: " + e.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket({ ...ticket, status: updated.status });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/tickets")}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Tickets</span>
        </button>
        <div className="flex items-center space-x-3">
          <select
            value={ticket.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={isUpdating}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CONTRACTOR">Waiting for Contractor</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ticket Header Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{ticket.referenceId}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ticket.urgency === 'EMERGENCY' ? 'text-red-600 bg-red-50 border-red-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                    }`}>
                    {ticket.urgency}
                  </span>
                </div>
                <div className="flex items-center text-gray-500 space-x-4 text-sm">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {format(new Date(ticket.createdAt), "MMM d, yyyy HH:mm")}</span>
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {ticket.property.name}, {ticket.unit || 'Common Area'}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="bg-[#1A1A1A] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Bot className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-8">
                <Bot className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold">AI Analysis & Automation</h2>
              </div>

              {ticket.aiResult ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Classification</p>
                      <p className="text-lg font-semibold">{ticket.aiResult.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Suggested Contractors</p>
                      <div className="flex flex-col gap-2 mt-2">
                        {JSON.parse(ticket.aiResult.recommendedContractors).map((trade: string) => {
                          const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(trade)}+near+${encodeURIComponent(ticket.property.address)}`;
                          return (
                            <div key={trade} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                              <span className="font-medium">{trade}</span>
                              <a
                                href={mapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Find on Google Maps
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {ticket.aiResult.missingInfo && JSON.parse(ticket.aiResult.missingInfo).length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl">
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Missing Information Identified
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-orange-100/80">
                        {JSON.parse(ticket.aiResult.missingInfo).map((info: string, idx: number) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-2xl text-slate-800">
                    <p className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest mb-4 flex justify-between items-center">
                      <span>Review & Send AI Draft</span>
                      {emailSuccess && <span className="text-emerald-500 flex items-center gap-1 text-xs"><CheckCircle2 className="w-4 h-4" /> Sent</span>}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Recipient</label>
                        <input
                          type="email"
                          value={draftTo}
                          onChange={(e) => setDraftTo(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                        <input
                          type="text"
                          value={draftSubject}
                          onChange={(e) => setDraftSubject(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={6}
                          value={draftBody}
                          onChange={(e) => setDraftBody(e.target.value)}
                          className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    <button
                      onClick={sendEmail}
                      disabled={isSendingEmail}
                      className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Request to Contractor</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/60">AI analysis was not performed for this ticket.</p>
                  <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors">Run AI Analysis Now</button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline / Audit Log */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <History className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
            </div>
            <div className="space-y-6">
              {ticket.auditLogs.map((log: any) => (
                <div key={log.id} className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                    <div className="w-px h-full bg-gray-100 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-bold text-gray-900">{log.action.replace("_", " ")}</p>
                    <p className="text-xs text-gray-500 mb-1">{format(new Date(log.createdAt), "MMM d, HH:mm")}</p>
                    {log.details && <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg mt-1">{log.details}</p>}
                    {log.user && <p className="text-xs text-indigo-600 mt-1 font-medium">By {log.user.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Tenant Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{ticket.contactName}</p>
                  <p className="text-xs text-gray-500">Tenant</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{ticket.contactEmail}</span>
              </div>
              {ticket.contactPhone && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{ticket.contactPhone}</span>
                </div>
              )}
              <div className={`flex items-center space-x-3 p-3 rounded-xl border ${ticket.permissionToEnter ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold">
                  {ticket.permissionToEnter ? 'Permission to Enter Granted' : 'No Permission to Enter'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Property Details</h3>
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-900">{ticket.property.name}</p>
              <p className="text-sm text-gray-600">{ticket.property.address}</p>
              <p className="text-sm text-gray-600">{ticket.property.zipCode} {ticket.property.city}</p>
            </div>
            <button className="mt-4 w-full py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
              View Property Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
