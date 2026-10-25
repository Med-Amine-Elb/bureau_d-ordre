import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Wallet,
  Truck,
  Layers,
  FileText,
  CreditCard,
  Eye,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { parseISO } from "date-fns";

import AgenceAccuseReceptionModal from "@/components/AgenceAccuseReceptionModal";
import AgenceValiderRemiseModal from "@/components/AgenceValiderRemiseModal";



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
      setSuccessMessage("Réception confirmée.");
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
        new_recu_signe_scan: data.scanNom || undefined,
        new_fournisseur_signe: true,
        new_commentaire_agence: data.commentaire
      });
      setSuccessMessage("Dossier validé.");
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de valider la remise." });
    }
  };

  const userName = localStorage.getItem("userName") || "Mohammed El Boubakri";
  const objTraites = remis + disponible + enTransit > 0 ? remis + disponible + enTransit : 10;
  const percentage = Math.round((remis / objTraites) * 100) || 0;



  return (
    <div className="w-full space-y-6">

      {/* Greeting Section */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Dashboard agence <span className="animate-pulse text-[#1F3B73]">⚡</span>
        </h1>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          Bonjour {userName}. Gérez les chèques pour votre agence régionale : {currentAgence}.
        </p>
      </div>

      {/* ═══════════ ROW 1: 4 STAT CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Card: En Transit */}
        <div
          style={{ animationDelay: "0ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => navigate("/agence/cheques", { state: { filterStatus: 130 } })}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">En transit</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Truck className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : enTransit.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            {enTransit > 0 ? (
              <><TrendingUp className="w-3.5 h-3.5 text-amber-500" /><span className="text-xs font-semibold text-amber-500">Arrivages prévus</span></>
            ) : (
              <span className="text-xs text-slate-400">À jour</span>
            )}
          </div>
        </div>

        {/* Card: Disponibles */}
        <div
          style={{ animationDelay: "60ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => navigate("/agence/cheques", { state: { filterStatus: 140 } })}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Disponibles en agence</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : disponible.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Prêts pour remise physique</span>
          </div>
        </div>

        {/* Card: Remis */}
        <div
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => navigate("/agence/cheques", { state: { filterStatus: 150 } })}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Chèques remis</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : remis.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Remis avec succès</span>
          </div>
        </div>

        {/* Card: Total Gérés */}
        <div
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => navigate("/agence/cheques", { state: { filterStatus: "ALL" } })}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Total gérés</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{loading ? "—" : totalGeres.toLocaleString()}</h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Volume total du mois</span>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: MAIN CONTENT + SIDEBAR ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          <div className="grid grid-cols-1 gap-6">
            {/* Table: Chèques Disponibles à l'Agence */}
            <div
              style={{ animationDelay: "220ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Chèques disponibles en agence
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  {disponible} chèques
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bénéficiaire</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">N° Chèque</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                    ) : disponible === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center text-[11px] text-slate-400">Aucun chèque en attente de remise.</td></tr>
                    ) : (
                      dossiers.filter((d) => d.new_status === 140).slice(0, 5).map((dossier, i) => {
                        const delay = dossier.new_reception_date_agence ? Math.floor((new Date().getTime() - parseISO(dossier.new_reception_date_agence).getTime()) / (1000 * 3600 * 24)) : 0;
                        return (
                          <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-[#1F3B73] dark:text-blue-400 flex items-center justify-center">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <Link to={`/agence/cheques/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors block">
                                  {dossier.new_folder_number}
                                </Link>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300 block">{dossier.new_supplier_id || "-"}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[12px] font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                {dossier.new_cheque_number || "N/A"}
                              </span>
                              {delay > 5 && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold">
                                  {delay}j attente
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleRemise(dossier)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3B73]/10 hover:bg-[#1F3B73]/20 text-[#1F3B73] dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-[11px] font-bold transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Remettre
                                </button>
                                <button
                                  onClick={() => navigate(`/agence/cheques/${dossier.new_folderid}`)}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                  title="Consulter"
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
            </div>

            {/* Table: En Transit */}
            <div
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Chèques en transit (à accuser)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  {enTransit} chèques
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Date d’envoi</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                    ) : enTransit === 0 ? (
                      <tr><td colSpan={3} className="py-4 text-center text-[11px] text-slate-400">Aucun chèque en transit.</td></tr>
                    ) : (
                      dossiers.filter((d) => d.new_status === 130).slice(0, 5).map((dossier, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-3 px-4">
                            <Link to={`/agence/cheques/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {dossier.new_folder_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-[12px] text-slate-500">
                            {dossier.new_cheque_preparation_date ? parseISO(dossier.new_cheque_preparation_date).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleAccuse(dossier)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Recevoir
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

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="flex flex-col gap-6 flex-1">

          {/* Objectif du mois */}
          <div
            style={{ animationDelay: "340ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-6 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-6">Objectif de remise</h3>

            <div className="flex flex-col items-center justify-center relative mb-4">
              <div className="w-32 h-32 rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-sm">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="transparent" strokeWidth="8" className="stroke-[#1F3B73] dark:stroke-blue-500" strokeDasharray="351.8" strokeDashoffset={351.8 - ((percentage > 100 ? 100 : percentage) / 100) * 351.8} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                </svg>
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{percentage > 100 ? 100 : percentage}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 mt-6 text-center">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Chèques remis</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{remis}</span>
                <span className="text-slate-400 font-semibold">/</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{objTraites} cibles</span>
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
              Confirmation
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <AgenceAccuseReceptionModal
        isOpen={isAccuseModalOpen}
        dossier={selectedDossier}
        onClose={() => {
          setIsAccuseModalOpen(false);
          setSelectedDossier(null);
        }}
        onConfirm={handleConfirmAccuse}
      />

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
