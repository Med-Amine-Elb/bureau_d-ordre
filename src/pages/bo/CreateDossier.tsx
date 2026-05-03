import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import { ArrowLeft, Save, Send, UploadCloud, AlertCircle, CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";

export default function CreateDossier() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero_dossier: `DOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date_reception: new Date().toISOString().split('T')[0],
    fournisseur: "",
    societe_gbm: "",
    direction: "",
    prescripteur: "",
    type_document: 100, // Facture
    numero_facture: "",
    numero_bc: "",
    date_facture: new Date().toISOString().split('T')[0],
    description: "",
    documents_complements: [] as string[],
    dossier_lie: "",
    collecteur_dcf: ""
  });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const requiredDocsPerType: Record<number, string[]> = {
    100: ['Facture Originale', 'Bon de Commande (BC)', 'Bon de Livraison (BL) / Attestation de Service', 'Attestation Fiscale'],
    200: ['Avoir Original'],
    300: ['Facture', 'Contrat', 'Bon de Commande (BC)', 'Attestation Fiscale'],
    400: ['Demande de chèque signée', 'Facture / Devis'],
    500: ['Demande d\'acompte', 'Facture / Devis']
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    
    // Règle des 5 jours (pour Facture et Acompte P2)
    let statut = isDraft ? 10 : 30; // Brouillon ou En Transit Vers Prescripteur
    let isRejete = false;

    if (!isDraft && (formData.type_document === 100)) {
      const daysDiff = differenceInDays(
        parseISO(formData.date_reception), 
        parseISO(formData.date_facture)
      );
      
      if (daysDiff > 5) {
        statut = 20; // Rejeté 5 Jours
        isRejete = true;
        toast.error("Règle des 5 jours dépassée !", {
          description: `Il y a ${daysDiff} jours d'écart entre la date de facture et la date de réception. Le dossier est automatiquement rejeté.`,
          duration: 6000
        });
      }
    }

    // Routage spécifique pour les flux courts
    if (!isDraft && !isRejete && (formData.type_document === 400 || formData.type_document === 500)) {
      if (!formData.collecteur_dcf) {
        toast.error("Champ manquant", { description: "Le collecteur DCF est obligatoire pour les flux courts." });
        return;
      }
      statut = 70; // En Transit Vers DCF directement
    }

    // Validation Avoir
    if (!isDraft && formData.type_document === 200 && !formData.dossier_lie) {
      toast.error("Champ manquant", { description: "Le dossier d'origine est obligatoire pour un Avoir." });
      return;
    }

    setLoading(true);
    
    try {
      await dataService.createDossier({
        new_numero_dossier: formData.numero_dossier,
        new_fournisseur_nom: formData.fournisseur,
        new_societe_gbm: formData.societe_gbm,
        new_direction: formData.direction,
        new_prescripteur: formData.prescripteur,
        new_collecteur_dcf: formData.collecteur_dcf,
        new_numero_facture: formData.numero_facture,
        new_numero_bc: formData.numero_bc,
        new_date_facture: formData.date_facture,
        new_date_reception: formData.date_reception,
        new_description: formData.description,
        new_documents_complements: Object.keys(uploadedDocs),
        new_type_document: Number(formData.type_document),
        new_statut: statut,
      });

      if (isDraft) {
        toast.success("Dossier sauvegardé en brouillon.");
      } else if (!isRejete) {
        toast.success("Dossier soumis avec succès !", { description: "Le flux Power Automate a été déclenché." });
      }
      
      navigate("/bo/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Erreur système", { description: "Impossible de créer le dossier." });
    } finally {
      setLoading(false);
    }
  };

  const isFluxCourt = formData.type_document === 400 || formData.type_document === 500;
  const isAvoir = formData.type_document === 200;

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate("/bo/dashboard")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nouveau Dossier Fournisseur</h1>
        <p className="text-slate-500 mt-1">Saisie complète et vérification des pièces avant routage.</p>
      </div>

      <form className="space-y-8">
        {/* Section 1: Informations Générales */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">1. Informations Générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">N° Dossier (Généré Auto) <span className="text-red-500">*</span></label>
              <input type="text" readOnly value={formData.numero_dossier}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date de Réception (Aujourd'hui) <span className="text-red-500">*</span></label>
              <input type="date" readOnly value={formData.date_reception} onChange={e => setFormData({...formData, date_reception: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
            </div>
            {!isAvoir && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Fournisseur <span className="text-red-500">*</span></label>
                  <input type="text" required={!isAvoir} placeholder="Ex: GBM IT Services" value={formData.fournisseur} onChange={e => setFormData({...formData, fournisseur: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Société GBM <span className="text-red-500">*</span></label>
                  <select value={formData.societe_gbm} onChange={e => setFormData({...formData, societe_gbm: e.target.value})} required={!isAvoir}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none">
                    <option value="">Sélectionner...</option>
                    <option value="GBM_CASA">GBM Casablanca</option>
                    <option value="GBM_RABAT">GBM Rabat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Direction</label>
                  <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none">
                    <option value="">Sélectionner...</option>
                    <option value="IT">Direction Informatique</option>
                    <option value="RH">Ressources Humaines</option>
                    <option value="ACHATS">Direction Achats</option>
                  </select>
                </div>
                {!isFluxCourt && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Prescripteur Assigné <span className="text-red-500">*</span></label>
                    <select value={formData.prescripteur} onChange={e => setFormData({...formData, prescripteur: e.target.value})} required={!isAvoir && !isFluxCourt}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none">
                      <option value="">Sélectionner un prescripteur...</option>
                      <option value="user_1">Ahmed Benali</option>
                      <option value="user_2">Sarah Alaoui</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Section 2: Document Principal */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">2. Document Principal</h2>
          
          <div className="mb-2">
            <label className="text-sm font-semibold text-slate-700 block mb-3">Type de Document</label>
            <div className="flex flex-wrap gap-4">
              {[
                { id: 100, label: "Facture", color: "blue" },
                { id: 200, label: "Avoir", color: "orange" },
                { id: 300, label: "Facture Contrat", color: "emerald" },
                { id: 400, label: "Demande de Chèque", color: "purple" },
                { id: 500, label: "Acompte Facture", color: "rose" },
              ].map(type => (
                <label key={type.id} className={`cursor-pointer flex items-center px-4 py-2.5 border rounded-xl transition-all ${
                  formData.type_document === type.id 
                    ? `border-${type.color}-500 bg-${type.color}-50 ring-2 ring-${type.color}-200` 
                    : `border-slate-200 bg-white hover:bg-slate-50`
                }`}>
                  <input type="radio" name="type_doc" className="sr-only" 
                    checked={formData.type_document === type.id} 
                    onChange={() => setFormData({...formData, type_document: type.id})} 
                  />
                  <span className={`text-sm font-semibold ${formData.type_document === type.id ? `text-${type.color}-700` : 'text-slate-600'}`}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {!isAvoir && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">N° Facture / Pièce <span className="text-red-500">*</span></label>
                  <input type="text" required={!isAvoir} placeholder="Ex: FAC-2026-089" value={formData.numero_facture} onChange={e => setFormData({...formData, numero_facture: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">N° Bon de Commande (BC)</label>
                  <input type="text" placeholder="Ex: BC-2026-104" value={formData.numero_bc} onChange={e => setFormData({...formData, numero_bc: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Date du Document <span className="text-red-500">*</span></label>
                  <input type="date" required={!isAvoir} value={formData.date_facture} onChange={e => setFormData({...formData, date_facture: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Description / Objet</label>
                <textarea rows={2} placeholder="Précisions sur la nature de la dépense..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none" />
              </div>
            </>
          )}
        </div>

        {/* Section 5: Informations Spécifiques Conditionnelles */}
        {(isFluxCourt || isAvoir) && (
          <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 soft-shadow">
            <h2 className="text-lg font-bold text-amber-900 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Informations Spécifiques Requises
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAvoir && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-amber-900">Dossier d'origine (Lié) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-amber-500" />
                    </div>
                    <input type="text" required placeholder="Rechercher par N° Dossier ou N° BC..." value={formData.dossier_lie} onChange={e => setFormData({...formData, dossier_lie: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none" />
                  </div>
                  <p className="text-xs text-amber-700 mt-1">Saisissez le N° de Dossier ou le Bon de Commande pour lier cet Avoir.</p>
                </div>
              )}
              {isFluxCourt && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-amber-900">Collecteur DCF (Comptabilité) <span className="text-red-500">*</span></label>
                  <select value={formData.collecteur_dcf} onChange={e => setFormData({...formData, collecteur_dcf: e.target.value})} required
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none">
                    <option value="">Sélectionner la personne de la DCF...</option>
                    <option value="dcf_1">Karim Idrissi</option>
                    <option value="dcf_2">Nadia Tazi</option>
                  </select>
                  <p className="text-xs text-amber-700 mt-1">Requis car les flux courts contournent le Prescripteur.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Documents Requis */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 soft-shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">
            3. Documents Requis <span className="text-sm font-normal text-slate-500 ml-2">(Spécifiques au type de document)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requiredDocsPerType[formData.type_document]?.map(docLabel => {
              const isUploaded = !!uploadedDocs[docLabel];
              return (
                <div key={docLabel} className={`border-2 ${isUploaded ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50'} rounded-xl p-5 transition-colors relative group flex flex-col justify-between`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        {isUploaded ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className={`font-semibold text-[15px] leading-tight mb-1 ${isUploaded ? 'text-emerald-800' : 'text-slate-800'}`}>
                          {docLabel}
                        </p>
                        {isUploaded ? (
                          <p className="text-sm text-emerald-600 font-medium truncate">{uploadedDocs[docLabel]}</p>
                        ) : (
                          <p className="text-xs text-slate-500">Formats acceptés : PDF, JPG (Max 5MB)</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="shrink-0 mt-1">
                      {isUploaded ? (
                        <button type="button" onClick={() => {
                          const newDocs = {...uploadedDocs};
                          delete newDocs[docLabel];
                          setUploadedDocs(newDocs);
                        }} className="text-slate-400 hover:text-red-500 bg-white border border-slate-200 hover:border-red-200 rounded-lg p-2 transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      ) : (
                        <div className="relative">
                          <button type="button" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors pointer-events-none whitespace-nowrap">
                            Parcourir...
                          </button>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setUploadedDocs({...uploadedDocs, [docLabel]: e.target.files[0].name});
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

        {/* Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 soft-shadow flex items-center justify-end gap-4 sticky bottom-6 z-10">
          <button 
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Brouillon
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
    </div>
  )
}
