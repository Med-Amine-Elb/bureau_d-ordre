import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import TransmissionModal from "@/components/TransmissionModal";
import DossierInformationPanel from "@/components/DossierInformationPanel";
import { ArrowLeft, Clock, FileText, Share2, AlertOctagon, PhoneCall, Link as LinkIcon, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DossierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("infos");

  // States for Transmission Modal
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [transmissionTargetRole, setTransmissionTargetRole] = useState<"Prescripteur" | "DCF">("Prescripteur");
  const [transmissionInitialCollector, setTransmissionInitialCollector] = useState("");

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const result = await dataService.getDossiers();
        const found = result.find(d => d.new_folderid === id);
        if (found) setDossier(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Chargement du dossier...</div>;
  if (!dossier) return <div className="p-12 text-center text-red-500">Dossier introuvable.</div>;

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 10: return { label: "Chez BO — à traiter", color: "slate" };
      case 20: return { label: "Hors délai", color: "red" };
      case 30: return { label: "En transit (prescr.)", color: "blue" };
      case 40: return { label: "Chez prescripteur", color: "indigo" };
      case 50: return { label: "En transit (BO)", color: "blue" };
      case 60: return { label: "Prêt DCF", color: "emerald" };
      case 70: return { label: "En transit (DCF)", color: "blue" };
      case 80: return { label: "Chez DCF", color: "purple" };
      case 90: return { label: "Retour correction", color: "orange" };
      case 100: return { label: "En transit (tréso.)", color: "blue" };
      case 110: return { label: "Chez Trésorerie", color: "indigo" };
      case 120: return { label: "Attente Remise", color: "emerald" };
      case 130: return { label: "En Transport", color: "orange" };
      case 140: return { label: "Disponible agence", color: "emerald" };
      case 150: return { label: dossier?.new_document_type === 600 ? "Livré (Clôturé)" : "Payé", color: "emerald" };
      default: return { label: `Statut ${status}`, color: "slate" };
    }
  };

  const statusInfo = getStatusDisplay(dossier.new_status);

  const handleTransmit = () => {
    const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
    const isReturningFromPrescripteur = dossier.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;

    setTransmissionTargetRole(isToDCF ? "DCF" : "Prescripteur");
    setTransmissionInitialCollector(isToDCF ? (dossier.new_dcf_collector_guid || "") : (dossier.new_prescriber_guid || ""));
    setShowTransmissionModal(true);
  };

  const handleConfirmTransmission = async (data: { collecteur: string; commentaire: string }) => {
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

      await dataService.transmitDossier({
        folderId: dossier.new_folderid,
        folderNumber: dossier.new_folder_number,
        dossierChanges: payload,
        fromRole: "BO",
        toRole: isToDCF ? "DCF" : "Prescripteur",
        collectorId: data.collecteur,
        sendingComment: data.commentaire,
      });
      toast.success("Dossier transmis avec succès.");

      // Update local state
      setDossier({
        ...dossier,
        ...payload
      });
    } catch (error) {
      toast.error("Erreur de transmission", { description: error instanceof Error ? error.message : "Le dossier n’a pas pu être transmis." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverCourier = async () => {
    setLoading(true);
    try {
      await dataService.completeCourierDelivery(dossier.new_folderid);
      const deliveredAt = new Date().toISOString();
      setDossier({ ...dossier, new_status: 150, new_final_delivery_date: deliveredAt });
      toast.success("Courrier marqué livré et dossier clôturé.");
    } catch (error) {
      toast.error("Impossible de clôturer le courrier.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">

      {/* Back button */}
      <button
        onClick={() => navigate("/bo/dossiers")}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </button>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow mb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{dossier.new_folder_number}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/30 text-${statusInfo.color}-700 dark:text-${statusInfo.color}-400`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Créé le {new Date(dossier.new_reception_date).toLocaleDateString('fr-FR')} par <span className="font-semibold text-slate-700 dark:text-slate-300">Bureau d'Ordre</span>
          </p>
        </div>

        {/* Quick Actions based on status */}
        <div className="flex flex-wrap gap-3">
          {/* Action: Accuser Réception (Traceability) - Visible uniquement si le dossier est en Transit BO (Statut 50) */}
          {dossier.new_status === 50 && (
            <button
              onClick={async () => {
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
                  toast.success("Réception accusée", {
                    description: `Le dossier est maintenant marqué comme reçu par le Bureau d'Ordre.`
                  });
                  // Refresh data
                  const updated = await dataService.getDossiers();
                  const found = updated.find(d => d.new_folderid === dossier.new_folderid);
                  if (found) setDossier(found);
                } catch (e: any) {
                  console.error("DEBUG ACCUSE ERROR:", e);
                  toast.error("Erreur", {
                    description: e.message || "Impossible d'accuser la réception."
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Accuser réception
            </button>
          )}

          {(dossier.new_status === 10 || dossier.new_status === 60) && (
            <button onClick={dossier.new_document_type === 600 ? handleDeliverCourier : handleTransmit} disabled={loading} className="bg-primary hover:bg-primary-hover text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2 disabled:opacity-60">
              {dossier.new_document_type === 600 ? <><CheckCircle2 className="w-4 h-4" /> Marquer livré</> : <><Send className="w-4 h-4" /> {dossier.new_document_type === 400 || dossier.new_document_type === 500 || dossier.new_status === 60 ? "Transmettre à la DCF" : "Transmettre à Prescripteur"}</>}
            </button>
          )}
          <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Partager
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: "infos", label: "Informations Générales", icon: FileText },
          { id: "details", label: "Détails complets", icon: FileText },
          { id: "timeline", label: "Flux de Traitement", icon: Clock },
          { id: "blocages", label: "Blocages", icon: AlertOctagon },
          { id: "relances", label: "Relances", icon: PhoneCall },
          { id: "documents", label: "Documents", icon: LinkIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                ? "border-blue-600 text-primary bg-blue-50/50 dark:bg-blue-900/20"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow min-h-[400px]">
        {activeTab === "infos" && (
          <div className="p-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">Informations détaillées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              {dossier.new_document_type === 600 ? (
                <>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Livreur</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_livreur_nom || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Société destinataire</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_company_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Destinataire (Prescripteur)</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_prescriber_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Direction</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_department_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Date de livraison</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_date_livraison ? new Date(dossier.new_date_livraison).toLocaleDateString('fr-FR') : 'N/A'}</p></div>
                  <div className="col-span-1 md:col-span-2"><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Description / Objet</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_description || 'N/A'}</p></div>
                </>
              ) : (
                <>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fournisseur</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_supplier_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Société GBM</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_company_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Direction</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_department_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Prescripteur</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_prescriber_id || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Date de la facture</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_invoice_date ? new Date(dossier.new_invoice_date).toLocaleDateString('fr-FR') : 'N/A'}</p></div>
                  <div className="col-span-1 md:col-span-2"><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Description</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_description || 'N/A'}</p></div>
                </>
              )}
            </div>

            {dossier.new_payment_method && (
              <>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 mt-10 border-b border-slate-100 dark:border-slate-800 pb-2">Informations de règlement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Mode de règlement</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-200">
                      {dossier.new_payment_method === 1 ? "Chèque" : dossier.new_payment_method === 2 ? "Virement" : "Non défini"}
                    </p>
                  </div>
                  {dossier.new_payment_method === 1 ? (
                    <>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Numéro du chèque</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_cheque_number || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Banque émettrice</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_banque_emettrice || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Date de préparation</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">
                          {dossier.new_cheque_preparation_date ? new Date(dossier.new_cheque_preparation_date).toLocaleDateString('fr-FR') : "N/A"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Date du virement</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">
                          {dossier.new_date_virement ? new Date(dossier.new_date_virement).toLocaleDateString('fr-FR') : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">RIB du bénéficiaire</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_compte_bancaire_dest || "N/A"}</p>
                      </div>
                    </>
                  )}
                  {dossier.new_commentaire_treso && (
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Commentaire de la trésorerie</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_commentaire_treso}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 mt-10 border-b border-slate-100 dark:border-slate-800 pb-2">Pièces jointes validées</h3>
            <div className="flex flex-wrap gap-3">
              {dossier.new_documents_complements && dossier.new_documents_complements.length > 0 ? (
                dossier.new_documents_complements.map(doc => (
                  <span key={doc} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {doc}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 dark:text-slate-400 text-sm">Aucun document complémentaire sélectionné.</span>
              )}
            </div>
          </div>
        )}

        {activeTab === "details" && <div className="p-5 md:p-8"><DossierInformationPanel dossier={dossier} /></div>}

        {activeTab === "timeline" && (
          <div className="p-8">
            {dossier.new_status === 20 && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Dossier hors délai</h4>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">Ce dossier a dépassé le délai de 5 jours entre la date de la facture et sa réception. Il est classé hors délai et nécessite une dérogation ou une action d’un administrateur.</p>
                </div>
              </div>
            )}
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 py-2 space-y-10">

              {[
                { id: 10, label: "Chez BO — à traiter", desc: "Dossier enregistré au Bureau d'Ordre, en attente de transmission manuelle.", icon: "edit" },
                { id: 30, label: "Transit Prescripteur", desc: `Envoi du dossier physique/numérique à la direction ${dossier.new_department_id || ''}.`, icon: "send" },
                { id: 40, label: "Chez prescripteur", desc: dossier.new_prescriber_id ? `Le dossier est chez ${dossier.new_prescriber_id} pour validation.` : "Le prescripteur examine et valide le service fait.", icon: "user" },
                { id: 50, label: "Retour BO (Transit)", desc: "Le dossier validé retourne au Bureau d'Ordre.", icon: "undo" },
                { id: 60, label: "Complet / Prêt DCF", desc: "BO accuse réception et prépare le lot pour la DCF.", icon: "package" },
                { id: 70, label: "Transit DCF", desc: "Envoi du dossier à la Direction Contrôle de Flux (DCF).", icon: "send" },
                { id: 80, label: "Chez DCF", desc: dossier.new_dcf_collector_id ? `Le dossier est entre les mains de ${dossier.new_dcf_collector_id} (DCF).` : "Vérification de la conformité comptable et fiscale.", icon: "shield" },
                { id: 90, label: "Retour correction", desc: "Besoin de corrections ou pièces manquantes.", icon: "alert" },
                { id: 100, label: "Transit Trésorerie", desc: "Dossier conforme envoyé à la Trésorerie pour règlement.", icon: "send" },
                { id: 110, label: "Chez Trésorerie", desc: "La Trésorerie prépare le règlement (Chèque/Virement).", icon: "bank" },
                { id: 120, label: "Prêt pour remise", desc: "Chèque prêt au BO pour remise au fournisseur.", icon: "credit" },
                { id: 130, label: "En Transport (Agence)", desc: dossier.new_destination_branch_id ? `Chèque expédié vers l'agence ${dossier.new_destination_branch_id}.` : "Chèque en cours d'expédition vers l'agence.", icon: "truck" },
                { id: 140, label: "Disponible agence", desc: dossier.new_destination_branch_id ? `Le chèque est arrivé à l'agence ${dossier.new_destination_branch_id} pour retrait.` : "Le chèque est arrivé en agence pour retrait.", icon: "map" },
                { id: 150, label: "Payé / clôturé", desc: "Remise effectuée et dossier clôturé définitivement.", icon: "check" }
              ].map((step, index) => {
                // Logic for visibility and state
                const isCompleted = dossier.new_status > step.id || (dossier.new_status === 150 && step.id === 150);

                // Handle Retour Correction separately if it's not the current status
                if (step.id === 90 && dossier.new_status !== 90) return null;

                const actuallyCurrent = (dossier.new_status === step.id);
                const isFuture = dossier.new_status < step.id;

                if (isFuture && !actuallyCurrent) {
                  return (
                    <div key={step.id} className="relative pl-8 opacity-40">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 ring-4 ring-white dark:ring-[#0F172B]"></div>
                      <h4 className="font-bold text-slate-400 dark:text-slate-500 text-sm">{step.label}</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  );
                }

                return (
                  <div key={step.id} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${actuallyCurrent ? 'bg-blue-500 animate-pulse ring-blue-100 dark:ring-blue-900/30' : 'bg-emerald-500'} ring-4 ring-white dark:ring-[#0F172B]`}></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Étape {index + 1}</p>
                        <h4 className={`font-bold text-sm ${actuallyCurrent ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{step.label}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-md">{step.desc}</p>
                      </div>
                      {actuallyCurrent && (
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full">ACTUEL</span>
                      )}
                      {!actuallyCurrent && isCompleted && (
                        <div className="text-right">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                          {dossier.new_accuse_par && step.id === 60 && (
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1">Accusé par {dossier.new_accuse_par}</p>
                          )}
                          {dossier.new_date_accuse && step.id === 60 && (
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">{new Date(dossier.new_date_accuse).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {(activeTab === "blocages" || activeTab === "relances" || activeTab === "documents") && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aucune donnée</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Il n'y a pas encore d'historique pour cet onglet. Le dossier est en cours de traitement.</p>
          </div>
        )}
      </div>

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={dossier.new_folder_number}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
        directionId={dossier.new_department_guid}
      />
    </div>
  )
}


