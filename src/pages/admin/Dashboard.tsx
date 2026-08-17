import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Info,
  Ban,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { differenceInDays, parseISO } from "date-fns";
import { PremiumGauge } from "@/components/PremiumGauge";



const BRACKET_COLORS = {
  "Moins de 5j": "#3b82f6",
  "5 à 10j": "#f97316",
  "Plus de 10j": "#ef4444"
};

interface FlowRun {
  runId: string;
  flowName: string;
  triggerTime: string;
  triggeredBy: string;
  status: "Succeeded" | "Failed" | "Running";
  entityName: string;
}

const INITIAL_FLOW_RUNS: FlowRun[] = [
  {
    runId: "run-0982-ab",
    flowName: "DCF - Notification Dossier Bloqué",
    triggerTime: new Date(Date.now() - 15 * 60000).toISOString(),
    triggeredBy: "System (Webhook)",
    status: "Failed",
    entityName: "new_dossier (DOS-2026-004)"
  },
  {
    runId: "run-0981-cd",
    flowName: "Trésorerie - Relance Chèque en Agence",
    triggerTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    triggeredBy: "Power Automate Scheduler",
    status: "Succeeded",
    entityName: "new_dossier (DOS-2026-010)"
  },
  {
    runId: "run-0980-ef",
    flowName: "BO - Alerte 5 Jours Dépassement",
    triggerTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    triggeredBy: "System (Webhook)",
    status: "Failed",
    entityName: "new_dossier (DOS-2026-001)"
  },
  {
    runId: "run-0979-gh",
    flowName: "Notification Signature Fournisseur",
    triggerTime: new Date(Date.now() - 12 * 3600000).toISOString(),
    triggeredBy: "Agent Agence",
    status: "Succeeded",
    entityName: "new_dossier (DOS-2026-018)"
  },
  {
    runId: "run-0978-ij",
    flowName: "Intégration Dataverse vers SAP",
    triggerTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    triggeredBy: "System Trigger",
    status: "Succeeded",
    entityName: "new_dossier (DOS-2026-015)"
  }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [flowRuns, setFlowRuns] = useState<FlowRun[]>(INITIAL_FLOW_RUNS);
  const [restartingFlowId, setRestartingFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await dataService.getDossiers();
        setDossiers(list);
      } catch (err) {
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // calculations
  const totalDossiers = dossiers.length;
  const dossiersBloques = dossiers.filter((d) => d.new_is_blocked).length;
  const dossiersPayes = dossiers.filter((d) => d.new_status === 150).length;
  const dossiersHorsDelai = dossiers.filter((d) => d.new_status === 20).length;

  const compliantCount = dossiers.filter((d) => {
    if (!d.new_invoice_date || !d.new_reception_date) return true;
    const diff = Math.abs(
      (new Date(d.new_reception_date).getTime() - new Date(d.new_invoice_date).getTime()) / (1000 * 3600 * 24)
    );
    return diff <= 5;
  }).length;

  const complianceRate = totalDossiers > 0 ? Math.round((compliantCount / totalDossiers) * 100) : 100;
  const averageDelayDays = totalDossiers > 0 ? 5.2 : 0;

  // Status breakdown grouped
  const dossiersEnTransit = dossiers.filter((d) => [30, 50, 70, 100, 120, 130].includes(d.new_status)).length;
  const dossiersPresc = dossiers.filter((d) => d.new_status === 40).length;
  const dossiersDCF = dossiers.filter((d) => [60, 80].includes(d.new_status)).length;
  const dossiersTreso = dossiers.filter((d) => d.new_status === 110).length;
  const dossiersAgence = dossiers.filter((d) => d.new_status === 140).length;

  // Stacked Aging Balance for Blocked Files
  const agingDataMap = {
    "Factures": { name: "Factures", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Avoirs": { name: "Avoirs", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Acomptes": { name: "Acomptes", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Courriers": { name: "Courriers", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
  };

  dossiers.forEach((d) => {
    if (!d.new_is_blocked) return;
    const age = differenceInDays(new Date(), parseISO(d.new_reception_date));
    let bracket: "Moins de 5j" | "5 à 10j" | "Plus de 10j" = "Moins de 5j";
    if (age > 10) bracket = "Plus de 10j";
    else if (age >= 5) bracket = "5 à 10j";

    let typeKey: keyof typeof agingDataMap = "Factures";
    if (d.new_document_type === 200) typeKey = "Avoirs";
    else if (d.new_document_type === 500) typeKey = "Acomptes";
    else if (d.new_document_type === 600) typeKey = "Courriers";

    agingDataMap[typeKey][bracket] += 1;
  });
  const agingChartData = Object.values(agingDataMap);

  // Activity trend (simulate last 7 days)
  const trendDataMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const dDate = new Date();
    dDate.setDate(dDate.getDate() - i);
    const label = dDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    trendDataMap[label] = 0;
  }
  dossiers.forEach((d) => {
    const dDate = new Date(d.new_reception_date);
    const label = dDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    if (label in trendDataMap) {
      trendDataMap[label] += 1;
    }
  });
  const trendChartData = Object.keys(trendDataMap).map((key) => ({
    date: key,
    "Activité": trendDataMap[key]
  }));

  // Dynamic Smart Insights based on mock data analysis
  const getDynamicInsights = () => {
    const insightsList = [];
    if (dossiersBloques > 3) {
      insightsList.push({
        type: "danger",
        title: "Alerte de Blocage",
        description: `Il y a actuellement ${dossiersBloques} dossiers bloqués en attente.`
      });
    } else {
      insightsList.push({
        type: "success",
        title: "Stabilité",
        description: "Le volume de dossiers bloqués reste sous contrôle."
      });
    }
    if (complianceRate < 85) {
      insightsList.push({
        type: "warning",
        title: "Respect SLA",
        description: `Seul ${complianceRate}% respectent le délai réglementaire.`
      });
    } else {
      insightsList.push({
        type: "success",
        title: "SLA Excellent",
        description: `Conformité élevée : ${complianceRate}% respectent la règle.`
      });
    }
    const failedFlows = flowRuns.filter(r => r.status === "Failed").length;
    if (failedFlows > 0) {
      insightsList.push({
        type: "danger",
        title: "Moniteur",
        description: `${failedFlows} flux en échec.`
      });
    } else {
      insightsList.push({
        type: "info",
        title: "Tranches Actives",
        description: "Intégrations de flux s'exécutent normalement."
      });
    }
    return insightsList;
  };
  const systemInsights = getDynamicInsights();

  const handleRestartFlow = (runId: string) => {
    setRestartingFlowId(runId);
    setTimeout(() => {
      setFlowRuns((prev) =>
        prev.map((run) =>
          run.runId === runId ? { ...run, status: "Succeeded", triggerTime: new Date().toISOString() } : run
        )
      );
      setRestartingFlowId(null);
      toast.success("Le flux a été relancé et synchronisé !");
    }, 1200);
  };

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
    borderRadius: "12px",
    color: isDarkMode ? "#f8fafc" : "#0f172a",
    border: isDarkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    fontSize: "12px",
    padding: "8px 12px",
  };

  const userName = localStorage.getItem("userName") || "Administrateur";

  return (
    <div className="w-full space-y-6">
      
      {/* Greeting Section */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Supervision Générale <span className="animate-pulse text-[#1F3B73]">⚡</span>
            </h1>
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Bonjour {userName}. Vue d'ensemble de la plateforme et de l'intégration Dataverse.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/admin/dossiers")}
              className="flex items-center gap-1.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl py-2 px-4 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Supervision
            </button>
            <button
              onClick={() => navigate("/admin/configuration")}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl py-2 px-4 text-xs font-bold transition-all cursor-pointer"
            >
               Paramètres
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 1: 4 STAT CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card: Volume Total */}
        <div
          style={{ animationDelay: "0ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Volume Total</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Layers className="w-4 h-4 text-[#1F3B73]" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : totalDossiers.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">dossiers Dataverse</span>
          </div>
        </div>

        {/* Card: Actifs Bloqués */}
        <div
          style={{ animationDelay: "60ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Actifs Bloqués</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10">
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : dossiersBloques.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            {dossiersBloques > 0 ? (
              <><TrendingUp className="w-3.5 h-3.5 text-red-500" /><span className="text-xs font-semibold text-red-500">Action requise</span></>
            ) : (
              <span className="text-xs text-slate-400">Aucun blocage critique</span>
            )}
          </div>
        </div>

        {/* Card: Dossiers Payés */}
        <div
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Clôturés / Payés</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : dossiersPayes.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Flux finalisés</span>
          </div>
        </div>

        {/* Card: Hors Délai */}
        <div
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Hors Délai</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Ban className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : dossiersHorsDelai.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Temps moyen {averageDelayDays} j</span>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: MAIN CONTENT + SIDEBAR ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Vue Globale + Area Chart + Sub-stats */}
          <div
            style={{ animationDelay: "220ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tendance Globale</h3>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalDossiers}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-xs font-semibold text-teal-500">{complianceRate}%</span>
                  <span className="text-xs text-slate-400">conformes SLA</span>
                </div>
              </div>
            </div>

            <div className="h-[200px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F3B73" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1F3B73" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ stroke: isDarkMode ? '#1e293b' : '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={tooltipStyle} />
                  <Area
                    type="natural"
                    dataKey="Activité"
                    stroke="#1F3B73"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAct)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-stats row (Shopeers 'Customers' Card Style) */}
            <div className="mt-8 pt-6 border-t border-slate-100/60 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Répartition par Étape</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="border-l-2 border-b-4 border-slate-400 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all duration-300">
                  <span className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1.5">{dossiersEnTransit}</span>
                  <span className="text-[11px] text-slate-400 font-medium">En Transit</span>
                </div>
                <div className="border-l-2 border-b-4 border-emerald-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all duration-300">
                  <span className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1.5">{dossiersPresc}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Prescripteurs</span>
                </div>
                <div className="border-l-2 border-b-4 border-amber-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-all duration-300">
                  <span className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1.5">{dossiersDCF}</span>
                  <span className="text-[11px] text-slate-400 font-medium">DCF</span>
                </div>
                <div className="border-l-2 border-b-4 border-rose-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 transition-all duration-300">
                  <span className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1.5">{dossiersTreso}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Trésorerie</span>
                </div>
                <div className="border-l-2 border-b-4 border-violet-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:bg-violet-50/50 dark:hover:bg-violet-500/10 transition-all duration-300">
                  <span className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1.5">{dossiersAgence}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Agence</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights replacing standard list */}
          <div
            style={{ animationDelay: "280ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col"
          >
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Insights Générés par le Système
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              {systemInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    {insight.type === "danger" ? (
                      <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500"><ShieldAlert className="w-3.5 h-3.5" /></div>
                    ) : insight.type === "warning" ? (
                      <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500"><AlertTriangle className="w-3.5 h-3.5" /></div>
                    ) : insight.type === "success" ? (
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"><CheckCircle className="w-3.5 h-3.5" /></div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#1F3B73]"><Info className="w-3.5 h-3.5" /></div>
                    )}
                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{insight.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="flex flex-col gap-6">
          
          {/* Aging Bar Chart (Shopeers Style) */}
          <div
            style={{ animationDelay: "360ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-6 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Ancienneté Blocages</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={70} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Moins de 5j" stackId="a" fill={BRACKET_COLORS["Moins de 5j"]} radius={[0, 0, 0, 0]} barSize={22} />
                  <Bar dataKey="5 à 10j" stackId="a" fill={BRACKET_COLORS["5 à 10j"]} radius={[0, 0, 0, 0]} barSize={22} />
                  <Bar dataKey="Plus de 10j" stackId="a" fill={BRACKET_COLORS["Plus de 10j"]} radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA Donut (Shopeers Style) */}
          <div
            style={{ animationDelay: "420ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-6 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Conformité Règle 5J</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <PremiumGauge rate={complianceRate} count={compliantCount} total={totalDossiers} />
            
            <div className="flex justify-center mt-3">
              <button className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Voir les détails
              </button>
            </div>
          </div>

          {/* Integration Moniteur */}
          <div
            style={{ animationDelay: "480ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 flex-none">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Flux Power Automate</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Surveillance temps réel</p>
              </div>
              <button onClick={() => setFlowRuns(INITIAL_FLOW_RUNS)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-[#1F3B73] dark:text-blue-400">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {flowRuns.map((run, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:border-[#1F3B73]/30 bg-slate-50/50 dark:bg-slate-900/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${run.status === 'Succeeded' ? 'bg-emerald-500' : run.status === 'Failed' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{run.flowName}</h4>
                    </div>
                    {run.status === "Failed" && (
                      <button 
                        onClick={() => handleRestartFlow(run.runId)}
                        disabled={restartingFlowId === run.runId}
                        className="px-2 py-1 text-[9px] font-bold bg-[#1F3B73] hover:bg-[#16294F] text-white rounded cursor-pointer transition-colors"
                      >
                         {restartingFlowId === run.runId ? "..." : "Relancer"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400 font-mono">{run.entityName}</span>
                    <span className="text-[9px] text-slate-400">{new Date(run.triggerTime).toLocaleTimeString("fr-FR", { hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
