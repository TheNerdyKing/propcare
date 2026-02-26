import Link from 'next/link';
import { ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';

export default function RootPage() {
    return (
        <main className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-6">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-4xl">
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center space-x-4 mb-8">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl shadow-blue-600/30 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                            PC
                        </div>
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">
                            Prop<span className="text-blue-600">Care</span>
                        </span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
                        Mieter<span className="text-blue-600">portal</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-xl max-w-2xl mx-auto italic leading-relaxed">
                        Willkommen im Service-Center Ihrer Liegenschaft. Hier können Sie Anliegen melden und den Status Ihrer Anfragen verfolgen.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Card 1: Schadensmeldung */}
                    <Link href="/schadensmeldung" className="group">
                        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-700 hover:-translate-y-3 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-blue-600 transition-colors duration-700"></div>
                            
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-blue-600 transition-colors duration-500 relative z-10">
                                <AlertCircle className="w-10 h-10 text-blue-600 group-hover:text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight relative z-10">Schadensmeldung</h2>
                            <p className="text-slate-500 font-medium text-lg mb-10 flex-grow relative z-10 leading-relaxed">
                                Melden Sie technische Mängel, Reparaturen oder Schäden in Ihrer Wohnung oder am Gebäude.
                            </p>
                            <div className="flex items-center text-blue-600 font-black text-[11px] uppercase tracking-widest relative z-10">
                                JETZT MELDEN <span className="ml-3 group-hover:translate-x-3 transition-transform">➔</span>
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Allgemeine Frage */}
                    <Link href="/allgemein" className="group">
                        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-emerald-600/10 transition-all duration-700 hover:-translate-y-3 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-emerald-600 transition-colors duration-700"></div>
                            
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-emerald-600 transition-colors duration-500 relative z-10">
                                <MessageSquare className="w-10 h-10 text-emerald-600 group-hover:text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight relative z-10">Administrative Anfrage</h2>
                            <p className="text-slate-500 font-medium text-lg mb-10 flex-grow relative z-10 leading-relaxed">
                                Kontaktieren Sie uns für administrative Anfragen, Mietverträge, Schlüssel oder sonstige Anliegen.
                            </p>
                            <div className="flex items-center text-emerald-600 font-black text-[11px] uppercase tracking-widest relative z-10">
                                NACHRICHT SENDEN <span className="ml-3 group-hover:translate-x-3 transition-transform">➔</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-6 grayscale opacity-50">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Sicher & Verschlüsselt
                        </div>
                    </div>
                </div>
            </div>

            {/* Silent Footer link for staff - very subtle or removed */}
            <div className="mt-auto pt-10 pb-4">
                <Link href="/login" className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 transition-colors">
                    Staff Login
                </Link>
            </div>
        </main>
    );
}
