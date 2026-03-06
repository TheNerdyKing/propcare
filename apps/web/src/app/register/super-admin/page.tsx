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
    const [credentials, setCredentials] = useState<{ email: string; pass: string } | null>(null);
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
                    password_reset_required: true
                }]);

            if (userError) throw userError;

            setCredentials({ email: tempEmail, pass: tempPass });
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
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 py-12 font-sans relative overflow-hidden">
            {/* Styling exactly like Login but more premium */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-[28rem] w-full space-y-10 p-12 rounded-[2.5rem] border border-white/5 bg-slate-900/60 backdrop-blur-3xl shadow-2xl relative">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/30 transform rotate-45 group">
                        <ShieldAlert className="w-8 h-8 text-white -rotate-45" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase mb-2">
                        Super Admin <span className="text-red-500">Erstellung</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-xs italic">Sicherheitskritischer Bereich.</p>
                </div>

                {!credentials ? (
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-400 transition-colors">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                required
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Geben Sie den Master-Secret ein"
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all font-bold text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-[0.1em] text-[11px] shadow-lg shadow-red-600/20 flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initial-Zugang Generieren'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500 block mb-1">Generated Email</label>
                                <div className="text-white font-mono text-sm break-all bg-white/5 p-3 rounded-lg border border-white/5">{credentials.email}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500 block mb-1">Generated Password</label>
                                <div className="text-white font-mono text-sm break-all bg-white/5 p-3 rounded-lg border border-white/5">{credentials.pass}</div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={copyToClipboard}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-[0.1em] text-[11px] flex items-center justify-center transition-all"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copied ? 'Kopiert' : 'Zugangsdaten Kopieren'}
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold uppercase tracking-[0.1em] text-[11px] flex items-center justify-center transition-all"
                            >
                                Zum Login <ArrowRight className="w-4 h-4 ml-2" />
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
