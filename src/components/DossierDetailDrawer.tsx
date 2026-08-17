import { useEffect, useState } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import TransmissionModal from "@/components/TransmissionModal";
import {
  X,
  Clock,
  FileText,
  AlertOctagon,
  Link as LinkIcon,
  Send,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface DossierDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string | null;
  onRefresh?: () => void;
}

export default function DossierDetailDrawer({
  isOpen,
  onClose,
  dossierId,
  onRefresh
}: DossierDetailDrawerProps) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("infos");

  // Transmission modal states
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [transmissionTargetRole, setTransmissionTargetRole] = useState<"Prescripteur" | "DCF">("Prescripteur");
  const [transmissionInitialCollector, setTransmissionInitialCollector] = useState("");

  const fetchData = async () => {
    if (!dossierId) return;
    setLoading(true);
    try {
      const result = await dataService.getDossiers();
      const found = result.find(d => d.new_folderid === dossierId);
      if (found) {
        setDossier(found);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les détails du dossier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && dossierId) {
      fetchData();
      setActiveTab("infos");
    } else {
      setDossier(null);
    }
  }, [isOpen, dossierId]);

  if (!isOpen) return null;

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 10: return { label: "Sauvegarder", color: "slate" };
      case 20: return { label: "Hors Délai", color: "red" };
      case 30: return { label: "En Transit (Prescr.)", color: "blue" };
      case 40: return { label: "Chez Prescripteur", color: "indigo" };
      case 50: return { label: "En Transit (BO)", color: "blue" };
      case 60: return { label: "Prêt DCF", color: "emerald" };
      case 70: return { label: "En Transit (DCF)", color: "blue" };
      case 80: return { label: "Chez DCF", color: "purple" };
      case 90: return { label: "Retour Correction", color: "orange" };
      case 100: return { label: "En Transit (Tréso.)", color: "blue" };
      case 110: return { label: "Chez Trésorerie", color: "indigo" };
      case 120: return { label: "Attente Remise", color: "emerald" };
      case 130: return { label: "En Transport", color: "orange" };
      case 140: return { label: "Disponible Agence", color: "emerald" };
      case 150: return { label: dossier?.new_document_type === 600 ? "Livré (Clôturé)" : "Payé", color: "emerald" };
      default: return { label: `Statut ${status}`, color: "slate" };
    }
  };

  const statusInfo = dossier ? getStatusDisplay(dossier.new_status) : { label: "", color: "slate" };

  const handleTransmitClick = () => {
    if (!dossier) return;
    const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
    const isReturningFromPrescripteur = dossier.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;

    setTransmissionTargetRole(isToDCF ? "DCF" : "Prescripteur");
    setTransmissionInitialCollector(isToDCF ? (dossier.new_dcf_collector_id || "") : (dossier.new_prescriber_id || ""));
    setShowTransmissionModal(true);
  };

  const handleConfirmTransmission = async (data: { collecteur: string; commentaire: string }) => {
    if (!dossier) return;
    setShowTransmissionModal(false);
    setLoading(true);
    try {
      const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
      const isReturningFromPrescripteur = dossier.new_status === 60;
      const isToDCF = isFluxCourt || isReturningFromPrescripteur;
      const nextStatus = isToDCF ? 70 : 30;

      const payload: Partial<Dossier> = {
        new_status: nextStatus,
        ...(isToDCF ? { new_dcf_collector_id: data.collecteur } : { new_prescriber_id: data.collecteur }),
        new_description: data.commentaire
          ? `${dossier.new_description ? dossier.new_description + " | " : ""}Transmission : ${data.commentaire}`
          : dossier.new_description
      };

      await dataService.updateDossier(dossier.new_folderid, payload);
      toast.success("Dossier transmis avec succès.");
      fetchData();
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error("Erreur de transmission");
    } finally {
      setLoading(false);
    }
  };

  const handleAccuseClick = async () => {
    if (!dossier) return;
    setLoading(true);
    try {
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
      const userName = context ? context.userSettings.userName : "Agent BO";

      await dataService.accuseReception(dossier.new_folderid, 60, userName);
      toast.success("Réception accusée avec succès.");
      fetchData();
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Erreur", { description: e.message || "Impossible d'accuser la réception." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      {/* Backdrop area for clicking out */}
      <div
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      {/* Slide-over Content Drawer */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0B0F19] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {dossier ? dossier.new_folder_number : "Chargement..."}
              </h2>
              {dossier && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-950/20 text-${statusInfo.color}-700 dark:text-${statusInfo.color}-400 border border-${statusInfo.color}-200/20`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            {dossier && (
              <p className="text-xs text-slate-400 font-medium">
                Reçu le {new Date(dossier.new_reception_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action ribbon inside drawer */}
        {dossier && (dossier.new_status === 50 || dossier.new_status === 10 || dossier.new_status === 60) && (
          <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            {dossier.new_status === 50 && (
              <button
                onClick={handleAccuseClick}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Accuser Réception
              </button>
            )}
            {(dossier.new_status === 10 || dossier.new_status === 60) && (
              <button
                onClick={handleTransmitClick}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> {dossier.new_document_type === 400 || dossier.new_document_type === 500 || dossier.new_status === 60 ? "Transmettre à la DCF" : "Transmettre à Prescripteur"}
              </button>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && !dossier && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <span className="animate-pulse">Chargement des données...</span>
          </div>
        )}

        {/* Main Content Pane */}
        {dossier && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Row */}
            <div className="flex items-center gap-1 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              {[
                { id: "infos", label: "Général", icon: FileText },
                { id: "timeline", label: "Flux", icon: Clock },
                { id: "documents", label: "Pièces", icon: LinkIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all ${activeTab === tab.id
                      ? "border-primary text-primary dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Tab view */}
            <div className="flex-1 overflow-y-auto p-6 custom-scroll space-y-6">

              {/* Tab 1: Info General */}
              {activeTab === "infos" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Informations Clés</h4>
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                      {dossier.new_document_type === 600 ? (
                        <>
                          <div><span className="text-slate-400 block mb-0.5">Livreur</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_livreur_nom || '-'}</span></div>
                          <div><span className="text-slate-400 block mb-0.5">Société Dest.</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_company_id || '-'}</span></div>
                          <div><span className="text-slate-400 block mb-0.5">Destinataire</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_prescriber_id || '-'}</span></div>
                          <div><span className="text-slate-400 block mb-0.5">Direction</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_department_id || '-'}</span></div>
                          <div className="col-span-2"><span className="text-slate-400 block mb-0.5">Date de Livraison</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_date_livraison ? new Date(dossier.new_date_livraison).toLocaleDateString('fr-FR') : '-'}</span></div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-slate-400 block mb-0.5">Fournisseur</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_supplier_id || '-'}</span></div>
                          <div><span className="text-slate-400 block mb-0.5">Société GBM</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_company_id || '-'}</span></div>
                          <div><span className="text-slate-400 block mb-0.5">Direction</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_department_id || '-'}</span></div>
                          <div><span className="text-slate-400 block mb-0.5">Prescripteur</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_prescriber_id || '-'}</span></div>
                          <div className="col-span-2"><span className="text-slate-400 block mb-0.5">Date de la Facture</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_invoice_date ? new Date(dossier.new_invoice_date).toLocaleDateString('fr-FR') : '-'}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Description / Objet</h4>
                    <p className="text-sm text-slate-750 dark:text-slate-300 leading-relaxed bg-slate-50/20 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      {dossier.new_description || "Aucune description renseignée."}
                    </p>
                  </div>

                  {dossier.new_payment_method && (
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Informations de Règlement</h4>
                      <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Mode</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {dossier.new_payment_method === 1 ? "Chèque" : dossier.new_payment_method === 2 ? "Virement" : "Non défini"}
                          </span>
                        </div>
                        {dossier.new_payment_method === 1 ? (
                          <>
                            <div><span className="text-slate-400 block mb-0.5">N° Chèque</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_cheque_number || "-"}</span></div>
                            <div><span className="text-slate-400 block mb-0.5">Banque</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_banque_emettrice || "-"}</span></div>
                            <div><span className="text-slate-400 block mb-0.5">Préparé le</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_cheque_preparation_date ? new Date(dossier.new_cheque_preparation_date).toLocaleDateString('fr-FR') : "-"}</span></div>
                          </>
                        ) : (
                          <>
                            <div><span className="text-slate-400 block mb-0.5">Virement le</span><span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_date_virement ? new Date(dossier.new_date_virement).toLocaleDateString('fr-FR') : "-"}</span></div>
                            <div className="col-span-2"><span className="text-slate-400 block mb-0.5">RIB Dest.</span><span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">{dossier.new_compte_bancaire_dest || "-"}</span></div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Flow Timeline */}
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  {dossier.new_status === 20 && (
                    <div className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2 text-xs">
                      <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-red-700 dark:text-red-400">Dossier Hors Délai</h5>
                        <p className="text-red-650/80 dark:text-red-400/80 mt-0.5">Ce dossier a dépassé la règle de traitement. Nécessite une régularisation.</p>
                      </div>
                    </div>
                  )}

                  <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 py-1 space-y-6 text-xs">
                    {[
                      { id: 10, label: "Sauvegarder", desc: "Dossier en cours de saisie au Bureau d'Ordre." },
                      { id: 30, label: "Transit Prescripteur", desc: `Envoi du dossier à la direction.` },
                      { id: 40, label: "Chez Prescripteur", desc: "Examen et validation du service fait par le prescripteur." },
                      { id: 50, label: "Retour BO (Transit)", desc: "Le dossier validé retourne au Bureau d'Ordre." },
                      { id: 60, label: "Complet / Prêt DCF", desc: "Accusé réception par le BO et préparation du lot." },
                      { id: 70, label: "Transit DCF", desc: "Envoi à la Direction Contrôle de Flux (DCF)." },
                      { id: 80, label: "Chez DCF", desc: "Vérification de la conformité comptable et fiscale." },
                      { id: 90, label: "Retour Correction", desc: "Dossier retourné pour pièces manquantes ou anomalies." },
                      { id: 100, label: "Transit Trésorerie", desc: "Envoi à la Trésorerie pour règlement." },
                      { id: 110, label: "Chez Trésorerie", desc: "Préparation du règlement chèque/virement." },
                      { id: 120, label: "Prêt pour Remise", desc: "Règlement prêt au BO pour remise." },
                      { id: 130, label: "En Transport (Agence)", desc: "Chèque expédié en agence." },
                      { id: 140, label: "Disponible Agence", desc: "Chèque disponible pour retrait." },
                      { id: 150, label: "Payé / Clôturé", desc: "Remise effectuée et dossier clôturé." }
                    ].map((step) => {
                      const isCompleted = dossier.new_status > step.id || (dossier.new_status === 150 && step.id === 150);
                      const isCurrent = dossier.new_status === step.id;

                      // Skip corrections unless active
                      if (step.id === 90 && dossier.new_status !== 90) return null;

                      return (
                        <div key={step.id} className={`relative pl-6 ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'}`}>
                          <div className={`absolute -left-[17px] top-0.5 w-3.5 h-3.5 rounded-full ${isCurrent ? 'bg-primary ring-4 ring-primary/20 animate-pulse' : isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                            } border-2 border-white dark:border-[#0B0F19]`} />
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h5 className={`font-bold text-xs ${isCurrent ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {step.label}
                              </h5>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{step.desc}</p>
                            </div>
                            {isCurrent && (
                              <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0">ACTUEL</span>
                            )}
                            {isCompleted && !isCurrent && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Documents */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Documents Joints</h4>
                  {dossier.new_documents_complements && dossier.new_documents_complements.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {dossier.new_documents_complements.map(doc => (
                        <div
                          key={doc}
                          className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{doc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Aucune pièce jointe spécifiée.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={dossier ? dossier.new_folder_number : ""}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
        directionId={dossier ? dossier.new_department_id : undefined}
      />
    </div>
  );
}
