import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { ArrowLeft, Clock, FileText, Share2, AlertOctagon, PhoneCall, Link as LinkIcon, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DossierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("infos");

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const result = await dataService.getDossiers();
        const found = result.find(d => d.new_dossierid === id);
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
    switch(status) {
      case 10: return { label: "Brouillon", color: "slate" };
      case 20: return { label: "En Retard (>5j)", color: "red" };
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
      case 150: return { label: "Payé", color: "emerald" };
      default: return { label: `Statut ${status}`, color: "slate" };
    }
  };

  const statusInfo = getStatusDisplay(dossier.new_statut);

  const handleTransmit = async () => {
    try {
      await dataService.updateDossierStatut(dossier.new_dossierid, 30); // Transit Prescripteur
      toast.success("Dossier transmis avec succès.");
      setDossier({...dossier, new_statut: 30});
    } catch (e) {
      toast.error("Erreur de transmission");
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{dossier.new_numero_dossier}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/30 text-${statusInfo.color}-700 dark:text-${statusInfo.color}-400`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Créé le {new Date(dossier.new_date_reception).toLocaleDateString('fr-FR')} par <span className="font-semibold text-slate-700 dark:text-slate-300">Bureau d'Ordre</span>
          </p>
        </div>

        {/* Quick Actions based on status */}
        <div className="flex flex-wrap gap-3">
          {dossier.new_statut === 10 && (
            <button onClick={handleTransmit} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2">
              <Send className="w-4 h-4" /> Transmettre à Prescripteur
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
              <div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Date Document</p><p className="font-semibold text-slate-900 dark:text-slate-200">{dossier.new_date_facture || 'N/A'}</p></div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 mt-10 border-b border-slate-100 dark:border-slate-800 pb-2">Pièces Jointes Validées</h3>
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

        {activeTab === "timeline" && (
          <div className="p-8">
             {dossier.new_statut === 20 && (
               <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                 <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Dossier Rejeté (Hors Délai)</h4>
                   <p className="text-xs text-red-600 dark:text-red-300 mt-1">Ce dossier a dépassé la règle des 5 jours entre la date de facture et la date de réception. Il est bloqué et nécessite une action corrective ou une dérogation.</p>
                 </div>
               </div>
             )}
             <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 py-2 space-y-10">
               
               {[
                 { id: 10, label: "Brouillon", desc: "Dossier en cours de saisie au Bureau d'Ordre.", icon: "edit" },
                 { id: 30, label: "Transit Prescripteur", desc: `Envoi du dossier physique/numérique à la direction ${dossier.new_direction || ''}.`, icon: "send" },
                 { id: 40, label: "Chez Prescripteur", desc: dossier.new_prescripteur ? `Le dossier est chez ${dossier.new_prescripteur} pour validation.` : "Le prescripteur examine et valide le service fait.", icon: "user" },
                 { id: 50, label: "Retour BO (Transit)", desc: "Le dossier validé retourne au Bureau d'Ordre.", icon: "undo" },
                 { id: 60, label: "Complet / Prêt DCF", desc: "BO accuse réception et prépare le lot pour la DCF.", icon: "package" },
                 { id: 70, label: "Transit DCF", desc: "Envoi du dossier à la Direction Contrôle de Flux (DCF).", icon: "send" },
                 { id: 80, label: "Chez DCF", desc: dossier.new_collecteur_dcf ? `Le dossier est entre les mains de ${dossier.new_collecteur_dcf} (DCF).` : "Vérification de la conformité comptable et fiscale.", icon: "shield" },
                 { id: 90, label: "Retour Correction", desc: "Besoin de corrections ou pièces manquantes.", icon: "alert" },
                 { id: 100, label: "Transit Trésorerie", desc: "Dossier conforme envoyé à la Trésorerie pour règlement.", icon: "send" },
                 { id: 110, label: "Chez Trésorerie", desc: "La Trésorerie prépare le règlement (Chèque/Virement).", icon: "bank" },
                 { id: 120, label: "Prêt pour Remise", desc: "Chèque prêt au BO pour remise au fournisseur.", icon: "credit" },
                 { id: 130, label: "En Transport (Agence)", desc: dossier.new_agence_destination ? `Chèque expédié vers l'agence ${dossier.new_agence_destination}.` : "Chèque en cours d'expédition vers l'agence.", icon: "truck" },
                 { id: 140, label: "Disponible Agence", desc: dossier.new_agence_destination ? `Le chèque est arrivé à l'agence ${dossier.new_agence_destination} pour retrait.` : "Le chèque est arrivé en agence pour retrait.", icon: "map" },
                 { id: 150, label: "Payé / Clôturé", desc: "Remise effectuée et dossier clôturé définitivement.", icon: "check" }
               ].map((step, index) => {
                 // Logic for visibility and state
                 const isCompleted = dossier.new_statut > step.id || (dossier.new_statut === 150 && step.id === 150);
                 
                 // Handle Retour Correction separately if it's not the current status
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

        {(activeTab === "transmissions" || activeTab === "blocages" || activeTab === "relances" || activeTab === "documents") && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aucune donnée</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Il n'y a pas encore d'historique pour cet onglet. Le dossier est en cours de traitement.</p>
          </div>
        )}
      </div>

    </div>
  )
}
