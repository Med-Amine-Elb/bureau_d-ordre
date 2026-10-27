import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import TransmissionModal from "@/components/TransmissionModal";
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  Pencil,
  Send,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import DossierDetailDrawer from "@/components/DossierDetailDrawer";
import SuccessConfirmationModal from "@/components/SuccessConfirmationModal";
import SupplierFilterInput from "@/components/SupplierFilterInput";
import { matchesSupplierFilter } from "@/lib/supplierFilter";
import { getDossierStatusLabel } from "@/lib/statusLabels";
import { exportDossiersToExcelDetailed } from "@/utils/excelExport";

export default function DossiersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(
    !!location.state?.filterStatus,
  );
  const [filterType, setFilterType] = useState<number | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<number | string | "ALL">(
    location.state?.filterStatus || "ALL",
  );
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // States for Transmission Modal
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [selectedDossierForTransmission, setSelectedDossierForTransmission] = useState<Dossier | null>(null);
  const [transmissionTargetRole, setTransmissionTargetRole] = useState<"Prescripteur" | "DCF">("Prescripteur");
  const [transmissionInitialCollector, setTransmissionInitialCollector] = useState("");

  // New SBM Table UX states
  const [density] = useState<"comfortable" | "compact">("compact");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedDossiers, setSelectedDossiers] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDossierIdForDrawer, setSelectedDossierIdForDrawer] = useState<string | null>(null);

  // Visible columns state, persisted in localStorage
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("bo_dossiers_visible_columns");
    return saved ? JSON.parse(saved) : ["folder", "type", "supplier", "company", "prescriber", "dates", "status"];
  });

  // Save visible columns configuration to localStorage
  useEffect(() => {
    localStorage.setItem("bo_dossiers_visible_columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const handleExportExcel = () => {
    exportDossiersToExcelDetailed(filteredDossiers, "BO_Dossiers");
  };

  const handleBulkTransmit = async () => {
    setLoading(true);
    try {
      let count = 0;
      let skipped = 0;
      let couriersClosed = 0;
      for (const id of selectedDossiers) {
        const dossier = dossiers.find(d => d.new_folderid === id);
        if (dossier && (dossier.new_status === 10 || dossier.new_status === 60)) {
          if (dossier.new_document_type === 600) {
            await dataService.completeCourierDelivery(dossier.new_folderid);
            couriersClosed++;
            continue;
          }
          const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
          const isReturningFromPrescripteur = dossier.new_status === 60;
          const isToDCF = isFluxCourt || isReturningFromPrescripteur;
          const nextStatus = isToDCF ? 70 : 30;
          const collectorId = isToDCF
            ? dossier.new_dcf_collector_guid
            : dossier.new_prescriber_guid;
          if (!collectorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collectorId)) {
            skipped++;
            continue;
          }
          await dataService.transmitDossier({
            folderId: dossier.new_folderid,
            folderNumber: dossier.new_folder_number,
            dossierChanges: {
              new_status: nextStatus,
              ...(isToDCF ? { new_dcf_collector_id: collectorId } : { new_prescriber_id: collectorId }),
            },
            fromRole: "BO",
            toRole: isToDCF ? "DCF" : "Prescripteur",
            collectorId,
          });
          count++;
        }
      }
      setSuccessMessage(`${count} dossier(s) transmis${couriersClosed ? ` ; ${couriersClosed} courrier(s) clôturé(s)` : ""}${skipped ? ` ; ${skipped} ignoré(s), destinataire non identifié` : ""}.`);
      setSuccessModalOpen(true);
      setSelectedDossiers([]);
      const result = await dataService.getDossiers();
      setDossiers(result);
    } catch (e) {
      toast.error("Erreur lors de la transmission groupée.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAccuse = async () => {
    setLoading(true);
    try {
      let count = 0;
      const getXrm = () => {
        if ((window as any).Xrm) return (window as any).Xrm;
        try {
          if (window.parent && (window.parent as any).Xrm) {
            return (window.parent as any).Xrm;
          }
        } catch (e) { }
        return null;
      };
      const context = getXrm() ? getXrm().Utility.getGlobalContext() : null;
      const userName = context ? context.userSettings.userName : "Agent BO";

      for (const id of selectedDossiers) {
        const dossier = dossiers.find(d => d.new_folderid === id);
        if (dossier && dossier.new_status === 50) {
          await dataService.accuseReception(dossier.new_folderid, 60, userName);
          count++;
        }
      }
      setSuccessMessage(`${count} réception(s) confirmée(s).`);
      setSuccessModalOpen(true);
      setSelectedDossiers([]);
      const result = await dataService.getDossiers();
      setDossiers(result);
    } catch (e) {
      toast.error("Erreur lors de l'accusé de réception groupé.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleTransmit = (dossier: Dossier) => {
    const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
    const isReturningFromPrescripteur = dossier.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;

    setSelectedDossierForTransmission(dossier);
    setTransmissionTargetRole(isToDCF ? "DCF" : "Prescripteur");
    setTransmissionInitialCollector(isToDCF ? (dossier.new_dcf_collector_guid || "") : (dossier.new_prescriber_guid || ""));
    setShowTransmissionModal(true);
  };

  const handleDeliverCourier = async (dossier: Dossier) => {
    setLoading(true);
    try {
      await dataService.completeCourierDelivery(dossier.new_folderid);
      setSuccessMessage(`Courrier ${dossier.new_folder_number} livré. Dossier clôturé.`);
      setSuccessModalOpen(true);
      setDossiers(await dataService.getDossiers());
    } catch (error) {
      toast.error("Impossible de clôturer le courrier.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransmission = async (data: { collecteur: string; commentaire: string }) => {
    if (!selectedDossierForTransmission) return;
    setShowTransmissionModal(false);
    setLoading(true);

    const isFluxCourt = selectedDossierForTransmission.new_document_type === 400 || selectedDossierForTransmission.new_document_type === 500;
    const isReturningFromPrescripteur = selectedDossierForTransmission.new_status === 60;
    const isToDCF = isFluxCourt || isReturningFromPrescripteur;
    const nextStatus = isToDCF ? 70 : 30;

    try {
      const payload: Partial<Dossier> = {
        new_status: nextStatus,
        ...(isToDCF ? { new_dcf_collector_id: data.collecteur } : { new_prescriber_id: data.collecteur }),
        new_description: data.commentaire
          ? `${selectedDossierForTransmission.new_description ? selectedDossierForTransmission.new_description + " | " : ""}Transmission : ${data.commentaire}`
          : selectedDossierForTransmission.new_description
      };

      await dataService.transmitDossier({
        folderId: selectedDossierForTransmission.new_folderid,
        folderNumber: selectedDossierForTransmission.new_folder_number,
        dossierChanges: payload,
        fromRole: "BO",
        toRole: isToDCF ? "DCF" : "Prescripteur",
        collectorId: data.collecteur,
        sendingComment: data.commentaire,
      });
      setSuccessMessage("Dossier transmis.");
      setSuccessModalOpen(true);
      const updated = await dataService.getDossiers();
      setDossiers(updated);
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de transmettre le dossier.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(
        dossier.new_folderid,
        60,
        "Med Amine (Liste)",
      );
      setSuccessMessage("Réception confirmée.");
      setSuccessModalOpen(true);
      const updated = await dataService.getDossiers();
      setDossiers(updated);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const getTypeBadge = (type: number) => {
    switch (type) {
      case 100:
        return (
          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            FACTURE
          </span>
        );
      case 200:
        return (
          <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            AVOIR
          </span>
        );
      case 500:
        return (
          <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            ACOMPTE
          </span>
        );
      case 600:
        return (
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border border-slate-200">
            COURRIER
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            AUTRE
          </span>
        );
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 10:
        return (
          <span className="flex items-center gap-1.5 text-slate-600">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>{getDossierStatusLabel(10)}
          </span>
        );
      case 20:
        return (
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>Hors délai
          </span>
        );
      case 30:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>{getDossierStatusLabel(30)}
          </span>
        );
      case 40:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>{getDossierStatusLabel(40)}
          </span>
        );
      case 50:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>{getDossierStatusLabel(50)}
          </span>
        );
      case 60:
        return (
          <span className="flex items-center gap-1.5 text-emerald-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{getDossierStatusLabel(60)}
          </span>
        );
      case 70:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>{getDossierStatusLabel(70)}
          </span>
        );
      case 80:
        return (
          <span className="flex items-center gap-1.5 text-purple-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>{getDossierStatusLabel(80)}
          </span>
        );
      case 90:
        return (
          <span className="flex items-center gap-1.5 text-orange-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>{getDossierStatusLabel(90)}
          </span>
        );
      case 100:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>{getDossierStatusLabel(100)}
          </span>
        );
      case 110:
        return (
          <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-primary"></div>{getDossierStatusLabel(110)}
          </span>
        );
      case 120:
        return (
          <span className="flex items-center gap-1.5 text-blue-700 font-bold tracking-tight">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            {getDossierStatusLabel(120)}
          </span>
        );
      case 130:
        return (
          <span className="flex items-center gap-1.5 text-orange-600">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>{getDossierStatusLabel(130)}
          </span>
        );
      case 140:
        return (
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            {getDossierStatusLabel(140)}
          </span>
        );
      case 150:
        return (
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            {getDossierStatusLabel(150)}
          </span>
        );
      case 160:
        return (
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Payé-Avance
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-slate-600">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>Statut:{" "}
            {status}
          </span>
        );
    }
  };

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_folder_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.new_supplier_id?.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "ALL" || d.new_document_type === filterType;

    let matchesStatus = filterStatus === "ALL";
    if (filterStatus === "EN_COURS") {
      matchesStatus = d.new_status !== 150 && d.new_status !== 20;
    } else if (filterStatus === "CHEQUES") {
      matchesStatus = d.new_status > 70 && d.new_status < 150;
    } else if (filterStatus !== "ALL") {
      matchesStatus = d.new_status === Number(filterStatus);
    }

    const matchesFournisseur = matchesSupplierFilter(d.new_supplier_id, filterFournisseur);
    const matchesDate =
      !filterDate || d.new_reception_date.startsWith(filterDate);

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesFournisseur &&
      matchesDate
    );
  });

  const pageCount = Math.max(1, Math.ceil(filteredDossiers.length / pageSize));
  const pageDossiers = filteredDossiers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisibleDossier = filteredDossiers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleDossier = Math.min(currentPage * pageSize, filteredDossiers.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterStatus, filterFournisseur, filterDate]);

  useEffect(() => {
    setCurrentPage(page => Math.min(page, pageCount));
  }, [pageCount]);

  return (
    <div className="w-full h-[calc(100vh-112px)] sm:h-[calc(100vh-128px)] md:h-[calc(100vh-144px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
            Liste des dossiers
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Recherche et gestion de tous les dossiers fournisseurs.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/bo/dossiers/nouveau")}
            className="bg-primary hover:bg-primary-hover
          dark:bg-blue-800 dark:hover:bg-blue-900 dark:border dark:border-blue-700
          text-white rounded-lg px-6 py-2 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2 shadow-primary/20"
          >
            + Nouveau Dossier
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white dark:bg-[#0F172B] p-4 rounded-t-2xl border-x border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° Dossier, Fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-black dark:text-slate-200 placeholder:text-black/60 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Download className="w-4 h-4" /> Exporter au format Excel
          </button>
          {/* Column Visibility Filter */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "columns" ? null : "columns")}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              title="Personnaliser les colonnes"
            >
              <Eye className="w-4 h-4" /> Colonnes
            </button>

            {activeDropdown === "columns" && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-20 py-3 px-4 space-y-2 animate-in zoom-in-95 duration-100 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Colonnes à afficher</p>
                  {[
                    { id: "folder", label: "N° Dossier" },
                    { id: "type", label: "Type / Document" },
                    { id: "supplier", label: "Fournisseur" },
                    { id: "company", label: "Société / Direction" },
                    { id: "prescriber", label: "Prescripteur" },
                    { id: "dates", label: "Dates (Fact. / Réc.)" },
                    { id: "status", label: "Statut" }
                  ].map(col => {
                    const isChecked = visibleColumns.includes(col.id);
                    return (
                      <label key={col.id} className="flex items-center gap-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 px-2 rounded-lg cursor-pointer transition-colors w-full">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (visibleColumns.length > 1) {
                                setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                              } else {
                                toast.warning("Au moins une colonne doit rester visible.");
                              }
                            } else {
                              setVisibleColumns([...visibleColumns, col.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/10 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-[#0F172B] border-x border-t border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-6 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Type de Document
            </label>
            <select
              className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
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
              <option value="500">Acompte</option>
              <option value="600">Courrier</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Statut du Dossier
            </label>
            <select
              className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_COURS">Dossiers en cours</option>
              <option value="10">{getDossierStatusLabel(10)}</option>
              <option value="20">Hors délai</option>
              <option value="30">{getDossierStatusLabel(30)}</option>
              <option value="40">{getDossierStatusLabel(40)}</option>
              <option value="50">{getDossierStatusLabel(50)}</option>
              <option value="60">{getDossierStatusLabel(60)}</option>
              <option value="70">{getDossierStatusLabel(70)}</option>
              <option value="80">{getDossierStatusLabel(80)}</option>
              <option value="90">{getDossierStatusLabel(90)}</option>
              <option value="100">{getDossierStatusLabel(100)}</option>
              <option value="110">{getDossierStatusLabel(110)}</option>
              <option value="120">{getDossierStatusLabel(120)}</option>
              <option value="130">{getDossierStatusLabel(130)}</option>
              <option value="140">{getDossierStatusLabel(140)}</option>
              <option value="150">{getDossierStatusLabel(150)}</option>
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
              className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
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
      <div className="bg-white dark:bg-[#0F172B] rounded-b-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className={`w-10 px-4 ${density === "comfortable" ? "py-4" : "py-2"}`}>
                <input
                  type="checkbox"
                  checked={pageDossiers.length > 0 && pageDossiers.every(d => selectedDossiers.includes(d.new_folderid))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDossiers(current => Array.from(new Set([...current, ...pageDossiers.map(d => d.new_folderid)])));
                    } else {
                      setSelectedDossiers(current => current.filter(id => !pageDossiers.some(d => d.new_folderid === id)));
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                />
              </th>
              {visibleColumns.includes("folder") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Dossier
                </th>
              )}
              {visibleColumns.includes("type") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Type / Document
                </th>
              )}
              {visibleColumns.includes("supplier") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Fournisseur
                </th>
              )}
              {visibleColumns.includes("company") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Société / Direction
                </th>
              )}
              {visibleColumns.includes("prescriber") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Prescripteur
                </th>
              )}
              {visibleColumns.includes("dates") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Dates (Fact. / Réc.)
                </th>
              )}
              {visibleColumns.includes("status") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Statut
                </th>
              )}
              <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                }`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-12 text-center text-slate-400">
                  Chargement des données...
                </td>
              </tr>
            ) : filteredDossiers.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  Aucun dossier trouvé.
                </td>
              </tr>
            ) : (
              pageDossiers.map((dossier) => (
                <tr
                  key={dossier.new_folderid}
                  className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group ${selectedDossiers.includes(dossier.new_folderid) ? "bg-slate-50/50 dark:bg-slate-900/10" : ""
                    }`}
                >
                  <td className={`w-10 px-4 ${density === "comfortable" ? "py-4" : "py-2"}`}>
                    <input
                      type="checkbox"
                      checked={selectedDossiers.includes(dossier.new_folderid)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDossiers([...selectedDossiers, dossier.new_folderid]);
                        } else {
                          setSelectedDossiers(selectedDossiers.filter(id => id !== dossier.new_folderid));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-350 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </td>
                  {visibleColumns.includes("folder") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setSelectedDossierIdForDrawer(dossier.new_folderid);
                              setDrawerOpen(true);
                            }}
                            className="font-semibold text-primary hover:underline text-sm text-left whitespace-nowrap block cursor-pointer"
                          >
                            {dossier.new_folder_number}
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {dossier.new_payment_method && (
                              <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border ${dossier.new_payment_method === 2
                                  ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                                  : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                }`}>
                                {dossier.new_payment_method === 2 ? "VIREMENT" : "CHÈQUE"}
                              </span>
                            )}
                            {dossier.new_is_blocked && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-red-500 font-bold px-1.5 py-0.5 rounded border border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                                <AlertTriangle className="w-2.5 h-2.5" /> BLOQUÉ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("type") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"}`}>
                      <div className="flex flex-col items-start gap-1">
                        {getTypeBadge(dossier.new_document_type)}
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase ml-2.5">
                          {dossier.new_invoice_number || "N/A"}
                        </span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("supplier") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"}`}>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {dossier.new_document_type === 600 ? "Non applicable" : dossier.new_supplier_id || "Non renseigné"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("company") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"}`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dossier.new_company_id || "N/A"}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                          {dossier.new_department_id || "N/A"}
                        </span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("prescriber") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"}`}>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">
                        {dossier.new_prescriber_id || "Non assigné"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("dates") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"}`}>
                      <div className="flex flex-col text-[11px]">
                        {dossier.new_document_type === 600 ? (
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">
                            Livraison:{" "}
                            {dossier.new_date_livraison
                              ? new Date(
                                dossier.new_date_livraison,
                              ).toLocaleDateString("fr-FR")
                              : "N/A"}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">
                            Doc:{" "}
                            {dossier.new_invoice_date
                              ? new Date(
                                dossier.new_invoice_date,
                              ).toLocaleDateString("fr-FR")
                              : "N/A"}
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          Réc:{" "}
                          {new Date(
                            dossier.new_reception_date,
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("status") && (
                    <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"} text-sm`}>
                      {getStatusBadge(dossier.new_status)}
                    </td>
                  )}
                  <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"} text-right whitespace-nowrap`}>
                    <div className="flex items-center justify-end gap-2">
                      {/* Le dossier peut être modifié tant qu'il est encore chez le BO (statut 10). */}
                      {dossier.new_status === 10 && (
                        <button
                          onClick={() => {
                            navigate("/bo/dossiers/nouveau", {
                              state: { editDossier: dossier },
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                          title="Modifier le dossier"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Modifier
                        </button>
                      )}

                      {/* Les courriers sont livrés/clôturés au BO ; les autres dossiers sont transmis au prochain rôle. */}
                      {(dossier.new_status === 10 || dossier.new_status === 60) && (
                        <button
                          onClick={() => dossier.new_document_type === 600 ? handleDeliverCourier(dossier) : handleTransmit(dossier)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
                        >
                          {dossier.new_document_type === 600
                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Marquer livré</>
                            : <><Send className="w-3.5 h-3.5" /> Transmettre</>}
                        </button>
                      )}

                      {/* Bouton Accuser Réception: Visible uniquement si le dossier est en Transit BO (Statut 50) */}
                      {dossier.new_status === 50 && (
                        <button
                          onClick={() => handleAccuse(dossier)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                          Réception
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0F172B]">
          <div>
            Affichage de {firstVisibleDossier} à {lastVisibleDossier} sur{" "}
            {filteredDossiers.length} résultats
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span className="px-3 py-1 text-slate-600 dark:text-slate-300" aria-current="page">
              Page {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              disabled={currentPage >= pageCount}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
      <SuccessConfirmationModal open={successModalOpen} message={successMessage} onClose={() => setSuccessModalOpen(false)} />

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={selectedDossierForTransmission?.new_folder_number || ""}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
        directionId={selectedDossierForTransmission?.new_department_guid}
      />

      {/* Floating Bulk Actions Bar */}
      {selectedDossiers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur text-white px-6 py-4 rounded-2xl flex items-center justify-between gap-8 shadow-2xl border border-slate-805 animate-in slide-in-from-bottom-8 duration-300 z-40 max-w-2xl w-[90%]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold text-slate-100">
              {selectedDossiers.length} {selectedDossiers.length > 1 ? "dossiers sélectionnés" : "dossier sélectionné"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkAccuse}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accuser réception
            </button>
            <button
              onClick={handleBulkTransmit}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-primary/10 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Transmettre
            </button>
            <button
              onClick={() => setSelectedDossiers([])}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Details Slide-over Drawer */}
      <DossierDetailDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDossierIdForDrawer(null);
        }}
        dossierId={selectedDossierIdForDrawer}
        onRefresh={async () => {
          const result = await dataService.getDossiers();
          setDossiers(result);
        }}
      />
    </div>
  );
}


