import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { 
  ArrowLeft, FileText, CheckCircle2, RotateCcw, 
  UploadCloud, AlertCircle, Building2, Calendar, 
  CheckCircle, FileUp, Link as LinkIcon, Share2, AlertOctagon, Clock, PhoneCall
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function DossierDetailPrescripteur() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("infos");

  // Modals state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showRetourModal, setShowRetourModal] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Validation form state
  const [hasBR, setHasBR] = useState(false);
  const [retourMotif, setRetourMotif] = useState("");

  const fetchDossier = async () => {
    try {
      const result = await dataService.getDossiers();
      const found = result.find(d => d.new_dossierid === id);
      setDossier(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const handleAccuse = async () => {
    if (!dossier) return;
    try {
      await dataService.updateDossier(dossier.new_dossierid, { new_statut: 40 });
      setSuccessMessage(`Réception accusée. Vous pouvez maintenant traiter le dossier.`);
      setSuccessModalOpen(true);
      fetchDossier();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur d'accusé réception");
    }
  };

  const handleValider = async () => {
    if (!dossier) return;
    if (!hasBR && dossier.new_type_document !== 200) { // Avoir (200) might not need BR, but others usually do
      toast.error("Veuillez charger le Bon de Réception pour valider.");
      return;
    }
    try {
      await dataService.updateDossier(dossier.new_dossierid, { new_statut: 50 }); // En transit vers BO
      setShowValidationModal(false);
      setSuccessMessage(`Dossier validé et renvoyé au Bureau d'Ordre.`);
      setSuccessModalOpen(true);
      // Wait a bit before leaving
      setTimeout(() => navigate("/prescripteur/dossiers"), 2000);
    } catch (err) {
      toast.error("Erreur lors de la validation");
    }
  };

  const handleRetour = async () => {
    if (!dossier) return;
    if (!retourMotif.trim()) {
      toast.error("Veuillez indiquer un motif de retour.");
      return;
    }
    try {
      await dataService.updateDossier(dossier.new_dossierid, { 
        new_statut: 90, // Retour Correction
        new_motif_blocage: retourMotif 
      });
      setShowRetourModal(false);
      setSuccessMessage(`Dossier retourné au Bureau d'Ordre pour correction.`);
      setSuccessModalOpen(true);
      setTimeout(() => navigate("/prescripteur/dossiers"), 2000);
    } catch (err) {
      toast.error("Erreur lors du retour");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement...</div>;
  if (!dossier) return <div className="p-12 text-center text-slate-500">Dossier introuvable</div>;

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate("/prescripteur/dossiers")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {dossier.new_numero_dossier}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {dossier.new_fournisseur_nom || "Fournisseur inconnu"}
          </p>
        </div>
        
        {/* Actions conditionnelles selon le statut */}
        <div className="flex gap-3">
          {dossier.new_statut === 30 && (
            <button
              onClick={handleAccuse}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Accuser Réception
            </button>
          )}

          {dossier.new_statut === 40 && (
            <>
              <button
                onClick={() => setShowRetourModal(true)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retour Correction
              </button>
              <button
                onClick={() => setShowValidationModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Valider la Facture
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-hide mt-4">
        {[
          { id: "infos", label: "Informations Générales", icon: FileText },
          { id: "timeline", label: "Flux de Traitement", icon: Clock },
          { id: "transmissions", label: "Transmissions", icon: Share2 },
          { id: "blocages", label: "Blocages", icon: AlertOctagon },
          { id: "relances", label: "Relances", icon: PhoneCall },
          { id: "documents", label: "Documents", icon: LinkIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" 
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
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">Informations Détaillées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fournisseur</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_fournisseur_nom || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Société GBM</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_societe_gbm || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Direction</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_direction || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Prescripteur</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_prescripteur || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Date Document</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_date_facture ? format(parseISO(dossier.new_date_facture), "dd MMM yyyy", { locale: fr }) : 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Type Document</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_type_document === 100 ? "FACTURE" : dossier.new_type_document === 200 ? "AVOIR" : dossier.new_type_document === 300 ? "CONTRAT" : "AUTRE"}</p></div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 mt-10 border-b border-slate-100 dark:border-slate-800 pb-2">Pièces Jointes & Validation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                 <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                   <LinkIcon className="w-4 h-4" /> Documents fournis par le BO
                 </h4>
                 <div className="space-y-3">
                   {dossier.new_documents_complements && dossier.new_documents_complements.length > 0 ? (
                     dossier.new_documents_complements.map(doc => (
                       <div key={doc} className="flex items-center justify-between p-3 bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-xl">
                         <div className="flex items-center gap-3">
                           <FileText className="w-5 h-5 text-blue-500" />
                           <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc}</span>
                         </div>
                         <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md font-bold">Disponible</span>
                       </div>
                     ))
                   ) : (
                     <div className="text-slate-500 dark:text-slate-400 text-sm italic">Aucun document spécifique associé.</div>
                   )}
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                 <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                   <UploadCloud className="w-4 h-4" /> Vos documents requis
                 </h4>
                 <div className="flex items-center justify-between p-3 bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-xl mb-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bon de Réception (BR)</span>
                    </div>
                    {dossier.new_statut >= 50 && dossier.new_statut !== 90 ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md font-bold">Fourni & Validé</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md font-bold">À fournir lors de la validation</span>
                    )}
                 </div>
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>Vérifiez que les quantités et prix correspondent au bon de commande avant d'émettre le BR et de valider la facture.</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="p-8">
             <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 py-2 space-y-10">
               {[
                 { id: 10, label: "Sauvegarder", desc: "Dossier en cours de saisie au Bureau d'Ordre.", icon: "edit" },
                 { id: 30, label: "Transit Prescripteur", desc: `Envoi du dossier physique/numérique à la direction ${dossier.new_direction || ''}.`, icon: "send" },
                 { id: 40, label: "Chez Prescripteur", desc: "Vous examinez et validez le service fait.", icon: "user" },
                 { id: 50, label: "Retour BO (Transit)", desc: "Le dossier validé retourne au Bureau d'Ordre.", icon: "undo" },
                 { id: 60, label: "Complet / Prêt DCF", desc: "BO accuse réception et prépare le lot pour la DCF.", icon: "package" },
                 { id: 70, label: "Transit DCF", desc: "Envoi du dossier à la Direction Contrôle de Flux (DCF).", icon: "send" },
                 { id: 80, label: "Chez DCF", desc: "Vérification de la conformité comptable et fiscale.", icon: "shield" }
               ].map((step, index) => {
                 const isCompleted = dossier.new_statut > step.id || (dossier.new_statut === 150 && step.id === 150);
                 if (step.id === 90 && dossier.new_statut !== 90) return null;
                 const actuallyCurrent = (dossier.new_statut === step.id);
                 const isFuture = dossier.new_statut < step.id;

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
                          <h4 className={`font-bold text-sm ${actuallyCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{step.label}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-md">{step.desc}</p>
                        </div>
                        {actuallyCurrent && (
                          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full">ACTUEL</span>
                        )}
                        {!actuallyCurrent && isCompleted && (
                          <div className="text-right">
                             <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                          </div>
                        )}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {(activeTab === "transmissions" || activeTab === "blocages" || activeTab === "relances" || activeTab === "documents") && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aucune donnée</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Il n'y a pas encore d'historique pour cet onglet.</p>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Validation du Dossier</h3>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vous êtes sur le point de valider le dossier <strong className="text-slate-900 dark:text-white">{dossier.new_numero_dossier}</strong>.
                Pour finaliser cette étape, vous devez obligatoirement joindre le Bon de Réception (BR).
              </p>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  hasBR 
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" 
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
                onClick={() => setHasBR(true)}
              >
                {hasBR ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">BR_Uploadé_OK.pdf</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="w-10 h-10 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Cliquez pour charger le BR (PDF)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleValider}
                disabled={!hasBR}
                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
                  hasBR 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                Confirmer la validation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retour Modal */}
      {showRetourModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-500" /> Retour au Bureau d'Ordre
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Veuillez indiquer le motif du retour pour que le Bureau d'Ordre puisse traiter l'anomalie.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Motif du renvoi *</label>
                <textarea 
                  value={retourMotif}
                  onChange={(e) => setRetourMotif(e.target.value)}
                  placeholder="Ex: La quantité facturée ne correspond pas à la livraison..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white h-24 resize-none"
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowRetourModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleRetour}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
              >
                Envoyer le retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Action Réussie
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {successMessage}
              </p>
              {/* Le bouton n'est pas nécessaire si on redirige automatiquement, mais utile en cas de blocage */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
