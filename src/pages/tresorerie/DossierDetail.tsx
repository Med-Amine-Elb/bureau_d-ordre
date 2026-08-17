import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier, AgenceLookup } from "@/lib/dataService";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Calendar,
  Wallet,
  User,
  Banknote,
  Lock,
  Unlock,
  ShieldAlert
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import TresoAccuseReceptionModal from "@/components/TresoAccuseReceptionModal";

export default function DossierDetailTresorerie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("infos");
  const [isAccuseModalOpen, setIsAccuseModalOpen] = useState(false);

  // Payment form states
  const [modePaiement, setModePaiement] = useState<number>(2); // 1 = Chèque, 2 = Virement
  const [numeroCheque, setNumeroCheque] = useState("");
  const [datePrepCheque, setDatePrepCheque] = useState(new Date().toISOString().split('T')[0]);
  const [banqueEmettrice, setBanqueEmettrice] = useState("");
  const [dateVirement, setDateVirement] = useState(new Date().toISOString().split('T')[0]);
  const [compteBancaireDest, setCompteBancaireDest] = useState("");
  const [commentaireTreso, setCommentaireTreso] = useState("");
  const [agences, setAgences] = useState<AgenceLookup[]>([]);
  const [selectedAgenceGuid, setSelectedAgenceGuid] = useState("");
  const [selectedAgenceName, setSelectedAgenceName] = useState("");

  // Blocage states
  const [isBlocageFormOpen, setIsBlocageFormOpen] = useState(false);
  const [sourceBlocage, setSourceBlocage] = useState("Fournisseur");
  const [motifBlocage, setMotifBlocage] = useState("");
  const [dateDeblocage, setDateDeblocage] = useState(new Date().toISOString().split('T')[0]);
  const [resolutionBlocage, setResolutionBlocage] = useState("");

  const fetchDossier = async () => {
    try {
      const result = await dataService.getDossiers();
      const found = result.find((d) => d.new_folderid === id);
      if (found) {
        setDossier(found);
        if (found.new_payment_method) setModePaiement(found.new_payment_method);
        if (found.new_cheque_number) setNumeroCheque(found.new_cheque_number);
        if (found.new_cheque_preparation_date) setDatePrepCheque(found.new_cheque_preparation_date.split('T')[0]);
        if (found.new_banque_emettrice) setBanqueEmettrice(found.new_banque_emettrice);
        if (found.new_date_virement) setDateVirement(found.new_date_virement.split('T')[0]);
        if (found.new_compte_bancaire_dest) setCompteBancaireDest(found.new_compte_bancaire_dest);
        if (found.new_commentaire_treso) setCommentaireTreso(found.new_commentaire_treso);
        if (found.new_motif_blocage) setMotifBlocage(found.new_motif_blocage);
        if (found.new_source_blocage) setSourceBlocage(found.new_source_blocage);
        if (found.new_destination_branch_guid) setSelectedAgenceGuid(found.new_destination_branch_guid);
        if (found.new_destination_branch_id) setSelectedAgenceName(found.new_destination_branch_id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: "Impossible de charger le dossier." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAgences = async () => {
      try {
        const list = await dataService.getAgencesLookup();
        setAgences(list.filter(a => a.new_is_active));
      } catch (err) {
        console.error("Erreur lors de la récupération des agences", err);
      }
    };
    loadAgences();
  }, []);

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
          onClick={() => navigate("/tresorerie/dossiers")}
          className="text-primary dark:text-blue-400 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const handleAccuse = () => {
    setIsAccuseModalOpen(true);
  };

  const handleConfirmAccuse = async (data: { commentaire: string; documentsRecons: string[] }) => {
    if (!dossier) return;
    try {
      setLoading(true);
      await dataService.updateDossier(dossier.new_folderid, {
        new_status: 110, // Chez Trésorerie
        new_accuse_par: (() => {
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
          return context ? context.userSettings.userName : "Utilisateur Trésorerie";
        })(),
        new_date_accuse: new Date().toISOString(),
        new_commentaire_reception: data.commentaire
      });
      toast.success("Réception accusée", {
        description: `Vous pouvez maintenant procéder au règlement.`,
      });
      fetchDossier();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    } finally {
      setLoading(false);
      setIsAccuseModalOpen(false);
    }
  };

  const handleConfirmerPreparation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;

    if (modePaiement === 1) {
      if (!selectedAgenceGuid) {
        toast.error("Erreur", { description: "Veuillez choisir une agence de destination pour le chèque." });
        return;
      }
      if (!numeroCheque || !datePrepCheque || !banqueEmettrice) {
        toast.error("Erreur", { description: "Veuillez remplir tous les champs du chèque." });
        return;
      }
    } else {
      if (!dateVirement || !compteBancaireDest) {
        toast.error("Erreur", { description: "Veuillez remplir la date de virement et le RIB." });
        return;
      }

      const ribCleaned = compteBancaireDest.replace(/\s+/g, '');
      if (ribCleaned.length !== 24 || !/^\d+$/.test(ribCleaned)) {
        toast.error("Erreur de validation", {
          description: "Le RIB d'une banque marocaine doit contenir exactement 24 chiffres."
        });
        return;
      }
    }

    try {
      setLoading(true);
      const isCheque = modePaiement === 1;
      const ribCleaned = compteBancaireDest.replace(/\s+/g, '');
      const payload: Partial<Dossier> = {
        new_status: isCheque ? 120 : 150, // 120 = En Attente Remise (BO), 150 = Payé (Direct Virement)
        new_payment_method: modePaiement,
        new_cheque_number: isCheque ? numeroCheque : undefined,
        new_cheque_preparation_date: isCheque ? datePrepCheque : undefined,
        new_banque_emettrice: isCheque ? banqueEmettrice : undefined,
        new_destination_branch_guid: isCheque ? selectedAgenceGuid : undefined,
        new_destination_branch_id: isCheque ? selectedAgenceName : undefined,
        new_date_virement: !isCheque ? dateVirement : undefined,
        new_compte_bancaire_dest: !isCheque ? ribCleaned : undefined,
        new_date_transmission_bo: isCheque ? new Date().toISOString().split('T')[0] : undefined,
        new_commentaire_treso: commentaireTreso,
        new_cheque_recu_bo: isCheque ? false : undefined
      };

      await dataService.updateDossier(dossier.new_folderid, payload);
      toast.success("Succès", {
        description: isCheque
          ? "Le chèque a été préparé et transmis au Bureau d'Ordre."
          : "Le virement a été enregistré et le dossier est clôturé."
      });
      fetchDossier();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'enregistrer le règlement." });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmerBlocage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    if (!motifBlocage) {
      toast.error("Erreur", { description: "Veuillez saisir le motif du blocage." });
      return;
    }

    try {
      setLoading(true);
      await dataService.updateDossier(dossier.new_folderid, {
        new_is_blocked: true,
        new_source_blocage: sourceBlocage,
        new_motif_blocage: motifBlocage
      });
      toast.success("Succès", { description: "Dossier marqué comme bloqué." });
      setIsBlocageFormOpen(false);
      fetchDossier();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de bloquer le dossier." });
    } finally {
      setLoading(false);
    }
  };

  const handleLeverBlocage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    if (!resolutionBlocage) {
      toast.error("Erreur", { description: "Veuillez renseigner les détails de la résolution." });
      return;
    }

    try {
      setLoading(true);
      await dataService.updateDossier(dossier.new_folderid, {
        new_is_blocked: false,
        new_date_deblocage: dateDeblocage,
        new_resolution_blocage: resolutionBlocage
      });
      toast.success("Succès", { description: "Le blocage a été levé." });
      fetchDossier();
    } catch (err) {
      toast.error("Erreur", { description: "Impossible de lever le blocage." });
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
    if (dossier.new_status === 100) return "En Transit (Tréso)";
    if (dossier.new_status === 110) return "Chez Trésorerie";
    if (dossier.new_status === 120) return "En Attente Remise";
    if (dossier.new_status === 150) return "Payé / Clôturé";
    return `Statut ${dossier.new_status}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">

      {/* Back button */}
      <button
        onClick={() => navigate("/tresorerie/dossiers")}
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${dossier.new_status === 110 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                dossier.new_status === 120 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  dossier.new_status === 100 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
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
          <div className="flex items-center gap-2">
            {dossier.new_status === 100 && (
              <button
                onClick={handleAccuse}
                className="bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Accuser Réception
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: "infos", label: "Informations", icon: FileText },
          { id: "paiement", label: "Préparation Règlement", icon: Wallet },
          { id: "blocage", label: "Gestion Blocage", icon: Lock },
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
                Détails du Dossier
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
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Société Destinataire</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_company_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Destinataire (Prescripteur)</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_prescriber_id || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date de livraison</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {dossier.new_date_livraison ? format(parseISO(dossier.new_date_livraison), "dd MMM yyyy", { locale: fr }) : "-"}
                      </div>
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
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Numéro de Facture</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_invoice_number || "-"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date de Réception</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {format(parseISO(dossier.new_reception_date), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date de Facture</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {dossier.new_invoice_date ? format(parseISO(dossier.new_invoice_date), "dd MMM yyyy", { locale: fr }) : "-"}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">N° Bon de Commande (BC)</label>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dossier.new_po_number || "-"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "paiement" && (
            <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Wallet className="w-5 h-5 text-blue-500" />
                Préparation du Règlement
              </h3>

              {dossier.new_status === 100 ? (
                <div className="p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-xl flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-orange-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-orange-800 dark:text-orange-400">En attente d'accusé de réception</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">Vous devez accuser réception de ce dossier physiquement avant de pouvoir préparer le règlement.</p>
                  </div>
                </div>
              ) : dossier.new_status >= 120 ? (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Règlement déjà préparé</h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                        Les informations de paiement ont été saisies et le dossier a été transmis au Bureau d'Ordre pour remise finale.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Mode de règlement</label>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {dossier.new_payment_method === 1 ? "Chèque" : "Virement"}
                      </span>
                    </div>

                    {dossier.new_payment_method === 1 ? (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Numéro Chèque</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_cheque_number || "-"}</span>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date de Préparation</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {dossier.new_cheque_preparation_date ? format(parseISO(dossier.new_cheque_preparation_date), "dd MMMM yyyy", { locale: fr }) : "-"}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Banque Émettrice</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_banque_emettrice || "-"}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date du Virement</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {dossier.new_date_virement ? format(parseISO(dossier.new_date_virement), "dd MMMM yyyy", { locale: fr }) : "-"}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">RIB du Bénéficiaire</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_compte_bancaire_dest || "-"}</span>
                        </div>
                      </>
                    )}

                    {dossier.new_payment_method === 1 && (
                      <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date Transmission BO</label>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {dossier.new_date_transmission_bo ? format(parseISO(dossier.new_date_transmission_bo), "dd MMMM yyyy", { locale: fr }) : "-"}
                        </span>
                      </div>
                    )}

                    <div className="md:col-span-2 mt-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Commentaire de la Trésorerie</label>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0F172B] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {dossier.new_commentaire_treso || "Aucun commentaire."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmerPreparation} className="space-y-6 animate-in fade-in">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mode de Règlement</span>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modePaiement"
                          className="text-[#1F3B73] focus:ring-[#1F3B73]"
                          checked={modePaiement === 2}
                          onChange={() => setModePaiement(2)}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Virement</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modePaiement"
                          className="text-[#1F3B73] focus:ring-[#1F3B73]"
                          checked={modePaiement === 1}
                          onChange={() => setModePaiement(1)}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Chèque</span>
                      </label>
                    </div>
                  </div>

                  {modePaiement === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Agence de Destination du Chèque</label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={selectedAgenceGuid}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedAgenceGuid(val);
                            const foundAg = agences.find(a => a.new_branchid === val);
                            setSelectedAgenceName(foundAg ? foundAg.new_name : "");
                          }}
                        >
                          <option value="">-- Choisir l'agence de destination --</option>
                          {agences.map((ag) => (
                            <option key={ag.new_branchid} value={ag.new_branchid}>
                              {ag.new_name} ({ag.new_city})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedAgenceGuid ? (
                        <>
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Numéro de Chèque</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={numeroCheque}
                              onChange={(e) => setNumeroCheque(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date de Préparation</label>
                            <input
                              type="date"
                              required
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={datePrepCheque}
                              onChange={(e) => setDatePrepCheque(e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Banque Émettrice</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Attijariwafa Bank, BCP..."
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={banqueEmettrice}
                              onChange={(e) => setBanqueEmettrice(e.target.value)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-2 text-center py-4 text-xs font-medium text-slate-400 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                          Veuillez choisir une agence pour émettre le chèque et afficher la suite du formulaire.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date du Virement</label>
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={dateVirement}
                          onChange={(e) => setDateVirement(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RIB du Bénéficiaire (24 chiffres)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 011123456789012345678901"
                          maxLength={35}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                          value={compteBancaireDest}
                          onChange={(e) => setCompteBancaireDest(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {modePaiement === 1 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Date Transmission BO (Automatique)</label>
                      <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-semibold">
                        {new Date().toLocaleDateString('fr-FR')} (Aujourd'hui)
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Commentaires additionnels</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={commentaireTreso}
                      onChange={(e) => setCommentaireTreso(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={modePaiement === 1 && !selectedAgenceGuid}
                    className={`w-full py-3 font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 ${(modePaiement === 1 && !selectedAgenceGuid)
                        ? "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : "bg-[#1F3B73] hover:bg-[#16294F] text-white"
                      }`}
                  >
                    <CheckCircle2 className="w-5 h-5" /> Enregistrer et transmettre au BO
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === "blocage" && (
            <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Gestion des Blocages
              </h3>

              {dossier.new_is_blocked ? (
                <div className="space-y-6">
                  <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-4">
                    <Lock className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-800 dark:text-red-400">Ce dossier est actuellement BLOQUÉ</h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        Toutes les opérations de règlement sont gelées.
                      </p>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <div>Source du Blocage : <span className="text-slate-800 dark:text-slate-200">{dossier.new_source_blocage || "Non défini"}</span></div>
                        <div>Date du Blocage : <span className="text-slate-800 dark:text-slate-200">En cours</span></div>
                      </div>
                      <div className="mt-3 p-3 bg-white dark:bg-[#0F172B] rounded-lg border border-red-100 dark:border-red-950/50">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Motif du Blocage</label>
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{dossier.new_motif_blocage || "Aucun motif spécifié."}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleLeverBlocage} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Lever le Blocage</h4>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Date de Résolution</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={dateDeblocage}
                        onChange={(e) => setDateDeblocage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Détails de la Résolution (Motif du déblocage)</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Qu'est-ce qui a résolu le blocage ?"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={resolutionBlocage}
                        onChange={(e) => setResolutionBlocage(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                    >
                      <Unlock className="w-4 h-4" /> Confirmer la levée du blocage
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-start gap-4">
                    <Unlock className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-400 font-bold">Dossier Actif</h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                        Aucun blocage n'est signalé sur ce dossier actuellement.
                      </p>
                    </div>
                  </div>

                  {dossier.new_resolution_blocage && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                      <span className="font-bold block uppercase mb-1">Dernière Résolution</span>
                      <p className="italic text-slate-700 dark:text-slate-300">{dossier.new_resolution_blocage}</p>
                    </div>
                  )}

                  {!isBlocageFormOpen ? (
                    <button
                      onClick={() => setIsBlocageFormOpen(true)}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Lock className="w-4 h-4" /> Signaler un blocage sur ce dossier
                    </button>
                  ) : (
                    <form onSubmit={handleConfirmerBlocage} className="space-y-4 p-5 border border-red-100 dark:border-red-950/30 rounded-xl bg-red-50/20 dark:bg-red-950/10 animate-in slide-in-from-top-2">
                      <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Déclarer un blocage</h4>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Source du Blocage</label>
                        <select
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none"
                          value={sourceBlocage}
                          onChange={(e) => setSourceBlocage(e.target.value)}
                        >
                          <option value="Fournisseur">Fournisseur (RIB erroné, etc.)</option>
                          <option value="Document">Document (Pièce manquante, etc.)</option>
                          <option value="Système">Système (Problème ERP, etc.)</option>
                          <option value="Autre">Autre motif</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Motif du Blocage</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Décrivez précisément la cause du blocage..."
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10"
                          value={motifBlocage}
                          onChange={(e) => setMotifBlocage(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
                        >
                          Bloquer le Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsBlocageFormOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg transition-colors text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Pièces Jointes
              </h3>

              {dossier.new_documents_complements && dossier.new_documents_complements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dossier.new_documents_complements.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{doc}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Document PDF</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Aucun document attaché.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historique Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Historique
            </h3>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-white border-2 border-slate-300 rounded-full -left-[7px] top-1.5"></div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Création (BO)</p>
                <p className="text-xs text-slate-500 mt-1">{format(parseISO(dossier.new_reception_date), "dd MMM yyyy", { locale: fr })}</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-white border-2 border-slate-300 rounded-full -left-[7px] top-1.5"></div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Validation Prescripteur</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-white border-2 border-slate-300 rounded-full -left-[7px] top-1.5"></div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Comptabilisation DCF</p>
              </div>
              <div className="relative pl-6">
                <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 border-2 bg-white ${dossier.new_status >= 100 ? 'border-blue-500' : 'border-slate-300'}`}></div>
                <p className={`text-sm font-bold ${dossier.new_status >= 100 ? 'text-primary dark:text-blue-400' : 'text-slate-500'}`}>Transmission Trésorerie</p>
              </div>
              <div className="relative pl-6">
                <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 border-2 bg-white ${dossier.new_status >= 120 ? 'border-blue-500' : dossier.new_status >= 150 ? 'border-emerald-500' : 'border-slate-300'}`}></div>
                <p className={`text-sm font-bold ${dossier.new_status >= 120 ? 'text-primary dark:text-blue-400' : 'text-slate-500'}`}>Règlement Préparé</p>
              </div>
              <div className="relative pl-6">
                <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 border-2 bg-white ${dossier.new_status >= 150 ? 'border-emerald-500' : 'border-slate-300'}`}></div>
                <p className={`text-sm font-bold ${dossier.new_status >= 150 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Remise Chèque (Clôture)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Accusé Réception Modal */}
      <TresoAccuseReceptionModal
        isOpen={isAccuseModalOpen}
        dossier={dossier}
        onClose={() => setIsAccuseModalOpen(false)}
        onConfirm={handleConfirmAccuse}
      />
    </div>
  );
}


