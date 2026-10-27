import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";
import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";
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
  Download,
  User
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { exportDossiersToExcelDetailed } from "../../utils/excelExport";
import SupplierFilterInput from "@/components/SupplierFilterInput";
import { matchesSupplierFilter } from "@/lib/supplierFilter";

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
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterStatus, filterFournisseur, filterDate]);

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // On affiche tous les dossiers à partir du statut 30 pour que le prescripteur puisse faire le suivi
      const assigned = result.filter(d => d.new_status >= 30 || d.new_status === 20);
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
      const auditRecorded = await dataService.accuseReception(
        dossier.new_folderid,
        40,
        "Amine Elboubakri"
      );
      if (!auditRecorded) {
        toast.warning("Réception enregistrée", {
          description: "Le dossier est bien accusé réception, mais la transmission n’a pas pu être ajoutée à l’historique.",
        });
      }
      setSuccessMessage("Réception confirmée.");
      setSuccessModalOpen(true);
      fetchDossiers();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible d'enregistrer l'accusé de réception du dossier.",
      });
    }
  };

  const handleExportExcel = () => {
    exportDossiersToExcelDetailed(filteredDossiers, "Prescripteur_Dossiers");
  };

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_folder_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.new_supplier_id?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      filterType === "ALL" || d.new_document_type === filterType;

    let matchesStatus = filterStatus === "ALL";
    if (filterStatus === "30,40") {
      matchesStatus = d.new_status === 30 || d.new_status === 40;
    } else if (filterStatus === ">=50") {
      matchesStatus = d.new_status >= 50 && d.new_status !== 90;
    } else if (filterStatus !== "ALL") {
      matchesStatus = d.new_status === Number(filterStatus);
    }

    const matchesFournisseur = matchesSupplierFilter(d.new_supplier_id, filterFournisseur);

    const matchesDate =
      !filterDate || d.new_reception_date.startsWith(filterDate);

    return matchesSearch && matchesType && matchesStatus && matchesFournisseur && matchesDate;
  });

  const totalPages = Math.ceil(filteredDossiers.length / ITEMS_PER_PAGE);
  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="w-full h-[calc(100vh-112px)] sm:h-[calc(100vh-128px)] md:h-[calc(100vh-144px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
              <FileText className="w-8 h-8 text-primary dark:text-blue-400" />
            </div>
            Dossiers Assignés
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 ml-14">
            Consultez, accusez réception et validez les dossiers qui vous sont affectés.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow flex flex-col flex-1 min-h-0 overflow-hidden">
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
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              <Filter className="w-4 h-4" /> Filtres avancés
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Download className="w-4 h-4" /> Exporter au format Excel
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
                <option value={100}>Facture</option>
                <option value={200}>Avoir</option>
                <option value={500}>Acompte</option>
                <option value={600}>Courrier</option>
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
                <option value="90">{getDossierStatusLabel(90)} (90)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fournisseur
              </label>
              <SupplierFilterInput value={filterFournisseur} onValueChange={setFilterFournisseur} />
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
                  setFilterFournisseur("");
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
        <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-[#0F172B]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700">
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
                paginatedDossiers.map((dossier) => (
                  <tr
                    key={dossier.new_folderid}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center font-bold">
                          {getTypeIcon(dossier.new_document_type)}
                        </div>
                        <div>
                          <Link
                            to={`/prescripteur/dossiers/${dossier.new_folderid}`}
                            className="font-bold text-primary hover:underline hover:text-primary-hover"
                          >
                            {dossier.new_folder_number}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {dossier.new_document_type === 600 ? (
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {dossier.new_livreur_nom || "-"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {dossier.new_supplier_id || "-"}
                          </span>
                        </div>
                      )}
                      <div className="mt-1">{getTypeBadge(dossier.new_document_type)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                          <span>Reçu: {format(parseISO(dossier.new_reception_date), "dd MMM yyyy", { locale: fr })}</span>
                        </div>
                        {dossier.new_document_type === 600 ? (
                          dossier.new_date_livraison && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Livré: {format(parseISO(dossier.new_date_livraison), "dd MMM yyyy", { locale: fr })}</span>
                            </div>
                          )
                        ) : (
                          dossier.new_invoice_date && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Doc: {format(parseISO(dossier.new_invoice_date), "dd MMM yyyy", { locale: fr })}</span>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {dossier.new_invoice_number || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatutBadge(dossier.new_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dossier.new_status === 30 && (
                          <button
                            onClick={() => handleAccuse(dossier)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Accuser
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/prescripteur/dossiers/${dossier.new_folderid}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                        >
                          <Eye className="w-4 h-4" /> {dossier.new_status === 40 ? "Traiter" : "Détails"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172B] flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div>
              Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredDossiers.length)} sur{" "}
              {filteredDossiers.length} résultats
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md font-medium transition-colors ${currentPage === i + 1
                      ? "bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400"
                      : "dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <SuccessConfirmationModal open={successModalOpen} message={successMessage} onClose={() => setSuccessModalOpen(false)} />
    </div>
  );
}

function getTypeIcon(type: number) {
  switch (type) {
    case 100: return <FileText className="w-5 h-5" />;
    case 200: return <FileText className="w-5 h-5 text-orange-500" />;
    case 500: return <FileText className="w-5 h-5 text-rose-500" />;
    case 600: return <FileText className="w-5 h-5 text-slate-500" />;
    default: return <FileText className="w-5 h-5" />;
  }
}

function getTypeBadge(type: number) {
  switch (type) {
    case 100: return <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">FACTURE</span>;
    case 200: return <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">AVOIR</span>;
    case 500: return <span className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">ACOMPTE</span>;
    case 600: return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border border-slate-200">COURRIER</span>;
    default: return <span className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">AUTRE</span>;
  }
}

function getStatutBadge(statut: number) {
  switch (statut) {
    case 30: return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold">À réceptionner</span>;
    case 40: return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold">Chez vous</span>;
    case 90: return <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-bold">{getDossierStatusLabel(90)}</span>;
    default: return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">En cours</span>;
  }
}


