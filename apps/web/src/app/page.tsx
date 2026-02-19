import Link from 'next/link';

export default function RootPage() {
    return (
        <main className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-24">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            {/* Content Card */}
            <div className="relative z-10 w-full max-w-xl text-center space-y-8 p-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <div className="space-y-2">
                    <div className="inline-block px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium uppercase tracking-wider mb-2">
                        Property Management Reimagined
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white">
                        Prop<span className="text-indigo-500">Care</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 font-light leading-relaxed">
                        Intelligent ticketing and maintenance orchestration powered by AI.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                        href="/login"
                        className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:scale-105 active:scale-95 text-center"
                    >
                        Enter Staff Portal
                    </Link>
                    <Link
                        href="/schadensmeldung"
                        className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-all duration-300 backdrop-blur-sm text-center"
                    >
                        Report an Issue
                    </Link>
                </div>

                <div className="pt-8 border-t border-white/5 flex justify-center gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all duration-500 underline underline-offset-4 decoration-indigo-500/0 hover:decoration-indigo-500/50">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        Smart Routing
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        AI Classification
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        Contractor Sync
                    </div>
                </div>
            </div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 text-slate-500 text-[10px] uppercase tracking-widest z-10 opacity-50">
                Powered by PropCare AI Engine • 2024
            </div>
        </main>
    );
}
