import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  PackageSearch,
  MoreHorizontal,
  Eye,
  FileText,
  PhoneCall,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Activity,
  CheckCircle2,
  RotateCcw,
  Send,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { differenceInDays, parseISO } from "date-fns";

const profitData = [
  { name: "1 Jan", value: 4000 },
  { name: "8 Jan", value: 3000 },
  { name: "15 Jan", value: 5000 },
  { name: "22 Jan", value: 9000 },
  { name: "29 Jan", value: 6500 },
  { name: "5 Feb", value: 12000 },
  { name: "12 Feb", value: 10000 },
];

export default function DashboardBO() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // --- KPI Calculations ---
  const enCoursTotal = dossiers.filter(
    (d) => d.new_statut !== 150 && d.new_statut !== 20,
  ).length;
  const enAttenteBO = dossiers.filter((d) => d.new_statut === 10).length;
  const enRetard = dossiers.filter((d) => d.new_statut === 20).length;
  const bloques = dossiers.filter((d) => d.new_est_bloque).length;
  const chequesAttente = dossiers.filter(
    (d) => d.new_statut > 70 && d.new_statut < 150,
  ).length;
  const cloturesAujourdhui = dossiers.filter(
    (d) => d.new_statut === 150,
  ).length;

  const statutCounts = dossiers.reduce(
    (acc, curr) => {
      const s = curr.new_statut;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const allStatuses = [
    { id: 10, label: "Sauvegarder", color: "bg-slate-400", hex: "#94a3b8" },
    { id: 20, label: "En Retard (>5j)", color: "bg-red-500", hex: "#ef4444" },
    {
      id: 30,
      label: "En Transit (Prescr.)",
      color: "bg-blue-400",
      hex: "#60a5fa",
    },
    {
      id: 40,
      label: "Chez Prescripteur",
      color: "bg-indigo-500",
      hex: "#6366f1",
    },
    { id: 50, label: "En Transit (BO)", color: "bg-blue-500", hex: "#3b82f6" },
    { id: 60, label: "Prêt DCF", color: "bg-emerald-400", hex: "#34d399" },
    { id: 70, label: "En Transit (DCF)", color: "bg-blue-500", hex: "#3b82f6" },
    { id: 80, label: "Chez DCF", color: "bg-purple-500", hex: "#8b5cf6" },
    {
      id: 90,
      label: "Retour Correction",
      color: "bg-orange-500",
      hex: "#f97316",
    },
    {
      id: 100,
      label: "En Transit (Tréso.)",
      color: "bg-blue-600",
      hex: "#2563eb",
    },
    {
      id: 110,
      label: "Chez Trésorerie",
      color: "bg-indigo-600",
      hex: "#4f46e5",
    },
    {
      id: 120,
      label: "Attente Remise",
      color: "bg-emerald-500",
      hex: "#10b981",
    },
    { id: 130, label: "En Transport", color: "bg-orange-400", hex: "#fb923c" },
    {
      id: 140,
      label: "Disponible Agence",
      color: "bg-emerald-400",
      hex: "#34d399",
    },
    { id: 150, label: "Payé", color: "bg-emerald-600", hex: "#059669" },
  ];

  const totalDossiers = dossiers.length || 1;
  const statusDistribution = allStatuses.map((st) => {
    const count = statutCounts[st.id] || 0;
    return { ...st, count, percent: Math.round((count / totalDossiers) * 100) };
  });

  const pieData = statusDistribution
    .filter((st) => st.count > 0)
    .map((st) => ({
      name: st.label,
      value: st.count,
      color: st.hex,
    }));
  if (pieData.length === 0)
    pieData.push({ name: "Aucun", value: 1, color: "#e2e8f0" });

  const barData = [
    { name: "Semaine 1", value: 12, active: false },
    { name: "Semaine 2", value: 19, active: false },
    { name: "Semaine 3", value: 8, active: false },
    { name: "Semaine 4", value: dossiers.length, active: true },
  ];

  const timelineEvents = dossiers.slice(0, 4).map((d, i) => ({
    id: d.new_dossierid,
    action: i % 2 === 0 ? "Création Dossier" : "Mise à jour Statut",
    dossier: d.new_numero_dossier,
    time: i === 0 ? "A l'instant" : `Il y a ${i * 2} heures`,
  }));

  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");



  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
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

  const handleTransmit = async (dossier: Dossier) => {
    const nextStatus =
      dossier.new_type_document === 400 || dossier.new_type_document === 500
        ? 70
        : 30;
    try {
      await dataService.updateDossier(dossier.new_dossierid, {
        new_statut: nextStatus,
      });
      setSuccessMessage(
        `Le dossier ${dossier.new_numero_dossier} a été transmis vers ${nextStatus === 70 ? "la DCF" : "le Prescripteur"}.`,
      );
      setSuccessModalOpen(true);
      fetchDossiers();
    } catch (err) {
      toast.error("Erreur", {
        description: "Impossible de transmettre le dossier.",
      });
    }
  };

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(
        dossier.new_dossierid,
        60,
        "Med Amine (Dash)",
      );
      setSuccessMessage(
        `Réception accusée pour le dossier ${dossier.new_numero_dossier}. Prêt pour la DCF.`,
      );
      setSuccessModalOpen(true);
      fetchDossiers();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
            Dashboard Bureau d'Ordre
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Supervision globale des flux fournisseurs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/bo/relances")}
            className="bg-white border border-slate-200 dark:bg-[#0F172B] dark:border-slate-700 
          rounded-lg px-4 py-2 
          text-sm text-slate-700 dark:text-slate-300
          font-medium soft-shadow hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4" /> Relances
          </button>
          <button
            onClick={() => navigate("/bo/remises")}
            className="bg-white border border-slate-200 dark:bg-[#0F172B] dark:border-slate-700 
          rounded-lg px-4 py-2 
          text-sm text-slate-700 dark:text-slate-300 
          font-medium soft-shadow hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Truck className="w-4 h-4" /> Remises Chèques
          </button>
          <button
            onClick={() => navigate("/bo/dossiers/nouveau")}
            className="bg-blue-600 hover:bg-blue-700
          dark:bg-blue-800 dark:hover:bg-blue-900 dark:border dark:border-blue-700
          text-white rounded-lg px-6 py-2 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2 shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Nouveau Dossier
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          index={0}
          variant="blue"
          title="Dossiers en cours"
          value={enCoursTotal}
          showTrend={false}
          onClick={() =>
            navigate("/bo/dossiers", { state: { filterStatus: "EN_COURS" } })
          }
          icon={
            <Eye className="w-5 h-5 text-white group-hover:animate-pulse" />
          }
        />
        <KPICard
          index={1}
          title="Chez BO"
          value={enAttenteBO}
          showTrend={false}
          onClick={() =>
            navigate("/bo/dossiers", { state: { filterStatus: 10 } })
          }
          icon={
            <Clock className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform duration-300" />
          }
        />
        <KPICard
          index={2}
          title="Chèques Attente"
          value={chequesAttente}
          showTrend={false}
          onClick={() =>
            navigate("/bo/dossiers", { state: { filterStatus: "CHEQUES" } })
          }
          icon={
            <PackageSearch className="w-5 h-5 text-purple-500 group-hover:-translate-y-1 transition-transform duration-300" />
          }
        />
        <KPICard
          index={3}
          variant="emerald"
          title="Clôturés"
          value={cloturesAujourdhui}
          trend="+8%"
          positive
          showTrend={true}
          onClick={() =>
            navigate("/bo/dossiers", { state: { filterStatus: 150 } })
          }
          icon={
            <CheckCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
          }
        />
      </div>

      {/* Réceptions en attente (High UX Priority) */}
      {dossiers.filter(d => d.new_statut === 50).length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                 Réceptions en attente <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full">{dossiers.filter(d => d.new_statut === 50).length}</span>
              </h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dossiers.filter(d => d.new_statut === 50).map((d) => (
                <div key={d.new_dossierid} className="bg-white dark:bg-[#0F172B] border-2 border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4 soft-shadow flex flex-col justify-between group hover:border-emerald-500 transition-all">
                   <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Dossier à recevoir</p>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-[180px]">{d.new_numero_dossier}</h3>
                        </div>
                        <button 
                          onClick={() => navigate(`/bo/dossiers/${d.new_dossierid}`)}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Voir le dossier complet"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 mt-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-bold">Fournisseur:</span> {d.new_fournisseur_nom}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                           <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" /> Documents à vérifier ({d.new_documents_complements?.length || 0})
                           </p>
                           <div className="flex flex-wrap gap-1.5">
                              {d.new_documents_complements && d.new_documents_complements.length > 0 ? (
                                d.new_documents_complements.slice(0, 3).map(doc => (
                                  <span key={doc} className="text-[9px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                                    {doc}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] italic text-slate-400">Aucun document attaché</span>
                              )}
                              {d.new_documents_complements && d.new_documents_complements.length > 3 && (
                                <span className="text-[9px] text-blue-500 font-bold">+{d.new_documents_complements.length - 3}</span>
                              )}
                           </div>
                        </div>
                      </div>
                   </div>

                   <button 
                     onClick={async () => {
                       try {
                         await dataService.accuseReception(d.new_dossierid, 60, "Med Amine (Dashboard)");
                         toast.success("Réception validée", {
                           description: `Le dossier ${d.new_numero_dossier} est maintenant enregistré.`
                         });
                         const updated = await dataService.getDossiers();
                         setDossiers(updated);
                       } catch (e) {
                         toast.error("Erreur", { description: "Impossible de valider la réception." });
                       }
                     }}
                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                   >
                      <CheckCircle2 className="w-4 h-4" /> Accuser Réception
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Priority Actions: Table & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tableau Alertes / Dossiers */}
        <div className="bg-card dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 soft-shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Alertes &
              Dossiers Récents
            </h3>
            <button
              onClick={() => navigate("/bo/dossiers")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Voir tout
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  N° Dossier
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : (
                dossiers
                  .filter((d) => d.new_statut !== 150 && d.new_statut !== 20)
                  .slice(0, 5)
                  .map((dossier, i) => {
                    const isEnRetard =
                      differenceInDays(
                        new Date(),
                        parseISO(dossier.new_date_reception),
                      ) > 5;
                    const inBoHand =
                      dossier.new_statut === 10 ||
                      dossier.new_statut === 90 ||
                      dossier.new_statut === 20;

                    return (
                      <tr
                        key={i}
                        className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${dossier.new_statut === 90 ? "bg-orange-500" : dossier.new_statut === 20 ? "bg-red-500" : isEnRetard ? "bg-orange-400" : "bg-slate-800 dark:bg-slate-700"}`}
                          >
                            {dossier.new_statut === 90 ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          {dossier.new_numero_dossier}
                        </td>
                        <td className="py-4">
                          {getTypeBadge(dossier.new_type_document)}
                        </td>
                        <td className="py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                          {dossier.new_fournisseur_nom || "-"}
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              dossier.new_statut === 90
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : dossier.new_statut === 20
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : isEnRetard
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {dossier.new_statut === 90
                              ? "À corriger"
                              : dossier.new_statut === 20
                                ? "Rejeté 5J"
                                : isEnRetard
                                  ? "En retard"
                                  : "En cours"}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {dossier.new_statut === 10 && (
                              <button
                                onClick={() => handleTransmit(dossier)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                              >
                                <Send className="w-3.5 h-3.5" /> Transmettre
                              </button>
                            )}

                            {dossier.new_statut === 50 && (
                              <button
                                onClick={() => handleAccuse(dossier)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                              </button>
                            )}

                            <button
                              onClick={() =>
                                navigate(`/bo/dossiers/${dossier.new_dossierid}`)
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                              title="Détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Timeline Activité */}
        <div className="bg-card dark:bg-[#0F172B] rounded-2xl border border-slate-100 dark:border-slate-700 soft-shadow p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Flux Temps Réel
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {timelineEvents.map((evt, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div
                  className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0F172B] flex items-center justify-center z-10 ${
                    i === 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-slate-50 dark:bg-slate-800"
                  }`}
                >
                  {i === 0 && (
                    <div className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-20"></div>
                  )}
                  <div
                    className={`relative w-2 h-2 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  ></div>
                </div>
                <div className="ml-10">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {evt.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {evt.dossier}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {evt.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 soft-shadow flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-2 uppercase tracking-wide text-xs">
                Évolution des traitements
              </h3>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {dossiers.filter((d) => d.new_statut === 150).length}
                </p>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+14.2%</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Dossiers clôturés vs. mois précédent
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 md:gap-8 md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Délai Moyen (TMT)
                </p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  2.4{" "}
                  <span className="text-sm font-medium text-slate-400">
                    Jours
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Taux de Rejet
                </p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  4.1{" "}
                  <span className="text-sm font-medium text-slate-400">%</span>
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Conformité
                </p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 98%
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  className="dark:stroke-slate-800"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dx={-10}
                  tickFormatter={(val) => `${val / 1000}K`}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: isDark ? "1px solid #334155" : "none",
                    backgroundColor: isDark ? "#0F172B" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#0f172a",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: isDark ? "#e2e8f0" : "#0f172a" }}
                  itemStyle={{ color: isDark ? "#e2e8f0" : "#0f172a" }}
                  cursor={{
                    fill: isDark ? "rgba(255, 255, 255, 1)" : "#f8fafc",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Charts */}
        <div className="flex flex-col gap-6">
          <div className="bg-card dark:bg-slate-900 rounded-2xl p-6 flex-1 border border-slate-100 dark:border-slate-800 soft-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                Dossiers Créés (Par Semaine)
              </h3>
              <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" />
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <RechartsTooltip
                    cursor={{
                      fill: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                    }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: isDark ? "1px solid #334155" : "none",
                      backgroundColor: isDark ? "#0F172B" : "#ffffff",
                      color: isDark ? "#e2e8f0" : "#0f172a",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.active
                            ? "#3b82f6"
                            : isDark
                              ? "#1e293b"
                              : "#e2e8f0"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card dark:bg-slate-900 rounded-2xl p-6 flex-1 border border-slate-100 dark:border-slate-800 soft-shadow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                Répartition par Statut
              </h3>
              <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" />
            </div>

            <div className="flex flex-col h-full gap-4">
              {/* Donut Chart */}
              <div className="h-[120px] relative w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {dossiers.length}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">
                    Dossiers
                  </span>
                </div>
              </div>

              {/* Custom Scrollable Legend */}
              <div
                className="custom-scroll flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mt-2"
                style={{ maxHeight: "100px" }}
              >
                {statusDistribution
                  .filter((st) => st.count > 0)
                  .map((st) => (
                    <div
                      key={st.id}
                      className="flex justify-between items-center w-full group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full`}
                          style={{ backgroundColor: st.hex }}
                        ></div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {st.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {st.percent}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {successModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Action Réussie
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {successMessage}
              </p>
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2s animation

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart

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

function KPICard({
  title,
  value,
  trend,
  positive,
  icon,
  index = 0,
  variant = "default",
  showTrend = true,
  onClick,
}: any) {
  const isBlue = variant === "blue";
  const isEmerald = variant === "emerald";
  const isColored = isBlue || isEmerald;

  const bgClass = isBlue
    ? "bg-blue-600 border-blue-500 dark:bg-blue-800 dark:border-blue-700"
    : isEmerald
      ? "bg-emerald-500 border-emerald-400 dark:bg-emerald-800 dark:border-emerald-700"
      : "bg-white border-slate-100 dark:bg-[#0F172B] dark:border-slate-700";

  const titleClass = isColored
    ? "text-blue-50 dark:text-blue-100"
    : "text-slate-500 dark:text-slate-400";

  const valueClass = isColored
    ? "text-white"
    : "text-slate-900 dark:text-slate-100";

  const iconBgClass = isBlue
    ? "bg-blue-500/50 group-hover:bg-blue-400/50"
    : isEmerald
      ? "bg-emerald-600/30 group-hover:bg-emerald-500/30"
      : "bg-slate-50 group-hover:bg-blue-50 dark:bg-slate-800 dark:group-hover:bg-slate-700";

  const trendBgClass = isColored
    ? positive
      ? "bg-white/20 text-white"
      : "bg-black/20 text-white"
    : positive
      ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950"
      : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";

  const footerClass = isColored
    ? "text-white/60"
    : "text-slate-400 dark:text-slate-500";

  return (
    <div
      onClick={onClick}
      className={`${bgClass} rounded-2xl p-5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-6 cursor-pointer`}
      style={{
        animationFillMode: "both",
        animationDelay: `${index * 100}ms`,
        animationDuration: "700ms",
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className={`${titleClass} text-sm font-semibold`}>{title}</h3>
        <div className={`p-2 rounded-xl transition-colors ${iconBgClass}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className={`${valueClass} text-3xl font-bold tracking-tight`}>
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        </span>
        {showTrend && (
          <span
            className={`flex items-center text-xs font-bold mb-1 px-1.5 py-0.5 rounded-md ${trendBgClass}`}
          >
            {positive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend}
          </span>
        )}
      </div>
      {showTrend && (
        <p
          className={`text-[10px] font-medium mt-2 uppercase tracking-wider ${footerClass}`}
        >
          vs. mois dernier
        </p>
      )}
    </div>
  );
}

function getTypeBadge(type: number) {
  switch (type) {
    case 100:
      return (
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
          FACTURE
        </span>
      );
    case 200:
      return (
        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
          AVOIR
        </span>
      );
    case 300:
      return (
        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
          CONTRAT
        </span>
      );
    case 400:
      return (
        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
          CHÈQUE
        </span>
      );
    case 500:
      return (
        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
          ACOMPTE
        </span>
      );
    default:
      return (
        <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
          INCONNU
        </span>
      );
  }
}
