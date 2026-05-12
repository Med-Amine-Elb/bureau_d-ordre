import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier as DossierType } from "@/lib/dataService";
import { 
  RotateCcw, 
  Search, 
  Eye, 
  Calendar, 
  User, 
  MessageSquare, 
  History, 
  FileText,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function CorrectionsPrescripteur() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<DossierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const all = await dataService.getDossiers();
        // Filtrer les dossiers en retour correction (Statut 90) que le prescripteur a renvoyés
        const inCorrection = all.filter(d => d.new_statut === 90);
        setDossiers(inCorrection);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, []);

  const filteredDossiers = dossiers.filter(d => 
    d.new_numero_dossier?.toLowerCase().includes(search.toLowerCase()) ||
    d.new_fournisseur_nom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-orange-600" /> Vos Retours Correction
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-11">
            Suivez les dossiers que vous avez renvoyés au Bureau d'Ordre pour correction.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-[#0F172B]">
          <div className="relative w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher un dossier en retour..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier / Fournisseur</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Motif Renseigné</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date de Retour</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400">Chargement des corrections...</td></tr>
              ) : filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-300" />
                      </div>
                      <p>Vous n'avez aucun dossier en attente de correction chez le BO.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((dossier) => (
                  <tr key={dossier.new_dossierid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{dossier.new_numero_dossier}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                             {dossier.new_fournisseur_nom || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2 max-w-sm">
                          {dossier.new_motif_blocage || "Motif non précisé. Veuillez revoir les pièces jointes."}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                       <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         {/* Simulation de date de retour */}
                         {format(new Date(), "dd MMM yyyy", { locale: fr })}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                       <button 
                        onClick={() => navigate(`/prescripteur/dossiers/${dossier.new_dossierid}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors"
                       >
                         <Eye className="w-4 h-4" /> Détails
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
               <History className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Dossiers Renvoyés</p>
               <p className="text-xm font-black text-orange-900 dark:text-orange-100">{filteredDossiers.length} en cours</p>
            </div>
         </div>
         
         <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center">
               <User className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pris en charge par</p>
               <p className="text-xm font-black text-slate-900 dark:text-slate-100">Bureau d'Ordre</p>
            </div>
         </div>
      </div>
    </div>
  );
}
