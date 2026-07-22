import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import TransmissionModal from "@/components/TransmissionModal";
import {
  ArrowLeft,
  Save,
  Send,
  UploadCloud,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";

export default function CreateDossier() {
  const navigate = useNavigate();
  const location = useLocation();
  const editDossier = location.state?.editDossier as Dossier | undefined;
  const isEditing = !!editDossier;

  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // States for Transmission Modal
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [transmissionTargetRole, setTransmissionTargetRole] = useState<"Prescripteur" | "DCF">("Prescripteur");
  const [transmissionInitialCollector, setTransmissionInitialCollector] = useState("");

  const [formData, setFormData] = useState({
    numero_dossier: editDossier
      ? editDossier.new_folder_number
      : `DOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date_reception: editDossier?.new_reception_date
      ? new Date(editDossier.new_reception_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    fournisseur: editDossier?.new_supplier_id || "",
    societe_gbm: editDossier?.new_company_id || "",
    direction: editDossier?.new_department_id || "",
    prescripteur: editDossier?.new_prescriber_id || "",
    type_document: editDossier?.new_document_type || 100, // Facture
    numero_facture: editDossier?.new_invoice_number || "",
    numero_bc: editDossier?.new_po_number || "",
    date_facture: editDossier?.new_invoice_date
      ? new Date(editDossier.new_invoice_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    description: editDossier?.new_description || "",
    documents_complements:
      editDossier?.new_documents_complements || ([] as string[]),
    dossier_lie: "",
    collecteur_dcf: editDossier?.new_dcf_collector_id || "",
    livreur_nom: editDossier?.new_livreur_nom || "",
    personne_a_livrer: editDossier?.new_personne_a_livrer || "",
    date_livraison: editDossier?.new_date_livraison
      ? new Date(editDossier.new_date_livraison).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!isEditing) {
       const prefix = formData.type_document === 600 ? "CR" : "DOS";
       if (!formData.numero_dossier.startsWith(prefix)) {
           setFormData(prev => ({
             ...prev,
             numero_dossier: `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
           }));
       }
    }
  }, [formData.type_document, isEditing, formData.numero_dossier]);

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const daysDiff = differenceInDays(
    parseISO(formData.date_reception),
    parseISO(formData.date_facture),
  );
  const isLate = formData.type_document === 100 && daysDiff > 5;

  const requiredDocsPerType: Record<number, string[]> = {
    100: [
      "Facture Originale",
      "Bon de Commande (BC)",
      "Bon de Livraison (BL) / Attestation de Service",
      "Attestation Fiscale",
    ],
    200: ["Avoir Original"],
    500: ["Demande d'acompte", "Facture / Devis"],
  };

  const validateForm = () => {
    const isFluxCourt = formData.type_document === 400 || formData.type_document === 500;
    const isAvoir = formData.type_document === 200;
    const isCourrier = formData.type_document === 600;

    if (!formData.numero_dossier) return "N° Dossier est obligatoire";
    if (!formData.date_reception) return "Date de réception est obligatoire";

    if (!isAvoir && !isCourrier) {
      if (!formData.fournisseur) return "Le fournisseur est obligatoire";
      if (!formData.societe_gbm) return "La société GBM est obligatoire";
      if (!formData.direction) return "La direction est obligatoire";
      if (!isFluxCourt && !formData.prescripteur) return "Le prescripteur est obligatoire";
      if (formData.type_document === 100 && !formData.numero_facture) return "Le numéro de facture est obligatoire";
      if (formData.type_document === 100 && !formData.date_facture) return "La date de facture est obligatoire";
    }

    if (isCourrier) {
      if (!formData.livreur_nom) return "Le nom du livreur est obligatoire";
      if (!formData.direction) return "La direction est obligatoire";
      if (!formData.personne_a_livrer) return "Le destinataire est obligatoire";
      if (!formData.description) return "L'objet/description du courrier est obligatoire";
    }

    if (isAvoir && !formData.dossier_lie) {
      return "Le dossier d'origine est obligatoire pour un Avoir";
    }

    if (isFluxCourt && !formData.collecteur_dcf) {
      return "Le collecteur DCF est obligatoire pour les flux courts";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();

    if (isDraft) {
      // Direct submit for drafts, no validation
      await executeSubmit(true, formData);
    } else {
      // Validate mandatory fields for submission
      const errorMsg = validateForm();
      if (errorMsg) {
        toast.error("Champs manquants", { description: errorMsg });
        return;
      }

      if (formData.type_document === 100 && isLate) {
        await executeSubmit(false, formData);
        return;
      }

      // Trigger the Transmission Modal (Skip if Courrier)
      const isCourrier = formData.type_document === 600;
      if (isCourrier) {
        await executeSubmit(false, formData);
        return;
      }

      const isFluxCourt = formData.type_document === 400 || formData.type_document === 500;
      setTransmissionTargetRole(isFluxCourt ? "DCF" : "Prescripteur");
      setTransmissionInitialCollector(isFluxCourt ? formData.collecteur_dcf : formData.prescripteur);
      setShowTransmissionModal(true);
    }
  };

  const handleConfirmTransmission = async (data: { collecteur: string; commentaire: string }) => {
    setShowTransmissionModal(false);
    
    // Update local form state with selected collector
    const isFluxCourt = formData.type_document === 400 || formData.type_document === 500;
    const updatedData = {
      ...formData,
      ...(isFluxCourt ? { collecteur_dcf: data.collecteur } : { prescripteur: data.collecteur }),
      description: data.commentaire 
        ? `${formData.description ? formData.description + " | " : ""}Transmission : ${data.commentaire}`
        : formData.description
    };
    
    setFormData(updatedData);
    await executeSubmit(false, updatedData);
  };

  const executeSubmit = async (isDraft: boolean, dataToSubmit: typeof formData) => {
    let statut = isDraft ? 10 : 30; // Brouillon ou En Transit Vers Prescripteur
    let isRejete = false;

    if (dataToSubmit.type_document === 100 && isLate) {
      statut = 20; // Hors Délai
      isRejete = true;
    }

    // Routage spécifique pour les flux courts ou le courrier
    const isCourrier = dataToSubmit.type_document === 600;
    
    if (!isDraft && isCourrier) {
      statut = 150; // Courrier direct à Livré (Clôturé)
    } else if (
      !isDraft &&
      !isRejete &&
      (dataToSubmit.type_document === 400 || dataToSubmit.type_document === 500)
    ) {
      statut = 70; // En Transit Vers DCF directement
    }

    setLoading(true);

    try {
      const payload = {
        new_folder_number: dataToSubmit.numero_dossier,
        new_supplier_id: isCourrier ? undefined : dataToSubmit.fournisseur,
        new_company_id: isCourrier ? undefined : dataToSubmit.societe_gbm,
        new_department_id: dataToSubmit.direction,
        new_prescriber_id: isCourrier ? undefined : dataToSubmit.prescripteur,
        new_document_type: Number(dataToSubmit.type_document),
        new_invoice_number: isCourrier ? undefined : dataToSubmit.numero_facture,
        new_po_number: isCourrier ? undefined : dataToSubmit.numero_bc,
        new_invoice_date: (isCourrier || !dataToSubmit.date_facture) ? undefined : new Date(dataToSubmit.date_facture).toISOString(),
        new_description: dataToSubmit.description,
        new_status: statut,
        new_is_blocked: isRejete,
        new_documents_complements: isCourrier ? undefined : dataToSubmit.documents_complements,
        new_dcf_collector_id: isCourrier ? undefined : dataToSubmit.collecteur_dcf,
        new_reception_date: new Date(dataToSubmit.date_reception).toISOString(),
        new_livreur_nom: isCourrier ? dataToSubmit.livreur_nom : undefined,
        new_personne_a_livrer: isCourrier ? dataToSubmit.personne_a_livrer : undefined,
        new_date_livraison: isCourrier ? new Date(dataToSubmit.date_livraison).toISOString() : undefined,
      };

      if (isEditing) {
        await dataService.updateDossier(editDossier.new_folderid, payload);
        setSuccessMessage(
          isDraft
            ? `Le brouillon ${dataToSubmit.numero_dossier} a été sauvegardé.`
            : (isLate && dataToSubmit.type_document === 100)
            ? `Le dossier ${dataToSubmit.numero_dossier} est hors délai et a été archivé.`
            : `Le dossier ${dataToSubmit.numero_dossier} a été transmis avec succès.`,
        );
      } else {
        await dataService.createDossier(payload);
        setSuccessMessage(
          isDraft
            ? `Le dossier ${dataToSubmit.numero_dossier} a été sauvegardé en tant que brouillon.`
            : (isLate && dataToSubmit.type_document === 100)
            ? `Le dossier ${dataToSubmit.numero_dossier} est hors délai et a été archivé.`
            : `Le dossier ${dataToSubmit.numero_dossier} a été créé et transmis avec succès.`,
        );
      }

      setSuccessModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Erreur système", {
        description: "Impossible de créer le dossier.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFluxCourt =
    formData.type_document === 400 || formData.type_document === 500;
  const isAvoir = formData.type_document === 200;
  const isCourrier = formData.type_document === 600;

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => navigate("/bo/dashboard")}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isEditing
            ? `Modifier le dossier ${formData.numero_dossier}`
            : "Créer un nouveau dossier"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isEditing
            ? "Modifiez les informations du brouillon."
            : "Remplissez les informations pour initialiser un nouveau dossier dans le circuit."}
        </p>
      </div>

      <form className="space-y-8" noValidate>
        {/* Section 1: Informations Générales */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Informations Générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                N° Dossier (Généré Auto) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                readOnly
                value={formData.numero_dossier}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Date de Réception (Aujourd'hui){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                readOnly
                value={formData.date_reception}
                onChange={(e) =>
                  setFormData({ ...formData, date_reception: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
            {!isAvoir && !isCourrier && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Fournisseur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={!isAvoir}
                    placeholder="Ex: GBM IT Services"
                    value={formData.fournisseur}
                    onChange={(e) =>
                      setFormData({ ...formData, fournisseur: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Société GBM <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.societe_gbm}
                    onChange={(e) =>
                      setFormData({ ...formData, societe_gbm: e.target.value })
                    }
                    required={!isAvoir}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="SBM">SBM</option>
                    <option value="SVCM">SVCM</option>
                    <option value="CDC">CDC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Direction
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) =>
                      setFormData({ ...formData, direction: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Direction Informatique">
                      Direction Informatique
                    </option>
                    <option value="Direction Ressources Humaines">
                      Direction Ressources Humaines
                    </option>
                    <option value="Direction Achats">Direction Achats</option>
                    <option value="Direction Juridique">
                      Direction Juridique
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Prescripteur / Demandeur{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.prescripteur}
                    onChange={(e) =>
                      setFormData({ ...formData, prescripteur: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="">Sélectionner un prescripteur...</option>
                    <option value="Amine Elboubakri">Amine Elboubakri</option>
                    <option value="Sarah Alaoui">Sarah Alaoui</option>
                    <option value="Nabil Bennani">Nabil Bennani</option>
                  </select>
                </div>
              </>
            )}
            {isCourrier && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nom du Livreur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ahmed Yassine"
                    value={formData.livreur_nom}
                    onChange={(e) =>
                      setFormData({ ...formData, livreur_nom: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Société Destinataire <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.societe_gbm}
                    onChange={(e) =>
                      setFormData({ ...formData, societe_gbm: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="SBM">SBM</option>
                    <option value="SVCM">SVCM</option>
                    <option value="CDC">CDC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Destinataire <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.prescripteur}
                    onChange={(e) =>
                      setFormData({ ...formData, prescripteur: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="">Sélectionner un destinataire...</option>
                    <option value="Amine Elboubakri">Amine Elboubakri</option>
                    <option value="Sarah Alaoui">Sarah Alaoui</option>
                    <option value="Nabil Bennani">Nabil Bennani</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date de Livraison <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    readOnly
                    value={formData.date_livraison}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Direction <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.direction}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, direction: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Direction Informatique">
                      Direction Informatique
                    </option>
                    <option value="Direction Ressources Humaines">
                      Direction Ressources Humaines
                    </option>
                    <option value="Direction Achats">Direction Achats</option>
                    <option value="Direction Juridique">
                      Direction Juridique
                    </option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Document Principal */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Document Principal
          </h2>

          <div className="mb-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">
              Type de Document
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                { id: 100, label: "Facture", color: "blue" },
                { id: 200, label: "Avoir", color: "orange" },
                { id: 500, label: "Acompte", color: "rose" },
                { id: 600, label: "Courrier", color: "slate" },
              ].map((type) => (
                <label
                  key={type.id}
                  className={`cursor-pointer flex items-center px-4 py-2.5 border rounded-xl transition-all ${
                    formData.type_document === type.id
                      ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20 ring-2 ring-${type.color}-200 dark:ring-${type.color}-900/40`
                      : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700`
                  }`}
                >
                  <input
                    type="radio"
                    name="type_doc"
                    className="sr-only"
                    checked={formData.type_document === type.id}
                    onChange={() =>
                      setFormData({ ...formData, type_document: type.id })
                    }
                  />
                  <span
                    className={`text-sm font-semibold ${formData.type_document === type.id ? `text-${type.color}-700 dark:text-${type.color}-400` : "text-slate-600 dark:text-slate-400"}`}
                  >
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {!isAvoir && !isCourrier && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    N° Facture / Pièce <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={!isAvoir}
                    placeholder="Ex: FAC-2026-089"
                    value={formData.numero_facture}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_facture: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    N° Bon de Commande (BC)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BC-2026-104"
                    value={formData.numero_bc}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_bc: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date du Document <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required={!isAvoir}
                    value={formData.date_facture}
                    onChange={(e) =>
                      setFormData({ ...formData, date_facture: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {(!isAvoir || isCourrier) && (
            <div className="mt-6 space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Description / Objet {isCourrier && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={2}
                placeholder="Précisions sur la nature de la dépense ou l'objet du courrier..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Section 5: Informations Spécifiques Conditionnelles */}
        {(isFluxCourt || isAvoir) && (
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-8 border border-amber-200 dark:border-amber-900/30 soft-shadow">
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-400 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Informations Spécifiques
              Requises
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAvoir && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                    Dossier d'origine (Lié){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-amber-500" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Rechercher par N° Dossier ou N° BC..."
                      value={formData.dossier_lie}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dossier_lie: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                    />
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Saisissez le N° de Dossier ou le Bon de Commande pour lier
                    cet Avoir.
                  </p>
                </div>
              )}
              {isFluxCourt && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                    Collecteur DCF (Comptabilité){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.collecteur_dcf}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collecteur_dcf: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                  >
                    <option value="">
                      Sélectionner la personne de la DCF...
                    </option>
                    <option value="Karim Idrissi">Karim Idrissi</option>
                    <option value="Nadia Tazi">Nadia Tazi</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Documents Requis */}
        {!isCourrier && (
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Documents Requis{" "}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
              (Spécifiques au type de document)
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requiredDocsPerType[formData.type_document]?.map((docLabel) => {
              const isUploaded = !!uploadedDocs[docLabel];
              return (
                <div
                  key={docLabel}
                  className={`border-2 ${isUploaded ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"} rounded-xl p-5 transition-colors relative group flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUploaded ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400"}`}
                      >
                        {isUploaded ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p
                          className={`font-semibold text-[15px] leading-tight mb-1 ${isUploaded ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}
                        >
                          {docLabel}
                        </p>
                        {isUploaded ? (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium truncate">
                            {uploadedDocs[docLabel]}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Formats acceptés : PDF, JPG (Max 5MB)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 mt-1">
                      {isUploaded ? (
                        <button
                          type="button"
                          onClick={() => {
                            const newDocs = { ...uploadedDocs };
                            delete newDocs[docLabel];
                            setUploadedDocs(newDocs);
                          }}
                          className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 rounded-lg p-2 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm transition-colors pointer-events-none whitespace-nowrap"
                          >
                            Parcourir...
                          </button>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setUploadedDocs({
                                  ...uploadedDocs,
                                  [docLabel]: e.target.files[0].name,
                                });
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Actions */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-end gap-4 sticky bottom-6 z-10">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Transmettre Dossier
          </button>
        </div>
      </form>
      {successModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle ${
                isLate && formData.type_document === 100 
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' 
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
              }`}>
                {isLate && formData.type_document === 100 ? (
                   <AlertCircle className="w-12 h-12" />
                ) : (
                   <CheckCircle className="w-12 h-12" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {isLate && formData.type_document === 100 ? "Dossier Hors Délai" : "Action Réussie"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {successMessage}
              </p>
              <button
                onClick={() => {
                  setSuccessModalOpen(false);
                  navigate("/bo/dossiers");
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={formData.numero_dossier}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
      />
    </div>
  );
}


