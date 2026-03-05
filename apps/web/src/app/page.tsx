'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, Info, Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <main className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden">
            {/* Header with Navigation */}
            <header className="relative w-full z-50 bg-white/50 backdrop-blur-md border-b border-slate-200/50">
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
                    <div className="md:hidden absolute top-[100%] left-0 w-full bg-white border-b border-slate-200/50 shadow-xl px-6 py-6 animate-in slide-in-from-top-2 z-50">
                        <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="block w-full py-4 bg-slate-50 border border-slate-100 text-center text-xs font-black text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-2xl uppercase tracking-[0.2em] transition-colors"
                        >
                            Verwaltung Login
                        </Link>
                    </div>
                )}
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 max-w-4xl mx-auto w-full z-10">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="md:col-span-2 text-center mb-8 md:mb-12">
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase mb-4 mt-4 md:mt-0">
                            Willkommen beim <span className="text-blue-600">Mieterportal</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-base md:text-lg italic">
                            Wie können wir Ihnen heute helfen?
                        </p>
                    </div>

                    <Link
                        href="/schadensmeldung"
                        className="group bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/10 transition-all hover:-translate-y-2 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Wrench className="w-8 h-8 md:w-10 md:h-10 text-blue-600 group-hover:text-white" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase mb-3">Schadensmeldung</h2>
                        <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest leading-relaxed">
                            Defekte melden & Reparaturen verfolgen
                        </p>
                    </Link>

                    <Link
                        href="/allgemein"
                        className="group bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/10 transition-all hover:-translate-y-2 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Info className="w-8 h-8 md:w-10 md:h-10 text-slate-400 group-hover:text-white" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase mb-3">Administrative Anfrage</h2>
                        <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest leading-relaxed">
                            Fragen zu Verträgen oder Abrechnungen
                        </p>
                    </Link>
                </div>

                {/* Visual background elements */}
                <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] md:w-[40rem] md:h-[40rem] bg-blue-600/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
                <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] md:w-[40rem] md:h-[40rem] bg-blue-600/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            </div>
        </main>
    );
}
