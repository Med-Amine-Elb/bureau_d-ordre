import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";
import { useEffect, useState } from "react";
import {
  PackageSearch,
  Eye,
  FileText,
  CheckCircle,
  CheckCircle2,
  Plus,
  Send,
  Sparkles,
  Users,
  Layers,
  TrendingUp,
  MoreHorizontal,
  PhoneCall
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell
} from "recharts";
import { useNavigate, Link } from "react-router-dom";
import KpiCard from "@/components/KpiCard";
import { dataService } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";
import type { Dossier, SystemUser, DepartmentLookup } from "@/lib/dataService";
import { PremiumGauge } from "@/components/PremiumGauge";
import TransmissionModal from "@/components/TransmissionModal";
import { isInvoiceReceiptOverdue } from "@/lib/invoiceReceiptDeadline";



export default function DashboardBO() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [invoiceReceiptLimitDays, setInvoiceReceiptLimitDays] = useState(5);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [selectedDossierForTransmission, setSelectedDossierForTransmission] = useState<Dossier | null>(null);
  const [transmissionTargetRole, setTransmissionTargetRole] = useState<"Prescripteur" | "DCF">("Prescripteur");
  const [transmissionInitialCollector, setTransmissionInitialCollector] = useState("");

  const fetchData = async () => {
    try {
      const [dossiersResult, usersResult, deptsResult, systemConfig] = await Promise.all([
        dataService.getDossiers(),
        dataService.getUsers(),
        dataService.getDepartmentsLookup(),
        dataService.getSystemConfig().catch(() => null),
      ]);
      setDossiers(dossiersResult);
      setUsers(usersResult);
      setDepartments(deptsResult);
      if (systemConfig) setInvoiceReceiptLimitDays(systemConfig.new_invoicereceiptlimitdays);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Calculations ──
  const totalDossiersCount = dossiers.length;
  const enCoursTotal = dossiers.filter((d) => d.new_status !== 150 && d.new_status !== 20).length;
  const enAttenteBO = dossiers.filter((d) => d.new_status === 10).length;
  const chequesAttente = dossiers.filter((d) => d.new_status > 70 && d.new_status < 150).length;
  const payesCount = dossiers.filter((d) => d.new_status === 150).length;

  // Sub-stat counts by workflow stage
  const dossiersBO = dossiers.filter((d) => d.new_status === 10 || d.new_status === 50 || d.new_status === 60).length;
  const dossiersPrescripteur = dossiers.filter((d) => d.new_status === 30 || d.new_status === 40).length;
  const dossiersDCF = dossiers.filter((d) => d.new_status === 70 || d.new_status === 80 || d.new_status === 90).length;
  const dossiersTresorerie = dossiers.filter((d) => d.new_status === 100 || d.new_status === 110).length;
  const dossiersAgence = dossiers.filter((d) => d.new_status >= 120 && d.new_status <= 140).length;

  // Conformité du délai entre la date de facture et la réception au BO.
  const compliantCount = dossiers.filter((d) => {
    return !isInvoiceReceiptOverdue(d.new_invoice_date, d.new_reception_date, invoiceReceiptLimitDays);
  }).length;
  const complianceRate = totalDossiersCount > 0 ? Math.round((compliantCount / totalDossiersCount) * 100) : 100;

  const completedCount = dossiers.filter((d) => d.new_status === 150).length;
  const completedRate = totalDossiersCount > 0 ? Math.round((completedCount / totalDossiersCount) * 100) : 0;
  // Pie data for segmentation
  const statutCounts = dossiers.reduce((acc, curr) => {
    const s = curr.new_status;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const pieData = [
    { name: "BO", value: statutCounts[10] || 0, color: "#3b82f6" },
    { name: "Prescripteur", value: statutCounts[40] || 0, color: "#8b5cf6" },
    { name: "DCF (Compta)", value: statutCounts[80] || 0, color: "#ec4899" },
    { name: "Trésorerie", value: statutCounts[110] || 0, color: "#f97316" },
    { name: "En agence", value: statutCounts[140] || 0, color: "#10b981" }
  ].filter(item => item.value > 0);

  if (pieData.length === 0) {
    pieData.push({ name: "Aucun dossier", value: 1, color: "#cbd5e1" });
  }

  // Trend data (last 7 days) for area chart
  const trendDataMap: Record<string, { total: number, facture: number, avoir: number, acompte: number, courrier: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const dDate = new Date();
    dDate.setDate(dDate.getDate() - i);
    const label = dDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    trendDataMap[label] = { total: 0, facture: 0, avoir: 0, acompte: 0, courrier: 0 };
  }
  dossiers.forEach((d) => {
    if (!d.new_reception_date) return;
    const dDate = new Date(d.new_reception_date);
    const label = dDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    if (label in trendDataMap) {
      trendDataMap[label].total += 1;
      const t = d.new_document_type;
      if (t === 100 || t === 400) trendDataMap[label].facture += 1;
      else if (t === 200) trendDataMap[label].avoir += 1;
      else if (t === 500) trendDataMap[label].acompte += 1;
      else if (t === 600) trendDataMap[label].courrier += 1;
      else trendDataMap[label].facture += 1; // Default to facture if unknown
    }
  });
  const activityTrendData = Object.keys(trendDataMap).map((key) => ({
    date: key,
    total: trendDataMap[key].total,
    Factures: trendDataMap[key].facture,
    Avoirs: trendDataMap[key].avoir,
    Acomptes: trendDataMap[key].acompte,
    Courriers: trendDataMap[key].courrier
  }));

  // Weekly bar chart data (by day of week)
  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayCounts: Record<string, number> = {};
  dayLabels.forEach(d => { dayCounts[d] = 0; });
  dossiers.forEach((d) => {
    if (!d.new_reception_date) return;
    const dayIndex = new Date(d.new_reception_date).getDay();
    const mapped = dayIndex === 0 ? "Dim" : dayLabels[dayIndex - 1];
    if (mapped in dayCounts) dayCounts[mapped] += 1;
  });
  const weeklyBarData = dayLabels.map(day => ({ day, count: dayCounts[day] }));

  // ── Collaborators ──
  const dcfUserIds = new Set(dossiers.map(d => d.new_dcf_collector_guid || d.new_dcf_collector_id).filter(Boolean));
  const tresoUserIds = new Set(dossiers.map(d => d.new_collecteur_treso).filter(Boolean));
  const boUserIds = new Set(dossiers.map(d => d.new_accuse_par).filter(Boolean));

  const computedCollaborators = users
    .map((u) => {
      let role: string | null = null;

      if (u.new_department_id || u.fullname.toLowerCase().includes("sarah")) {
        role = "Prescripteur";
      } else if (dcfUserIds.has(u.systemuserid) || u.fullname.toLowerCase().includes("karim")) {
        role = "DCF";
      } else if (tresoUserIds.has(u.systemuserid) || u.fullname.toLowerCase().includes("meryem")) {
        role = "Tresorerie";
      } else if (
        boUserIds.has(u.systemuserid) ||
        u.fullname.toLowerCase().includes("amine") ||
        u.fullname.toLowerCase().includes("bo") ||
        u.fullname.toLowerCase().includes("agent")
      ) {
        role = "BO";
      }

      if (!role || u.new_status !== "Actif" || role === "Admin") {
        return null;
      }

      let count = 0;
      if (role === "Prescripteur") {
        count = dossiers.filter(
          (d) =>
            (d.new_status === 30 || d.new_status === 40) &&
            (d.new_department_guid === u.new_department_id || !u.new_department_id)
        ).length;
      } else if (role === "DCF") {
        count = dossiers.filter((d) => d.new_status === 70 || d.new_status === 80).length;
      } else if (role === "Tresorerie") {
        count = dossiers.filter((d) => d.new_status === 100 || d.new_status === 110).length;
      } else if (role === "BO") {
        count = dossiers.filter(
          (d) => d.new_status === 50 || d.new_status === 60 || (d.new_status === 120 && d.new_payment_method === 1)
        ).length;
      }

      const workload = count <= 2 ? "low" : count <= 5 ? "medium" : "high";

      let roleText = role;
      if (role === "DCF") {
        roleText = "DCF / Comptabilité";
      } else if (role === "Tresorerie") {
        roleText = "Trésorerie";
      } else if (role === "BO") {
        roleText = "Bureau d'Ordre";
      } else if (role === "Prescripteur") {
        const dept = departments.find(d => d.new_departmentid === u.new_department_id);
        roleText = dept ? `Prescripteur (${dept.new_name})` : "Prescripteur";
      }

      return {
        name: u.fullname,
        role: roleText,
        status: u.new_status || "Actif",
        workload,
        count,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── Handlers ──
  const handleTransmit = (dossier: Dossier) => {
    const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
    const isReturningFromPrescripteur = dossier.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;

    setSelectedDossierForTransmission(dossier);
    setTransmissionTargetRole(isToDCF ? "DCF" : "Prescripteur");
    setTransmissionInitialCollector(isToDCF ? (dossier.new_dcf_collector_guid || "") : (dossier.new_prescriber_guid || ""));
    setShowTransmissionModal(true);
  };

  const handleConfirmTransmission = async (data: { collecteur: string; commentaire: string }) => {
    if (!selectedDossierForTransmission) return;
    setShowTransmissionModal(false);
    setLoading(true);

    const isFluxCourt = selectedDossierForTransmission.new_document_type === 400 || selectedDossierForTransmission.new_document_type === 500;
    const isReturningFromPrescripteur = selectedDossierForTransmission.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;
    const nextStatus = isToDCF ? 70 : 30;

    try {
      const payload: Partial<Dossier> = {
        new_status: nextStatus,
        ...(isToDCF ? { new_dcf_collector_id: data.collecteur } : { new_prescriber_id: data.collecteur }),
        new_description: data.commentaire
          ? `${selectedDossierForTransmission.new_description ? selectedDossierForTransmission.new_description + " | " : ""}Transmission : ${data.commentaire}`
          : selectedDossierForTransmission.new_description
      };

      await dataService.transmitDossier({
        folderId: selectedDossierForTransmission.new_folderid,
        folderNumber: selectedDossierForTransmission.new_folder_number,
        dossierChanges: payload,
        fromRole: "BO",
        toRole: isToDCF ? "DCF" : "Prescripteur",
        collectorId: data.collecteur,
        sendingComment: data.commentaire,
      });
      setSuccessMessage("Dossier transmis.");
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Impossible de transmettre le dossier." });
    } finally {
      setLoading(false);
    }
  };

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(dossier.new_folderid, 60, "Agent BO");
      setSuccessMessage("Réception confirmée.");
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const handleDeliverCourier = async (dossier: Dossier) => {
    setLoading(true);
    try {
      await dataService.completeCourierDelivery(dossier.new_folderid);
      setSuccessMessage(`Courrier ${dossier.new_folder_number} livré. Dossier clôturé.`);
      setSuccessModalOpen(true);
      await fetchData();
    } catch (error) {
      toast.error("Impossible de clôturer le courrier.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabelText = (status: number) => {
    switch (status) {
      case 10: return getDossierStatusLabel(status);
      case 20: return "Hors délai";
      case 30:
      case 40:
      case 50:
      case 60:
      case 70:
      case 80:
      case 90:
      case 100:
      case 110:
      case 120:
      case 130:
      case 140:
      case 150: return getDossierStatusLabel(status);
      default: return `Statut ${status}`;
    }
  };

  const getStatusBadgeStyle = (status: number) => {
    switch (status) {
      case 20: return "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      case 90: return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      case 40:
      case 80:
      case 110: return "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20";
      case 150: return "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20";
      default: return "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20";
    }
  };

  const dossiersEnAttenteBO = dossiers.filter((d) => d.new_status === 50);

  // Reusable tooltip style for Recharts
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
    borderRadius: "12px",
    color: isDarkMode ? "#f8fafc" : "#0f172a",
    border: isDarkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    fontSize: "12px",
    padding: "8px 12px",
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1120] p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[160px] border border-slate-800">
          <p className="text-[13px] font-medium text-white mb-3">{label}</p>
          <div className="space-y-2.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-1 h-3.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-slate-400 font-medium">{entry.name}</span>
                </div>
                <span className="font-semibold text-white ml-6">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  const userName = localStorage.getItem("userName") || "Mohammed El Boubakri";

  return (
    <div className="w-full space-y-6">

      {/* Greeting Section */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            Bienvenue, {userName}. Voici le récapitulatif de vos activités aujourd'hui.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={() => navigate("/bo/dossiers/nouveau")}
            className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl py-2.5 px-4 text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nouveau dossier
          </button>
          <button
            onClick={() => navigate("/bo/relances")}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold transition-colors cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" /> Relances
          </button>
        </div>
      </div>

      {/* ═══════════ ROW 1: 4 STAT CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Dossiers actifs"
          icon={Layers}
          value={enCoursTotal.toLocaleString()}
          loading={loading}
          iconColorClass="text-[#1F3B73] dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-500/10"
          animationDelay="0ms"
          onClick={() => navigate("/bo/dossiers")}
          subtext={
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-500">+{enAttenteBO}</span>
              <span className="text-xs text-slate-400">en attente BO</span>
            </>
          }
        />
        <KpiCard
          title="Chèques en attente"
          icon={PackageSearch}
          value={chequesAttente.toLocaleString()}
          loading={loading}
          iconColorClass="text-violet-500 dark:text-violet-400"
          iconBgClass="bg-violet-50 dark:bg-violet-500/10"
          animationDelay="60ms"
          onClick={() => navigate("/bo/remises")}
          subtext={<span className="text-xs text-slate-400">logistique &amp; remise</span>}
        />
        <KpiCard
          title="Conformité SLA"
          icon={Sparkles}
          value={`${complianceRate}%`}
          loading={loading}
          iconColorClass="text-teal-500 dark:text-teal-400"
          iconBgClass="bg-teal-50 dark:bg-teal-500/10"
          animationDelay="120ms"
          subtext={
            <>
              {complianceRate >= 80 ? (
                <><TrendingUp className="w-3.5 h-3.5 text-teal-500" /><span className="text-xs font-semibold text-teal-500">Conforme</span></>
              ) : (
                <span className="text-xs font-semibold text-amber-500">Amélioration requise</span>
              )}
            </>
          }
        />
        <KpiCard
          title="Clôturés / payés"
          icon={CheckCircle}
          value={payesCount.toLocaleString()}
          loading={loading}
          iconColorClass="text-amber-500 dark:text-amber-400"
          iconBgClass="bg-amber-50 dark:bg-amber-500/10"
          animationDelay="180ms"
          subtext={<span className="text-xs text-slate-400">vs. {totalDossiersCount} total</span>}
        />
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
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Vue globale des dossiers</h3>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalDossiersCount}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-xs font-semibold text-teal-500">{complianceRate}%</span>
                  <span className="text-xs text-slate-400">conformes SLA</span>
                </div>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-[200px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFactures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F3B73" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1F3B73" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAvoirs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAcomptes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCourriers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ stroke: isDarkMode ? '#1e293b' : '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="natural"
                    dataKey="Factures"
                    stroke="#1F3B73"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFactures)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Area
                    type="natural"
                    dataKey="Avoirs"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAvoirs)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Area
                    type="natural"
                    dataKey="Acomptes"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAcomptes)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Area
                    type="natural"
                    dataKey="Courriers"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCourriers)"
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-stats row (Shopeers 'Customers' Card Style) */}
            <div className="mt-8 pt-6 border-t border-slate-100/60 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Répartition par rôle</h3>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {/* Bureau d'Ordre */}
                <div className="border-l-2 border-b-4 border-blue-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all duration-300 ease-out">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-bold text-lg text-slate-900 dark:text-white leading-none">{dossiersBO}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Bureau d'Ordre</span>
                </div>

                {/* Prescripteurs */}
                <div className="border-l-2 border-b-4 border-emerald-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all duration-300 ease-out">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-lg text-slate-900 dark:text-white leading-none">{dossiersPrescripteur}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Prescripteurs</span>
                </div>

                {/* DCF */}
                <div className="border-l-2 border-b-4 border-amber-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-all duration-300 ease-out">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-lg text-slate-900 dark:text-white leading-none">{dossiersDCF}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Comptabilité</span>
                </div>

                {/* Trésorerie */}
                <div className="border-l-2 border-b-4 border-rose-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/20 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 transition-all duration-300 ease-out">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-bold text-lg text-slate-900 dark:text-white leading-none">{dossiersTresorerie}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Trésorerie</span>
                </div>

                {/* Agence */}
                <div className="border-l-2 border-b-4 border-violet-500 pl-3 pb-2 flex flex-col rounded-bl-sm group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/20 hover:bg-violet-50/50 dark:hover:bg-violet-500/10 transition-all duration-300 ease-out">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PackageSearch className="w-3.5 h-3.5 text-violet-500" />
                    <span className="font-bold text-lg text-slate-900 dark:text-white leading-none">{dossiersAgence}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Agence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Cheques (if any) */}
          {dossiersEnAttenteBO.length > 0 && (
            <div
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chèques reçus de trésorerie ({dossiersEnAttenteBO.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dossiersEnAttenteBO.map((d) => (
                  <div
                    key={d.new_folderid}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-[#1F3B73]/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                        <FileText className="w-4 h-4 text-[#1F3B73]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{d.new_folder_number}</h4>
                        <p className="text-[10px] text-slate-400">{d.new_supplier_id || "—"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAccuse(d)}
                      className="px-3 py-1.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Accuser
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dossiers Table */}
          <div
            style={{ animationDelay: "320ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col"
          >
            <div className="p-5 pb-0 flex items-center justify-between flex-none">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dossiers en cours de traitement</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Suivi des étapes actives et relances des acteurs.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/bo/dossiers")} className="text-xs font-semibold text-[#1F3B73] hover:underline cursor-pointer">
                  Voir tout
                </button>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4 flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-5">N° Dossier</th>
                    <th className="py-3 px-5">Fournisseur</th>
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5">Statut</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 animate-pulse text-xs">Chargement...</td>
                    </tr>
                  ) : dossiers.filter((d) => d.new_status !== 150 && d.new_status !== 20).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">Aucun dossier actif.</td>
                    </tr>
                  ) : (
                    dossiers
                      .filter((d) => d.new_status !== 150 && d.new_status !== 20)
                      .slice(0, 5)
                      .map((d) => (
                        <tr key={d.new_folderid} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <Link to={`/bo/dossiers/${d.new_folderid}`} className="text-xs font-semibold text-[#1F3B73] hover:underline">
                                {d.new_folder_number}
                              </Link>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-xs font-medium text-slate-600 dark:text-slate-400">{d.new_supplier_id || "—"}</td>
                          <td className="py-3.5 px-5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {d.new_document_type === 100 ? "Facture" : d.new_document_type === 200 ? "Avoir" : d.new_document_type === 500 ? "Acompte" : "Courrier"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(d.new_status)}`}>
                              {getStatusLabelText(d.new_status)}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              {(d.new_status === 10 || d.new_status === 60) && (
                                <button onClick={() => d.new_document_type === 600 ? handleDeliverCourier(d) : handleTransmit(d)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                                  {d.new_document_type === 600 ? <><CheckCircle2 className="w-3 h-3" /> Marquer livré</> : <><Send className="w-3 h-3" /> Transmettre</>}
                                </button>
                              )}
                              <button onClick={() => navigate(`/bo/dossiers/${d.new_folderid}`)} className="p-1.5 text-slate-400 hover:text-[#1F3B73] transition-colors cursor-pointer">
                                <Eye className="w-3.5 h-3.5" />
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

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="flex flex-col gap-6">

          {/* Activity Bar Chart (Shopeers Style) */}
          <div
            style={{ animationDelay: "360ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-6 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Jour le plus actif</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBarData} barSize={22} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const isMax = payload.value === weeklyBarData.reduce((max, d) => d.count > max.count ? d : max, weeklyBarData[0]).day;
                      return (
                        <text x={x} y={y + 12} textAnchor="middle" fill={isMax ? (isDarkMode ? "#93C5FD" : "#1F3B73") : (isDarkMode ? "#A3B2C7" : "#94a3b8")} fontSize={11} fontWeight={isMax ? "bold" : "normal"}>
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 6, 6]}
                    label={(props: any) => {
                      const { x, y, width, value, index } = props;
                      const dataPoint = weeklyBarData[index];
                      const isMax = dataPoint.count === Math.max(...weeklyBarData.map(d => d.count)) && dataPoint.count > 0;
                      if (!isMax) return <g></g>;
                      return (
                        <text x={x + width / 2} y={y - 8} fill="#111827" textAnchor="middle" fontSize={12} fontWeight="bold" className="dark:fill-white">
                          {value.toLocaleString()}
                        </text>
                      );
                    }}
                  >
                    {weeklyBarData.map((entry, index) => {
                      const isMax = entry.count === Math.max(...weeklyBarData.map(d => d.count)) && entry.count > 0;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isMax ? (isDarkMode ? "#60A5FA" : "#1F3B73") : (isDarkMode ? "#475569" : "#f1f5f9")}
                        />
                      );
                    })}
                  </Bar>
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
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Dossiers complétés</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <PremiumGauge rate={completedRate} count={completedCount} total={totalDossiersCount} />

            <div className="flex justify-center mt-3">
              <button className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Voir les détails
              </button>
            </div>
          </div>

          {/* Collaborators */}
          <div
            style={{ animationDelay: "480ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Collaborateurs</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Responsables d'étapes actifs</p>
              </div>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              {computedCollaborators.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Aucun collaborateur</p>
              ) : (
                computedCollaborators.slice(0, 5).map((col, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span aria-label={`Charge ${col.workload === "low" ? "faible" : col.workload === "medium" ? "moyenne" : "élevée"}`} className={`h-2.5 w-2.5 shrink-0 rounded-full ${col.workload === "low" ? "bg-emerald-500" : col.workload === "medium" ? "bg-amber-500" : "bg-red-500"}`} />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{col.name}</h4>
                        <span className="text-[10px] text-slate-400">{col.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{col.count}</span>
                      <p className="text-[9px] text-slate-400 uppercase">dossiers</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════ MODALS ═══════════ */}
<SuccessConfirmationModal open={successModalOpen} message={successMessage} onClose={() => setSuccessModalOpen(false)} />

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={selectedDossierForTransmission?.new_folder_number || ""}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
        directionId={selectedDossierForTransmission?.new_department_guid}
      />
    </div>
  );
}
