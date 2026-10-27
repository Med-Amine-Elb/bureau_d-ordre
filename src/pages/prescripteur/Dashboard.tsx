import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";
import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  TrendingUp,
  Target,
  Receipt,
  CreditCard,
  Mail,
  FileMinus
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { addMonths, differenceInDays, format, parseISO, startOfYear } from "date-fns";
import { fr } from "date-fns/locale";
import { isDateInMonth } from "@/lib/monthlyMetrics";
import {
  PieChart, Pie, ResponsiveContainer, Cell
} from "recharts";
import KpiCard from "@/components/KpiCard";





export default function DashboardPrescripteur() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // On simule le filtrage Dataverse côté client :
      // On affiche tous les dossiers assignés ou en suivi
      const assigned = result.filter(
        (d) => d.new_status >= 30 || d.new_status === 20,
      );
      setDossiers(assigned);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const aValider = dossiers.filter((d) => d.new_status === 30 || d.new_status === 40).length;
  const enCorrection = dossiers.filter((d) => d.new_status === 90).length;
  const validesCeMois = dossiers.filter(
    (d) => d.new_status >= 50 && d.new_status !== 90 && isDateInMonth(d.new_date_val_prescripteur, new Date()),
  ).length;
  const horsDelai = dossiers.filter((d) => {
    if (!d.new_reception_date) return false;
    return differenceInDays(new Date(), parseISO(d.new_reception_date)) > 5;
  }).length;

  const monthlyDossiers = dossiers.filter((d) => isDateInMonth(d.new_reception_date, selectedMonth));
  const monthlyCounts = {
    aValider: monthlyDossiers.filter((d) => d.new_status === 30 || d.new_status === 40).length,
    enCorrection: monthlyDossiers.filter((d) => d.new_status === 90).length,
    horsDelai: monthlyDossiers.filter((d) => {
      if (d.new_status !== 20 || !d.new_reception_date) return false;
      return differenceInDays(new Date(), parseISO(d.new_reception_date)) > 5;
    }).length,
    traites: monthlyDossiers.filter((d) => d.new_status >= 50 && d.new_status !== 90).length,
  };
  const chartData = [
    { name: "À valider", value: monthlyCounts.aValider, color: "#3b82f6", grad: "url(#grad-blue)", icon: FileText },
    { name: "Corrections", value: monthlyCounts.enCorrection, color: "#a855f7", grad: "url(#grad-purple)", icon: RotateCcw },
    { name: "Hors délai", value: monthlyCounts.horsDelai, color: "#ef4444", grad: "url(#grad-red)", icon: Clock },
    { name: "Traités", value: monthlyCounts.traites, color: "#14b8a6", grad: "url(#grad-teal)", icon: CheckCircle }
  ];
  const totalDossiers = chartData.reduce((total, entry) => total + entry.value, 0);
  const monthsOfYear = Array.from({ length: 12 }, (_, index) => addMonths(startOfYear(selectedMonth), index));
  const activeItem = chartData[activeIndex] || chartData[0];
  const activePercentage = totalDossiers > 0 ? Math.round((activeItem.value / totalDossiers) * 100) : 0;

  const handleAccuse = async (dossier: Dossier) => {
    try {
      const auditRecorded = await dataService.accuseReception(dossier.new_folderid, 40, "Amine Elboubakri");
      setSuccessMessage("Réception confirmée.");
      setSuccessModalOpen(true);
      if (!auditRecorded) {
        toast.warning("Réception enregistrée", {
          description: "Le dossier est bien accusé réception, mais la transmission n’a pas pu être ajoutée à l’historique.",
        });
      }
      fetchDossiers();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible d'enregistrer l'accusé de réception du dossier.",
      });
    }
  };

  const userName = localStorage.getItem("userName") || "Mohammed El Boubakri";
  const role = localStorage.getItem("userRole") || "Prescripteur";
  const objTraites = validesCeMois + aValider > 0 ? validesCeMois + aValider : 10;
  const percentage = Math.round((validesCeMois / objTraites) * 100) || 0;

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

  // Breakdown by document type (Objectives per type)
  const countFactures = dossiers.filter(d => d.new_document_type === 100).length;
  const facturesTraites = dossiers.filter(d => d.new_document_type === 100 && d.new_status >= 50 && d.new_status !== 90).length;

  const countAvoirs = dossiers.filter(d => d.new_document_type === 200).length;
  const avoirsTraites = dossiers.filter(d => d.new_document_type === 200 && d.new_status >= 50 && d.new_status !== 90).length;

  const countAcomptes = dossiers.filter(d => d.new_document_type === 400 || d.new_document_type === 500).length;
  const acomptesTraites = dossiers.filter(d => (d.new_document_type === 400 || d.new_document_type === 500) && d.new_status >= 50 && d.new_status !== 90).length;

  const countCourriers = dossiers.filter(d => d.new_document_type === 600).length;
  const courriersTraites = dossiers.filter(d => d.new_document_type === 600 && d.new_status >= 50 && d.new_status !== 90).length;

  return (
    <div className="w-full flex flex-col min-h-[calc(100vh-120px)] gap-6 pb-6">

      {/* Greeting Section */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 mb-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Dashboard {role === "DCF" ? role : role.toLocaleLowerCase("fr-FR")} <span className="animate-pulse text-[#1F3B73]">⚡</span>
        </h1>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          Bonjour {userName}. Validez vos saisies et pilotez vos flux.
        </p>
      </div>

      {/* ═══════════ ROW 1: 4 STAT CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="À valider / accuser"
          icon={FileText}
          value={aValider.toLocaleString()}
          loading={loading}
          iconColorClass="text-blue-500"
          iconBgClass="bg-blue-50 dark:bg-blue-500/10"
          animationDelay="0ms"
          onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: "30,40" } })}
          subtext={<span className="text-xs text-slate-400">En attente de votre action</span>}
        />
        <KpiCard
          title="Validés (mois en cours)"
          icon={CheckCircle}
          value={validesCeMois.toLocaleString()}
          loading={loading}
          iconColorClass="text-emerald-500"
          iconBgClass="bg-emerald-50 dark:bg-emerald-500/10"
          animationDelay="60ms"
          onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: ">=50" } })}
          subtext={
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-500">{percentage}% cible</span>
            </>
          }
        />
        <KpiCard
          title="Retours de correction"
          icon={RotateCcw}
          value={enCorrection.toLocaleString()}
          loading={loading}
          iconColorClass="text-red-500"
          iconBgClass="bg-red-50 dark:bg-red-500/10"
          animationDelay="120ms"
          onClick={() => navigate("/prescripteur/corrections")}
          subtext={<span className="text-xs text-slate-400">Anomalies relevées</span>}
        />
        <KpiCard
          title="Hors délai"
          icon={Clock}
          value={horsDelai.toLocaleString()}
          loading={loading}
          iconColorClass="text-amber-500"
          iconBgClass="bg-amber-50 dark:bg-amber-500/10"
          animationDelay="180ms"
          onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: 20 } })}
          subtext={<span className="text-xs text-slate-400">&gt; 5 jours depuis réception</span>}
        />
      </div>
      {/* ═══════════ MAIN CONTENT GRID ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">

        {/* ── LEFT COLUMN (col-span-2) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">


          {/* ── LEFT COLUMN: Table ── */}
          <div className="flex flex-col">
            <div className="flex flex-col h-fit">
              {/* Table: Dossiers à valider */}
              <div
                style={{ animationDelay: "220ms", animationFillMode: "both" }}
                className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Dossiers en attente d'action
                  </h3>
                  <button onClick={() => navigate("/prescripteur/dossiers")} className="text-[11px] font-semibold text-[#1F3B73] hover:text-blue-700 transition-colors">
                    Voir tout
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 pr-1">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/30 sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                        <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Fournisseur & Type</th>
                        <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Statut</th>
                        <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                      ) : dossiers.filter((d) => d.new_status === 30 || d.new_status === 40).length === 0 ? (
                        <tr><td colSpan={4} className="py-4 text-center text-[11px] text-slate-400">Aucun dossier en attente d'action.</td></tr>
                      ) : (
                        dossiers.filter((d) => d.new_status === 30 || d.new_status === 40).slice(0, 5).map((dossier, i) => (
                          <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#1F3B73] dark:text-blue-400 flex items-center justify-center">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <Link to={`/prescripteur/dossiers/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors block">
                                    {dossier.new_folder_number}
                                  </Link>
                                  <span className="text-[10px] text-slate-400">{dossier.new_invoice_number || "-"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300 block">{dossier.new_supplier_id || "-"}</span>
                              <span className="text-[10px] text-slate-400">
                                {dossier.new_document_type === 100 ? "FACTURE" : dossier.new_document_type === 200 ? "AVOIR" : "AUTRE"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${dossier.new_status === 30
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-blue-100 text-[#1F3B73] dark:bg-blue-900/30 dark:text-blue-400"
                                }`}>
                                {dossier.new_status === 30 ? "À réceptionner" : "Chez vous"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {dossier.new_status === 30 && (
                                  <button
                                    onClick={() => handleAccuse(dossier)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/prescripteur/dossiers/${dossier.new_folderid}`)}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                  title="Consulter"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── LEFT COLUMN: PieChart Split-Card ── */}
          <div className="flex flex-col flex-1 min-h-[250px]">
            <div
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-[2rem] shadow-sm flex flex-col xl:flex-row flex-1 overflow-hidden"
            >
              {/* Left side: Chart */}
              <div className="flex-1 p-5 flex flex-col relative bg-white dark:bg-[#0B1120]">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 z-10">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Répartition</h3>
                  <button className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Mensuel <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                </div>

                {/* Total text */}
                <div className="mb-2 z-10 relative text-center">
                  <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Total: </span>
                  <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{totalDossiers}</span>
                </div>

                {/* Chart */}
                <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="grad-blue" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" />
                          <stop offset="100%" stopColor="#0EA5E9" />
                        </linearGradient>
                        <linearGradient id="grad-purple" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#9333EA" />
                          <stop offset="100%" stopColor="#DB2777" />
                        </linearGradient>
                        <linearGradient id="grad-red" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#E11D48" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                        <linearGradient id="grad-teal" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#0D9488" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={88}
                        paddingAngle={4}
                        cornerRadius={10}
                        dataKey="value"
                        stroke="none"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.grad}
                            style={{
                              opacity: activeIndex === index ? 1 : 0.7,
                              transition: 'all 0.3s ease-out',
                              filter: activeIndex === index ? `drop-shadow(0px 8px 16px ${entry.color}90)` : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Dynamic Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                    <div className={`p-2 rounded-full mb-1 transition-colors duration-300`} style={{ color: activeItem.color }}>
                      <activeItem.icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-medium text-slate-800 dark:text-white mb-0.5 transition-colors duration-300">
                      {activeItem.name}
                    </span>
                    <span className="text-xl font-semibold text-slate-900 dark:text-white transition-colors duration-300">
                      {activeItem.value} <span className="text-slate-400 text-sm font-medium">/ {activePercentage}%</span>
                    </span>
                  </div>
                </div>

                {/* Month selector at bottom */}
                <div className="flex justify-center gap-5 mt-6 z-10">
                  {monthsOfYear.map((month) => {
                    const isSelected = month.getMonth() === selectedMonth.getMonth();
                    return (
                      <button
                        key={month.toISOString()}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={format(month, "MMMM yyyy", { locale: fr })}
                        onClick={() => setSelectedMonth(month)}
                        className={`text-[11px] font-medium uppercase tracking-widest cursor-pointer transition-all ${isSelected ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white pb-1' : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 pb-1 border-b-2 border-transparent'}`}
                      >
                        {format(month, "MMM", { locale: fr }).replace(".", "")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right side: Legend */}
              <div className="w-full xl:w-[280px] bg-[#0F172B] p-5 flex flex-col flex-none overflow-y-auto min-h-[250px] xl:rounded-r-[2rem]">
                <h4 className="text-[14px] font-medium mb-4 text-white tracking-wide">Légende:</h4>
                <div className="space-y-3 flex-1">
                  {chartData.map((entry, index) => {
                    const entryPercentage = totalDossiers > 0 ? Math.round((entry.value / totalDossiers) * 100) : 0;
                    return (
                      <div
                        key={index}
                        className={`flex flex-col gap-2 p-3 -mx-3 rounded-2xl transition-all duration-300 cursor-pointer ${activeIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-1.5 rounded-lg border-2 transition-colors duration-300`} style={{ borderColor: activeIndex === index ? entry.color : `${entry.color}40`, color: entry.color }}>
                              <entry.icon className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                            <span className="text-[13px] text-slate-300 font-medium">{entry.name}</span>
                          </div>
                          <span className="text-[13px] font-medium text-white">{entry.value} <span className="text-slate-500 font-normal">/ {entryPercentage}%</span></span>
                        </div>
                        {/* Progress bar */}
                        <div className="ml-[42px] h-[4px] bg-white/10 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full rounded-full transition-all duration-[1500ms] ease-out" style={{ width: isMounted ? `${entryPercentage}%` : '0%', background: entry.grad }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-right pr-2">
                  <span className="text-[13px] font-medium text-white tracking-wide">Total: {totalDossiers}</span>
                </div>
              </div>
            </div>
          </div>        </div>

        {/* ── RIGHT COLUMN (col-span-1) ── */}
        <div className="flex flex-col gap-6">


          {/* ── RIGHT COLUMN: Objectif du mois ── */}
          <div className="flex flex-col h-fit">
            <div
              style={{ animationDelay: "400ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-7 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative flex flex-col flex-1"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-500/10 rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <Target className="text-[#3b82f6] w-6 h-6" />
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
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
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
                  <div className="mt-3 bg-blue-500/10 text-blue-600 dark:text-[#3b82f6] px-2.5 py-0.5 rounded text-[12px] font-bold flex items-center gap-1">
                    ↑ {validesCeMois} vs cible
                  </div>
                </div>
                <div className="absolute bottom-2 left-6 text-sm font-medium text-slate-400">0</div>
                <div className="absolute bottom-2 right-6 text-sm font-medium text-slate-400">100</div>
              </div>

              {/* Summary Sentence */}
              <p className="text-[14px] text-center text-slate-600 dark:text-slate-300 mt-2 mb-6 px-4">
                Excellent rythme — <span className="font-semibold text-slate-900 dark:text-white">les dossiers traités</span> sont {validesCeMois} ce mois-ci.
              </p>

              <hr className="border-slate-100 dark:border-slate-800/60 mb-6" />

              {/* Details List */}
              <div className="flex flex-col flex-1">
                <h4 className="text-[11px] font-bold text-slate-400 tracking-widest mb-4">Répartition</h4>
                <div className="space-y-4">
                  {[
                    { label: "Factures", value: facturesTraites, max: countFactures || 1, total: countFactures, icon: Receipt, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { label: "Avoirs", value: avoirsTraites, max: countAvoirs || 1, total: countAvoirs, icon: FileMinus, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
                    { label: "Acomptes", value: acomptesTraites, max: countAcomptes || 1, total: countAcomptes, icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                    { label: "Courriers", value: courriersTraites, max: countCourriers || 1, total: countCourriers, icon: Mail, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white w-20">{item.label}</span>
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
