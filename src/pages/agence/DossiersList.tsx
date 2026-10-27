import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Wallet,
  Truck,
  CreditCard,
  Download
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { exportDossiersToExcelDetailed } from "@/utils/excelExport";
import AgenceAccuseReceptionModal from "@/components/AgenceAccuseReceptionModal";
import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";
import AgenceValiderRemiseModal from "@/components/AgenceValiderRemiseModal";
import SupplierFilterInput from "@/components/SupplierFilterInput";
import { matchesSupplierFilter } from "@/lib/supplierFilter";

export default function DossiersListAgence() {
  const location = useLocation();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const currentAgence = localStorage.getItem("userAgence") || "Rabat Agdal";

  // Filters
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>(() =>
    location.state?.filterStatus || "ALL"
  );
  const [filterFournisseur, setFilterFournisseur] = useState("");

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, [currentAgence]);

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
      await dataService.accuseReception(selectedDossier.new_folderid, 140, "Agence", {
        new_reception_date_agence: new Date().toISOString(),
        new_commentaire_agence: data.commentaire
      });
      setSuccessMessage("Réception du chèque confirmée.");
      setSuccessModalOpen(true);
      fetchDossiers();
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
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de valider la remise." });
    }
  };

  const handleExportExcel = () => {
    exportDossiersToExcelDetailed(filteredDossiers, "Agence_Dossiers");
  };

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_folder_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.new_supplier_id?.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = filterStatus === "ALL";
    if (filterStatus !== "ALL") {
      matchesStatus = d.new_status === Number(filterStatus);
    }

    const matchesFournisseur = matchesSupplierFilter(d.new_supplier_id, filterFournisseur);

    return matchesSearch && matchesStatus && matchesFournisseur;
  });

  const getStatusBadge = (status: number) => {
    if (status === 130) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Truck className="w-3.5 h-3.5" />{getDossierStatusLabel(status)}</span>;
    if (status === 140) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><Wallet className="w-3.5 h-3.5" />{getDossierStatusLabel(status)}</span>;
    if (status === 150) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />{getDossierStatusLabel(status)}</span>;

    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Statut {status}</span>;
  };

  return (
    <div className="w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
            Suivi des chèques (agence régionale)
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Validez la réception des chèques et confirmez leur remise aux fournisseurs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm text-sm">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Agence :</span>
          <span className="font-bold text-[#1F3B73] dark:text-blue-400">{currentAgence}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par N° Dossier, Fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-slate-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
            >
              <Filter className="w-4 h-4" /> Filtres
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Exporter au format Excel
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Statut</label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="130">En transport</option>
                <option value="140">{getDossierStatusLabel(140)}</option>
                <option value="150">{getDossierStatusLabel(150)}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fournisseur</label>
              <SupplierFilterInput value={filterFournisseur} onValueChange={setFilterFournisseur} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  N° Chèque / Banque
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date Expédition
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date Réception / Remise
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Chargement des dossiers...
                  </td>
                </tr>
              ) : filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Aucun chèque trouvé.
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((dossier, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-[#1F3B73] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {dossier.new_folder_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#1F3B73]/10 dark:bg-[#1F3B73]/30 text-[#1F3B73] dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(dossier.new_supplier_id || "F").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {dossier.new_supplier_id || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(dossier.new_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {dossier.new_date_transmission_bo ? format(parseISO(dossier.new_date_transmission_bo), "dd MMM yyyy", { locale: fr }) : "-"}
                        </span>
                        {dossier.new_commentaire_agence && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {dossier.new_commentaire_agence}
                          </span>
                        )}
                        {dossier.new_livreur_nom && (
                          <span className="text-[11px] text-primary dark:text-blue-400 font-bold">
                            Chauffeur : {dossier.new_livreur_nom}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {dossier.new_status === 150 && dossier.new_final_delivery_date ? (
                        <div className="flex flex-col text-emerald-600 dark:text-emerald-400">
                          <span className="font-semibold">Remis le :</span>
                          <span>{format(parseISO(dossier.new_final_delivery_date), "dd MMM yyyy", { locale: fr })}</span>
                        </div>
                      ) : dossier.new_reception_date_agence ? (
                        <div className="flex flex-col text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">Reçu le :</span>
                          <span>{format(parseISO(dossier.new_reception_date_agence), "dd MMM yyyy", { locale: fr })}</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {dossier.new_status === 130 && (
                          <button
                            onClick={() => handleAccuse(dossier)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" /> Accuser réception
                          </button>
                        )}
                        {dossier.new_status === 140 && (
                          <button
                            onClick={() => handleRemise(dossier)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Remettre
                          </button>
                        )}
                        {dossier.new_status === 150 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Clôturé <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SuccessConfirmationModal open={successModalOpen} message={successMessage} onClose={() => setSuccessModalOpen(false)} />

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


