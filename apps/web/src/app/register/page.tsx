'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const registerSchema = z.object({
    tenantName: z.string().min(2, 'Company name is required'),
    name: z.string().min(2, 'Your name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Sign up with Supabase Auth
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
            if (!authData.user) throw new Error('Signup failed');

            // 2. Create Tenant (direct to public.tenants)
            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .insert([{ name: data.tenantName }])
                .select()
                .single();

            if (tenantError) throw tenantError;

            // 3. Create User profile (direct to public.users)
            // We link the UUID to the Supabase Auth UUID
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

            // 4. Success -> Dashboard
            // Note: If email confirmation is required, user may need to check email first.
            // But by default for prototypes, it's often disabled.
            router.push('/login?registered=true');
        } catch (err: any) {
            console.error('Registration error details:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white font-sans">
                        Create PropCare Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400 font-sans">
                        Direct Supabase Connection Active
                    </p>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                            <div className="text-sm text-red-400 font-sans">{error}</div>
                        </div>
                    )}

                    <div className="space-y-4 font-sans">
                        <div>
                            <input
                                {...register('tenantName')}
                                placeholder="Management Company Name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.tenantName && (
                                <p className="text-red-400 text-xs mt-1 px-1">{errors.tenantName.message}</p>
                            )}
                        </div>

                        <div>
                            <input
                                {...register('name')}
                                placeholder="Your Name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.name && (
                                <p className="text-red-400 text-xs mt-1 px-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="Work Email"
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
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-300 disabled:opacity-50 font-sans"
                        >
                            {loading ? 'Creating Account...' : 'Get Started Now'}
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-400 pt-2 font-sans">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            Sign in here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
