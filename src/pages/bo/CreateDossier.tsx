import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier, FournisseurLookup, CompanyLookup, DepartmentLookup, SystemUser } from "@/lib/dataService";
import { loadDossierLookups } from "@/lib/dossierLookups";
import { DOCUMENT_UPLOADS_ENABLED } from "@/lib/features";
import {
  ArrowLeft,
  Save,
  UploadCloud,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";
import { filterDossiers } from "@/lib/normalization";
import { isInvoiceReceiptOverdue } from "@/lib/invoiceReceiptDeadline";
import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";

export default function CreateDossier() {
  const navigate = useNavigate();
  const location = useLocation();
  const editDossier = location.state?.editDossier as Dossier | undefined;
  const isEditing = !!editDossier;

  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [suppliers, setSuppliers] = useState<FournisseurLookup[]>([]);
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [lookupErrors, setLookupErrors] = useState<string[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupReload, setLookupReload] = useState(0);
  const [allDossiers, setAllDossiers] = useState<Dossier[]>([]);
  const [invoiceReceiptLimitDays, setInvoiceReceiptLimitDays] = useState(5);
  const [dossierLieInput, setDossierLieInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dataService.getSystemConfig()
      .then((config) => {
        if (!cancelled) setInvoiceReceiptLimitDays(config.new_invoicereceiptlimitdays);
      })
      .catch((error) => console.warn("Could not load the invoice reception threshold; using 5 days.", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLookups = async () => {
      setLookupsLoading(true);
      try {
        const result = await loadDossierLookups();
        if (cancelled) return;
        setSuppliers(result.suppliers);
        setCompanies(result.companies);
        setDepartments(result.departments);
        setUsers(result.users);
        setAllDossiers(result.dossiers);
        setLookupErrors(result.errors);
      } catch {
        if (!cancelled) setLookupErrors(["listes de référence"]);
      } finally {
        if (!cancelled) setLookupsLoading(false);
      }
    };
    void loadLookups();
    return () => { cancelled = true; };
  }, [lookupReload]);

  useEffect(() => {
    if (editDossier && allDossiers.length > 0) {
      const found = allDossiers.find(d => d.new_folderid === editDossier.new_linked_folder_id);
      if (found) {
        setDossierLieInput(`${found.new_folder_number} ${found.new_po_number ? '(BC: ' + found.new_po_number + ')' : ''}`);
      } else if (editDossier.new_linked_folder_id) {
        setDossierLieInput(editDossier.new_linked_folder_id);
      }
    }
  }, [editDossier, allDossiers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".linked-folder-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    numero_dossier: editDossier
      ? editDossier.new_folder_number
      : `DOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date_reception: editDossier?.new_reception_date
      ? new Date(editDossier.new_reception_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    fournisseur: editDossier?.new_supplier_guid || editDossier?.new_supplier_id || "",
    societe_gbm: editDossier?.new_company_guid || editDossier?.new_company_id || "",
    direction: editDossier?.new_department_guid || editDossier?.new_department_id || "",
    prescripteur: editDossier?.new_prescriber_guid || editDossier?.new_prescriber_id || "",
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
    collecteur_dcf: editDossier?.new_dcf_collector_guid || editDossier?.new_dcf_collector_id || "",
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

  const [isDuplicateInvoice, setIsDuplicateInvoice] = useState(false);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (Number(formData.type_document) === 100 && formData.fournisseur && formData.numero_facture) {
        try {
          const isDup = await dataService.checkDuplicateInvoice(
            formData.fournisseur,
            formData.numero_facture,
            editDossier?.new_folderid
          );
          setIsDuplicateInvoice(isDup);
        } catch (e) {
          console.error("Failed to check duplicate invoice", e);
        }
      } else {
        setIsDuplicateInvoice(false);
      }
    };

    const timer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timer);
  }, [formData.fournisseur, formData.numero_facture, formData.type_document, editDossier]);

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const daysDiff = differenceInDays(
    parseISO(formData.date_reception),
    parseISO(formData.date_facture),
  );
  const isLate = formData.type_document === 100 && isInvoiceReceiptOverdue(formData.date_facture, formData.date_reception, invoiceReceiptLimitDays);

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
      if (formData.numero_facture && !/^\d+$/.test(formData.numero_facture)) return "Le numéro de facture doit contenir uniquement des chiffres";
      if (formData.numero_bc && !/^\d+$/.test(formData.numero_bc)) return "Le numéro de BC doit contenir uniquement des chiffres";
      if (formData.type_document === 100 && isDuplicateInvoice) return "Ce numéro de facture existe déjà pour ce fournisseur";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      toast.error("Champs manquants", { description: errorMsg });
      return;
    }

    await executeSubmit(formData);
  };

  const executeSubmit = async (dataToSubmit: typeof formData) => {
    let statut = 10; // Première étape : dossier enregistré au Bureau d'Ordre
    let isRejete = false;

    const diff = differenceInDays(
      parseISO(dataToSubmit.date_reception),
      parseISO(dataToSubmit.date_facture)
    );
    const dossierIsLate = Number(dataToSubmit.type_document) === 100 && isInvoiceReceiptOverdue(dataToSubmit.date_facture, dataToSubmit.date_reception, invoiceReceiptLimitDays);
    
    console.log("DEBUG LATE CHECK:", {
      type_doc: dataToSubmit.type_document,
      date_reception: dataToSubmit.date_reception,
      date_facture: dataToSubmit.date_facture,
      days_diff: diff,
      is_late_calculated: dossierIsLate,
    });

    if (Number(dataToSubmit.type_document) === 100 && dossierIsLate) {
      statut = 20; // Hors Délai
      isRejete = true;
    }

    const isCourrier = dataToSubmit.type_document === 600;

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
        new_linked_folder_id: isAvoir ? dataToSubmit.dossier_lie : undefined,
      };

      if (isEditing) {
        await dataService.updateDossier(editDossier.new_folderid, payload);
        setSuccessMessage(
          (isLate && dataToSubmit.type_document === 100)
            ? `Le dossier ${dataToSubmit.numero_dossier} est hors délai.`
            : "Dossier sauvegardé.",
        );
      } else {
        await dataService.createDossier(payload);
        setSuccessMessage(
          (isLate && dataToSubmit.type_document === 100)
            ? `Le dossier ${dataToSubmit.numero_dossier} est hors délai.`
            : "Dossier sauvegardé.",
        );
      }

      setSuccessModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Erreur système", {
        description: `Le dossier a peut-être été enregistré, mais la transmission a échoué. Vérifiez le dossier avant de réessayer. ${error instanceof Error ? error.message : ""}`.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDossiers = () => {
    return filterDossiers(allDossiers, dossierLieInput);
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
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" disabled={lookupsLoading} onClick={() => setLookupReload(current => current + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50">
          {lookupsLoading ? "Chargement des listes…" : "Actualiser les listes"}
        </button>
        {lookupErrors.length > 0 && <p role="alert" className="text-sm text-red-600 dark:text-red-400">Impossible de charger : {lookupErrors.join(", ")}. Vérifiez votre connexion et vos droits, puis actualisez les listes.</p>}
      </div>

      <form className="space-y-8" noValidate>
        {/* Section 1: Informations Générales */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Informations générales
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
                  <select
                    value={formData.fournisseur}
                    onChange={(e) =>
                      setFormData({ ...formData, fournisseur: e.target.value })
                    }
                    required={!isAvoir}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="" disabled>Sélectionner un fournisseur...</option>
                    {suppliers.filter(s => s.new_is_active || s.new_supplierid === formData.fournisseur).map(s => (
                      <option key={s.new_supplierid} value={s.new_supplierid}>{s.new_name}</option>
                    ))}
                  </select>
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
                    <option value="" disabled>Sélectionner une société...</option>
                    {companies.filter(c => c.new_is_active || c.new_companyid === formData.societe_gbm).map(c => (
                      <option key={c.new_companyid} value={c.new_companyid}>{c.new_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Direction
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        direction: e.target.value,
                        prescripteur: "",
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="" disabled>Sélectionner une direction...</option>
                    {departments.filter(d => d.new_is_active || d.new_departmentid === formData.direction).map(d => (
                      <option key={d.new_departmentid} value={d.new_departmentid}>{d.new_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Prescripteur / Demandeur{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.prescripteur}
                    disabled={!formData.direction}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, prescripteur: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {formData.direction ? "Sélectionner un prescripteur..." : "Sélectionnez d’abord une direction"}
                    </option>
                    {users.filter(u =>
                      u.new_department_id?.toLowerCase() === formData.direction.toLowerCase()
                    ).map(u => (
                      <option key={u.systemuserid} value={u.systemuserid}>{u.fullname}</option>
                    ))}
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
                    <option value="" disabled>Sélectionner une société...</option>
                    {companies.filter(c => c.new_is_active || c.new_companyid === formData.societe_gbm).map(c => (
                      <option key={c.new_companyid} value={c.new_companyid}>{c.new_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Destinataire <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.personne_a_livrer}
                    onChange={(e) =>
                      setFormData({ ...formData, personne_a_livrer: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  >
                    <option value="" disabled>Sélectionner un destinataire...</option>
                    {users.filter(u => !formData.direction || u.new_department_id === formData.direction).map(u => (
                      <option key={u.systemuserid} value={u.systemuserid}>{u.fullname}</option>
                    ))}
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
                    <option value="" disabled>Sélectionner une direction...</option>
                    {departments.filter(d => d.new_is_active || d.new_departmentid === formData.direction).map(d => (
                      <option key={d.new_departmentid} value={d.new_departmentid}>{d.new_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Document Principal */}
        <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Document principal
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required={!isAvoir}
                    placeholder="Ex: 2026089"
                    value={formData.numero_facture}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_facture: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none transition-all ${
                      isDuplicateInvoice
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary"
                    }`}
                  />
                  {isDuplicateInvoice && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      ⚠️ Cette facture existe déjà pour ce fournisseur.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    N° Bon de Commande (BC)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ex: 2026104"
                    value={formData.numero_bc}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_bc: e.target.value.replace(/\D/g, "") })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date de la Facture <span className="text-red-500">*</span>
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
              <AlertCircle className="w-5 h-5" /> Informations spécifiques
              Requises
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAvoir && (
                <div className="space-y-2 relative linked-folder-container">
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
                      value={dossierLieInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDossierLieInput(val);
                        if (!val) {
                          setFormData({ ...formData, dossier_lie: "" });
                        }
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                    />
                  </div>

                  {showSuggestions && dossierLieInput.trim().length >= 2 && (() => {
                    const filtered = getFilteredDossiers();
                    return (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
                        {filtered.slice(0, 6).map((d) => (
                          <div
                            key={d.new_folderid}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex flex-col gap-0.5 text-left text-xs text-slate-500"
                            onClick={() => {
                              setFormData({ ...formData, dossier_lie: d.new_folderid });
                              setDossierLieInput(`${d.new_folder_number} ${d.new_po_number ? '(BC: ' + d.new_po_number + ')' : ''}`);
                              setShowSuggestions(false);
                            }}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {d.new_folder_number}
                              </span>
                              {d.new_po_number && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold uppercase tracking-wider text-[9px]">
                                  {d.new_po_number}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span>Fournisseur : {d.new_supplier_id || "-"}</span>
                              <span className="italic">{d.new_invoice_number || "-"}</span>
                            </div>
                          </div>
                        ))}
                        {filtered.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400">
                            Aucun dossier trouvé correspondant.
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
                    <option value="" disabled>
                      Sélectionner la personne de la DCF...
                    </option>
                    {users.map(u => (
                      <option key={u.systemuserid} value={u.systemuserid}>{u.fullname}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Documents Requis */}
        {DOCUMENT_UPLOADS_ENABLED && !isCourrier && (
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-8 border border-slate-200 dark:border-slate-700 soft-shadow">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Documents requis{" "}
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
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUploaded ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-primary dark:group-hover:text-blue-400"}`}
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
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm transition-colors pointer-events-none whitespace-nowrap"
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
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Enregistrer le dossier
          </button>
        </div>
      </form>
      <SuccessConfirmationModal
        open={successModalOpen}
        message={successMessage}
        onClose={() => {
          setSuccessModalOpen(false);
          navigate("/bo/dossiers");
        }}
      />

    </div>
  );
}


