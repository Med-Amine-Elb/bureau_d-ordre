import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier as DossierType } from "@/lib/dataService";
import { AlertOctagon, Search, Lock, Unlock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Blocages() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<DossierType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierType | null>(null);
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    const fetchDossiers = async () => {
      const data = await dataService.getDossiers();
      // On filtre pour ne garder que ceux "bloqués"
      const bloqués = data.filter(d => d.new_est_bloque);
      setDossiers(bloqués);
      setLoading(false);
    };
    fetchDossiers();
  }, []);

  const handleOpenUnlock = (dossier: DossierType) => {
    setSelectedDossier(dossier);
    setResolution("");
    setIsModalOpen(true);
  };

  const handleConfirmUnlock = async () => {
    if (!selectedDossier) return;
    try {
      // Dans une vraie app, on mettrait new_est_bloque = false.
      // Le mock local simule cette modification via updateDossierStatut pour le moment
      toast.success("Dossier débloqué !", { description: "Le dossier a été débloqué et le flux reprend." });
      setDossiers(dossiers.filter(d => d.new_dossierid !== selectedDossier.new_dossierid));
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Erreur", { description: "Impossible de débloquer le dossier." });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <AlertOctagon className="w-8 h-8 text-red-600" /> Gestion des Blocages
        </h1>
        <p className="text-slate-500 mt-1 ml-11">Résolution des dossiers en anomalie bloquante.</p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-200 soft-shadow overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="relative w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Rechercher par N° Dossier..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dossier</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Motif du Blocage</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 animate-pulse">Chargement...</td></tr>
              ) : dossiers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <Unlock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    Aucun dossier bloqué actuellement.
                  </td>
                </tr>
              ) : (
                dossiers.map(dossier => (
                  <tr key={dossier.new_dossierid} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{dossier.new_numero_dossier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{dossier.new_fournisseur_nom || 'Inconnu'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-red-600 text-sm">Pièce manquante / Erreur système</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/bo/dossiers/${dossier.new_dossierid}`)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors mr-2">
                        <Eye className="w-4 h-4" /> Voir
                      </button>
                      <button onClick={() => handleOpenUnlock(dossier)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold transition-colors">
                        <Unlock className="w-4 h-4" /> Débloquer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Déblocage */}
      {isModalOpen && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Débloquer le Dossier</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="sr-only">Fermer</span>&times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium">Dossier concerné</p>
                <p className="text-sm font-bold text-slate-900">{selectedDossier.new_numero_dossier}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Détail de la Résolution <span className="text-red-500">*</span></label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Ex: Pièce reçue du fournisseur, blocage levé..."
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleConfirmUnlock} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                <Unlock className="w-4 h-4" /> Confirmer Déblocage
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
