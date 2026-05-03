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
      case 20: return { label: "Rejeté 5 Jours", color: "red" };
      case 30: return { label: "En Transit Vers Prescripteur", color: "blue" };
      case 40: return { label: "Chez Prescripteur", color: "indigo" };
      case 70: return { label: "En Transit Vers DCF", color: "blue" };
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
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </button>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 soft-shadow mb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{dossier.new_numero_dossier}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-slate-500 flex items-center gap-2">
            Créé le {new Date(dossier.new_date_reception).toLocaleDateString('fr-FR')} par <span className="font-semibold text-slate-700">Bureau d'Ordre</span>
          </p>
        </div>

        {/* Quick Actions based on status */}
        <div className="flex flex-wrap gap-3">
          {dossier.new_statut === 10 && (
            <button onClick={handleTransmit} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2">
              <Send className="w-4 h-4" /> Transmettre à Prescripteur
            </button>
          )}
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Partager
          </button>
          <button className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2.5 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" /> Bloquer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 overflow-x-auto pb-1">
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
                ? "border-blue-600 text-blue-600 bg-blue-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 soft-shadow min-h-[400px]">
        {activeTab === "infos" && (
          <div className="p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Informations Détaillées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div><p className="text-sm text-slate-500 mb-1">Fournisseur</p><p className="font-semibold text-slate-900">{dossier.new_fournisseur_nom || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Société GBM</p><p className="font-semibold text-slate-900">{dossier.new_societe_gbm || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Direction</p><p className="font-semibold text-slate-900">{dossier.new_direction || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Prescripteur</p><p className="font-semibold text-slate-900">{dossier.new_prescripteur || 'N/A'}</p></div>
              <div><p className="text-sm text-slate-500 mb-1">Date Document</p><p className="font-semibold text-slate-900">{dossier.new_date_facture || 'N/A'}</p></div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-4 mt-10 border-b border-slate-100 pb-2">Pièces Jointes Validées</h3>
            <div className="flex flex-wrap gap-3">
              {dossier.new_documents_complements && dossier.new_documents_complements.length > 0 ? (
                dossier.new_documents_complements.map(doc => (
                  <span key={doc} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {doc}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">Aucun document complémentaire sélectionné.</span>
              )}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="p-8">
             <div className="relative border-l-2 border-slate-100 ml-4 py-4 space-y-8">
               
               {/* Step 1 */}
               <div className="relative pl-8">
                 <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                 <p className="text-xs text-slate-500 mb-1">{new Date(dossier.new_date_reception).toLocaleString('fr-FR')}</p>
                 <h4 className="font-bold text-slate-800">Enregistrement Bureau d'Ordre</h4>
                 <p className="text-sm text-slate-600 mt-1">Dossier créé et vérifié par l'agent BO.</p>
               </div>

               {/* Step 2 (if transmitted) */}
               {dossier.new_statut >= 30 && (
                 <div className="relative pl-8">
                   <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${dossier.new_statut > 30 ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'} ring-4 ring-white`}></div>
                   <p className="text-xs text-slate-500 mb-1">Aujourd'hui</p>
                   <h4 className="font-bold text-slate-800">Transmission au Prescripteur</h4>
                   <p className="text-sm text-slate-600 mt-1">Dossier en attente d'accusé réception par le prescripteur.</p>
                 </div>
               )}

               {/* Rejeté */}
               {dossier.new_statut === 20 && (
                 <div className="relative pl-8">
                   <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 ring-4 ring-white"></div>
                   <p className="text-xs text-slate-500 mb-1">Aujourd'hui</p>
                   <h4 className="font-bold text-red-700">Rejet Automatique (&gt; 5 Jours)</h4>
                   <p className="text-sm text-red-600 mt-1">La date du document est trop ancienne par rapport à la date de réception.</p>
                 </div>
               )}

             </div>
          </div>
        )}

        {(activeTab === "transmissions" || activeTab === "blocages" || activeTab === "relances" || activeTab === "documents") && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Aucune donnée</h3>
            <p className="text-slate-500 mt-2 max-w-md">Il n'y a pas encore d'historique pour cet onglet. Le dossier est en cours de traitement.</p>
          </div>
        )}
      </div>

    </div>
  )
}
