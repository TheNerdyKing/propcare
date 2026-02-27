'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Building2, Plus, Download, ChevronRight, MapPin, X, FileText, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<any>(null);
    const [csvText, setCsvText] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        addressLine1: '',
        zip: '',
        city: '',
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const getTenantId = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user.tenantId ||
                user.tenant_id ||
                (user.tenants?.id) ||
                (Array.isArray(user.tenants) ? user.tenants[0]?.id : user.tenants?.id);
        } catch (e) {
            return null;
        }
    };

    const fetchProperties = async () => {
        const tenantId = getTenantId();
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('properties')
                .select(`*, units(count), tickets(count)`)
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });

            if (error) throw error;

            const mappedData = (data || []).map(p => ({
                ...p,
                addressLine1: p.address_line1,
                _count: {
                    units: p.units?.[0]?.count || 0,
                    tickets: p.tickets?.[0]?.count || 0
                }
            }));

            setProperties(mappedData);
        } catch (err) {
            console.error('Failed to fetch properties', err);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Sind Sie sicher, dass Sie "${name}" löschen möchten? Alle Einheiten und Tickets werden ebenfalls gelöscht.`)) return;
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);
            if (error) throw error;
            await fetchProperties();
        } catch (err: any) {
            alert(`Fehler: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId) return;

        setActionLoading(true);
        try {
            const dbData = {
                name: formData.name,
                address_line1: formData.addressLine1,
                zip: formData.zip,
                city: formData.city,
                tenant_id: tenantId
            };

            if (editingProperty) {
                const { error } = await supabase
                    .from('properties')
                    .update(dbData)
                    .eq('id', editingProperty.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('properties')
                    .insert([dbData]);
                if (error) throw error;
            }
            setShowModal(false);
            setEditingProperty(null);
            setFormData({ name: '', addressLine1: '', zip: '', city: '' });
            await fetchProperties();
        } catch (err: any) {
            alert(`Fehler beim Speichern: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importSummary, setImportSummary] = useState<{ created: number, updated: number } | null>(null);

    const parseCsv = (text: string, tenantId: string) => {
        const lines = text.trim().split('\n').filter(l => l.includes(','));
        if (lines.length < 2) throw new Error('Ungültiges Format. Kopfzeile erforderlich.');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = { tenant_id: tenantId };
            headers.forEach((h, i) => {
                const val = values[i];
                if (h === 'name') obj.name = val;
                if (h === 'address' || h === 'street') obj.address_line1 = val;
                if (h === 'zip' || h === 'plz') obj.zip = val;
                if (h === 'city' || h === 'ort') obj.city = val;
            });
            return obj;
        }).filter(o => o.name && o.address_line1);
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = getTenantId();
        if (!tenantId || previewData.length === 0) return;

        setActionLoading(true);
        try {
            // Upsert logic: using name + tenant_id as a basic "match" if id is missing
            let created = 0;
            let updated = 0;

            for (const item of previewData) {
                // Check if exists
                const { data: existing } = await supabase
                    .from('properties')
                    .select('id')
                    .eq('tenant_id', tenantId)
                    .eq('name', item.name)
                    .maybeSingle();

                if (existing) {
                    await supabase.from('properties').update(item).eq('id', existing.id);
                    updated++;
                } else {
                    await supabase.from('properties').insert([item]);
                    created++;
                }
            }

            setImportSummary({ created, updated });
            setPreviewData([]);
            setCsvText('');
            await fetchProperties();
        } catch (err: any) {
            alert(`Import fehlgeschlagen: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-10 max-w-7xl mx-auto font-sans text-slate-900">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
                            <Building2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Bestand</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Liegenschaften</h1>
                        <p className="text-slate-500 font-medium text-xl max-w-2xl italic">Echtzeit-Verwaltung Ihres Immobilienportfolios.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-white text-slate-500 border border-slate-100 px-8 py-4.5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shadow-sm hover:shadow-xl transition-all flex items-center"
                        >
                            <Download className="w-4 h-4 mr-3 text-blue-500" />
                            Daten Import
                        </button>
                        <button
                            onClick={() => {
                                setEditingProperty(null);
                                setFormData({ name: '', addressLine1: '', zip: '', city: '' });
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-8 py-4.5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 flex items-center hover:-translate-y-1"
                        >
                            <Plus className="w-5 h-5 mr-3" />
                            Neu Erfassen
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-40 text-center">
                            <Loader2 className="animate-spin w-16 h-16 text-blue-600 mx-auto mb-10" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Bestandsdaten werden geladen...</p>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/40">
                            <Building2 className="w-20 h-20 text-slate-100 mb-10" />
                            <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Keine Objekte</h3>
                            <p className="text-slate-400 font-medium text-lg italic max-w-sm text-center">Beginnen Sie mit der Erfassung Ihrer ersten Liegenschaft.</p>
                        </div>
                    ) : (
                        properties.map((p) => (
                            <div key={p.id} className="group bg-white rounded-[3rem] shadow-xl shadow-slate-200/30 border border-slate-50 p-10 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 shadow-sm">
                                        <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDelete(p.id, p.name)} className="text-slate-200 hover:text-red-500 p-2.5 transition-colors bg-slate-50 rounded-xl">
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                        <button onClick={() => {
                                            setEditingProperty(p);
                                            setFormData({ name: p.name || '', addressLine1: p.address_line1 || '', zip: p.zip || '', city: p.city || '' });
                                            setShowModal(true);
                                        }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 transition-all">
                                            Bearbeiten
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter truncate leading-none">{p.name}</h3>
                                <div className="space-y-2 mb-10 text-slate-500 font-bold text-xs uppercase tracking-tight">
                                    <p className="flex items-center"><MapPin className="w-4 h-4 mr-3 text-slate-200" /> {p.address_line1}</p>
                                    <p className="pl-7">{p.zip} {p.city}</p>
                                </div>
                                <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1.5 px-0.5">Einheiten</span>
                                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{p._count?.units || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1.5 px-0.5">Tickets</span>
                                            <span className="text-2xl font-black text-blue-600 tracking-tighter">{p._count?.tickets || 0}</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-2 transition-all shadow-sm">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] max-w-md w-full border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editingProperty ? 'Objekt editieren' : 'Neu Erfassen'}</h2>
                                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl flex items-center justify-center transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Bezeichnung</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all placeholder:text-slate-300 shadow-inner"
                                        placeholder="z.B. SEESICHT RESIDENZ"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Strasse / Nummer</label>
                                    <input
                                        type="text" required
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all placeholder:text-slate-300 shadow-inner"
                                        placeholder="HAUPTSTRASSE 12"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">PLZ</label>
                                        <input
                                            type="text" required
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 text-center transition-all placeholder:text-slate-300 shadow-inner"
                                            placeholder="8000"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.26em] px-1">Ort</label>
                                        <input
                                            type="text" required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4.5 text-sm text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all placeholder:text-slate-300 shadow-inner"
                                            placeholder="ZÜRICH"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full h-20 rounded-[1.5rem] font-black text-white bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all uppercase tracking-[0.2em] text-[11px] mt-10"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'DATENSATZ SPEICHERN ➔'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-50">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 border border-slate-100">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">Massen-Import</h2>
                                    <p className="text-slate-400 font-medium text-xs">Laden Sie eine CSV-Datei hoch oder ziehen Sie diese hierher.</p>
                                </div>
                                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {importSummary ? (
                                <div className="text-center py-10 animate-in zoom-in-95">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Import Abgeschlossen</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Neu Erstellt</p>
                                            <p className="text-2xl font-black text-slate-900">{importSummary.created}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aktualisiert</p>
                                            <p className="text-2xl font-black text-slate-900">{importSummary.updated}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setImportSummary(null);
                                        }}
                                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Schliessen
                                    </button>
                                </div>
                            ) : previewData.length > 0 ? (
                                <div className="animate-in slide-in-from-bottom-5">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Vorschau ({previewData.length} Objekte)</h3>
                                    <div className="max-h-60 overflow-y-auto mb-8 border border-slate-100 rounded-2xl divide-y divide-slate-50">
                                        {previewData.map((p, i) => (
                                            <div key={i} className="p-4 flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase">{p.name}</p>
                                                    <p className="text-slate-400">{p.address_line1}, {p.zip} {p.city}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setPreviewData([])}
                                            className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Abbrechen
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={actionLoading}
                                            className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20"
                                        >
                                            {actionLoading ? 'Verarbeite...' : 'Bestätigen & Importieren'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={async (e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files[0];
                                            if (file) {
                                                const text = await file.text();
                                                try {
                                                    const parsed = parseCsv(text, getTenantId()!);
                                                    setPreviewData(parsed);
                                                } catch (err: any) {
                                                    alert(err.message);
                                                }
                                            }
                                        }}
                                        className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 group hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer mb-8"
                                        onClick={() => document.getElementById('file-input')?.click()}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Datei hierher ziehen oder klicken
                                        </p>
                                        <input
                                            id="file-input"
                                            type="file"
                                            className="hidden"
                                            accept=".csv"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const text = await file.text();
                                                    try {
                                                        const parsed = parseCsv(text, getTenantId()!);
                                                        setPreviewData(parsed);
                                                    } catch (err: any) {
                                                        alert(err.message);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[10px] font-bold text-blue-800 leading-relaxed">
                                        <span className="uppercase tracking-widest text-blue-900 block mb-1">Format-Vorgabe:</span>
                                        Kopfzeile: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-100 font-mono">name, address, zip, city</code>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
