'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldAlert, Copy, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

export default function SuperAdminSetup() {
    const router = useRouter();
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<{ email: string; pass: string; secret: string } | null>(null);
    const [setupCode, setSetupCode] = useState(`ADM-${Math.random().toString(36).toUpperCase().slice(-8)}`);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // In a real app, this secret would be in process.env
            // Using 'KREATIVEROCKET2026' as the master secret
            if (secret !== 'KREATIVEROCKET2026') {
                throw new Error('Ungültiger Master-Secret-Code.');
            }

            // Create or Find Global Tenant
            let { data: tenant, error: tError } = await supabase
                .from('tenants')
                .select('id')
                .eq('name', 'PropCare Global Administration')
                .single();

            if (!tenant) {
                const { data: newTenant, error: createTError } = await supabase
                    .from('tenants')
                    .insert([{
                        name: 'PropCare Global Administration',
                        subscription_status: 'ACTIVE',
                        subscription_plan: 'PLATFORM'
                    }])
                    .select()
                    .single();
                if (createTError) throw createTError;
                tenant = newTenant;
            }

            const tempEmail = `setup-${Math.floor(Math.random() * 10000)}@propcare.internal`;
            const tempPass = `Tmp_${Math.random().toString(36).slice(-8)}!`;
            const finalSetupSecret = setupCode;

            // Create Admin User in Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: tempEmail,
                password: tempPass,
            });

            if (authError) throw authError;

            // Create in Users table
            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user?.id,
                    tenant_id: tenant.id,
                    email: tempEmail,
                    name: 'Super Admin Initial',
                    role: 'SUPER_ADMIN',
                    password_hash: 'managed-by-supabase',
                    password_reset_required: true,
                    setup_secret: finalSetupSecret
                }]);

            if (userError) throw userError;

            setCredentials({ email: tempEmail, pass: tempPass, secret: finalSetupSecret });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (credentials) {
            navigator.clipboard.writeText(`Email: ${credentials.email}\nPasswort: ${credentials.pass}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1e293b] px-4 py-12 font-sans relative overflow-hidden">
            {/* Styling exactly like Login but more premium */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#334155_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-[22rem] w-full space-y-6 p-8 rounded-[2rem] border border-white/5 bg-slate-900/60 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative">
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(220,38,38,0.3)] transform rotate-45 group">
                        <ShieldAlert className="w-6 h-6 text-white -rotate-45" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white uppercase mb-1 leading-tight">
                        Super Admin <span className="text-red-500">Erstellung</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-[10px] italic">Sicherheitskritischer Bereich.</p>
                </div>

                {!credentials ? (
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-400 transition-colors">
                                    <Lock className="w-3.5 h-3.5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Master-Secret (KREATIVEROCKET2026)"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all font-bold text-xs shadow-inner"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1">Ihr Setup-Pinn (Zufällig generiert)</label>
                                <div className="flex space-x-2">
                                    <div className="relative flex-1 group">
                                        <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={setupCode}
                                            onChange={(e) => setSetupCode(e.target.value)}
                                            placeholder="Setup Code"
                                            className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-mono font-bold text-xs shadow-inner"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSetupCode(`ADM-${Math.random().toString(36).toUpperCase().slice(-8)}`)}
                                        className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all group"
                                    >
                                        <Loader2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] shadow-[0_0_15px_rgba(220,38,38,0.2)] flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zugang Generieren'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <div>
                                <label className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500 block mb-2">Einmal-Setup-Code</label>
                                <div className="text-white font-mono text-lg break-all bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center font-black tracking-widest">{credentials.secret}</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 block mb-1">E-Mail</label>
                                    <div className="text-white/60 font-mono text-[10px] break-all bg-white/5 p-2 rounded-lg border border-white/5">{credentials.email}</div>
                                </div>
                                <div>
                                    <label className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 block mb-1">Passwort</label>
                                    <div className="text-white/60 font-mono text-[10px] break-all bg-white/5 p-2 rounded-lg border border-white/5">{credentials.pass}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={copyToClipboard}
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] flex items-center justify-center transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copied ? 'Kopiert' : 'Daten Kopieren'}
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] flex items-center justify-center transition-all"
                            >
                                Zum Login <ArrowRight className="w-3 h-3 ml-2" />
                            </button>
                        </div>

                        <p className="text-[9px] text-slate-500 text-center italic leading-relaxed uppercase tracking-widest">
                            DIESE DATEN SIND NUR EINMALIG GÜLTIG. NACH DEM LOGIN MÜSSEN SIE IHRE ECHTE E-MAIL UND IHR PASSWORT FESTLEGEN.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
