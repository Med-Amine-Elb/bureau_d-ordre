import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { differenceInDays, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function DashboardPrescripteur() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // On simule le filtrage Dataverse côté client :
      // On affiche tous les dossiers assignés ou en suivi
      const assigned = result.filter(d => d.new_statut >= 30 || d.new_statut === 20);
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

  // --- KPI Calculations ---
  const aValider = dossiers.filter((d) => d.new_statut === 30 || d.new_statut === 40).length;
  const enCorrection = dossiers.filter((d) => d.new_statut === 90).length;
  const validesCeMois = dossiers.filter((d) => d.new_statut >= 50 && d.new_statut !== 90).length;
  const enRetard = dossiers.filter((d) => differenceInDays(new Date(), parseISO(d.new_date_reception)) > 10).length;

  const timelineEvents = dossiers.slice(0, 4).map((d, i) => ({
    id: d.new_dossierid,
    action: d.new_statut === 30 ? "Nouveau dossier reçu" : "Dossier en traitement",
    dossier: d.new_numero_dossier,
    time: i === 0 ? "A l'instant" : `Il y a ${i * 2} heures`,
  }));

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.updateDossier(dossier.new_dossierid, {
        new_statut: 40, // Chez Prescripteur
      });
      setSuccessMessage(
        `Réception physique confirmée pour le dossier ${dossier.new_numero_dossier}.`,
      );
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
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
            Espace Prescripteur
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Validation des factures et contrats assignés
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="À Valider"
          value={aValider}
          onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: "30,40" } })}
          icon={<FileText className="w-5 h-5 text-white group-hover:-translate-y-1 transition-transform duration-300" />}
          variant="blue"
          index={0}
        />
        <KPICard
          title="Validés ce mois"
          value={validesCeMois}
          onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: ">=50" } })}
          icon={<CheckCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />}
          variant="emerald"
          index={1}
        />
        <KPICard
          title="Retours Correction"
          value={enCorrection}
          onClick={() => navigate("/prescripteur/corrections")}
          icon={<RotateCcw className="w-5 h-5 text-white group-hover:-translate-y-1 transition-transform duration-300" />}
          variant="orange"
          index={2}
        />
        <KPICard
          title="En Retard"
          value={enRetard}
          onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: 20 } })}
          icon={<Clock className="w-5 h-5 text-red-500 group-hover:rotate-12 transition-transform duration-300" />}
          variant="default"
          index={3}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table - Dossiers Récents */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-100 dark:border-slate-700 soft-shadow p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white text-lg">
              Dossiers en attente d'action
            </h3>
            <button
              onClick={() => navigate("/prescripteur/dossiers")}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
            >
              Voir tout
            </button>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fournisseur & Type
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date de Réception
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : (
                dossiers
                  .filter((d) => d.new_statut === 30 || d.new_statut === 40)
                  .slice(0, 5)
                  .map((dossier, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-4 group"
                      style={{
                        animationFillMode: "both",
                        animationDelay: `${i * 100}ms`,
                      }}
                    >
                      <td className="py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-800 dark:bg-blue-900">
                          <FileText className="w-4 h-4" />
                        </div>
                        {dossier.new_numero_dossier}
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {dossier.new_numero_facture || "-"}
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {dossier.new_fournisseur_nom || "-"}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {dossier.new_type_document === 100 ? "FACTURE" : dossier.new_type_document === 200 ? "AVOIR" : dossier.new_type_document === 300 ? "CONTRAT" : "AUTRE"}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-500 dark:text-slate-400">
                        {dossier.new_date_reception ? format(parseISO(dossier.new_date_reception), "dd MMM yyyy", { locale: fr }) : "-"}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            dossier.new_statut === 30
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {dossier.new_statut === 30 ? "À réceptionner" : "Chez vous"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {dossier.new_statut === 30 && (
                            <button
                              onClick={() => handleAccuse(dossier)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(`/prescripteur/dossiers/${dossier.new_dossierid}`)
                            }
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                            title="Consulter"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
              {!loading && dossiers.filter((d) => d.new_statut === 30 || d.new_statut === 40).length === 0 && (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-slate-500">
                     Aucun dossier en attente d'action.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Timeline Activité */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-100 dark:border-slate-700 soft-shadow p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Vos flux récents
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {timelineEvents.map((evt, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div
                  className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0F172B] flex items-center justify-center z-10 ${
                    i === 0
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-slate-50 dark:bg-slate-800"
                  }`}
                >
                  {i === 0 && (
                    <div className="absolute w-full h-full rounded-full bg-blue-400 animate-ping opacity-20"></div>
                  )}
                  <div
                    className={`relative w-2 h-2 rounded-full ${i === 0 ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
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
              <p className="text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  variant = "default",
  index = 0,
  onClick
}: any) {
  const isBlue = variant === "blue";
  const isEmerald = variant === "emerald";
  const isOrange = variant === "orange";
  const isColored = isBlue || isEmerald || isOrange;

  const bgClass = isBlue
    ? "bg-blue-600 border-blue-500 dark:bg-blue-800 dark:border-blue-700"
    : isEmerald
      ? "bg-emerald-500 border-emerald-400 dark:bg-emerald-800 dark:border-emerald-700"
      : isOrange
        ? "bg-orange-500 border-orange-400 dark:bg-orange-800 dark:border-orange-700"
        : "bg-white border-slate-100 dark:bg-[#0F172B] dark:border-slate-700";

  const titleClass = isColored
    ? "text-blue-50 dark:text-blue-100"
    : "text-slate-500 dark:text-slate-400";

  const valueClass = isColored
    ? "text-white"
    : "text-slate-900 dark:text-slate-100";

  const iconBgClass = isBlue
    ? "bg-blue-500/50"
    : isEmerald
      ? "bg-emerald-600/30"
      : isOrange
        ? "bg-orange-600/30"
        : "bg-red-50 dark:bg-red-900/20";

  return (
    <div 
      onClick={onClick}
      className={`${bgClass} rounded-2xl p-5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-6`}
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
      </div>
    </div>
  );
}
