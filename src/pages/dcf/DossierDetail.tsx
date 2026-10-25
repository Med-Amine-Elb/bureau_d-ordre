import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Building2,
  Calendar,
  Wallet,
  User
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import TransmissionModal from "@/components/TransmissionModal";
import DossierInformationPanel from "@/components/DossierInformationPanel";

export default function DossierDetailDCF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("infos");

  // Modals state
  const [isTransmitModalOpen, setIsTransmitModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [retourCommentaire, setRetourCommentaire] = useState("");

  // Comptabilisation state
  const [isComptabilise, setIsComptabilise] = useState(false);

  const fetchDossier = async () => {
    try {
      const result = await dataService.getDossiers();
      const found = result.find((d) => d.new_folderid === id);
      if (found) {
        setDossier(found);
        setIsComptabilise(!!found.new_est_comptabilise);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: "Impossible de charger le dossier." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-slate-400">Chargement du dossier...</div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
        <FileText className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Dossier introuvable</h2>
        <button
          onClick={() => navigate("/dcf/dossiers")}
          className="text-primary hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const handleAccuse = async () => {
    try {
      setLoading(true);
      const getXrm = () => {
        if ((window as any).Xrm) return (window as any).Xrm;
        try {
          if (window.parent && (window.parent as any).Xrm) {
            return (window.parent as any).Xrm;
          }
        } catch (e) { }
        return null;
      };
      const context = getXrm() ? getXrm().Utility.getGlobalContext() : null;
      const userName = context ? context.userSettings.userName : "Utilisateur DCF";

      await dataService.accuseReception(dossier.new_folderid, 80, userName);
      toast.success("Réception accusée", {
        description: `Vous pouvez maintenant procéder à la comptabilisation.`,
      });
      fetchDossier();
    } catch (err: any) {
      console.error("DEBUG ACCUSE ERROR:", err);
      toast.error("Erreur", {
        description: err.message || "Impossible d'accuser réception."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComptabiliser = async (checked: boolean) => {
    try {
      setLoading(true);
      // On met à jour directement le champ
      await dataService.updateDossier(dossier.new_folderid, {
        new_est_comptabilise: checked,
        new_accounting_date: checked ? new Date().toISOString() : undefined,
      });
      toast.success("Succès", {
        description: checked ? "Dossier marqué comme comptabilisé." : "Comptabilisation annulée.",
      });
      fetchDossier();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de modifier la comptabilisation." });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: number) => {
    switch (type) {
      case 100: return "Facture";
      case 200: return "Avoir";
      case 500: return "Acompte";
      case 600: return "Courrier";
      default: return "Inconnu";
    }
  };

  const renderStatus = () => {
    if (dossier.new_status === 80 && dossier.new_est_comptabilise) return "Prêt pour trésorerie";
    return getDossierStatusLabel(dossier.new_status);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">

      {/* Back button */}
      <button
        onClick={() => navigate("/dcf/dossiers")}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </button>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow mb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{dossier.new_folder_number}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">
              {getTypeBadge(dossier.new_document_type)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${dossier.new_status === 80 && dossier.new_est_comptabilise ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              dossier.new_status === 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                dossier.new_status === 70 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
              {renderStatus()}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Créé le {new Date(dossier.new_reception_date).toLocaleDateString('fr-FR')} par <span className="font-semibold text-slate-700 dark:text-slate-300">Bureau d'Ordre</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {dossier.new_status === 70 && (
            <button
              onClick={handleAccuse}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Accuser réception
            </button>
          )}

          {dossier.new_status === 80 && (
            <>
              <button
                onClick={() => setIsCorrectionModalOpen(true)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retour pour correction
              </button>

              {dossier.new_est_comptabilise && (
                <button
                  onClick={() => setIsTransmitModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Transmettre à la trésorerie
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: "infos", label: "Informations", icon: FileText },
          { id: "details", label: "Détails complets", icon: FileText },
          { id: "comptabilisation", label: "Comptabilisation", icon: Wallet },
          { id: "documents", label: "Documents", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
              ? "border-blue-600 text-primary dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "infos" && (
            <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Détails du dossier
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {dossier.new_document_type === 600 ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Livreur</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {dossier.new_livreur_nom || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Société destinataire</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_company_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Destinataire (Prescripteur)</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_prescriber_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Direction</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_department_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date de livraison</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {dossier.new_date_livraison ? format(parseISO(dossier.new_date_livraison), "dd MMMM yyyy", { locale: fr }) : "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Description / Objet</label>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        {dossier.new_description || "Aucune description fournie pour ce courrier."}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Fournisseur</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {dossier.new_supplier_id || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Société GBM</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_company_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Direction</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_department_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date de facture</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {dossier.new_invoice_date ? format(parseISO(dossier.new_invoice_date), "dd MMMM yyyy", { locale: fr }) : "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        {dossier.new_description || "Aucune description fournie pour ce dossier."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "details" && <DossierInformationPanel dossier={dossier} />}

          {activeTab === "comptabilisation" && (
            <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                Saisie comptable
              </h3>

              {dossier.new_status < 80 ? (
                <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30 flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-1">Accusé de réception requis</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Vous devez d'abord accuser réception physique de ce dossier avant de pouvoir procéder à la saisie comptable.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-lg">Statut comptable</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Confirmez que ce dossier a bien été saisi et validé.
                      </p>
                    </div>

                    {dossier.new_status === 80 ? (
                      <label className={`group inline-flex min-w-[210px] items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${isComptabilise
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/70 dark:bg-emerald-950/30"
                        : "border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-emerald-800"
                        } ${loading ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isComptabilise}
                          disabled={loading}
                          aria-label={isComptabilise ? "Annuler la comptabilisation" : "Marquer comme comptabilisé"}
                          onChange={(e) => handleComptabiliser(e.target.checked)}
                        />
                        <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500 dark:bg-slate-600" />
                        <span className={`whitespace-nowrap text-sm font-bold ${isComptabilise ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
                          {isComptabilise ? "Comptabilisé" : "À comptabiliser"}
                        </span>
                      </label>
                    ) : (
                      <div className="flex items-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isComptabilise ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {isComptabilise ? "Comptabilisé" : "Non comptabilisé"}
                        </span>
                      </div>
                    )}
                  </div>

                  {isComptabilise && dossier.new_status !== 80 && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                          {dossier.new_status === 80
                            ? "Ce dossier est marqué comme comptabilisé. Vous pouvez maintenant le transmettre à la trésorerie en utilisant le bouton en haut à droite."
                            : dossier.new_status >= 150
                              ? "Ce dossier a été payé et clôturé."
                              : "Ce dossier a été validé et transmis à la trésorerie pour règlement."
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Pièces jointes
              </h3>

              {dossier.new_documents_complements && dossier.new_documents_complements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dossier.new_documents_complements.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 group cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{doc}</p>
                        <p className="text-xs text-slate-500">Document PDF</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucun document joint à ce dossier.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick Actions / Info */}
          <div className="bg-slate-50 dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wider mb-4">Informations rapides</h3>
            <ul className="space-y-4">
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Date de réception BO</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{format(parseISO(dossier.new_reception_date), "dd/MM/yyyy")}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Statut comptable</span>
                <span className={`font-semibold ${isComptabilise ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>
                  {isComptabilise ? 'Saisi' : 'En attente'}
                </span>
              </li>
              {dossier.new_collecteur_treso && (
                <li className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Cible de trésorerie</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_collecteur_treso}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {isTransmitModalOpen && (
        <TransmissionModal
          isOpen={isTransmitModalOpen}
          dossierNumber={dossier.new_folder_number}
          targetRole="Trésorerie"
          onClose={() => setIsTransmitModalOpen(false)}
          directionId={dossier.new_department_guid}
          onConfirm={async (data) => {
            setIsTransmitModalOpen(false);
            setLoading(true);
            try {
              await dataService.transmitDossier({
                folderId: dossier.new_folderid,
                folderNumber: dossier.new_folder_number,
                dossierChanges: {
                  new_status: 100,
                  new_collecteur_treso: data.collecteur,
                },
                fromRole: "DCF",
                toRole: "Trésorerie",
                collectorId: data.collecteur,
                sendingComment: data.commentaire,
              });
              toast.success("Dossier transmis à la trésorerie.");
              fetchDossier();
            } catch (err) {
              toast.error("Erreur de transmission.", { description: err instanceof Error ? err.message : "Le dossier n’a pas pu être transmis." });
              setLoading(false);
            }
          }}
        />
      )}

      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              Retour pour correction
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
              Êtes-vous sûr de vouloir retourner ce dossier au Bureau d'Ordre pour correction ?
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Motif du retour <span className="text-red-500">*</span>
              </label>
              <textarea
                value={retourCommentaire}
                onChange={(e) => setRetourCommentaire(e.target.value)}
                placeholder="Veuillez expliquer pourquoi ce dossier est retourné..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCorrectionModalOpen(false);
                  setRetourCommentaire("");
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Annuler
              </button>
              <button
                disabled={retourCommentaire.trim() === ""}
                onClick={async () => {
                  if (retourCommentaire.trim() === "") return;
                  try {
                    await dataService.updateDossier(dossier.new_folderid, {
                      new_status: 90,
                      new_motif_retour: retourCommentaire,
                      new_date_retour_bo: new Date().toISOString()
                    });
                    toast.success("Dossier retourné avec succès.");
                    setIsCorrectionModalOpen(false);
                    setRetourCommentaire("");
                    fetchDossier();
                  } catch (e) {
                    toast.error("Erreur lors du retour.");
                  }
                }}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${retourCommentaire.trim() === ""
                  ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
              >
                Confirmer le retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


