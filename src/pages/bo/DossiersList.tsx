import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { Search, Filter, Download, MoreHorizontal, Eye, FileText, AlertTriangle } from "lucide-react";

export default function DossiersList() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const result = await dataService.getDossiers();
        setDossiers(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, []);

  const getTypeBadge = (type: number) => {
    switch(type) {
      case 100: return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">FACTURE</span>;
      case 200: return <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">AVOIR</span>;
      case 300: return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">CONTRAT</span>;
      case 400: return <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">DEMANDE CHÈQUE</span>;
      case 500: return <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">ACOMPTE</span>;
      default: return <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">INCONNU</span>;
    }
  };

  const getStatusBadge = (status: number) => {
    switch(status) {
      case 10: return <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-slate-400"></div>Brouillon</span>;
      case 20: return <span className="flex items-center gap-1.5 text-red-700 font-medium"><div className="w-2 h-2 rounded-full bg-red-500"></div>Rejeté 5 Jours</span>;
      case 30: return <span className="flex items-center gap-1.5 text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit Prescripteur</span>;
      case 40: return <span className="flex items-center gap-1.5 text-indigo-600"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Chez Prescripteur</span>;
      case 70: return <span className="flex items-center gap-1.5 text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit DCF</span>;
      case 150: return <span className="flex items-center gap-1.5 text-emerald-700 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Payé</span>;
      default: return <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-slate-400"></div>Statut: {status}</span>;
    }
  };

  const filteredDossiers = dossiers.filter(d => 
    d.new_numero_dossier?.toLowerCase().includes(search.toLowerCase()) ||
    d.new_fournisseur_nom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Liste des Dossiers</h1>
          <p className="text-slate-500 mt-1">Recherche et gestion de tous les dossiers fournisseurs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/bo/dossiers/nouveau")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold soft-shadow transition-colors">
            + Nouveau Dossier
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-4 rounded-t-2xl border-x border-t border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Rechercher par N° Dossier, Fournisseur..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filtres Avancés
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="w-4 h-4" /> Exporter Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dossier</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fournisseur</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Réception</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">Chargement des données...</td></tr>
            ) : filteredDossiers.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Aucun dossier trouvé.</td></tr>
            ) : (
              filteredDossiers.map((dossier) => (
                <tr key={dossier.new_dossierid} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{dossier.new_numero_dossier}</div>
                        {dossier.new_est_bloque && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> BLOQUÉ
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getTypeBadge(dossier.new_type_document)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{dossier.new_fournisseur_nom || 'Non renseigné'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(dossier.new_date_reception).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(dossier.new_statut)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/bo/dossiers/${dossier.new_dossierid}`)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors ml-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination mock */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>Affichage de 1 à {filteredDossiers.length} sur {filteredDossiers.length} résultats</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50" disabled>Précédent</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md bg-blue-50 text-blue-600 font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">Suivant</button>
          </div>
        </div>
      </div>

    </div>
  )
}
