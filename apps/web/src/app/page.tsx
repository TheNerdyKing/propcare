'use client';

import Link from 'next/link';
import { Wrench, Info } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-10 left-10">
                <Logo />
            </div>

            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
                <div className="md:col-span-2 text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-4">
                        Willkommen beim <span className="text-blue-600">Mieterportal</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg md:text-xl italic">
                        Wie können wir Ihnen heute helfen?
                    </p>
                </div>

                <Link
                    href="/schadensmeldung"
                    className="group bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/10 transition-all hover:-translate-y-2 flex flex-col items-center text-center"
                >
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                        <Wrench className="w-10 h-10 text-blue-600 group-hover:text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4">Schadensmeldung</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        Defekte melden & Reparaturen verfolgen
                    </p>
                </Link>

                <Link
                    href="/allgemein"
                    className="group bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/10 transition-all hover:-translate-y-2 flex flex-col items-center text-center"
                >
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                        <Info className="w-10 h-10 text-slate-400 group-hover:text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4">Administrative Anfrage</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        Fragen zu Verträgen oder Abrechnungen
                    </p>
                </Link>
            </div>

            {/* Visual background elements */}
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-0"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-0"></div>
        </main>
    );
}
