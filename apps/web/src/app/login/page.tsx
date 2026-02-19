'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchParams?.get('registered') === 'true') {
            setSuccess('Registration successful! You can now sign in.');
        }
    }, [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // 1. Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;

            // 2. Fetch User Profile from our custom table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*, tenants(*)')
                .eq('id', authData.user.id)
                .single();

            if (userError) {
                console.warn('User profile not found in custom table:', userError);
                // Fallback: Use basic auth info if profile fetch fails
                localStorage.setItem('user', JSON.stringify(authData.user));
            } else {
                localStorage.setItem('user', JSON.stringify(userData));
            }

            localStorage.setItem('accessToken', authData.session.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        PropCare Login
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400">
                        Sign in with Supabase Auth
                    </p>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                            <div className="text-sm text-red-400">{error}</div>
                        </div>
                    )}
                    {success && (
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/50 p-4">
                            <div className="text-sm text-emerald-400">{success}</div>
                        </div>
                    )}

                    <div className="space-y-4 font-sans">
                        <div>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="Email address"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1 px-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1 px-1">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-300 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-400 pt-2 font-sans">
                        New to PropCare?{' '}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            Create an account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
