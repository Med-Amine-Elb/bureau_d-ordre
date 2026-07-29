import { useEffect, useState } from "react";
import {
  PackageSearch,
  Eye,
  FileText,
  PhoneCall,
  Truck,
  CheckCircle,
  Plus,
  Activity,
  Send,
  ArrowRight,
  Sparkles,
  Users,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier, SystemUser, DepartmentLookup } from "@/lib/dataService";
import TransmissionModal from "@/components/TransmissionModal";

export default function DashboardBO() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // States for Transmission Modal
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [selectedDossierForTransmission, setSelectedDossierForTransmission] = useState<Dossier | null>(null);
  const [transmissionTargetRole, setTransmissionTargetRole] = useState<"Prescripteur" | "DCF">("Prescripteur");
  const [transmissionInitialCollector, setTransmissionInitialCollector] = useState("");

  const fetchData = async () => {
    try {
      const [dossiersResult, usersResult, deptsResult] = await Promise.all([
        dataService.getDossiers(),
        dataService.getUsers(),
        dataService.getDepartmentsLookup()
      ]);
      setDossiers(dossiersResult);
      setUsers(usersResult);
      setDepartments(deptsResult);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Calculations ---
  const totalDossiersCount = dossiers.length;
  const enCoursTotal = dossiers.filter((d) => d.new_status !== 150 && d.new_status !== 20).length;
  const enAttenteBO = dossiers.filter((d) => d.new_status === 10).length;
  const chequesAttente = dossiers.filter((d) => d.new_status > 70 && d.new_status < 150).length;
  const payesCount = dossiers.filter((d) => d.new_status === 150).length;

  // SLA Compliance (Règle des 5 jours)
  const compliantCount = dossiers.filter((d) => {
    if (!d.new_invoice_date || !d.new_reception_date) return true;
    const diff = Math.abs(
      (new Date(d.new_reception_date).getTime() - new Date(d.new_invoice_date).getTime()) / (1000 * 3600 * 24)
    );
    return diff <= 5;
  }).length;
  const complianceRate = totalDossiersCount > 0 ? Math.round((compliantCount / totalDossiersCount) * 100) : 100;

  // SLA Radial Gauge Data
  const gaugeData = [
    { name: "Conforme", value: complianceRate, fill: "#10b981" },
    { name: "Non-conforme", value: 100 - complianceRate, fill: "#e2e8f0" }
  ];


  // Chart data: statuses distribution
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
    { name: "En Agence", value: statutCounts[140] || 0, color: "#10b981" }
  ].filter(item => item.value > 0);

  if (pieData.length === 0) {
    pieData.push({ name: "Aucun dossier", value: 1, color: "#cbd5e1" });
  }

  // Trend data (last 7 days)
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
  const activityTrendData = Object.keys(trendDataMap).map((key) => ({
    date: key,
    "Dossiers reçus": trendDataMap[key]
  }));

  const dcfUserIds = new Set(dossiers.map(d => d.new_dcf_collector_guid || d.new_dcf_collector_id).filter(Boolean));
  const tresoUserIds = new Set(dossiers.map(d => d.new_collecteur_treso).filter(Boolean));
  const boUserIds = new Set(dossiers.map(d => d.new_accuse_par).filter(Boolean));

  const computedCollaborators = users
    .map((u) => {
      let role: string | null = null;

      // Identify operational role
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

      // Filter out non-workflow/inactive/admin accounts
      if (!role || u.new_status !== "Actif" || role === "Admin") {
        return null;
      }

      // Calculate active count of folders for this user/role
      let count = 0;
      if (role === "Prescripteur") {
        // Only count folders that belong to this prescripteur's department
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
        avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${u.fullname}&backgroundColor=b6e3f4`
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleTransmit = (dossier: Dossier) => {
    const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
    const isReturningFromPrescripteur = dossier.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;

    setSelectedDossierForTransmission(dossier);
    setTransmissionTargetRole(isToDCF ? "DCF" : "Prescripteur");
    setTransmissionInitialCollector(isToDCF ? (dossier.new_dcf_collector_id || "") : (dossier.new_prescriber_id || ""));
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

      await dataService.updateDossier(selectedDossierForTransmission.new_folderid, payload);
      setSuccessMessage(
        `Le dossier ${selectedDossierForTransmission.new_folder_number} a été transmis vers ${nextStatus === 70 ? "la DCF" : "le Prescripteur"}.`,
      );
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de transmettre le dossier." });
    } finally {
      setLoading(false);
    }
  };

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(dossier.new_folderid, 60, "Agent BO");
      setSuccessMessage(`Réception accusée pour le dossier ${dossier.new_folder_number}. Prêt pour la DCF.`);
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  // Get status color
  const getStatusLabelText = (status: number) => {
    switch (status) {
      case 10: return "Sauvegarde";
      case 20: return "Hors Délai";
      case 30:
      case 50:
      case 70:
      case 100: return "En Transit";
      case 40: return "Chez Prescripteur";
      case 60: return "Prêt DCF";
      case 80: return "Chez DCF";
      case 90: return "Retour Correction";
      case 110: return "Trésorerie";
      case 120: return "Attente Remise";
      case 130: return "En Transport";
      case 140: return "Disponible Agence";
      case 150: return "Payé / Clôturé";
      default: return `Statut ${status}`;
    }
  };

  const getStatusBadgeStyle = (status: number) => {
    switch (status) {
      case 20: return "bg-red-500/10 text-red-500 border-red-500/20";
      case 90: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 40:
      case 80:
      case 110: return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case 150: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const dossiersEnAttenteBO = dossiers.filter((d) => d.new_status === 50);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">

      {/* 3-Column Immersive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Main centralized analytics & lists (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">

          {/* Gaming Launcher Inspired Hero Banner */}
          <div className="relative rounded-3xl p-8 md:p-10 overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] border border-slate-800 shadow-xl group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            {/* Ambient Red/Blue glowing blobs in corners */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-block py-1 px-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-extrabold tracking-wider border border-blue-500/20 uppercase">
                    Featured Workflow
                  </span>
                  <span className="inline-block py-1 px-2.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-extrabold tracking-wider border border-red-500/20 uppercase">
                    ⭐ Urgent
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                  Bonjour, Agent BO
                </h1>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Vous pilotez le Bureau d'Ordre. Actuellement, <strong className="text-white">{enAttenteBO} dossiers</strong> sont en attente d'affectation et <strong className="text-white">{dossiersEnAttenteBO.length} chèques</strong> nécessitent un accusé physique.
                </p>

                {/* Nested overlapping profile avatars (Gaming inspiration) */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-3">
                    {computedCollaborators.map((col, idx) => (
                      <img
                        key={idx}
                        src={col.avatar}
                        alt={col.name}
                        title={`${col.name} (${col.role})`}
                        className="w-8 h-8 rounded-full border-2 border-[#0F172B] bg-slate-800 object-cover hover:scale-110 hover:z-20 transition-all cursor-pointer"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    + {computedCollaborators.length} acteurs actifs
                  </span>
                </div>
              </div>

              {/* Action Trigger Card */}
              <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
                <button
                  onClick={() => navigate("/bo/dossiers/nouveau")}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 px-6 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Nouveau Dossier
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("/bo/relances")}
                    className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Relances
                  </button>
                  <button
                    onClick={() => navigate("/bo/remises")}
                    className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" /> Remises
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-State Cards: Gaming Challenge-Inspired Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Dossiers en Cours */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between group hover:border-[#2b4c7e]/40 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Dossiers Actifs</span>
                  <h4 className="text-xl font-black text-slate-850 dark:text-white">{enCoursTotal}</h4>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/5 text-blue-500">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold text-blue-500">
                <span className="uppercase tracking-wider">Superviser les flux</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Chèques en attente de transport */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between group hover:border-[#2b4c7e]/40 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Chèques Attente</span>
                  <h4 className="text-xl font-black text-slate-850 dark:text-white">{chequesAttente}</h4>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/5 text-purple-500">
                  <PackageSearch className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold text-purple-500">
                <span className="uppercase tracking-wider">Gérer la logistique</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Clôturés */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between group hover:border-[#2b4c7e]/40 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Clôturés / Payés</span>
                  <h4 className="text-xl font-black text-emerald-650 dark:text-emerald-450">{payesCount}</h4>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/5 text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold text-emerald-500">
                <span className="uppercase tracking-wider">Historique finalisé</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pending Cheques / Receivables Notification Grid */}
          {dossiersEnAttenteBO.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Chèques physiques reçus de Trésorerie ({dossiersEnAttenteBO.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dossiersEnAttenteBO.map((d) => (
                  <div
                    key={d.new_folderid}
                    className="bg-[#2b4c7e]/5 dark:bg-[#0F172B] border-2 border-dashed border-[#2b4c7e]/20 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 group hover:border-[#2b4c7e] transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-850 dark:text-white text-base">
                            {d.new_folder_number}
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Fournisseur : {d.new_supplier_id || "-"}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/bo/dossiers/${d.new_folderid}`)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-500 transition-all shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {d.new_documents_complements?.slice(0, 2).map((doc, idx) => (
                          <span key={idx} className="text-[9px] font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 border border-slate-100 dark:border-slate-800 max-w-[120px] truncate">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAccuse(d)}
                      className="w-full bg-[#2b4c7e] hover:bg-[#20395f] text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md shadow-[#2b4c7e]/10 hover:scale-[1.02]"
                    >
                      Accuser Réception Physiquement
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active dossiers supervision table */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-white text-base">
                  Dossiers Métiers en Cours de Traitement
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Suivi des étapes actives et relances des acteurs.
                </p>
              </div>
              <button
                onClick={() => navigate("/bo/dossiers")}
                className="text-xs font-bold text-[#2b4c7e] hover:underline"
              >
                Voir tout
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-3.5 px-4">Numéro Dossier</th>
                    <th className="py-3.5 px-4">Fournisseur</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Statut Actuel</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 animate-pulse">
                        Chargement des flux...
                      </td>
                    </tr>
                  ) : dossiers.filter((d) => d.new_status !== 150 && d.new_status !== 20).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Aucun dossier actif.
                      </td>
                    </tr>
                  ) : (
                    dossiers
                      .filter((d) => d.new_status !== 150 && d.new_status !== 20)
                      .slice(0, 5)
                      .map((d) => (
                        <tr key={d.new_folderid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                          {/* Code */}
                          <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                                <FileText className="w-4 h-4" />
                              </div>
                              {d.new_folder_number}
                            </div>
                          </td>
                          {/* Vendor */}
                          <td className="py-4 px-4 font-medium text-slate-650 dark:text-slate-455">
                            {d.new_supplier_id || "-"}
                          </td>
                          {/* Type */}
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 px-2 py-0.5 rounded">
                              {d.new_document_type === 100 ? "Facture" : d.new_document_type === 200 ? "Avoir" : d.new_document_type === 500 ? "Acompte" : "Courrier"}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeStyle(d.new_status)}`}>
                              {getStatusLabelText(d.new_status)}
                            </span>
                          </td>
                          {/* Direct Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {(d.new_status === 10 || d.new_status === 60) && (
                                <button
                                  onClick={() => handleTransmit(d)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                  <Send className="w-3 h-3" /> Transmettre
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/bo/dossiers/${d.new_folderid}`)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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

          {/* Activity Trend Graph (Area chart) */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2b4c7e]" /> Tendance Hebdomadaire de Saisie
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Nombre de dossiers reçus et numérisés au Bureau d'Ordre quotidiennement.
            </p>
            <div className="h-[210px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrendData}>
                  <defs>
                    <linearGradient id="colorBO" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2b4c7e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2b4c7e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                  <Area type="monotone" dataKey="Dossiers reçus" stroke="#2b4c7e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBO)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar monitoring (1/3 width) */}
        <div className="space-y-8">

          {/* Circular SLA Gauge: Red Dead Redemption Statistics Style */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> Taux de Respect SLA (BO)
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                Conformité globale par rapport à la règle de dépôt de 5 jours.
              </p>
            </div>

            {/* Semicircle PieChart Gauge */}
            <div className="h-[150px] relative flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={75}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#e2e8f0" stroke="none" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-[10%] text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{complianceRate}%</span>
                <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">SLA Conforme</p>
              </div>
            </div>

            {/* Micro pills below circular chart */}
            <div className="flex justify-around text-center border-t border-slate-50 dark:border-slate-800/80 pt-4 mt-2 text-xs">
              <div>
                <span className="font-extrabold text-slate-850 dark:text-white">{compliantCount}</span>
                <p className="text-[10px] text-slate-400">Conformes</p>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
              <div>
                <span className="font-extrabold text-red-500">{totalDossiersCount - compliantCount}</span>
                <p className="text-[10px] text-slate-400">En Retard</p>
              </div>
            </div>
          </div>

          {/* Active Collaborators Panel (Direct translation of RDR2 Friend List) */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#2b4c7e]" /> Collaborateurs du Workflow
            </h2>
            <p className="text-[11px] text-slate-400 mb-6">
              Responsables d'étapes et charge de travail active.
            </p>

            <div className="space-y-4">
              {computedCollaborators.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Aucun collaborateur enregistré</p>
              ) : (
                computedCollaborators.map((col, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/40 hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={col.avatar} alt={col.name} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#0F172B] ${col.workload === "low" ? "bg-emerald-500" :
                            col.workload === "medium" ? "bg-amber-500" : "bg-red-500"
                          }`} title={`Charge : ${col.workload}`}></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{col.name}</h4>
                          <span className={`inline-flex items-center text-[8px] font-bold px-1.5 py-0.2 rounded border ${col.status === "Actif"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                              : "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800"
                            }`}>
                            {col.status}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">{col.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-850 dark:text-white">{col.count}</span>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase">dossiers</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pie Chart: Status Breakdown (Gaming circular donut) */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Segmentation des Dossiers
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Localisation des dossiers dans le cycle de validation.
            </p>
            <div className="h-[150px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalDossiersCount}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  Dossiers
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Success Notification Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Action Réussie
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {successMessage}
              </p>
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={selectedDossierForTransmission?.new_folder_number || ""}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
        directionId={selectedDossierForTransmission?.new_department_id}
      />
    </div>
  );
}


