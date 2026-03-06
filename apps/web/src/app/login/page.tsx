'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldCheck, Mail, Lock, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';
import Logo from '@/components/Logo';

const loginSchema = z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

type TicketFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [pendingUser, setPendingUser] = useState<any>(null);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [showSetupBox, setShowSetupBox] = useState(false);
    const [showAdminPortal, setShowAdminPortal] = useState(false);
    const [setupSecret, setSetupSecret] = useState('');
    const [setupResult, setSetupResult] = useState<any>(null);

    useEffect(() => {
        if (searchParams?.get('registered') === 'true') {
            setSuccess('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
        }
    }, [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TicketFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: TicketFormValues) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*, tenants(*)')
                .eq('id', authData.user.id)
                .single();

            const finalUser = userError ? authData.user : userData;

            if (finalUser.password_reset_required) {
                setPendingUser(finalUser);
                setShowResetForm(true);
                setLoading(false);
                return;
            }

            localStorage.setItem('user', JSON.stringify(finalUser));
            localStorage.setItem('accessToken', authData.session.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message === 'Invalid login credentials' ? 'Ungültige Zugangsdaten. Bitte prüfen Sie Ihre E-Mail und Ihr Passwort.' : 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    const handleInitialSetup = async (e: any) => {
        e.preventDefault();
        if (!newEmail || newPassword.length < 6) {
            setError('Bitte geben Sie eine gültige E-Mail und ein Passwort (min. 6 Zeichen) ein.');
            return;
        }

        setLoading(true);
        try {
            // 1. Update Password
            const { error: passError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (passError) throw passError;

            // 2. Update Email in Auth
            const { error: emailError } = await supabase.auth.updateUser({
                email: newEmail
            });
            if (emailError) throw emailError;

            // 3. Update User Record 
            const { error: dbError } = await supabase.from('users').update({
                email: newEmail,
                password_reset_required: false
            }).eq('id', pendingUser.id);

            if (dbError) throw dbError;

            // 4. Send Confirmation Email via API
            await fetch('/api/auth/setup-complete', {
                method: 'POST',
                body: JSON.stringify({ email: newEmail, name: pendingUser.name || 'Admin' })
            });

            setSuccess('Konto erfolgreich eingerichtet! Eine Bestätigungsmail wurde gesendet.');
            setEmailSent(true);

            localStorage.setItem('user', JSON.stringify({ ...pendingUser, email: newEmail, password_reset_required: false }));

            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (err: any) {
            setError('Setup fehlgeschlagen: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySetup = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/verify-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: setupSecret })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Ungültiger Code');

            setSetupResult({ email: data.email, pass: data.tempPass, name: data.name, role: data.role });
            setSuccess('Code verifiziert! Nutzen Sie die untenstehenden Daten zum Login.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (showSetupBox) {
        return (
            <div className="max-w-[20rem] w-full space-y-5 p-6 rounded-[1.5rem] border border-white/5 bg-blue-950/60 backdrop-blur-3xl shadow-[0_0_30px_rgba(0,0,0,0.2)] ring-1 ring-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px] pointer-events-none" />
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)] transform rotate-45 group">
                    <Lock className="w-4 h-4 text-white -rotate-45" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase mb-1 leading-tight text-center">
                    Admin <span className="text-emerald-500">Initialisierung</span>
                </h2>
                <p className="text-slate-500 font-medium text-[9px] italic text-center">Nur für Super-Admins beim ersten Login.</p>

                {!setupResult ? (
                    <form className="mt-8 space-y-4" onSubmit={handleVerifySetup}>
                        {error && (
                            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 animate-in fade-in zoom-in-95">
                                <div className="text-[10px] font-black uppercase text-red-400 tracking-widest text-center leading-relaxed">{error}</div>
                            </div>
                        )}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Setup-Code eingeben"
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold text-xs"
                                value={setupSecret}
                                onChange={(e) => setSetupSecret(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Code Prüfen'}
                        </button>
                        <button onClick={() => setShowSetupBox(false)} type="button" className="w-full text-[10px] text-slate-500 uppercase font-black tracking-widest hover:text-white transition-colors">
                            Abbrechen & Zurück zum Portal
                        </button>
                    </form>
                ) : (
                    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3">
                            <div>
                                <label className="text-[8px] uppercase font-black tracking-[0.2em] text-emerald-500 block mb-1">E-Mail</label>
                                <div className="text-white font-mono text-[10px] break-all font-bold">{setupResult.email}</div>
                            </div>
                            {setupResult.name && (
                                <div>
                                    <label className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 block mb-1">Inhaber / Name</label>
                                    <div className="text-white font-black text-[10px] tracking-tight">{setupResult.name}</div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => { setShowSetupBox(false); setSetupResult(null); }}
                            className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold uppercase tracking-[0.1em] text-[9px] flex items-center justify-center transition-all"
                        >
                            Fertig & Login
                        </button>
                        <p className="text-[8px] text-slate-500 text-center italic uppercase tracking-widest leading-relaxed">
                            Dieses Passwort ist zufällig für Sie generiert und nur einmal gültig.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (showAdminPortal) {
        return (
            <div className="max-w-[20rem] w-full space-y-5 p-6 rounded-[1.5rem] border border-white/5 bg-blue-950/60 backdrop-blur-3xl shadow-[0_0_30px_rgba(0,0,0,0.2)] ring-1 ring-white/10 relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px] pointer-events-none" />
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)] transform rotate-45 group">
                    <ShieldAlert className="w-5 h-5 text-white -rotate-45" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase mb-1 leading-tight">
                    Super Admin <span className="text-red-500">Portal</span>
                </h2>
                <p className="text-slate-500 font-medium text-[9px] italic">Plattform-Administration & Setup</p>

                <div className="mt-8 space-y-3">
                    <button
                        onClick={() => { setShowSetupBox(true); }}
                        className="w-full h-11 bg-white/5 hover:bg-emerald-500/10 text-white border border-white/5 rounded-lg font-bold uppercase tracking-[0.1em] text-[9px] flex items-center justify-center transition-all group"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                        Erster Login? Code verwenden
                    </button>

                    <Link
                        href="/register/super-admin"
                        className="w-full h-11 bg-white/5 hover:bg-red-500/10 text-white border border-white/5 rounded-lg font-bold uppercase tracking-[0.1em] text-[9px] flex items-center justify-center transition-all group"
                    >
                        <ShieldAlert className="w-3.5 h-3.5 mr-2 text-red-500 group-hover:scale-110 transition-transform" />
                        System initial einrichten
                    </Link>

                    <button
                        onClick={() => setShowAdminPortal(false)}
                        className="w-full pt-4 text-[10px] text-slate-500 uppercase font-black tracking-widest hover:text-white transition-colors"
                    >
                        Zurück zum Login
                    </button>
                </div>
            </div>
        );
    }

    if (showResetForm) {
        return (
            <div className="max-w-[22rem] w-full space-y-6 p-8 rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] pointer-events-none" />
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(37,99,235,0.3)] transform rotate-6">
                    <Sparkles className="w-5 h-5 text-white -rotate-6" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase mb-1 leading-tight">
                    Account <span className="text-blue-500">Initialisieren</span>
                </h2>
                <p className="text-slate-400 font-medium text-[10px] italic">Legen Sie Ihre echten Zugangsdaten fest.</p>

                <form className="mt-8 space-y-4" onSubmit={handleInitialSetup}>
                    {error && (
                        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 animate-in fade-in zoom-in-95">
                            <div className="text-[10px] font-black uppercase text-red-400 tracking-widest text-center leading-relaxed">{error}</div>
                        </div>
                    )}
                    {success && (
                        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 animate-in fade-in zoom-in-95">
                            <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest text-center leading-relaxed">{success}</div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="Ihre neue E-Mail Adresse"
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-xs"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Neues Passwort festlegen"
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || emailSent}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konto einrichten & starten'}
                    </button>
                    {!emailSent && (
                        <p className="text-[9px] text-slate-500 text-center italic leading-relaxed uppercase tracking-widest px-4">
                            Sie erhalten zur Sicherheit eine Bestätigungsmail via Resend.
                        </p>
                    )}
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-[20rem] w-full space-y-5 p-6 rounded-[1.5rem] border border-white/5 bg-blue-950/60 backdrop-blur-3xl shadow-[0_0_30px_rgba(0,0,0,0.2)] ring-1 ring-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px] pointer-events-none" />

            <div className="relative z-10 text-center mb-4 overflow-visible">
                <Logo showStatus light className="mx-auto" />
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {error && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] font-black uppercase text-red-400 tracking-widest text-center">{error}</div>
                    </div>
                )}
                {success && (
                    <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest text-center">{success}</div>
                    </div>
                )}

                <div className="space-y-5 font-sans">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <Mail className="w-4 h-4" />
                        </div>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="E-Mail Adresse"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-xs shadow-inner"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-widest">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <Lock className="w-4 h-4" />
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="Passwort"
                            className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm shadow-inner"
                        />
                        {errors.password && (
                            <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-widest">{errors.password.message}</p>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold uppercase tracking-[0.1em] text-[10px] shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                Jetzt Anmelden
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>

                <div className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pt-6 flex flex-col space-y-4">
                    <div>
                        Neu bei PropCare?{' '}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Konto Erstellen
                        </Link>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex flex-col space-y-3">
                        <button
                            type="button"
                            onClick={() => setShowAdminPortal(true)}
                            className="inline-flex items-center justify-center text-slate-600 hover:text-red-400 transition-all font-bold group"
                        >
                            <ShieldAlert className="w-3 h-3 mr-2 group-hover:rotate-12 transition-transform" />
                            Super Admin Portal
                        </button>
                    </div>
                </div>
            </form>

            <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                <ShieldCheck className="w-4 h-4" />
                <span>Gesicherte SSL Verschlüsselung</span>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#334155] py-8 px-4 font-sans relative overflow-hidden">
            {/* Enhanced radial gradients for a more "luminous" feel */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#475569_0%,transparent_50%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-700" />

            <Suspense fallback={<div className="text-white"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
