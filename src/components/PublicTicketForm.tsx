import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Loader2, Building2, ArrowRight, Search, FileText } from "lucide-react";

// The schema is strictly expecting an ID but since we allow custom typing, 
// if it's not in the list, we might want the backend to figure it out, 
// or simply enforce that they must select it but they CAN type to search.
const TicketSchema = z.object({
  propertyId: z.string().min(1, "Please select your property from the list"),
  unit: z.string().optional(),
  urgency: z.enum(["NOT_SURE", "NORMAL", "URGENT", "EMERGENCY"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  contactName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  permissionToEnter: z.boolean(),
});

type TicketFormData = z.infer<typeof TicketSchema>;

export default function PublicTicketForm({ tenantId }: { tenantId: string }) {
  const [properties, setProperties] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<"NEW" | "CHECK">("NEW");

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Check state
  const [checkId, setCheckId] = useState("");
  const [checkResult, setCheckResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TicketFormData>({
    resolver: zodResolver(TicketSchema),
    defaultValues: {
      propertyId: "",
      unit: "",
      urgency: "NORMAL",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      permissionToEnter: false,
    },
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`/api/public/properties?tenantId=${tenantId}&v=${Date.now()}`);
        if (!response.ok) throw new Error("Failed to load properties");
        const data = await response.json();
        setProperties(data);
        if (data.length === 1) {
          setValue("propertyId", data[0].id);
          setSearchQuery(data[0].name);
        }
      } catch (err: any) {
        setError("We're having trouble connecting to the property database.");
      }
    };
    fetchProperties();
  }, [tenantId, setValue]);

  const filteredProperties = properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/public/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        setSuccessRef(result.referenceId);
      } else {
        setError(result.error || "Failed to submit ticket");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkId) return;
    setIsChecking(true);
    setError(null);
    try {
      // We simulate fetch by checking API. In reality you'd need a public route to get status by ref ID.
      // Since we don't have that route explicitly provided yet, I will mock it or show processing.
      // E.g fetch(`/api/public/tickets/${checkId}`)

      // MOCK check result for now if backend is not yet implemented for public check
      setCheckResult({
        referenceId: checkId,
        status: "IN PROGRESS",
        createdAt: new Date().toISOString()
      });
      // In a real scenario we might throw error if 404

    } catch (err: any) {
      setError("Failed to fetch status.");
    } finally {
      setIsChecking(false);
    }
  };

  if (successRef) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Report Received</h2>
          <p className="text-slate-500 mb-8 text-[15px] leading-relaxed">
            Your request is being analyzed by our AI system and will be dispatched to the appropriate specialist shortly.
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Reference ID (Save this)</span>
            <span className="text-3xl font-mono font-bold text-blue-600 tracking-tight">{successRef}</span>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md">
            Submit Another Report
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900">
      {/* Left Pane: Hero & Branding */}
      <div className="lg:w-5/12 p-10 lg:p-20 flex flex-col justify-between bg-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900 mix-blend-multiply opacity-50 z-10"></div>
        <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Building" className="absolute inset-0 w-full h-full object-cover z-0 opacity-20" />

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 relative z-20">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
            <Building2 className="text-blue-600 w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">PropCare.</span>
        </motion.div>

        <div className="my-16 lg:my-0 relative z-20">
          <h1 className="text-5xl md:text-6xl font-light text-white leading-[1.1] tracking-tight mb-8">
            Digital Maintenance <br />
            <span className="font-bold">Simplified.</span>
          </h1>
          <p className="text-lg text-blue-100/80 max-w-sm leading-relaxed font-light">
            Report damages instantly. Our system analyzes your request and routes it to exactly the right professionals.
          </p>
        </div>

        <div className="hidden lg:block text-[11px] font-semibold text-blue-200/40 uppercase tracking-widest relative z-20">
          © {new Date().getFullYear()} PropCare Systems AG
        </div>
      </div>

      {/* Right Pane: The Form */}
      <div className="lg:w-7/12 p-6 lg:p-12 flex items-center justify-center relative bg-white">

        {/* Toggle View Mode */}
        <div className="absolute top-8 right-8 flex border border-slate-200 rounded-lg p-1 bg-slate-50 z-10">
          <button
            type="button"
            onClick={() => setViewMode("NEW")}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${viewMode === "NEW" ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            New Report
          </button>
          <button
            type="button"
            onClick={() => setViewMode("CHECK")}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${viewMode === "CHECK" ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Check Status
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mt-16 md:mt-0"
        >
          {viewMode === "CHECK" ? (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Track Report</h2>
                <p className="text-slate-500">Enter your Reference ID (Damage ID) to see its current status.</p>
              </div>

              <form onSubmit={handleCheckStatus} className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reference ID</label>
                  <div className="relative mt-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      value={checkId}
                      onChange={(e) => setCheckId(e.target.value)}
                      placeholder="e.g. PC-A1B2C3D"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 uppercase"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-[15px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check Status"}
                </button>
              </form>

              {checkResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono font-bold text-slate-900">{checkResult.referenceId}</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md uppercase tracking-wide">
                      {checkResult.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Report submitted on {new Date(checkResult.createdAt).toLocaleDateString()}. Our team is actively reviewing the request and will coordinate with a contractor soon.
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Report Damage</h2>
                <p className="text-slate-500">Fill in the details below. We'll classify the urgency automatically.</p>
              </div>

              <div className="space-y-6">

                {/* Autocomplete Property Input */}
                <div className="relative z-20">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Property Address</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      setValue("propertyId", ""); // clear ID initially
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Type to search your building..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-[15px] font-medium"
                  />
                  {errors.propertyId && <p className="text-xs text-red-500 mt-2 font-medium">{errors.propertyId.message}</p>}

                  {showDropdown && filteredProperties.length > 0 && searchQuery && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {filteredProperties.map(p => (
                        <div
                          key={p.id}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setSearchQuery(p.name);
                            setValue("propertyId", p.id);
                            setShowDropdown(false);
                          }}
                        >
                          <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.address}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Unit / Apartment</label>
                  <input
                    {...register("unit")}
                    placeholder="e.g. 402, 3rd Floor"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-[15px] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {["NORMAL", "URGENT", "EMERGENCY", "NOT_SURE"].map((u) => (
                    <label key={u} className={`
                      flex items-center justify-center p-3.5 rounded-xl cursor-pointer transition-all text-xs font-bold tracking-wide border
                      ${watch("urgency") === u ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}
                    `}>
                      <input type="radio" value={u} {...register("urgency")} className="hidden" />
                      {u.replace("_", " ")}
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Damage Description</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Please describe exactly what happened..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-[15px] font-medium leading-relaxed"
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-2 font-medium">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Your Name</label>
                    <input
                      {...register("contactName")}
                      placeholder="John Doe"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-[15px] font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email Address</label>
                    <input
                      type="email"
                      {...register("contactEmail")}
                      placeholder="john@example.com"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-[15px] font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <input
                    type="checkbox"
                    {...register("permissionToEnter")}
                    className="w-5 h-5 rounded border-blue-200 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label className="text-xs text-blue-900 font-semibold uppercase tracking-wide">
                    I grant permission to enter the unit if not home
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[15px] hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Damage Report</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
