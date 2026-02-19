'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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
            const response = await api.post('/auth/register', data);
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Registration error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: err.config
            });
            const apiMessage = err.response?.data?.message;
            const status = err.response?.status;

            if (!err.response) {
                setError(`Cannot reach API at "${err.config?.baseURL}". Check if your backend is running and NEXT_PUBLIC_API_URL is set.`);
            } else {
                setError(apiMessage || `Error ${status}: Registration failed.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        Create PropCare Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400">
                        Start managing your properties with AI
                    </p>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                            <div className="text-sm text-red-400">{error}</div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <input
                                {...register('tenantName')}
                                placeholder="Management Company Name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                            {errors.tenantName && (
                                <p className="text-red-400 text-xs mt-1 px-1">{errors.tenantName.message}</p>
                            )}
                        </div>

                        <div>
                            <input
                                {...register('name')}
                                placeholder="Your Name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                            {loading ? 'Creating Account...' : 'Get Started Now'}
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-400 pt-2">
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
