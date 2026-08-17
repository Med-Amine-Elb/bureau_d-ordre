import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import {
  FileText,
  Search,
  Eye,
  Filter,
  CheckCircle2,
  Building2,
  Wallet,
  User,
  Download
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { exportDossiersToExcelDetailed } from "../../utils/excelExport";

export default function DossiersListDCF() {
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

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      const visible = result.filter(d => [70, 80, 90, 100].includes(d.new_status));
      setDossiers(visible);
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
      await dataService.accuseReception(
        dossier.new_folderid,
        80, // Chez DCF
        "Utilisateur DCF"
      );
      setSuccessMessage(
        `Réception accusée pour le dossier ${dossier.new_folder_number}.`
      );
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const handleExportExcel = () => {
    exportDossiersToExcelDetailed(filteredDossiers, "DCF_Dossiers");
  };

  const uniqueFournisseurs = Array.from(
    new Set(dossiers.map((d) => d.new_supplier_id).filter(Boolean)),
  ).sort();

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_folder_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.new_supplier_id?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      filterType === "ALL" || d.new_document_type === filterType;

    let matchesStatus = filterStatus === "ALL";
    if (filterStatus !== "ALL") {
      matchesStatus = d.new_status === Number(filterStatus);
    }

    const matchesFournisseur =
      filterFournisseur === "ALL" ||
      d.new_supplier_id === filterFournisseur;

    return matchesSearch && matchesType && matchesStatus && matchesFournisseur;
  });

  const getTypeBadge = (type: number) => {
    switch (type) {
      case 100: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Facture</span>;
      case 200: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Avoir</span>;
      case 500: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400">Acompte</span>;
      case 600: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Courrier</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Inconnu</span>;
    }
  };

  const getStatusBadge = (status: number, estComptabilise?: boolean) => {
    if (status === 70) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>À Accuser Réception</span>;
    if (status === 80) {
      if (estComptabilise) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Comptabilisé</span>;
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Wallet className="w-3.5 h-3.5" />À Comptabiliser</span>;
    }
    if (status === 90) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Retour Correction</span>;
    if (status === 100) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">En Transit (Tréso)</span>;

    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Statut {status}</span>;
  };

  return (
    <div className="w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
            Dossiers à Traiter (DCF)
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Gérez vos dossiers, la saisie comptable et la transmission.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par N° Dossier, Fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
            >
              <Filter className="w-4 h-4" /> Filtres
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Exporter Excel
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Statut</label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="70">En attente d'accusé (En Transit DCF)</option>
                <option value="80">Chez DCF (À comptabiliser / Prêt Tréso)</option>
                <option value="90">Retour Correction</option>
                <option value="100">Transmis Trésorerie</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fournisseur</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={filterFournisseur}
                  onChange={(e) => setFilterFournisseur(e.target.value)}
                >
                  <option value="ALL">Tous les fournisseurs</option>
                  {uniqueFournisseurs.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type Document</label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
              >
                <option value="ALL">Tous les types</option>
                <option value={100}>Facture</option>
                <option value={200}>Avoir</option>
                <option value={500}>Acompte</option>
                <option value={600}>Courrier</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 min-h-0 overflow-auto">
        <div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date Réception (BO)
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Chargement des dossiers...
                  </td>
                </tr>
              ) : filteredDossiers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Aucun dossier trouvé avec ces critères.
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((dossier, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/dcf/dossiers/${dossier.new_folderid}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <Link to={`/dcf/dossiers/${dossier.new_folderid}`} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {dossier.new_folder_number}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(dossier.new_document_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dossier.new_document_type === 600 ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dossier.new_livreur_nom || "-"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dossier.new_supplier_id || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {format(parseISO(dossier.new_reception_date), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(dossier.new_status, dossier.new_est_comptabilise)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {dossier.new_status === 70 && (
                          <button
                            onClick={() => handleAccuse(dossier)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/dcf/dossiers/${dossier.new_folderid}`)}
                          className="p-1.5 text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Action réussie
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


