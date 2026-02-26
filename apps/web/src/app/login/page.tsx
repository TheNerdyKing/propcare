'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldCheck, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

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

            if (userError) {
                localStorage.setItem('user', JSON.stringify(authData.user));
            } else {
                localStorage.setItem('user', JSON.stringify(userData));
            }

            localStorage.setItem('accessToken', authData.session.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message === 'Invalid login credentials' ? 'Ungültige Zugangsdaten. Bitte prüfen Sie Ihre E-Mail und Ihr Passwort.' : 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full space-y-10 p-12 rounded-[3.5rem] border border-white/5 bg-slate-900/60 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl p-1 pointer-events-none" />
            
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/20 transform -rotate-6">
                    <span className="text-white font-black text-2xl">PC</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">
                    Prop<span className="text-blue-500">Care</span>
                </h2>
                <p className="text-slate-400 font-medium text-sm italic">
                    Ihre Zentrale für effizientes Immobilienmanagement.
                </p>
            </div>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                            className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm shadow-inner"
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

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Jetzt Anmelden
                                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>

                <div className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pt-4">
                    Neu bei PropCare?{' '}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                        Konto Erstellen
                    </Link>
                </div>
            </form>
            
            <div className="mt-10 flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Gesicherte SSL Verschlüsselung</span>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />
            
            <Suspense fallback={<div className="text-white"><Loader2 className="animate-spin text-blue-600" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
