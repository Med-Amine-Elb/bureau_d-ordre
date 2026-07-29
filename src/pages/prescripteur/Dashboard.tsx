import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  Activity,
  CheckCircle2,
  RotateCcw,
  Eye,
  ArrowRight
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

function KPIPill({
  title,
  value,
  icon,
  index = 0,
  variant = "default",
  onClick,
}: any) {
  const isBlue = variant === "blue";
  const isEmerald = variant === "emerald";
  
  const iconBg = isBlue ? "bg-[#2b4c7e]/10 text-[#2b4c7e] dark:bg-blue-900/30 dark:text-blue-400" 
    : isEmerald ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#0F172B] rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-6"
      style={{ animationFillMode: "both", animationDelay: `${index * 100}ms`, animationDuration: "700ms" }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{title}</h3>
          <span className="text-slate-900 dark:text-slate-100 text-xl font-bold block leading-none mt-1">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </span>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[#2b4c7e] dark:group-hover:text-blue-400 transition-colors" />
    </div>
  );
}

const ProfileProgressCard = ({ dossiersTraites, objTraites }: any) => {
  const percentage = Math.round((dossiersTraites / objTraites) * 100) || 0;
  const avatarUrl = localStorage.getItem("userAvatar") || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
  const role = localStorage.getItem("userRole") || "Prescripteur";

  return (
    <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-colors group-hover:bg-blue-500/20"></div>
       
       <div className="flex items-center gap-4 mb-6 relative z-10">
         <div className="relative">
           <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
           <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#0F172B] rounded-full"></div>
         </div>
         <div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Bonjour !</h3>
           <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{role}</p>
         </div>
       </div>

       <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 relative z-10">
         <div className="flex justify-between items-end mb-3">
           <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Objectif du mois</span>
           <span className="text-xl font-black text-[#2b4c7e] dark:text-blue-400">{percentage}%</span>
         </div>
         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden relative">
           <div className="bg-[#2b4c7e] dark:bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${percentage}%` }}>
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
           </div>
         </div>
         <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
            {dossiersTraites} traités / {objTraites} cible
         </p>
       </div>
    </div>
  );
}



const ActivityTimeline = ({ timelineEvents }: any) => {
  return (
    <div className="bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-500" /> Flux d'Activité
      </h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {timelineEvents.map((evt: any, i: number) => (
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
            <div className="ml-10 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {evt.action}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {evt.dossier}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                {evt.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const formatEventTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} j`;
  } catch (e) {
    return dateStr;
  }
};

const buildTimelineEvents = (dossiers: Dossier[]) => {
  const events: { action: string; dossier: string; time: string; timestamp: string }[] = [];
  
  dossiers.forEach((d) => {
    if (d.new_reception_date) {
      events.push({ action: "Réception au BO", dossier: d.new_folder_number, time: "", timestamp: d.new_reception_date });
    }
    if (d.new_date_accuse) {
      events.push({ action: "Accusé de réception BO", dossier: d.new_folder_number, time: "", timestamp: d.new_date_accuse });
    }
    if (d.new_date_trans_prescripteur) {
      events.push({ action: "Transmis au Prescripteur", dossier: d.new_folder_number, time: "", timestamp: d.new_date_trans_prescripteur });
    }
    if (d.new_date_accuse_prescripteur) {
      events.push({ action: "Accusé par le Prescripteur", dossier: d.new_folder_number, time: "", timestamp: d.new_date_accuse_prescripteur });
    }
    if (d.new_date_val_prescripteur) {
      events.push({ action: "Validé par le Prescripteur", dossier: d.new_folder_number, time: "", timestamp: d.new_date_val_prescripteur });
    }
    if (d.new_date_retour_bo) {
      events.push({ action: "Retourné pour Correction", dossier: d.new_folder_number, time: "", timestamp: d.new_date_retour_bo });
    }
    if (d.new_date_trans_dcf) {
      events.push({ action: "Transmis à la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_date_trans_dcf });
    }
    if (d.new_date_accuse_dcf) {
      events.push({ action: "Accusé par la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_date_accuse_dcf });
    }
    if (d.new_date_val_dcf) {
      events.push({ action: "Validé par la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_date_val_dcf });
    }
    if (d.new_accounting_date) {
      events.push({ action: "Comptabilisé par la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_accounting_date });
    }
    if (d.new_cheque_preparation_date) {
      events.push({ action: "Chèque préparé (Trésorerie)", dossier: d.new_folder_number, time: "", timestamp: d.new_cheque_preparation_date });
    }
    if (d.new_date_virement) {
      events.push({ action: "Réglé par Virement", dossier: d.new_folder_number, time: "", timestamp: d.new_date_virement });
    }
    const deliveryDate = d.new_delivery_date || d.new_reception_date_agence || d.new_date_livraison;
    if (deliveryDate) {
      events.push({ action: "Chèque reçu par l'Agence", dossier: d.new_folder_number, time: "", timestamp: deliveryDate });
    }
    if (d.new_final_delivery_date) {
      events.push({ action: "Chèque remis au Fournisseur", dossier: d.new_folder_number, time: "", timestamp: d.new_final_delivery_date });
    }
  });

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((evt) => ({
      ...evt,
      time: formatEventTime(evt.timestamp)
    }));
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

  const aValider = dossiers.filter(
    (d) => d.new_status === 30 || d.new_status === 40,
  ).length;
  const enCorrection = dossiers.filter((d) => d.new_status === 90).length;
  const validesCeMois = dossiers.filter(
    (d) => d.new_status >= 50 && d.new_status !== 90,
  ).length;
  const horsDelai = dossiers.filter(
    (d) => differenceInDays(new Date(), parseISO(d.new_reception_date)) > 5,
  ).length;


  const timelineEvents = buildTimelineEvents(dossiers);

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(
        dossier.new_folderid,
        40, // Chez Prescripteur
        "Amine Elboubakri"
      );
      setSuccessMessage(
        `Réception physique confirmée pour le dossier ${dossier.new_folder_number}.`,
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
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Left Content */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Hero Banner SBM Design */}
          <div className="bg-[#2b4c7e] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-[#2b4c7e]/20 flex justify-between items-center">
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 w-full lg:w-2/3">
              <span className="inline-block py-1.5 px-3 rounded-lg bg-white/10 text-blue-100 text-xs font-bold tracking-wider mb-6 border border-white/20 backdrop-blur-md">
                ESPACE PRESCRIPTEUR
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Validation des Saisies
              </h1>
              <p className="text-blue-100/90 text-sm md:text-base mb-8 max-w-xl">
                Vous avez <strong className="text-white">{aValider} dossiers</strong> en attente de validation et <strong className="text-white">{enCorrection} retours</strong> à corriger.
              </p>
              <button 
                onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: "30,40" } })}
                className="bg-white text-[#2b4c7e] hover:bg-blue-50 px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 group"
              >
                Traiter les dossiers
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Illustration: Floating Glassmorphism Cards */}
            <div className="hidden lg:block relative w-48 h-48 z-10 mr-4">
              <div className="absolute top-4 right-4 w-32 h-40 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform rotate-12 transition-transform hover:rotate-6 flex flex-col p-4 gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20"></div>
                 <div className="w-full h-2 rounded bg-white/20 mt-auto"></div>
                 <div className="w-2/3 h-2 rounded bg-white/20"></div>
              </div>
              <div className="absolute bottom-2 -left-4 w-36 h-20 bg-blue-500/30 backdrop-blur-xl rounded-2xl border border-blue-300/30 shadow-2xl transform -rotate-6 flex items-center justify-center">
                 <CheckCircle2 className="w-10 h-10 text-white opacity-90 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* KPI Pills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPIPill
              title="À Valider"
              value={aValider}
              onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: "30,40" } })}
              icon={<FileText className="w-5 h-5" />}
              variant="blue"
              index={0}
            />
            <KPIPill
              title="Validés ce mois"
              value={validesCeMois}
              onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: ">=50" } })}
              icon={<CheckCircle className="w-5 h-5" />}
              variant="emerald"
              index={1}
            />
            <KPIPill
              title="Retours Correction"
              value={enCorrection}
              onClick={() => navigate("/prescripteur/corrections")}
              icon={<RotateCcw className="w-5 h-5" />}
              variant="default"
              index={2}
            />
            <KPIPill
              title="Hors Délai"
              value={horsDelai}
              onClick={() => navigate("/prescripteur/dossiers", { state: { filterStatus: 20 } })}
              icon={<Clock className="w-5 h-5" />}
              variant="default"
              index={3}
            />
          </div>

          {/* Table - Dossiers Récents */}
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-100 dark:border-slate-700 soft-shadow p-6 flex flex-col flex-1 min-h-[400px]">
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
                  .filter((d) => d.new_status === 30 || d.new_status === 40)
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
                        {dossier.new_folder_number}
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {dossier.new_invoice_number || "-"}
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {dossier.new_supplier_id || "-"}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {dossier.new_document_type === 100
                            ? "FACTURE"
                            : dossier.new_document_type === 200
                              ? "AVOIR"
                              : dossier.new_document_type === 500
                                ? "ACOMPTE"
                                : dossier.new_document_type === 600
                                  ? "COURRIER"
                                  : "AUTRE"}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-500 dark:text-slate-400">
                        {dossier.new_reception_date
                          ? format(
                              parseISO(dossier.new_reception_date),
                              "dd MMM yyyy",
                              { locale: fr },
                            )
                          : "-"}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            dossier.new_status === 30
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {dossier.new_status === 30
                            ? "À réceptionner"
                            : "Chez vous"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {dossier.new_status === 30 && (
                            <button
                              onClick={() => handleAccuse(dossier)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(
                                `/prescripteur/dossiers/${dossier.new_folderid}`,
                              )
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
              {!loading &&
                dossiers.filter(
                  (d) => d.new_status === 30 || d.new_status === 40,
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-500"
                    >
                      Aucun dossier en attente d'action.
                    </td>
                  </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-8">
            <ProfileProgressCard dossiersTraites={validesCeMois} objTraites={validesCeMois + aValider > 0 ? validesCeMois + aValider : 10} />

            <ActivityTimeline timelineEvents={timelineEvents} />
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


