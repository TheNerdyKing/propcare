import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, Lock, Mail, ArrowRight, Home } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Decoration Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-blue-900 mix-blend-multiply opacity-60 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80"
          alt="Modern Swiss Real Estate property"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="relative z-20 p-16 text-white max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-12 h-12 text-blue-300" />
              <span className="text-4xl font-bold tracking-tight">PropCare.</span>
            </div>
            <h1 className="text-5xl font-light mb-6 leading-tight">
              Smarter Property Management.
            </h1>
            <p className="text-xl text-blue-100 font-light opacity-90 mb-12">
              Automate damage analysis, coordinate contractors seamlessly, and deliver exceptional experiences for your tenants.
            </p>
            <div className="flex gap-4 items-center">
              <div className="h-1 w-12 bg-blue-400 rounded-full"></div>
              <div className="h-1 w-4 bg-white/30 rounded-full"></div>
              <div className="h-1 w-4 bg-white/30 rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-slate-800 tracking-tight">PropCare.</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your administration portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-600"></div>
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                    placeholder="admin@demo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-4"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-slate-400">
              Demo Access: admin@demo.com / password123
            </p>
            <p className="text-xs font-semibold text-red-400 mt-2 bg-red-50/50 px-3 py-1 rounded-full">
              <a href="/superadmin">Master Access: Click here for Global Agencies Dashboard</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
