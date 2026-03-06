'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, Info, Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <main className="min-h-screen bg-[#1e293b] flex flex-col relative overflow-hidden text-white">
            {/* Header with Navigation */}
            <header className="relative w-full z-50 bg-[#1e293b]/50 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 md:h-24 flex items-center justify-between">
                    <Logo />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/login" className="px-6 py-2.5 bg-white border border-slate-200 text-xs font-black text-slate-600 hover:text-blue-600 hover:border-blue-400 rounded-full uppercase tracking-widest transition-all shadow-sm hover:shadow-md">
                            Verwaltung Login
                        </Link>
                    </nav>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-[100%] left-0 w-full bg-[#1e293b] border-b border-white/10 shadow-xl px-6 py-6 animate-in slide-in-from-top-2 z-50">
                        <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="block w-full py-3 bg-white/5 border border-white/10 text-center text-[10px] font-black text-slate-300 hover:text-white hover:bg-white/10 rounded-xl uppercase tracking-[0.2em] transition-colors"
                        >
                            Verwaltung Login
                        </Link>
                    </div>
                )}
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full z-10">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 text-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-3 leading-tight">
                            Willkommen beim <span className="text-blue-400">Mieterportal</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm italic">
                            Wie können wir Ihnen heute helfen?
                        </p>
                    </div>

                    <Link
                        href="/schadensmeldung"
                        className="group bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all flex flex-col items-center text-center ring-1 ring-white/5"
                    >
                        <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                            <Wrench className="w-6 h-6 text-blue-400 group-hover:text-white" />
                        </div>
                        <h2 className="text-lg font-black text-white tracking-tight uppercase mb-2">Schadensmeldung</h2>
                        <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest leading-relaxed">
                            Defekte melden & Reparaturen verfolgen
                        </p>
                    </Link>

                    <Link
                        href="/allgemein"
                        className="group bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all flex flex-col items-center text-center ring-1 ring-white/5"
                    >
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Info className="w-6 h-6 text-slate-400 group-hover:text-white" />
                        </div>
                        <h2 className="text-lg font-black text-white tracking-tight uppercase mb-2">Administrative Anfrage</h2>
                        <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest leading-relaxed">
                            Fragen zu Verträgen oder Abrechnungen
                        </p>
                    </Link>
                </div>

                {/* Visual background elements */}
                <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[120px] -z-0 pointer-events-none animate-pulse"></div>
                <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] -z-0 pointer-events-none animate-pulse delay-700"></div>
            </div>
        </main>
    );
}
