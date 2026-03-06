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
});

type TicketFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TicketFormValues>({
        resolver: zodResolver(registerSchema),
    });

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

            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    tenant_id: tenantData.id,
                    email: data.email,
                    name: data.name,
                    role: 'ADMIN',
                    password_hash: 'managed-by-supabase'
                }]);

            if (userError) throw userError;

            router.push('/login?registered=true');
        } catch (err: any) {
            console.error('Registration error details:', err);
            setError(err.message === 'User already registered' ? 'Diese E-Mail-Adresse wird bereits verwendet.' : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#1e293b_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full space-y-10 p-12 rounded-[3.5rem] border border-white/5 bg-slate-900/60 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl p-1 pointer-events-none" />

                <div className="relative z-10 text-center mb-10 overflow-visible">
                    <Logo light showStatus className="mx-auto scale-110" />
                </div>

                <form className="mt-10 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="text-[10px] font-black uppercase text-red-400 tracking-widest text-center">{error}</div>
                        </div>
                    )}

                    <div className="space-y-4 font-sans">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <Building className="w-4 h-4" />
                            </div>
                            <input
                                {...register('tenantName')}
                                placeholder="Name der Hausverwaltung"
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm shadow-inner"
                            />
                            {errors.tenantName && (
                                <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-widest">{errors.tenantName.message}</p>
                            )}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                {...register('name')}
                                placeholder="Ihr vollständiger Name"
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm shadow-inner"
                            />
                            {errors.name && (
                                <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-widest">{errors.name.message}</p>
                            )}
                        </div>

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
                            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group font-sans"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Konto Jetzt Erstellen
                                    <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
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

                <div className="mt-10 flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Gesicherte SSL Verschlüsselung</span>
                </div>
            </div>
        </div>
    );
}
