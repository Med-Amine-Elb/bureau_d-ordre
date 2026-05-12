import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { 
  FileText, 
  Search, 
  Eye, 
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowDown,
  CheckCircle,
  Download
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function DossiersListPrescripteur() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(!!location.state?.filterStatus);
  const [filterType, setFilterType] = useState<number | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<number | string | "ALL">(
    location.state?.filterStatus || "ALL"
  );
  const [filterFournisseur, setFilterFournisseur] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("");
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // On affiche tous les dossiers à partir du statut 30 pour que le prescripteur puisse faire le suivi
      const assigned = result.filter(d => d.new_statut >= 30 || d.new_statut === 20);
      setDossiers(assigned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.updateDossier(dossier.new_dossierid, {
        new_statut: 40,
      });
      setSuccessMessage(
        `Réception accusée pour le dossier ${dossier.new_numero_dossier}. Il est maintenant chez vous.`,
      );
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const uniqueFournisseurs = Array.from(
    new Set(dossiers.map((d) => d.new_fournisseur_nom).filter(Boolean)),
  ).sort();

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_numero_dossier?.toLowerCase().includes(search.toLowerCase()) ||
      d.new_fournisseur_nom?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType =
      filterType === "ALL" || d.new_type_document === filterType;

    let matchesStatus = filterStatus === "ALL";
    if (filterStatus === "30,40") {
      matchesStatus = d.new_statut === 30 || d.new_statut === 40;
    } else if (filterStatus === ">=50") {
      matchesStatus = d.new_statut >= 50 && d.new_statut !== 90;
    } else if (filterStatus !== "ALL") {
      matchesStatus = d.new_statut === Number(filterStatus);
    }

    const matchesFournisseur =
      filterFournisseur === "ALL" ||
      d.new_fournisseur_nom === filterFournisseur;
      
    const matchesDate =
      !filterDate || d.new_date_reception.startsWith(filterDate);

    return matchesSearch && matchesType && matchesStatus && matchesFournisseur && matchesDate;
  });

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            Dossiers Assignés
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 ml-14">
            Consultez, accusez réception et validez les dossiers qui vous sont affectés.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow overflow-hidden">
        {/* Toolbar / Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-[#0F172B]">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par N° Dossier, Fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Filter className="w-4 h-4" /> Filtres Avancés
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Download className="w-4 h-4" /> Exporter Excel
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-slate-50/50 dark:bg-[#0F172B] border-b border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-6 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Type de Document
              </label>
              <select
                className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700 dark:text-slate-300"
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value),
                  )
                }
              >
                <option value="ALL">Tous les types</option>
                <option value="100">Facture</option>
                <option value="200">Avoir</option>
                <option value="300">Contrat</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Statut du Dossier
              </label>
              <select
                className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700 dark:text-slate-300"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="30,40">À Valider (30, 40)</option>
                <option value="30">À réceptionner (30)</option>
                <option value="40">Chez moi (40)</option>
                <option value=">=50">Validés &amp; Transmis ({">="} 50)</option>
                <option value="90">Retour Correction (90)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fournisseur
              </label>
              <select
                className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700 dark:text-slate-300"
                value={filterFournisseur}
                onChange={(e) => setFilterFournisseur(e.target.value)}
              >
                <option value="ALL">Tous les fournisseurs</option>
                {uniqueFournisseurs.map((f) => (
                  <option key={f as string} value={f as string}>
                    {f as string}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date de Réception
              </label>
              <input
                type="date"
                className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700 dark:text-slate-300"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div className="flex items-end pb-0.5">
              <button
                onClick={() => {
                  setFilterType("ALL");
                  setFilterStatus("ALL");
                  setFilterFournisseur("ALL");
                  setFilterDate("");
                  setSearch("");
                }}
                className="text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fournisseur & Type
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chargement des dossiers...
                  </td>
                </tr>
              ) : filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p>Aucun dossier trouvé pour ces critères.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((dossier) => (
                  <tr
                    key={dossier.new_dossierid}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          {getTypeIcon(dossier.new_type_document)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {dossier.new_numero_dossier}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {dossier.new_fournisseur_nom || "-"}
                        </span>
                      </div>
                      <div className="mt-1">{getTypeBadge(dossier.new_type_document)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          <span>Reçu: {format(parseISO(dossier.new_date_reception), "dd MMM yyyy", { locale: fr })}</span>
                        </div>
                        {dossier.new_date_facture && (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Doc: {format(parseISO(dossier.new_date_facture), "dd MMM yyyy", { locale: fr })}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {dossier.new_numero_facture || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatutBadge(dossier.new_statut)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dossier.new_statut === 30 && (
                          <button
                            onClick={() => handleAccuse(dossier)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Accuser
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/prescripteur/dossiers/${dossier.new_dossierid}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                        >
                          <Eye className="w-4 h-4" /> {dossier.new_statut === 40 ? "Traiter" : "Détails"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <p className="text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeIcon(type: number) {
  switch (type) {
    case 100: return <FileText className="w-5 h-5" />;
    case 200: return <FileText className="w-5 h-5 text-orange-500" />;
    case 300: return <FileText className="w-5 h-5 text-emerald-500" />;
    default: return <FileText className="w-5 h-5" />;
  }
}

function getTypeBadge(type: number) {
  switch (type) {
    case 100: return <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">FACTURE</span>;
    case 200: return <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">AVOIR</span>;
    case 300: return <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">CONTRAT</span>;
    default: return <span className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">AUTRE</span>;
  }
}

function getStatutBadge(statut: number) {
  switch (statut) {
    case 30: return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold">À réceptionner</span>;
    case 40: return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold">Chez Vous</span>;
    case 90: return <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-bold">Retour Correction</span>;
    default: return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">En Cours</span>;
  }
}
