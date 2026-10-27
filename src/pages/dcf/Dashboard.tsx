import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  Wallet,
  TrendingUp,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import { subMonths, format, startOfMonth, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import KpiCard from "@/components/KpiCard";




export default function DashboardDCF() {

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // Fetch all dossiers to be able to compute history (last 6 months)
      setDossiers(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const aAccuser = dossiers.filter((d) => d.new_status === 70).length;
  const aComptabiliser = dossiers.filter((d) => d.new_status === 80 && !d.new_est_comptabilise).length;
  const comptabilises = dossiers.filter((d) => d.new_est_comptabilise && d.new_accounting_date && isSameMonth(new Date(d.new_accounting_date), new Date())).length;
  const enCorrection = dossiers.filter((d) => d.new_status === 90).length;

  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    return startOfMonth(subMonths(new Date(), 5 - i));
  });

  const barChartData = last6Months.map(monthDate => {
    const monthName = format(monthDate, "MMM", { locale: fr });
    let traites = dossiers.filter(d =>
      d.new_est_comptabilise && d.new_accounting_date && isSameMonth(new Date(d.new_accounting_date), monthDate)
    ).length;
    let retours = dossiers.filter(d =>
      d.new_status === 90 && d.new_date_retour_bo && isSameMonth(new Date(d.new_date_retour_bo), monthDate)
    ).length;

    return {
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      traites: traites,
      retours: retours,
    };
  });

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(dossier.new_folderid, 80, "Utilisateur DCF");
      setSuccessMessage(`Réception physique confirmée pour le dossier ${dossier.new_folder_number}.`);
      setSuccessModalOpen(true);
      fetchDossiers();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const userName = localStorage.getItem("userName") || "Mohammed El Boubakri";
  const objTraites = comptabilises + aComptabiliser > 0 ? comptabilises + aComptabiliser : 10;
  const percentage = Math.round((comptabilises / objTraites) * 100) || 0;
  const totalDossiers = aAccuser + aComptabiliser + enCorrection + comptabilises;

  useEffect(() => {
    let startTime: number;
    const duration = 1500;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentage(Math.round(easeOut * percentage));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (percentage > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      setAnimatedPercentage(0);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [percentage]);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
    borderRadius: "12px",
    color: isDarkMode ? "#f8fafc" : "#0f172a",
    border: isDarkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    fontSize: "12px",
    padding: "8px 12px",
  };

  return (
    <div className="w-full space-y-6">

      {/* Greeting Section */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Dashboard DCF <span className="animate-pulse text-[#1F3B73]">⚡</span>
        </h1>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          Bonjour {userName}. Gérez vos saisies et factures avec efficacité.
        </p>
      </div>

      {/* ═══════════ ROW 1: 4 STAT CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="À Accuser Réception"
          icon={Clock}
          value={aAccuser.toLocaleString()}
          loading={loading}
          iconColorClass="text-orange-500 dark:text-orange-400"
          iconBgClass="bg-orange-50 dark:bg-orange-500/10"
          animationDelay="0ms"
          onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 70 } })}
          subtext={
            aAccuser > 0 ? (
              <><TrendingUp className="w-3.5 h-3.5 text-orange-500" /><span className="text-xs font-semibold text-orange-500">Nouveaux</span></>
            ) : (
              <span className="text-xs text-slate-400">À jour</span>
            )
          }
        />
        <KpiCard
          title="À Comptabiliser"
          icon={Wallet}
          value={aComptabiliser.toLocaleString()}
          loading={loading}
          iconColorClass="text-blue-500 dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-500/10"
          animationDelay="60ms"
          onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 80 } })}
          subtext={<span className="text-xs text-slate-400">En attente de traitement</span>}
        />
        <KpiCard
          title="Retours Correction"
          icon={RotateCcw}
          value={enCorrection.toLocaleString()}
          loading={loading}
          iconColorClass="text-red-500 dark:text-red-400"
          iconBgClass="bg-red-50 dark:bg-red-500/10"
          animationDelay="120ms"
          onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 90 } })}
          subtext={<span className="text-xs text-slate-400">Anomalies relevées</span>}
        />
        <KpiCard
          title="Prêts (Trésorerie)"
          icon={CheckCircle}
          value={comptabilises.toLocaleString()}
          loading={loading}
          iconColorClass="text-emerald-500 dark:text-emerald-400"
          iconBgClass="bg-emerald-50 dark:bg-emerald-500/10"
          animationDelay="180ms"
          onClick={() => navigate("/dcf/dossiers")}
          subtext={<span className="text-xs text-slate-400">Comptabilisés ce mois</span>}
        />
      </div>

      {/* ═══════════ ROW 2: MAIN CONTENT + SIDEBAR ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6 h-full">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table: À Accuser Réception */}
            <div
              style={{ animationDelay: "220ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Nouveaux reçus
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  {aAccuser} dossiers
                </span>
              </div>
              <div className="overflow-y-auto flex-1 pr-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                    ) : dossiers.filter((d) => d.new_status === 70).length === 0 ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Aucun dossier en attente d'accusé.</td></tr>
                    ) : (
                      dossiers.filter((d) => d.new_status === 70).map((dossier, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-3 px-4">
                            <Link to={`/dcf/dossiers/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {dossier.new_folder_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleAccuse(dossier)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table: Saisie Comptable */}
            <div
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1F3B73] animate-pulse" />
                  Saisie Comptable
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  {aComptabiliser} dossiers
                </span>
              </div>
              <div className="overflow-y-auto flex-1 pr-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                    ) : dossiers.filter((d) => d.new_status === 80 && !d.new_est_comptabilise).length === 0 ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Aucun dossier à comptabiliser.</td></tr>
                    ) : (
                      dossiers.filter((d) => d.new_status === 80 && !d.new_est_comptabilise).map((dossier, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-3 px-4">
                            <Link to={`/dcf/dossiers/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {dossier.new_folder_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => navigate(`/dcf/dossiers/${dossier.new_folderid}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3B73]/10 hover:bg-[#1F3B73]/20 text-[#1F3B73] dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-[11px] font-bold transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> Traiter
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Stacked BarChart */}
          <div
            style={{ animationDelay: "340ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-[#fafafa] dark:bg-[#0F172B] rounded-3xl p-7 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col flex-1 min-h-[350px]"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white leading-tight">Évolution des Dossiers</h3>
                <p className="text-[13px] font-medium text-slate-500 mt-1">Traités vs Retours (6 derniers mois)</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <div className="w-3 h-3 rounded bg-[#a3e635]"></div> Traités
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <div className="w-3 h-3 rounded bg-[#1e293b] dark:bg-slate-700"></div> Retours
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={32}>
                  <defs>
                    <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                      <rect width="8" height="8" fill="#a3e635" />
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#84cc16" strokeWidth="4" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDarkMode ? "#64748b" : "#94a3b8", fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDarkMode ? "#64748b" : "#94a3b8", fontWeight: 600 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDarkMode ? "#1e293b" : "#f1f5f9" }}
                    contentStyle={{ ...tooltipStyle, borderRadius: '16px' }}
                  />
                  <Bar dataKey="retours" stackId="a" fill={isDarkMode ? "#334155" : "#1e293b"} radius={[6, 6, 6, 6]} animationDuration={1500} />
                  <Bar dataKey="traites" stackId="a" fill="url(#diagonalHatch)" radius={[6, 6, 6, 6]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (col-span-1) ── */}
        <div className="flex flex-col gap-6 flex-1">

          {/* ── RIGHT COLUMN: Objectif du mois ── */}
          <div className="flex flex-col h-fit">
            <div
              style={{ animationDelay: "400ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-7 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative flex flex-col flex-1"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-yellow-500/10 rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <Target className="text-yellow-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white leading-tight">Objectif du mois</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5">Ce mois-ci • {totalDossiers} dossiers</p>
                </div>
              </div>

              {/* Gauge */}
              <div className="relative w-full h-[220px] mt-6 flex items-center justify-center">
                <svg width="240" height="200" viewBox="0 0 240 200" className="absolute top-0">
                  <defs>
                    <linearGradient id="gauge-grad" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 44 }).map((_, i) => {
                    const fraction = i / 43;
                    const angle = -120 + fraction * 240;
                    const isFilled = fraction <= animatedPercentage / 100;

                    const rad = (angle * Math.PI) / 180;
                    const innerR = 90;
                    const outerR = 108;
                    const cx = 120;
                    const cy = 130;

                    const x1 = cx + innerR * Math.sin(rad);
                    const y1 = cy - innerR * Math.cos(rad);
                    const x2 = cx + outerR * Math.sin(rad);
                    const y2 = cy - outerR * Math.cos(rad);

                    const strokeColor = isFilled ? 'url(#gauge-grad)' : (document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9');

                    return (
                      <line
                        key={i}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={strokeColor}
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute top-[55px] flex flex-col items-center">
                  <span className={`${animatedPercentage === 100 ? 'text-[54px] tracking-tight' : 'text-[64px] tracking-tighter'} font-bold text-slate-900 dark:text-white leading-none`}>{animatedPercentage}</span>
                  <span className="text-[13px] font-medium text-slate-400 mt-2">sur 100</span>
                  <div className="mt-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2.5 py-0.5 rounded text-[12px] font-bold flex items-center gap-1">
                    ↑ {comptabilises} vs cible
                  </div>
                </div>
                <div className="absolute bottom-2 left-6 text-sm font-medium text-slate-400">0</div>
                <div className="absolute bottom-2 right-6 text-sm font-medium text-slate-400">100</div>
              </div>

              {/* Summary Sentence */}
              <p className="text-[14px] text-center text-slate-600 dark:text-slate-300 mt-2 mb-6 px-4">
                Excellent rythme — <span className="font-semibold text-slate-900 dark:text-white">les dossiers traités</span> sont {comptabilises} ce mois-ci.
              </p>

              <hr className="border-slate-100 dark:border-slate-800/60 mb-6" />

              {/* Details List */}
              <div className="flex flex-col flex-1">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Répartition</h4>
                <div className="space-y-4">
                  {[
                    { label: "À Accuser", value: aAccuser, max: totalDossiers || 1, total: totalDossiers, icon: Clock, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
                    { label: "À Saisir", value: aComptabiliser, max: totalDossiers || 1, total: totalDossiers, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { label: "Corrections", value: enCorrection, max: totalDossiers || 1, total: totalDossiers, icon: RotateCcw, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
                    { label: "Traités", value: comptabilises, max: totalDossiers || 1, total: totalDossiers, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white w-24">{item.label}</span>
                      <div className="flex-1 h-[6px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="h-full bg-[#3b82f6] rounded-full transition-all duration-[1500ms] ease-out" style={{ width: isMounted ? `${(item.value / item.max) * 100}%` : '0%' }}></div>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900 dark:text-white w-10 text-right whitespace-nowrap">{item.value} <span className="text-slate-400 font-normal">/ {item.total}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Success Modal */}
<SuccessConfirmationModal open={successModalOpen} message={successMessage} onClose={() => setSuccessModalOpen(false)} />
    </div>
  );
}
