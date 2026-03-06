'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldCheck, Mail, Lock, User, Building, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

const registerSchema = z.object({
    tenantName: z.string().min(2, 'Name der Hausverwaltung ist erforderlich'),
    name: z.string().min(2, 'Ihr Name ist erforderlich'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    setupCode: z.string().min(4, 'Setup-Code ist erforderlich'),
});

type TicketFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [setupSecret, setSetupSecret] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TicketFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            setupCode: `REG-${Math.random().toString(36).toUpperCase().slice(-8)}`
        }
    });

    const currentSetupCode = watch('setupCode');

    const generateNewCode = () => {
        setValue('setupCode', `REG-${Math.random().toString(36).toUpperCase().slice(-8)}`);
    };

    const onSubmit = async (data: TicketFormValues) => {
        setLoading(true);
        setError(null);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.name,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Registrierung fehlgeschlagen');

            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .insert([{ name: data.tenantName }])
                .select()
                .single();

            if (tenantError) throw tenantError;

            const uniqueSecret = `REG-${Math.random().toString(36).toUpperCase().slice(-8)}`;

            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    tenant_id: tenantData.id,
                    email: data.email,
                    name: data.name,
                    role: 'ADMIN',
                    password_hash: 'managed-by-supabase',
                    setup_secret: data.setupCode,
                    password_reset_required: false
                }]);

            if (userError) throw userError;

            setSetupSecret(data.setupCode);
        } catch (err: any) {
            console.error('Registration error details:', err);
            setError(err.message === 'User already registered' ? 'Diese E-Mail-Adresse wird bereits verwendet.' : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1e293b] py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#334155_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[22rem] w-full space-y-8 p-8 rounded-[2rem] border border-white/5 bg-slate-900/60 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl p-1 pointer-events-none" />

                <div className="relative z-10 text-center mb-6 overflow-visible">
                    <Logo light showStatus className="mx-auto scale-90" />
                </div>

                {setupSecret ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Erfolgreich!</h2>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Ihr Account wurde erstellt. Sichern Sie Ihren Zugangsschlüssel:</p>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center ring-1 ring-emerald-500/10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2">Setup-Code</p>
                            <p className="text-2xl font-mono font-black text-white tracking-widest bg-emerald-500/10 py-3 rounded-lg border border-emerald-500/30">{setupSecret}</p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center transition-all"
                            >
                                Jetzt Anmelden <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                            <p className="text-[9px] text-slate-500 text-center italic leading-relaxed uppercase tracking-widest px-8">
                                Bewahren Sie diesen Code sicher auf. Er kann für den ersten Login oder zur Verifizierung genutzt werden.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form className="mt-10 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        {error && (
                            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 animate-in fade-in slide-in-from-top-2">
                                <div className="text-[10px] font-black uppercase text-red-400 tracking-widest text-center">{error}</div>
                            </div>
                        )}

                        <div className="space-y-4 font-sans">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <Building className="w-3.5 h-3.5" />
                                </div>
                                <input
                                    {...register('tenantName')}
                                    placeholder="Name der Hausverwaltung"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-xs shadow-inner"
                                />
                                {errors.tenantName && (
                                    <p className="text-red-400 text-[9px] font-black uppercase mt-1.5 ml-1 tracking-widest">{errors.tenantName.message}</p>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <input
                                    {...register('name')}
                                    placeholder="Ihr vollständiger Name"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-xs shadow-inner"
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-[9px] font-black uppercase mt-1.5 ml-1 tracking-widest">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <Mail className="w-3.5 h-3.5" />
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="E-Mail Adresse"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-xs shadow-inner"
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-[9px] font-black uppercase mt-1.5 ml-1 tracking-widest">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <Lock className="w-3.5 h-3.5" />
                                </div>
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="Passwort"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-xs shadow-inner"
                                />
                                {errors.password && (
                                    <p className="text-red-400 text-[9px] font-black uppercase mt-1.5 ml-1 tracking-widest">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="pt-4 pb-2 border-t border-white/5 space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1">Setup-Secret (Für ersten Login)</label>
                                <div className="flex space-x-2">
                                    <div className="relative flex-1 group">
                                        <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            {...register('setupCode')}
                                            placeholder="Ihr Setup-Code"
                                            className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-mono font-bold text-xs shadow-inner"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateNewCode}
                                        className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all group"
                                        title="Neuen Code generieren"
                                    >
                                        <Loader2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>
                                {errors.setupCode && (
                                    <p className="text-red-400 text-[9px] font-black uppercase mt-1.5 ml-1 tracking-widest">{errors.setupCode.message}</p>
                                )}
                                <p className="text-[8px] text-slate-500 uppercase tracking-widest italic leading-relaxed px-1">
                                    Dies ist Ihr persönlicher Schlüssel für den Portal-Zugang.
                                </p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group font-sans"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        Konto Jetzt Erstellen
                                        <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pt-4 font-sans">
                            Bereits registriert?{' '}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                                Hier anmelden
                            </Link>
                        </div>
                    </form>
                )}

                <div className="mt-10 flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Gesicherte SSL Verschlüsselung</span>
                </div>
            </div>
        </div>
    );
}
