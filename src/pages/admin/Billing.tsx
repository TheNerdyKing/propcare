import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Building2,
    LayoutDashboard,
    Ticket,
    Users,
    LogOut,
    CreditCard,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Billing() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'INVOICE' | null>(null);

    // MOCK STATE - In reality, fetch from /api/billing
    const subscription = {
        status: 'TRIALING', // TRIALING, ACTIVE, PAST_DUE, CANCELED
        daysLeft: 3,
        plan: 'Professional',
    };

    const invoices = [
        { id: 'INV-2026-001', date: '2026-03-01', amount: 'CHF 199.00', status: 'PAID' }
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar - Shared compact style */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">PropCare.</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 ml-3">Menu</div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/properties')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
                    >
                        <Building2 className="w-5 h-5" />
                        <span>Properties</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/tickets')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium transition-all group"
                    >
                        <Ticket className="w-5 h-5" />
                        <span>Reports (Meldungen)</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/billing')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium transition-all"
                    >
                        <CreditCard className="w-5 h-5" />
                        <span>Billing & Plan</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm border border-slate-200">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.tenantName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-10 overflow-y-auto w-full max-w-[1000px] mx-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Plan</h2>
                    <p className="text-slate-500 mt-1">Manage your active subscription and payment methods.</p>
                </header>

                {/* Status Banner */}
                {subscription.status === 'TRIALING' && (
                    <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">You are currently on a 5-Day Free Trial.</h3>
                                <p className="text-blue-100 text-sm">You have {subscription.daysLeft} days left before your portfolio is locked. Add a payment method to ensure continuous service.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            Upgrade Now
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Active Plan Detail */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Current Plan</h3>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-3xl font-bold text-slate-900">{subscription.plan}</p>
                                <p className="text-slate-500 mt-1">Unlimited Properties</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-light text-slate-900">CHF 199<span className="text-sm text-slate-400">/mo</span></p>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Damage Analysis</li>
                            <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Contractor Geolocation</li>
                            <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Full Automation Suite</li>
                        </ul>

                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-white transition-colors text-sm"
                        >
                            Change Plan
                        </button>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Payment Method</h3>

                        <div className="flex flex-col items-center justify-center h-48 bg-slate-50 border border-slate-200 border-dashed rounded-xl mb-6">
                            <CreditCard className="w-8 h-8 text-slate-300 mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No active payment method.</p>
                        </div>

                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm"
                        >
                            <CreditCard className="w-4 h-4" /> Add Payment Method
                        </button>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900">Invoice History</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-500">Invoice ID</th>
                                <th className="px-6 py-4 font-semibold text-slate-500">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-500">Amount</th>
                                <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{inv.id}</td>
                                    <td className="px-6 py-4 text-slate-600">{inv.date}</td>
                                    <td className="px-6 py-4 text-slate-900">{inv.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wide">
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 font-medium hover:underline text-xs uppercase tracking-wide">Download PDF</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Stripe Checkout Mock Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Secure Checkout</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8">
                                <p className="text-slate-500 mb-6 text-sm">How would you like to pay for your <span className="font-bold text-slate-900">Professional Plan</span>?</p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <button
                                        onClick={() => setPaymentMethod('CARD')}
                                        className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'CARD' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                                    >
                                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'CARD' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className={`font-semibold ${paymentMethod === 'CARD' ? 'text-blue-900' : 'text-slate-600'}`}>Credit Card</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('INVOICE')}
                                        className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${paymentMethod === 'INVOICE' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                                    >
                                        <FileText className={`w-5 h-5 ${paymentMethod === 'INVOICE' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className={`font-semibold ${paymentMethod === 'INVOICE' ? 'text-blue-900' : 'text-slate-600'}`}>Bill via Invoice</span>
                                    </button>
                                </div>

                                {paymentMethod === 'CARD' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 mb-8">
                                        {/* Simulated Stripe Element */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Card Details</label>
                                            <div className="px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-inner text-slate-400 font-mono text-sm tracking-widest flex items-center justify-between">
                                                <span>•••• •••• •••• 4242</span>
                                                <span className="text-xs">MM/YY CVC</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Secured by Stripe Payments</p>
                                        </div>
                                    </motion.div>
                                )}

                                {paymentMethod === 'INVOICE' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-orange-50 border border-orange-100 rounded-xl mb-8">
                                        <p className="text-sm font-medium text-orange-800">Invoices will be automatically generated and emailed via PDFKit. Terms: Net 30 days.</p>
                                    </motion.div>
                                )}

                                <button
                                    disabled={!paymentMethod}
                                    onClick={() => setShowPaymentModal(false)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Confirm Subscription
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
