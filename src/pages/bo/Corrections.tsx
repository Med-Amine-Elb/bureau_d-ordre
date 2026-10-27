import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier as DossierType, DossierCorrectionInfo } from "@/lib/dataService";
import { 
  RotateCcw, 
  Search, 
  Eye, 
  ArrowRight, 
  Calendar, 
  User, 
  FileText,
  AlertCircle
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Corrections() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<DossierType[]>([]);
  const [returnInfo, setReturnInfo] = useState<Record<string, DossierCorrectionInfo>>({});
  const [loading, setLoading] = useState(true);
  const [auditLoadError, setAuditLoadError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const all = await dataService.getDossiers();
        // Filtrer les dossiers en retour correction (Statut 90)
        const inCorrection = all.filter(d => d.new_status === 90);
        setDossiers(inCorrection);
        try {
          setReturnInfo(await dataService.getLatestCorrectionReturnInfo(inCorrection.map(d => d.new_folderid)));
          setAuditLoadError(false);
        } catch (auditError) {
          console.error("Impossible de charger les détails d’audit des retours :", auditError);
          setAuditLoadError(true);
        }
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
    d.new_folder_number?.toLowerCase().includes(search.toLowerCase()) ||
    d.new_supplier_id?.toLowerCase().includes(search.toLowerCase()) ||
    (returnInfo[d.new_folderid.toLowerCase()]?.reason || d.new_return_reason || "").toLowerCase().includes(search.toLowerCase()) ||
    (returnInfo[d.new_folderid.toLowerCase()]?.actorRoleLabel || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-orange-600" /> Corrections et retours
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-11">
            Gérez ici les dossiers renvoyés par le Prescripteur ou la DCF.
          </p>
        </div>
      </div>

      {auditLoadError && (
        <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          L’historique des retours n’a pas pu être chargé. Les informations de provenance peuvent être incomplètes.
        </div>
      )}

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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date de retour</th>
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
                  <tr key={dossier.new_folderid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <Link to={`/bo/dossiers/${dossier.new_folderid}`} className="font-bold text-primary hover:underline hover:text-primary-hover">
                            {dossier.new_folder_number}
                          </Link>
                          <div className="mt-1 max-w-[32rem] text-xs font-medium text-orange-700 dark:text-orange-300">
                            Motif : {returnInfo[dossier.new_folderid.toLowerCase()]?.reason || dossier.new_return_reason || "Motif non renseigné"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          <span className="block">{returnInfo[dossier.new_folderid.toLowerCase()]?.actorRoleLabel || "Provenance non renseignée"}</span>
                          {returnInfo[dossier.new_folderid.toLowerCase()]?.actorLabel && (
                            <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">{returnInfo[dossier.new_folderid.toLowerCase()]?.actorLabel}</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                       <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4" />
                         {(() => {
                           const rawDate = returnInfo[dossier.new_folderid.toLowerCase()]?.eventDate || dossier.new_date_retour_bo;
                           const date = rawDate ? new Date(rawDate) : undefined;
                           return date && Number.isFinite(date.getTime())
                             ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date)
                             : "Date non renseignée";
                         })()}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                       <button 
                        onClick={() => navigate(`/bo/dossiers/${dossier.new_folderid}`)}
                        className="p-2 text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors mr-2"
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

    </div>
  );
}


