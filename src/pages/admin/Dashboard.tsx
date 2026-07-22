import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle,
  Workflow,
  TrendingUp,
  Sparkles,
  Info,
  FileCheck,
  Ban,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

const COLORS = [
  "#2b4c7e", // SBM Blue
  "#3b82f6", // Vivid Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#10b981", // Emerald
  "#64748b"  // Slate
];

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

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1000; // 1s animation

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(ease * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [flowRuns, setFlowRuns] = useState<FlowRun[]>(INITIAL_FLOW_RUNS);
  const [restartingFlowId, setRestartingFlowId] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await dataService.getDossiers();
        setDossiers(list);
      } catch (err) {
        toast.error("Erreur lors du chargement des données");
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (heroRef.current) {
      const targets = heroRef.current.querySelectorAll(".gsap-animate");
      gsap.fromTo(
        targets,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" }
      );
    }
  }, [dossiers]);

  // calculations
  const totalDossiers = dossiers.length;
  const dossiersBloques = dossiers.filter((d) => d.new_is_blocked).length;
  const dossiersPayes = dossiers.filter((d) => d.new_status === 150).length;

  // Dossiers currently in Hors Délai status (code 20)
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

  // Status breakdown
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 10: return "Brouillon";
      case 20: return "Hors Délai";
      case 30:
      case 50:
      case 70:
      case 100: return "En Transit";
      case 40: return "Prescripteur";
      case 60: return "Prêt DCF";
      case 80: return "Chez DCF";
      case 90: return "Correction";
      case 110: return "Trésorerie";
      case 120: return "Attente Remise";
      case 130: return "En Transport";
      case 140: return "En Agence";
      case 150: return "Clôturé/Payé";
      default: return `Statut ${status}`;
    }
  };

  const statusMap: Record<string, number> = {};
  dossiers.forEach((d) => {
    const lbl = getStatusLabel(d.new_status);
    statusMap[lbl] = (statusMap[lbl] || 0) + 1;
  });

  const pieData = Object.keys(statusMap).map((key) => ({
    name: key,
    value: statusMap[key]
  }));

  // Stacked Aging Balance for Blocked Files
  const agingDataMap = {
    "Factures": { name: "Factures", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Avoirs": { name: "Avoirs", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Acomptes": { name: "Acomptes", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Courriers": { name: "Courriers", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 },
    "Autres": { name: "Autres", "Moins de 5j": 0, "5 à 10j": 0, "Plus de 10j": 0 }
  };

  dossiers.forEach((d) => {
    if (!d.new_is_blocked) return;

    // Calculate age of blockage or reception
    const age = differenceInDays(new Date(), parseISO(d.new_reception_date));
    let bracket: "Moins de 5j" | "5 à 10j" | "Plus de 10j" = "Moins de 5j";
    if (age > 10) bracket = "Plus de 10j";
    else if (age >= 5) bracket = "5 à 10j";

    let typeKey: keyof typeof agingDataMap = "Autres";
    if (d.new_document_type === 100) typeKey = "Factures";
    else if (d.new_document_type === 200) typeKey = "Avoirs";
    else if (d.new_document_type === 500) typeKey = "Acomptes";
    else if (d.new_document_type === 600) typeKey = "Courriers";

    agingDataMap[typeKey][bracket] += 1;
  });
  const agingChartData = Object.values(agingDataMap);

  // SLA Radial Gauge Data
  const gaugeData = [
    { name: "Conforme", value: complianceRate, fill: "#10b981" },
    { name: "Non-conforme", value: 100 - complianceRate, fill: "rgba(148, 163, 184, 0.15)" }
  ];


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
    "Dossiers Reçus": trendDataMap[key]
  }));

  // Dynamic Smart Insights based on mock data analysis
  const getDynamicInsights = () => {
    const insightsList = [];

    // Insight 1: Blockage volume
    if (dossiersBloques > 3) {
      insightsList.push({
        type: "danger",
        title: "Alerte de Blocage Critique",
        description: `Il y a actuellement ${dossiersBloques} dossiers bloqués en attente d'une action corrective.`
      });
    } else {
      insightsList.push({
        type: "success",
        title: "Stabilité du Workflow",
        description: "Le volume de dossiers bloqués reste sous contrôle et conforme aux seuils standards."
      });
    }

    // Insight 2: SLA rule of 5 days
    if (complianceRate < 85) {
      insightsList.push({
        type: "warning",
        title: "Respect SLA de Dépôt Faible",
        description: `Seul ${complianceRate}% des factures respectent le délai réglementaire de dépôt de 5 jours.`
      });
    } else {
      insightsList.push({
        type: "success",
        title: "Excellent SLA de Dépôt",
        description: `Conformité élevée : ${complianceRate}% des dossiers respectent la règle de saisie des 5 jours.`
      });
    }

    // Insight 3: Power Automate status
    const failedFlows = flowRuns.filter(r => r.status === "Failed").length;
    if (failedFlows > 0) {
      insightsList.push({
        type: "danger",
        title: "Moniteur d'Intégration",
        description: `${failedFlows} flux de relance Power Automate sont en échec. Action manuelle requise.`
      });
    } else {
      insightsList.push({
        type: "info",
        title: "Tranches Horaires Actives",
        description: "Toutes les connexions et intégrations de flux s'exécutent normalement."
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
      toast.success("Le flux Power Automate a été relancé et synchronisé !");
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Console de supervision Hero Banner */}
      <div ref={heroRef} className="relative rounded-3xl p-8 md:p-10 overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#111827] border border-slate-800 shadow-xl group transition-all duration-300 hover:shadow-2xl">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        {/* Ambient glowing blobs in corners */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-700"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 gsap-animate opacity-0">
              <span className="inline-block py-1 px-3 rounded-lg bg-blue-600/30 text-blue-200 text-[11px] font-extrabold tracking-wider border border-blue-400/50 uppercase">
                Groupe SBM
              </span>
              <span className="inline-block py-1 px-3 rounded-lg bg-slate-700/65 text-white text-[11px] font-extrabold tracking-wider border border-slate-500/60 uppercase">
                Bureau d'Ordre Central
              </span>
              <span className="inline-block py-1 px-3 rounded-lg bg-amber-500/25 text-amber-200 text-[11px] font-extrabold tracking-wider border border-amber-400/50 uppercase">
                Espace Superviseur
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none gsap-animate opacity-0">
              Espace d'Administration et de Supervision
            </h1>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed gsap-animate opacity-0">
              Plateforme de pilotage et de gouvernance du Bureau d'Ordre. Le référentiel comprend <strong className="text-white">{totalDossiers} dossiers</strong> enregistrés dans Dataverse, dont <strong className="text-red-400">{dossiersBloques} blocages</strong> en attente de résolution et <strong className="text-orange-400">{flowRuns.filter(r => r.status === 'Failed').length} anomalies d'intégration</strong> Power Automate nécessitant une surveillance.
            </p>
          </div>

          {/* Action Trigger Card */}
          <div className="flex flex-col gap-3 min-w-[220px] w-full md:w-auto gsap-animate opacity-0">
            <button
              onClick={() => navigate("/admin/dossiers")}
              className="w-full bg-[#2b4c7e] hover:bg-[#3d659e] text-white rounded-xl py-3 px-6 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 border border-[#3d659e]/30"
            >
              <ShieldCheck className="w-4 h-4" /> Supervision des Dossiers
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/admin/utilisateurs")}
                className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                Utilisateurs
              </button>
              <button
                onClick={() => navigate("/admin/configuration")}
                className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                Configuration
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* KPI Section - 6 Premium Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {/* KPI 1: Total */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 shadow-sm border border-slate-150 dark:border-slate-800/80 hover:-translate-y-1 hover:border-[#2b4c7e]/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Volume Total</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-4"><AnimatedNumber value={totalDossiers} /></h3>
          <p className="text-[10px] text-slate-450 mt-1 font-semibold">Dossiers créés</p>
        </div>

        {/* KPI 2: Bloqués */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 shadow-sm border border-slate-150 dark:border-slate-800/80 hover:-translate-y-1 hover:border-red-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Actifs Bloqués</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-red-650 dark:text-red-400 mt-4"><AnimatedNumber value={dossiersBloques} /></h3>
          <p className="text-[10px] text-slate-450 mt-1 font-semibold">Bypass requis</p>
        </div>

        {/* KPI 3: Payés */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 shadow-sm border border-slate-150 dark:border-slate-800/80 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Dossiers Payés</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-450">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-650 dark:text-emerald-400 mt-4"><AnimatedNumber value={dossiersPayes} /></h3>
          <p className="text-[10px] text-slate-450 mt-1 font-semibold">Flux finalisés</p>
        </div>

        {/* KPI 4: Compliance */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 shadow-sm border border-slate-150 dark:border-slate-800/80 hover:-translate-y-1 hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Conformité SLA</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-indigo-650 dark:text-indigo-400 mt-4"><AnimatedNumber value={complianceRate} />%</h3>
          <p className="text-[10px] text-slate-450 mt-1 font-semibold">Règle des 5 jours</p>
        </div>

        {/* KPI 5: Hors Délai */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 shadow-sm border border-slate-150 dark:border-slate-800/80 hover:-translate-y-1 hover:border-amber-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Hors Délai</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-450 mt-4"><AnimatedNumber value={dossiersHorsDelai} /></h3>
          <p className="text-[10px] text-slate-450 mt-1 font-semibold">Hors délais dépôt</p>
        </div>

        {/* KPI 6: Average delay */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 shadow-sm border border-slate-150 dark:border-slate-800/80 hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Traitement Moyen</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-650 dark:text-purple-400 mt-4">{averageDelayDays} j</h3>
          <p className="text-[10px] text-slate-450 mt-1 font-semibold">Temps global de validation</p>
        </div>
      </div>

      {/* AI Smart Insights Section */}
      <div className="bg-gradient-to-r from-[#2b4c7e]/5 to-indigo-500/5 dark:from-[#2b4c7e]/10 dark:to-indigo-500/10 border border-[#2b4c7e]/15 p-6 rounded-3xl">
        <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> Insights Générés par le Système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {systemInsights.map((insight, idx) => (
            <div
              key={idx}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-3 shadow-sm"
            >
              {insight.type === "danger" ? (
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              ) : insight.type === "warning" ? (
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : insight.type === "success" ? (
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{insight.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visuels Section 1: Balance Âgée & SLA Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual 1: SLA Compliance Semi-Circle Gauge */}
        <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Performance Règle 5 Jours
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Pourcentage de dossiers conformes à la règle de dépôt de 5 jours.
            </p>
          </div>
          <div className="h-[180px] relative flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="90%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={85}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="rgba(148, 163, 184, 0.15)" stroke="none" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-[10%] text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{complianceRate}%</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Conformité</p>
            </div>
          </div>
          <div className="flex justify-around text-center border-t border-slate-50 dark:border-slate-800/80 pt-4 mt-2">
            <div>
              <span className="text-sm font-bold text-slate-850 dark:text-white">{compliantCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">Dossiers conformes</p>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
            <div>
              <span className="text-sm font-bold text-red-500">{totalDossiers - compliantCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">Dossiers en retard</p>
            </div>
          </div>
        </div>

        {/* Visual 2: Stacked Aging Balance Chart for Blocked Files */}
        <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Balance Âgée des Blocages Actifs
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Répartition des dossiers bloqués selon leur ancienneté en jours (Règle d'Alerte SLA).
          </p>
          <div className="h-[230px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={85} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    border: "none"
                  }}
                />
                <Legend iconType="circle" fontSize={10} verticalAlign="top" height={36} />
                <Bar dataKey="Moins de 5j" stackId="a" fill={BRACKET_COLORS["Moins de 5j"]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="5 à 10j" stackId="a" fill={BRACKET_COLORS["5 à 10j"]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Plus de 10j" stackId="a" fill={BRACKET_COLORS["Plus de 10j"]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visuels Section 2: Status breakdown and Activity Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual 3: Activity trend over last 7 days */}
        <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2b4c7e]" /> Tendance d'Activité (Dossiers reçus)
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Évolution du nombre de factures et courriers traités par jour sur le Bureau d'Ordre.
          </p>
          <div className="h-[230px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorDossiers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2b4c7e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2b4c7e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    border: "none"
                  }}
                />
                <Area type="monotone" dataKey="Dossiers Reçus" stroke="#2b4c7e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDossiers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 4: Répartition des statuts (PieChart) */}
        <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" /> Répartition par Statuts
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Positionnement global des dossiers dans le workflow SBM.
            </p>
          </div>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    border: "none"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-h-[80px] overflow-y-auto pt-2 border-t border-slate-50 dark:border-slate-800/80">
            {pieData.map((entry, index) => (
              <span key={index} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-550 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Monitoring Panel (Power Automate Runs) */}
      <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Workflow className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Moniteur d'Intégration Power Automate
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Surveillance en temps réel des déclencheurs de flux cloud liés aux modifications d'entités dans Dataverse.
            </p>
          </div>
          <button
            onClick={() => {
              setFlowRuns(INITIAL_FLOW_RUNS);
              toast.info("Journal de supervision rechargé");
            }}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser les logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/25">
                <th className="py-3 px-4">Flux Cloud</th>
                <th className="py-3 px-4">Date de déclenchement</th>
                <th className="py-3 px-4">Entité / Contexte</th>
                <th className="py-3 px-4">Déclenché par</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {flowRuns.map((run) => (
                <tr key={run.runId} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors group/row">
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    {run.flowName}
                  </td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(run.triggerTime).toLocaleString("fr-FR")}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-450 dark:text-slate-500 group-hover/row:text-slate-700 dark:group-hover/row:text-slate-350 transition-colors">
                    {run.entityName}
                  </td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {run.triggeredBy}
                  </td>
                  <td className="py-4 px-4">
                    {run.status === "Succeeded" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                        Succès
                      </span>
                    ) : run.status === "Failed" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Échec
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> En Cours
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {run.status === "Failed" && (
                      <button
                        onClick={() => handleRestartFlow(run.runId)}
                        disabled={restartingFlowId === run.runId}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-300 hover:text-white font-bold bg-indigo-50 hover:bg-indigo-650 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-100 hover:border-indigo-600 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        {restartingFlowId === run.runId ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> Envoi...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Relancer
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


