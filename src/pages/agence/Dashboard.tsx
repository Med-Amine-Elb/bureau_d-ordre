import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Activity,
  Truck,
  Building,
  Layers,
  CreditCard,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { differenceInDays, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import AgenceAccuseReceptionModal from "@/components/AgenceAccuseReceptionModal";
import AgenceValiderRemiseModal from "@/components/AgenceValiderRemiseModal";

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1000;

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
  const isAmber = variant === "amber";

  const iconBg = isBlue ? "bg-[#2b4c7e]/10 text-[#2b4c7e] dark:bg-blue-900/30 dark:text-blue-400"
    : isEmerald ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
      : isAmber ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
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

const ProfileProgressCard = ({ dossiersRemis, targetRemis }: any) => {
  const percentage = Math.round((dossiersRemis / targetRemis) * 100) || 0;
  const avatarUrl = localStorage.getItem("userAvatar") || "https://api.dicebear.com/7.x/micah/svg?seed=Regional&backgroundColor=ffd5e5";
  const role = localStorage.getItem("userRole") || "Agence Régionale";

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
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Objectif de Remise</span>
          <span className="text-xl font-black text-[#2b4c7e] dark:text-blue-400">{percentage > 100 ? 100 : percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden relative">
          <div className="bg-[#2b4c7e] dark:bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${percentage > 100 ? 100 : percentage}%` }}>
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
          {dossiersRemis} remis / {targetRemis} chèques reçus
        </p>
      </div>
    </div>
  );
}

const ActivityTimeline = () => {
  return (
    <div className="bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-500"></div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-500" /> Flux d'Activité Agence
      </h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {[1, 2].map((_, i) => (
          <div key={i} className="relative flex items-start gap-4">
            <div
              className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0F172B] flex items-center justify-center z-10 bg-emerald-50 dark:bg-emerald-900/20`}
            >
              <div className={`relative w-2 h-2 rounded-full bg-emerald-500`}></div>
            </div>
            <div className="ml-10 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Chèque DOS-2026-01{i + 7} remis
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Remise validée, scan du reçu archivé.
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                Il y a {i + 1} jours
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardAgence() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentAgence = localStorage.getItem("userAgence") || "Rabat Agdal";

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isAccuseModalOpen, setIsAccuseModalOpen] = useState(false);
  const [isRemiseModalOpen, setIsRemiseModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // Agence sees status 130, 140, and 150 destined for currentAgence
      const visible = result.filter(
        (d) => (d.new_status === 130 || d.new_status === 140 || d.new_status === 150) &&
               d.new_destination_branch_id === currentAgence
      );
      setDossiers(visible);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, [currentAgence]);

  const enTransit = dossiers.filter((d) => d.new_status === 130).length;
  const disponible = dossiers.filter((d) => d.new_status === 140).length;
  const remis = dossiers.filter((d) => d.new_status === 150).length;
  const totalGeres = enTransit + disponible + remis;

  const chartData = [
    { name: "En Transit", value: enTransit, color: "#f59e0b" },
    { name: "Disponible en Agence", value: disponible, color: "#3b82f6" },
    { name: "Remis / Clôturé", value: remis, color: "#10b981" }
  ];

  const handleAccuse = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setIsAccuseModalOpen(true);
  };

  const handleRemise = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setIsRemiseModalOpen(true);
  };

  const handleConfirmAccuse = async (data: { commentaire: string }) => {
    if (!selectedDossier) return;
    try {
      setIsAccuseModalOpen(false);
      await dataService.updateDossier(selectedDossier.new_folderid, {
        new_status: 140, // Disponible Agence
        new_reception_date_agence: new Date().toISOString(),
        new_accuse_reception_agence_par: "Utilisateur Agence",
        new_commentaire_agence: data.commentaire
      });
      setSuccessMessage(
        `Réception du chèque validée pour le dossier ${selectedDossier.new_folder_number}.`
      );
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const handleConfirmRemise = async (data: { dateRemise: string; scanNom: string; commentaire: string }) => {
    if (!selectedDossier) return;
    try {
      setIsRemiseModalOpen(false);
      await dataService.updateDossier(selectedDossier.new_folderid, {
        new_status: 150, // Payé / Clôturé
        new_final_delivery_date: data.dateRemise,
        new_recu_signe_scan: data.scanNom,
        new_fournisseur_signe: true,
        new_commentaire_agence: data.commentaire
      });
      setSuccessMessage(
        `Remise du chèque validée avec succès pour le dossier ${selectedDossier.new_folder_number}.`
      );
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de valider la remise." });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Main Left Content */}
        <div className="xl:col-span-2 space-y-8">

          {/* Hero Banner SBM Design */}
          <div className="bg-[#2b4c7e] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-[#2b4c7e]/20 flex justify-between items-center">
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 w-full lg:w-2/3">
              <span className="inline-block py-1.5 px-3 rounded-lg bg-white/10 text-blue-100 text-xs font-bold tracking-wider mb-6 border border-white/20 backdrop-blur-md uppercase">
                PORTAIL REGIONAL — {currentAgence}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Gestion des chèques locaux
              </h1>
              <p className="text-blue-100/90 text-sm md:text-base mb-8 max-w-xl">
                Vous avez <strong className="text-white">{disponible} chèques</strong> disponibles pour remise physique et <strong className="text-white">{enTransit} chèques</strong> actuellement en route vers votre agence.
              </p>
              <button
                onClick={() => navigate("/agence/cheques", { state: { filterStatus: 140 } })}
                className="bg-white text-[#2b4c7e] hover:bg-blue-50 px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 group"
              >
                Accéder aux chèques à remettre
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:block relative w-48 h-48 z-10 mr-4">
              <div className="absolute top-4 right-4 w-32 h-40 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform rotate-12 transition-transform hover:rotate-6 flex flex-col p-4 gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                <div className="w-full h-2 rounded bg-white/20 mt-auto"></div>
                <div className="w-2/3 h-2 rounded bg-white/20"></div>
              </div>
              <div className="absolute bottom-2 -left-4 w-36 h-20 bg-emerald-500/30 backdrop-blur-xl rounded-2xl border border-emerald-300/30 shadow-2xl transform -rotate-6 flex items-center justify-center">
                <Building className="w-10 h-10 text-white opacity-90 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* KPI Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIPill
              title="Chèques en Transit"
              value={enTransit}
              onClick={() => navigate("/agence/cheques", { state: { filterStatus: 130 } })}
              icon={<Truck className="w-5 h-5" />}
              variant="amber"
              index={0}
            />
            <KPIPill
              title="Chèques Disponibles"
              value={disponible}
              onClick={() => navigate("/agence/cheques", { state: { filterStatus: 140 } })}
              icon={<Wallet className="w-5 h-5" />}
              variant="blue"
              index={1}
            />
            <KPIPill
              title="Chèques Remis"
              value={remis}
              onClick={() => navigate("/agence/cheques", { state: { filterStatus: 150 } })}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="emerald"
              index={2}
            />
            <KPIPill
              title="Total Gérés"
              value={totalGeres}
              onClick={() => navigate("/agence/cheques", { state: { filterStatus: "ALL" } })}
              icon={<Layers className="w-5 h-5" />}
              variant="default"
              index={3}
            />
          </div>

          {/* Tables Section */}
          <div className="space-y-8">

            {/* Table Chèques Disponibles à l'Agence */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Chèques Disponibles en Agence (Prêts pour Remise)
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                  {disponible} chèques
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bénéficiaire</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">N° Chèque / Banque</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reçu le</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Chargement...</td>
                      </tr>
                    ) : disponible === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Aucun chèque en attente de remise.</td>
                      </tr>
                    ) : (
                      dossiers
                        .filter((d) => d.new_status === 140)
                        .slice(0, 5)
                        .map((dossier, i) => {
                          const delay = dossier.new_reception_date_agence
                            ? differenceInDays(new Date(), parseISO(dossier.new_reception_date_agence))
                            : 0;
                          return (
                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-[#2b4c7e] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                    {dossier.new_folder_number}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-[#2b4c7e]/10 dark:bg-[#2b4c7e]/30 text-[#2b4c7e] dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    {(dossier.new_supplier_id || "F").charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                    {dossier.new_supplier_id || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-950 dark:text-white text-sm flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                    {dossier.new_cheque_number || "N/A"}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    {dossier.new_banque_emettrice || "Non renseignée"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                                {dossier.new_reception_date_agence ? format(parseISO(dossier.new_reception_date_agence), "dd MMM yyyy", { locale: fr }) : "-"}
                                {delay > 5 && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold">
                                    {delay}j attente
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleRemise(dossier)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Remettre
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Chèques en Transit */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Chèques en Transit (Expédiés par le BO, en route)
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                  {enTransit} chèques
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fournisseur</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">N° Chèque / Banque</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expédié le</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Chargement...</td>
                      </tr>
                    ) : enTransit === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Aucun chèque actuellement en transport.</td>
                      </tr>
                    ) : (
                      dossiers
                        .filter((d) => d.new_status === 130)
                        .slice(0, 5)
                        .map((dossier, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-[#2b4c7e] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {dossier.new_folder_number}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#2b4c7e]/10 dark:bg-[#2b4c7e]/30 text-[#2b4c7e] dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {(dossier.new_supplier_id || "F").charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                  {dossier.new_supplier_id || "-"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-950 dark:text-white text-sm flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                  {dossier.new_cheque_number || "N/A"}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                  {dossier.new_banque_emettrice || "Non renseignée"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                              {dossier.new_date_transmission_bo ? format(parseISO(dossier.new_date_transmission_bo), "dd MMM yyyy", { locale: fr }) : "-"}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleAccuse(dossier)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2b4c7e] hover:bg-[#1f385e] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                <Clock className="w-3.5 h-3.5" /> Accuser Réception
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
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-8">
          <ProfileProgressCard dossiersRemis={remis} targetRemis={(remis + disponible > 0) ? (remis + disponible) : 5} />
          
          {/* Chart Section */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in zoom-in-95 duration-500 delay-200">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              Répartition des Chèques
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    formatter={(value: any, name: any) => [`${value} chèques`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ActivityTimeline />
        </div>
      </div>

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Action réussie
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Accusé Réception Modal */}
      <AgenceAccuseReceptionModal
        isOpen={isAccuseModalOpen}
        dossier={selectedDossier}
        onClose={() => {
          setIsAccuseModalOpen(false);
          setSelectedDossier(null);
        }}
        onConfirm={handleConfirmAccuse}
      />

      {/* Valider Remise Modal */}
      <AgenceValiderRemiseModal
        isOpen={isRemiseModalOpen}
        dossier={selectedDossier}
        onClose={() => {
          setIsRemiseModalOpen(false);
          setSelectedDossier(null);
        }}
        onConfirm={handleConfirmRemise}
      />
    </div>
  );
}


