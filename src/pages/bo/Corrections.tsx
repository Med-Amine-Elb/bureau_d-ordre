import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier as DossierType } from "@/lib/dataService";
import { 
  RotateCcw, 
  Search, 
  Eye, 
  ArrowRight, 
  Calendar, 
  User, 
  MessageSquare, 
  History, 
  FileText,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Corrections() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<DossierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const all = await dataService.getDossiers();
        // Filtrer les dossiers en retour correction (Statut 90)
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

  const handleProcessCorrection = (dossier: DossierType) => {
    navigate("/bo/dossiers/nouveau", { state: { editDossier: dossier } });
  };

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
            <RotateCcw className="w-8 h-8 text-orange-600" /> Corrections & Retours
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-11">
            Gérez ici les dossiers renvoyés par la DCF ou la Trésorerie.
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier / Motif</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Provenance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Retour</th>
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
                      <p>Aucun dossier en attente de correction.</p>
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
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded inline-block">
                             Anomalie détectée par le valideur
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Comptabilité (DCF)</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                       <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4" />
                         {new Date().toLocaleDateString('fr-FR')}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                       <button 
                        onClick={() => navigate(`/bo/dossiers/${dossier.new_dossierid}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-2"
                        title="Consulter"
                       >
                         <Eye className="w-5 h-5" />
                       </button>
                       <button 
                        onClick={() => handleProcessCorrection(dossier)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold soft-shadow transition-all group"
                       >
                         Traiter <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
               <History className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Taux de retour</p>
               <p className="text-xm font-black text-orange-900 dark:text-orange-100">4.2%</p>
            </div>
         </div>
         
         <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
               <FileText className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Dossiers corrigés</p>
               <p className="text-xm font-black text-blue-900 dark:text-blue-100">8 ce mois</p>
            </div>
         </div>

         <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center">
               <MessageSquare className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Motif principal</p>
               <p className="text-xm font-black text-slate-900 dark:text-slate-100">PJ illisibles</p>
            </div>
         </div>
      </div>
    </div>
  );
}
