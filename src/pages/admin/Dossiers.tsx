import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  Play,
  User,
  Trash2,
  AlertCircle,
  X,
  FileCheck,
  Building,
  DollarSign,
  Download,
  History
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";
import type { Dossier } from "@/lib/dataService";
import { exportToExcel, formatDateSafely, getTypeLabel } from "@/utils/excelExport";
import DossierInformationPanel from "@/components/DossierInformationPanel";
import DossierTransmissionHistory from "@/components/DossierTransmissionHistory";

export default function AdminDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterBlocked, setFilterBlocked] = useState("Tous");

  // Selection states for modals
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [selectedDossierForAudit, setSelectedDossierForAudit] = useState<Dossier | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCollectorModal, setShowCollectorModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState<number>(10);
  const [newCommentaire, setNewCommentaire] = useState("");
  const [newPrescripteur, setNewPrescripteur] = useState("");
  const [newCollecteurDcf, setNewCollecteurDcf] = useState("");
  const [newCollecteurTreso, setNewCollecteurTreso] = useState("");

  const handleExportExcel = () => {
    const dataToExport = filteredDossiers.map(d => ({
      "Numéro Dossier": d.new_folder_number,
      "Fournisseur": d.new_supplier_id || d.new_livreur_nom || "",
      "Numéro Facture": d.new_invoice_number || "",
      "Type Document": getTypeLabel(d.new_document_type),
      "Statut Code": d.new_status,
      "Statut Libellé": getStatusLabel(d.new_status),
      "Bloqué": d.new_is_blocked ? "Oui" : "Non",
      "Prescripteur": d.new_prescriber_id || "",
      "DCF Collecteur": d.new_dcf_collector_id || "",
      "Trésorerie Collecteur": d.new_collecteur_treso || "",
      "Date Réception": formatDateSafely(d.new_reception_date)
    }));
    exportToExcel(dataToExport, "Admin_Supervision_Dossiers");
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await dataService.getDossiers();
      setDossiers(list);
    } catch (err) {
      toast.error("Erreur lors de la récupération des dossiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStatus = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setNewStatus(dossier.new_status);
    setNewCommentaire("");
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    try {
      const payload: Partial<Dossier> = {
        new_status: Number(newStatus),
        new_description: newCommentaire
          ? `${selectedDossier.new_description ? selectedDossier.new_description + " | " : ""}Forçage Statut (${selectedDossier.new_status} -> ${newStatus}) : ${newCommentaire}`
          : selectedDossier.new_description
      };
      await dataService.updateDossier(selectedDossier.new_folderid, payload);
      toast.success("Le statut du dossier a été forcé avec succès !");
      setShowStatusModal(false);
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleOpenCollector = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setNewPrescripteur(dossier.new_prescriber_id || "");
    setNewCollecteurDcf(dossier.new_dcf_collector_id || "");
    setNewCollecteurTreso(dossier.new_collecteur_treso || "");
    setShowCollectorModal(true);
  };

  const handleSaveCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    try {
      const payload: Partial<Dossier> = {
        new_prescriber_id: newPrescripteur || undefined,
        new_dcf_collector_id: newCollecteurDcf || undefined,
        new_collecteur_treso: newCollecteurTreso || undefined
      };
      await dataService.updateDossier(selectedDossier.new_folderid, payload);
      toast.success("Collecteurs mis à jour avec succès.");
      setShowCollectorModal(false);
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour des collecteurs");
    }
  };

  const handleForceDebloquer = async (dossier: Dossier) => {
    if (confirm("Voulez-vous lever le blocage administratif de ce dossier ?")) {
      try {
        const payload: Partial<Dossier> = {
          new_is_blocked: false,
          new_date_deblocage: new Date().toISOString(),
          new_resolution_blocage: "Débloqué administrativement par l'Administrateur"
        };
        await dataService.updateDossier(dossier.new_folderid, payload);
        toast.success("Le blocage a été levé.");
        loadData();
      } catch (err) {
        toast.error("Erreur lors du déblocage");
      }
    }
  };

  const handleDeleteDossier = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier de la base de données Dataverse ?")) {
      try {
        await dataService.deleteDossier(id);
        toast.success("Dossier supprimé définitivement.");
        loadData();
      } catch (err) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const getStatusLabel = getDossierStatusLabel;

  const getStatusColor = (status: number) => {
    switch(status) {
      case 20: return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200";
      case 40:
      case 80:
      case 110: return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200";
      case 90: return "bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200";
      case 120:
      case 140:
      case 150: return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200";
    }
  };

  // Filtered dossiers
  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_folder_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.new_supplier_id && d.new_supplier_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.new_invoice_number && d.new_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === "Tous" || d.new_document_type === Number(filterType);
    const matchesStatus = filterStatus === "Tous" || d.new_status === Number(filterStatus);
    const matchesBlocked =
      filterBlocked === "Tous" ||
      (filterBlocked === "Bloqués" && d.new_is_blocked) ||
      (filterBlocked === "Non Bloqués" && !d.new_is_blocked);

    return matchesSearch && matchesType && matchesStatus && matchesBlocked;
  });

  return (
    <div className="h-[calc(100vh-112px)] sm:h-[calc(100vh-128px)] md:h-[calc(100vh-144px)] flex flex-col gap-6 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Supervision des dossiers
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Console de contrôle globale. Bypassez les règles métiers Dataverse, forcez des étapes ou modifiez l'affectation des tâches.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-sm shadow-[#1F3B73]/20"
        >
          <Download className="w-5 h-5" /> Exporter au format Excel
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="N° dossier, Fournisseur, Facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 transition-all text-slate-950 dark:text-white"
            />
          </div>

          {/* Type document filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
            >
              <option value="Tous">Tous les types de document</option>
              <option value="100">Factures (100)</option>
              <option value="200">Avoirs (200)</option>
              <option value="500">Acomptes (500)</option>
              <option value="600">Courriers (600)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
            >
              <option value="Tous">Tous les statuts</option>
                  <option value="10">{getDossierStatusLabel(10)} (10)</option>
              <option value="20">Hors délai (20)</option>
              <option value="30">{getDossierStatusLabel(30)} (30)</option>
              <option value="40">{getDossierStatusLabel(40)} (40)</option>
              <option value="50">{getDossierStatusLabel(50)} (50)</option>
              <option value="60">Prêt DCF (60)</option>
              <option value="70">{getDossierStatusLabel(70)} (70)</option>
              <option value="80">{getDossierStatusLabel(80)} (80)</option>
              <option value="90">{getDossierStatusLabel(90)} (90)</option>
              <option value="100">{getDossierStatusLabel(100)} (100)</option>
              <option value="110">{getDossierStatusLabel(110)} (110)</option>
              <option value="120">{getDossierStatusLabel(120)} (120)</option>
              <option value="130">{getDossierStatusLabel(130)} (130)</option>
              <option value="140">{getDossierStatusLabel(140)} (140)</option>
              <option value="150">{getDossierStatusLabel(150)} (150)</option>
            </select>
          </div>

          {/* Blocked filter */}
          <div>
            <select
              value={filterBlocked}
              onChange={(e) => setFilterBlocked(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
            >
              <option value="Tous">Tous les blocages</option>
              <option value="Bloqués">Bloqués uniquement</option>
              <option value="Non Bloqués">Non bloqués</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white dark:bg-[#0F172B] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Chargement de la supervision...</div>
        ) : filteredDossiers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Aucun dossier ne correspond aux critères de recherche.</div>
        ) : (
          <div>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="py-4 px-6">Numéro du dossier</th>
                  <th className="py-4 px-6">Fournisseur / Facture</th>
                  <th className="py-4 px-6">Type de document</th>
                  <th className="py-4 px-6">Statut Dataverse</th>
                  <th className="py-4 px-6">Blocage</th>
                  <th className="py-4 px-6">Collecteurs actuels</th>
                  <th className="py-4 px-6 text-right">Actions d’administration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredDossiers.map((d) => (
                  <tr key={d.new_folderid} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    {/* Numero */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {d.new_folder_number}
                      </div>
                    </td>

                    {/* Vendor and Invoice */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{d.new_supplier_id || "Non spécifié"}</div>
                      <div className="text-xs text-slate-400 font-medium">Facture : {d.new_invoice_number || "N/A"}</div>
                    </td>

                    {/* Document Type */}
                    <td className="py-4 px-6 font-medium text-slate-650 dark:text-slate-350">
                      {d.new_document_type === 100 ? "Facture (100)" :
                       d.new_document_type === 200 ? "Avoir (200)" :
                       d.new_document_type === 500 ? "Acompte (500)" :
                       d.new_document_type === 600 ? "Courrier (600)" :
                       `Type ${d.new_document_type}`}
                    </td>

                    {/* Dataverse status code */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(d.new_status)}`}>
                        {d.new_status === 150 ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {getStatusLabel(d.new_status)} ({d.new_status})
                      </span>
                    </td>

                    {/* Blockage state */}
                    <td className="py-4 px-6">
                      {d.new_is_blocked ? (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> BLOQUÉ
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Aucun</span>
                      )}
                    </td>

                    {/* Owners lookups */}
                    <td className="py-4 px-6 text-xs space-y-1">
                      {d.new_prescriber_id && (
                        <div><span className="font-semibold text-slate-400">Presc:</span> <span className="font-medium text-slate-600 dark:text-slate-300">{d.new_prescriber_id}</span></div>
                      )}
                      {d.new_dcf_collector_id && (
                        <div><span className="font-semibold text-slate-400">DCF:</span> <span className="font-medium text-slate-600 dark:text-slate-300">{d.new_dcf_collector_id}</span></div>
                      )}
                      {d.new_collecteur_treso && (
                        <div><span className="font-semibold text-slate-400">Tréso:</span> <span className="font-medium text-slate-600 dark:text-slate-300">{d.new_collecteur_treso}</span></div>
                      )}
                    </td>

                    {/* Overrides Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {d.new_is_blocked && (
                          <button
                            onClick={() => handleForceDebloquer(d)}
                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Lever blocage
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenStatus(d)}
                          className="bg-[#1F3B73]/10 text-[#1F3B73] hover:bg-[#1F3B73]/20 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Forcer Statut
                        </button>
                        <button
                          onClick={() => handleOpenCollector(d)}
                          className="bg-purple-50 dark:bg-purple-950/40 text-purple-750 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Réassigner
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDossierForAudit(d);
                            setShowAuditModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-[#1F3B73] hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                          title="Historique & Audit Log"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDossier(d.new_folderid)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Supprimer dossier de la base"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Force Status Modal */}
      {showStatusModal && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <AlertCircle className="w-6 h-6 text-[#1F3B73]" />
              Forcer le statut du dossier
            </h2>

            <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-400 font-medium">
              <span className="font-bold">Attention :</span> Cette opération bypasse l'ensemble des contrôles d'étape de l'application et force directement la propriété `new_status` dans la base Dataverse.
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Dossier sélectionné</span>
                <p className="font-bold text-slate-800 dark:text-white">{selectedDossier.new_folder_number} ({selectedDossier.new_supplier_id})</p>
                <p className="text-xs text-slate-400 mt-0.5">Statut actuel : {getStatusLabel(selectedDossier.new_status)} ({selectedDossier.new_status})</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nouveau statut cible</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
                >
                  <option value="10">{getDossierStatusLabel(10)} (10)</option>
                  <option value="20">Hors délai (20)</option>
                  <option value="30">{getDossierStatusLabel(30)} (30)</option>
                  <option value="40">{getDossierStatusLabel(40)} (40)</option>
              <option value="50">{getDossierStatusLabel(50)} (50)</option>
                  <option value="60">{getDossierStatusLabel(60)} (60)</option>
              <option value="70">{getDossierStatusLabel(70)} (70)</option>
                  <option value="80">{getDossierStatusLabel(80)} (80)</option>
                  <option value="90">{getDossierStatusLabel(90)} (90)</option>
                  <option value="100">{getDossierStatusLabel(100)} (100)</option>
                  <option value="110">{getDossierStatusLabel(110)} (110)</option>
                  <option value="120">{getDossierStatusLabel(120)} (120)</option>
                  <option value="130">{getDossierStatusLabel(130)} (130)</option>
                  <option value="140">{getDossierStatusLabel(140)} (140)</option>
              <option value="150">{getDossierStatusLabel(150)} (150)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commentaire justificatif (requis)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Expliquez la raison de ce forçage manuel (ex: déblocage par email de la direction générale...)"
                  value={newCommentaire}
                  onChange={(e) => setNewCommentaire(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl text-sm font-bold transition-all"
                >
                  Confirmer le Forçage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collector / Owner Reassignment Modal */}
      {showCollectorModal && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCollectorModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-[#1F3B73]" />
              Réassigner les acteurs du dossier
            </h2>

            <form onSubmit={handleSaveCollector} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Dossier sélectionné</span>
                <p className="font-bold text-slate-800 dark:text-white">{selectedDossier.new_folder_number}</p>
              </div>

              {/* Prescripteur */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Prescripteur (Métier)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sarah Alaoui"
                  value={newPrescripteur}
                  onChange={(e) => setNewPrescripteur(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              {/* Collector DCF */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-purple-500" /> Comptabilisateur (DCF)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Karim Idrissi"
                  value={newCollecteurDcf}
                  onChange={(e) => setNewCollecteurDcf(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              {/* Collector Tresorerie */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Agent Règlements (Trésorerie)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Meryem Touimi"
                  value={newCollecteurTreso}
                  onChange={(e) => setNewCollecteurTreso(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCollectorModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl text-sm font-bold transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && selectedDossierForAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-[#1F3B73] dark:text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                    Journal d’audit et cycle de vie
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dossier {selectedDossierForAudit.new_folder_number} • Événements et étapes Dataverse
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedDossierForAudit(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fournisseur</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">{selectedDossierForAudit.new_supplier_id || "-"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Société GBM</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{selectedDossierForAudit.new_company_id || "-"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Type</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    {selectedDossierForAudit.new_document_type === 100 ? "Facture" :
                     selectedDossierForAudit.new_document_type === 200 ? "Avoir" :
                     selectedDossierForAudit.new_document_type === 500 ? "Acompte" : "Courrier"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statut actuel</span>
                  <span className="text-xs font-semibold text-[#1F3B73] dark:text-blue-400 block">
                    {getStatusLabel(selectedDossierForAudit.new_status)} ({selectedDossierForAudit.new_status})
                  </span>
                </div>
              </div>

              <DossierInformationPanel dossier={selectedDossierForAudit} />

              <DossierTransmissionHistory folderId={selectedDossierForAudit.new_folderid} />

              {/* Timeline Container */}
              <div className="space-y-6 ml-2 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                
                {/* 1. BO Saisie */}
                <div className="relative flex gap-4 pl-8 items-start">
                  <div className="absolute left-0 w-7 h-7 rounded-full bg-blue-500/10 dark:bg-blue-950/40 border-2 border-blue-500 flex items-center justify-center text-blue-500 z-10">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">Saisie et réception au BO</h4>
                      <span className="text-[10px] font-semibold text-slate-450">
                        {selectedDossierForAudit.new_reception_date ? new Date(selectedDossierForAudit.new_reception_date).toLocaleString("fr-FR") : "Date inconnue"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
                      Numérisation et création du dossier. Direction destinataire affectée : <strong className="text-slate-700 dark:text-slate-300">{selectedDossierForAudit.new_department_id || "Non spécifiée"}</strong>.
                    </p>
                    {selectedDossierForAudit.new_invoice_number && (
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        N° Facture : {selectedDossierForAudit.new_invoice_number} {selectedDossierForAudit.new_po_number ? `| BC : ${selectedDossierForAudit.new_po_number}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Prescripteur Validation */}
                {(selectedDossierForAudit.new_status >= 40 || selectedDossierForAudit.new_prescriber_id) && (
                  <div className="relative flex gap-4 pl-8 items-start animate-in fade-in duration-350">
                    <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                      selectedDossierForAudit.new_status >= 50
                        ? "bg-indigo-500/10 dark:bg-indigo-950/40 border-2 border-indigo-500 text-indigo-500"
                        : "bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}>
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">Validation du prescripteur</h4>
                        <span className="text-[10px] font-semibold text-slate-450">
                          {selectedDossierForAudit.new_status >= 50 ? "Service validé" : "En cours d'examen"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">
                        Prescripteur en charge : <strong className="text-slate-700 dark:text-slate-300">{selectedDossierForAudit.new_prescriber_id || "En attente"}</strong>.
                      </p>
                      
                      {/* Enriched Dates List */}
                      <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-100/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de transmission :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_trans_prescripteur ? new Date(selectedDossierForAudit.new_date_trans_prescripteur).toLocaleString("fr-FR") : "En attente"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date d’accusé de réception :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_accuse_prescripteur ? new Date(selectedDossierForAudit.new_date_accuse_prescripteur).toLocaleString("fr-FR") : "En attente"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de validation métier :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_val_prescripteur ? new Date(selectedDossierForAudit.new_date_val_prescripteur).toLocaleString("fr-FR") : "En attente"}</span></div>
                      </div>

                      {selectedDossierForAudit.new_documents_complements && selectedDossierForAudit.new_documents_complements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedDossierForAudit.new_documents_complements.map((doc, idx) => (
                            <span key={idx} className="text-[9px] font-semibold bg-slate-150 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
 
                 {/* 3. DCF Accounting */}
                {(selectedDossierForAudit.new_status >= 80 || selectedDossierForAudit.new_dcf_collector_id) && (
                  <div className="relative flex gap-4 pl-8 items-start animate-in fade-in duration-350">
                    <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                      selectedDossierForAudit.new_status >= 100
                        ? "bg-purple-500/10 dark:bg-purple-950/40 border-2 border-purple-500 text-purple-500"
                        : "bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}>
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">Comptabilisation DCF</h4>
                        <span className="text-[10px] font-semibold text-slate-450">
                          {selectedDossierForAudit.new_status >= 100 ? "Comptabilisé" : "En cours"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">
                        Comptable affecté : <strong className="text-slate-700 dark:text-slate-300">{selectedDossierForAudit.new_dcf_collector_id || "En attente"}</strong>.
                      </p>

                      {/* Enriched Dates List */}
                      <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-100/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de transmission :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_trans_dcf ? new Date(selectedDossierForAudit.new_date_trans_dcf).toLocaleString("fr-FR") : "En attente"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date d’accusé de réception :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_accuse_dcf ? new Date(selectedDossierForAudit.new_date_accuse_dcf).toLocaleString("fr-FR") : "En attente"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de saisie comptable :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_val_dcf ? new Date(selectedDossierForAudit.new_date_val_dcf).toLocaleString("fr-FR") : "En attente"}</span></div>
                      </div>
                    </div>
                  </div>
                )}
 
                 {/* 4. Trésorerie Payment */}
                {(selectedDossierForAudit.new_status >= 110 || selectedDossierForAudit.new_collecteur_treso) && (
                  <div className="relative flex gap-4 pl-8 items-start animate-in fade-in duration-355">
                    <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                      selectedDossierForAudit.new_status >= 120 || selectedDossierForAudit.new_status === 150
                        ? "bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-500"
                        : "bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}>
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">Traitement de la trésorerie</h4>
                        <span className="text-[10px] font-semibold text-slate-450">
                          {selectedDossierForAudit.new_status >= 120 || selectedDossierForAudit.new_status === 150 ? "Règlement prêt" : "En cours"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">
                        Chargé de règlements : <strong className="text-slate-700 dark:text-slate-300">{selectedDossierForAudit.new_collecteur_treso || "En attente"}</strong>.
                        {selectedDossierForAudit.new_accuse_par && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">Accusé par : {selectedDossierForAudit.new_accuse_par}</span>
                        )}
                      </p>

                      {/* Enriched Dates List */}
                      <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-100/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de transmission :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_val_dcf ? new Date(selectedDossierForAudit.new_date_val_dcf).toLocaleString("fr-FR") : "En attente"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-medium">Date d’accusé de réception :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_accuse ? new Date(selectedDossierForAudit.new_date_accuse).toLocaleString("fr-FR") : "En attente"}</span></div>
                      </div>
 
                      {/* Payment mode details */}
                      {selectedDossierForAudit.new_payment_method && (
                        <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Mode de règlement : {selectedDossierForAudit.new_payment_method === 2 ? "Virement" : "Chèque"}
                          </p>
                          {selectedDossierForAudit.new_payment_method === 2 ? (
                            <>
                              <p className="text-slate-650 dark:text-slate-400">Date du virement : {selectedDossierForAudit.new_date_virement ? new Date(selectedDossierForAudit.new_date_virement).toLocaleDateString("fr-FR") : "-"}</p>
                              <p className="font-mono text-[10px] text-slate-500 mt-1 select-all break-all bg-slate-200 dark:bg-slate-950 p-2 rounded border border-slate-300 dark:border-slate-850">RIB Dest : {selectedDossierForAudit.new_compte_bancaire_dest || "-"}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-slate-650 dark:text-slate-400">N° Chèque : <span className="font-bold text-slate-900 dark:text-white">{selectedDossierForAudit.new_cheque_number || "-"}</span></p>
                              <p className="text-slate-650 dark:text-slate-400">Banque émettrice : {selectedDossierForAudit.new_banque_emettrice || "-"}</p>
                              <p className="text-slate-650 dark:text-slate-400">Préparé le : {selectedDossierForAudit.new_cheque_preparation_date ? new Date(selectedDossierForAudit.new_cheque_preparation_date).toLocaleDateString("fr-FR") : "-"}</p>
                              <p className="text-slate-650 dark:text-slate-400">Transmis au BO le : {selectedDossierForAudit.new_date_transmission_bo ? new Date(selectedDossierForAudit.new_date_transmission_bo).toLocaleDateString("fr-FR") : "-"}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
 
                 {/* 5. Physical distribution (Chèque BO & Agence) */}
                {selectedDossierForAudit.new_payment_method === 1 && selectedDossierForAudit.new_status >= 120 && (
                  <div className="relative flex gap-4 pl-8 items-start animate-in fade-in duration-355">
                    <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                      selectedDossierForAudit.new_status === 150
                        ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-500"
                        : "bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}>
                      <FileCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">Acheminement et remise</h4>
                        <span className="text-[10px] font-semibold text-slate-450">
                          {selectedDossierForAudit.new_status === 150 ? "Livré" : "En cours"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-455 mt-2 space-y-2 leading-relaxed">
                        {/* Enriched Dates List */}
                        <div className="my-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-100/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                          <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de transmission au BO :</span> <span className="font-semibold">{selectedDossierForAudit.new_date_transmission_bo ? new Date(selectedDossierForAudit.new_date_transmission_bo).toLocaleDateString("fr-FR") : "En attente"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400 font-medium">Reçu en agence le :</span> <span className="font-semibold">{selectedDossierForAudit.new_reception_date_agence ? new Date(selectedDossierForAudit.new_reception_date_agence).toLocaleString("fr-FR") : "En transit"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400 font-medium">Date de remise finale :</span> <span className="font-semibold">{selectedDossierForAudit.new_final_delivery_date ? new Date(selectedDossierForAudit.new_final_delivery_date).toLocaleDateString("fr-FR") : "En attente"}</span></div>
                        </div>
                        
                        <p>• Accusé de réception du chèque au BO : <strong className={selectedDossierForAudit.new_cheque_recu_bo ? "text-emerald-500" : "text-slate-400"}>{selectedDossierForAudit.new_cheque_recu_bo ? "Confirmé" : "En attente"}</strong></p>
                        {selectedDossierForAudit.new_commentaire_reception && (
                          <p className="text-[11px] bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 italic">BO: "{selectedDossierForAudit.new_commentaire_reception}"</p>
                        )}
                        {selectedDossierForAudit.new_destination_branch_id && (
                          <p>• Agence de destination : <strong className="text-slate-700 dark:text-slate-300">{selectedDossierForAudit.new_destination_branch_id}</strong></p>
                        )}
                        <p>• Remise au fournisseur : <strong className={selectedDossierForAudit.new_fournisseur_signe ? "text-emerald-500" : "text-slate-400"}>{selectedDossierForAudit.new_fournisseur_signe ? "Confirmée" : "Non signée"}</strong></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Description Comments Audit */}
              {selectedDossierForAudit.new_description && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider">Commentaires et dérogations techniques</h4>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs font-medium text-slate-650 dark:text-slate-400 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/50">
                    {selectedDossierForAudit.new_description.split("|").map((segment, idx) => (
                      <div key={idx} className={`${idx > 0 ? "pt-2" : ""} leading-relaxed`}>
                        {segment.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedDossierForAudit(null);
                }}
                className="px-5 py-2.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#1F3B73]/20"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


