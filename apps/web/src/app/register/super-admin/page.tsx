'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldAlert, Copy, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

export default function SuperAdminSetup() {
    const router = useRouter();
    const [masterSecret, setMasterSecret] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<{ email: string; pass: string; secret: string } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setMasterSecret(`MS-${Math.random().toString(36).toUpperCase().slice(-8)}`);
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (inputValue !== masterSecret) {
                throw new Error('Der eingegebene Master-Secret ist ungültig.');
            }

            // Create or Find Global Tenant
            let { data: tenant, error: tError } = await supabase
                .from('tenants')
                .select('id')
                .eq('name', 'PropCare Global Administration')
                .single();

            if (!tenant) {
                // Try to insert with fallback for missing columns
                const insertData: any = { name: 'PropCare Global Administration' };

                const { data: newTenant, error: createTError } = await supabase
                    .from('tenants')
                    .insert([insertData])
                    .select()
                    .single();

                if (createTError) {
                    console.error('Tenant Create Error:', createTError);
                    // If it failed because of subscription_status, try to just find any tenant or ignore
                    throw new Error('Tenant konnte nicht erstellt werden. ' + createTError.message);
                }
                tenant = newTenant;
            }

            const tempEmail = `setup-${Math.floor(Math.random() * 10000)}@propcare.internal`;
            const tempPass = `Tmp_${Math.random().toString(36).slice(-8)}!`;
            const finalSetupSecret = masterSecret;

            // Create Admin User in Auth
            let authData: any;
            let authError: any;

            try {
                const result = await supabase.auth.signUp({
                    email: tempEmail,
                    password: tempPass,
                });
                authData = result.data;
                authError = result.error;
            } catch (e: any) {
                authError = e;
            }

            // Detect if the error is just the confirmation email failing (happens with unverified domains)
            const isEmailError = authError?.message?.toUpperCase().includes('EMAIL') || authError?.message?.toUpperCase().includes('CONFIRMATION');

            if (authError && !isEmailError) throw authError;

            // If it's an email error, try to fetch the user anyway in case it was created
            if (isEmailError && !authData?.user) {
                const { data: existingUser } = await supabase.from('users').select('id').eq('email', tempEmail).single();
                if (existingUser) {
                    authData = { user: existingUser };
                } else {
                    // It really failed
                    throw new Error('Supabase Email Error: Bitte deaktivieren Sie "Confirm Email" in Ihren Supabase Auth Einstellungen, da Ihre Domain noch nicht verifiziert ist.');
                }
            }

            if (!authData?.user?.id) {
                throw new Error('Benutzer konnte nicht erstellt werden (Auth ID fehlt).');
            }

            // Create in Users table
            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
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
            console.error('SuperAdmin Setup Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            if (credentials && typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(`Email: ${credentials.email}\nPasswort: ${credentials.pass}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                alert(`Email: ${credentials?.email}\nPasswort: ${credentials?.pass}`);
            }
        } catch (err) {
            console.error('Clipboard error:', err);
            alert('Kopieren fehlgeschlagen. Bitte markieren Sie den Text manuell.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1e293b] px-4 py-12 font-sans relative overflow-hidden">
            {/* Styling exactly like Login but more premium */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#475569_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

            <div className="max-w-[20rem] w-full space-y-6 p-7 rounded-[1.5rem] border border-white/5 bg-blue-950/60 backdrop-blur-3xl shadow-[0_0_30px_rgba(0,0,0,0.2)] ring-1 ring-white/10 relative">
                <div className="text-center">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)] transform rotate-45 group">
                        <ShieldAlert className="w-5 h-5 text-white -rotate-45" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white uppercase mb-1 leading-tight">
                        Admin <span className="text-red-500">Creation</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-[8px] uppercase tracking-[0.2em]">Initial System Setup</p>
                </div>

                {!credentials ? (
                    <form onSubmit={handleGenerate} className="space-y-8">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 text-center">Master Secret Verifizierung</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-500/50 group-focus-within:text-red-500 transition-colors">
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Secret hier eingeben..."
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-mono font-bold text-xs text-center tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 text-center">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 italic">Erforderlicher Schlüssel:</p>
                                <div
                                    onClick={() => {
                                        navigator.clipboard.writeText(masterSecret);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:bg-red-500/10 transition-all active:scale-[0.98]"
                                >
                                    <code className="text-[12px] font-mono font-black text-red-500 tracking-wider mx-auto">{masterSecret}</code>
                                    <div className="text-slate-500 group-hover:text-red-400 transition-colors">
                                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[9px] font-black uppercase text-center tracking-widest leading-relaxed">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] shadow-[0_0_15px_rgba(220,38,38,0.2)] flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Super Admin Erstellen'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                            <div>
                                <label className="text-[8px] uppercase font-black tracking-[0.2em] text-emerald-500 block mb-1">Einmal-Setup-Code</label>
                                <div className="text-white font-mono text-sm break-all bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-center font-black tracking-widest">{credentials?.secret}</div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <div>
                                    <label className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 block mb-1">E-Mail</label>
                                    <div className="text-white/60 font-mono text-[9px] break-all bg-white/5 p-2 rounded-lg border border-white/5">{credentials?.email}</div>
                                </div>
                                <div>
                                    <label className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 block mb-1">Passwort</label>
                                    <div className="text-white font-mono text-[11px] break-all bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 font-black text-emerald-400 tracking-tight">{credentials?.pass}</div>
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
