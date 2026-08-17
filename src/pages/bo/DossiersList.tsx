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
  List,
} from "lucide-react";
import { toast } from "sonner";
import DossierDetailDrawer from "@/components/DossierDetailDrawer";
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
  const [filterFournisseur, setFilterFournisseur] = useState<string>("ALL");
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
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
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
      for (const id of selectedDossiers) {
        const dossier = dossiers.find(d => d.new_folderid === id);
        if (dossier && (dossier.new_status === 10 || dossier.new_status === 60)) {
          const isFluxCourt = dossier.new_document_type === 400 || dossier.new_document_type === 500;
          const isReturningFromPrescripteur = dossier.new_status === 60;
          const isToDCF = isFluxCourt || isReturningFromPrescripteur;
          const nextStatus = isToDCF ? 70 : 30;
          const collector = isToDCF ? (dossier.new_dcf_collector_id || "DCF Agent") : (dossier.new_prescriber_id || "Prescripteur Agent");

          await dataService.updateDossier(dossier.new_folderid, {
            new_status: nextStatus,
            ...(isToDCF ? { new_dcf_collector_id: collector } : { new_prescriber_id: collector })
          });
          count++;
        }
      }
      toast.success(`${count} dossiers transmis avec succès.`);
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
      toast.success(`${count} réceptions accusées avec succès.`);
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
    setTransmissionInitialCollector(isToDCF ? (dossier.new_dcf_collector_id || "") : (dossier.new_prescriber_id || ""));
    setShowTransmissionModal(true);
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

      await dataService.updateDossier(selectedDossierForTransmission.new_folderid, payload);
      setSuccessMessage(
        `Le dossier ${selectedDossierForTransmission.new_folder_number} a été transmis avec succès vers ${nextStatus === 70 ? "la DCF" : "le Prescripteur"}.`,
      );
      setSuccessModalOpen(true);
      const updated = await dataService.getDossiers();
      setDossiers(updated);
    } catch (err) {
      toast.error("Erreur", {
        description: "Impossible de transmettre le dossier.",
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
      setSuccessMessage(
        `Réception accusée pour le dossier ${dossier.new_folder_number}. Il est maintenant prêt pour la DCF.`,
      );
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

  const getStatusBadge = (status: number, typeDocument?: number) => {
    switch (status) {
      case 10:
        return (
          <span className="flex items-center gap-1.5 text-slate-600">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>Sauvegarder
          </span>
        );
      case 20:
        return (
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>Hors Délai
          </span>
        );
      case 30:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit
            Prescripteur
          </span>
        );
      case 40:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>Chez
            Prescripteur
          </span>
        );
      case 50:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit BO
          </span>
        );
      case 60:
        return (
          <span className="flex items-center gap-1.5 text-emerald-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>Prêt DCF
          </span>
        );
      case 70:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit DCF
          </span>
        );
      case 80:
        return (
          <span className="flex items-center gap-1.5 text-purple-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>Chez DCF
          </span>
        );
      case 90:
        return (
          <span className="flex items-center gap-1.5 text-orange-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>Retour
            Correction
          </span>
        );
      case 100:
        return (
          <span className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit
            Trésorerie
          </span>
        );
      case 110:
        return (
          <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-primary"></div>Chez
            Trésorerie
          </span>
        );
      case 120:
        return (
          <span className="flex items-center gap-1.5 text-blue-700 font-bold tracking-tight">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            Attente Remise
          </span>
        );
      case 130:
        return (
          <span className="flex items-center gap-1.5 text-orange-600">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>En
            Transport
          </span>
        );
      case 140:
        return (
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Disponible Agence
          </span>
        );
      case 150:
        return (
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            {typeDocument === 600 ? "Livré (Clôturé)" : "Payé"}
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
    if (filterStatus === "EN_COURS") {
      matchesStatus = d.new_status !== 150 && d.new_status !== 20;
    } else if (filterStatus === "CHEQUES") {
      matchesStatus = d.new_status > 70 && d.new_status < 150;
    } else if (filterStatus !== "ALL") {
      matchesStatus = d.new_status === Number(filterStatus);
    }

    const matchesFournisseur =
      filterFournisseur === "ALL" ||
      d.new_supplier_id === filterFournisseur;
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

  return (
    <div className="w-full h-[calc(100vh-112px)] sm:h-[calc(100vh-128px)] md:h-[calc(100vh-144px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
            Liste des Dossiers
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
            <Filter className="w-4 h-4" /> Filtres Avancés
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Download className="w-4 h-4" /> Exporter Excel
          </button>
          <button
            onClick={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Ajuster la densité de la table"
          >
            <List className="w-4 h-4" /> {density === "comfortable" ? "Vue Compacte" : "Vue Aérée"}
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
                    { id: "supplier", label: "Fournisseur / Livreur" },
                    { id: "company", label: "Société / Destinataire" },
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
              <option value="10">Sauvegarder</option>
              <option value="20">Hors Délai</option>
              <option value="30">Transit Prescripteur</option>
              <option value="40">Chez Prescripteur</option>
              <option value="50">En Transit BO</option>
              <option value="60">Prêt DCF</option>
              <option value="70">Transit DCF</option>
              <option value="80">Chez DCF</option>
              <option value="90">Retour Correction</option>
              <option value="100">Transit Trésorerie</option>
              <option value="110">Chez Trésorerie</option>
              <option value="120">Attente Remise</option>
              <option value="130">En Transport</option>
              <option value="140">Disponible Agence</option>
              <option value="150">Payé / Clôturé</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fournisseur
            </label>
            <select
              className="w-full min-w-[200px] border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
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
      <div className="bg-white dark:bg-[#0F172B] rounded-b-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className={`w-10 px-4 ${density === "comfortable" ? "py-4" : "py-2"}`}>
                <input
                  type="checkbox"
                  checked={filteredDossiers.length > 0 && selectedDossiers.length === filteredDossiers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDossiers(filteredDossiers.map(d => d.new_folderid));
                    } else {
                      setSelectedDossiers([]);
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
                  Fournisseur / Livreur
                </th>
              )}
              {visibleColumns.includes("company") && (
                <th className={`text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"
                  }`}>
                  Société / Destinataire
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
              filteredDossiers.map((dossier) => (
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
                        {dossier.new_document_type === 600 ? dossier.new_livreur_nom || "N/A" : dossier.new_supplier_id || "Non renseigné"}
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
                      {getStatusBadge(dossier.new_status, dossier.new_document_type)}
                    </td>
                  )}
                  <td className={`${density === "comfortable" ? "px-6 py-4" : "px-4 py-2"} text-right whitespace-nowrap`}>
                    <div className="flex items-center justify-end gap-2">
                      {/* Bouton Modifier: Visible uniquement si le dossier est au statut Sauvegarder (Statut 10) */}
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

                      {/* Bouton Transmettre: Visible uniquement si le dossier est Chez BO (Sauvegarder) ou Prêt DCF (Statut 60) */}
                      {(dossier.new_status === 10 || dossier.new_status === 60) && (
                        <button
                          onClick={() => handleTransmit(dossier)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
                        >
                          <Send className="w-3.5 h-3.5" /> Transmettre
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div>
            Affichage de 1 à {filteredDossiers.length} sur{" "}
            {filteredDossiers.length} résultats
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              disabled
            >
              Précédent
            </button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
              2
            </button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
              Suivant
            </button>
          </div>
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
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {successMessage}
              </p>
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      <TransmissionModal
        isOpen={showTransmissionModal}
        onClose={() => setShowTransmissionModal(false)}
        onConfirm={handleConfirmTransmission}
        dossierNumber={selectedDossierForTransmission?.new_folder_number || ""}
        targetRole={transmissionTargetRole}
        initialCollector={transmissionInitialCollector}
        directionId={selectedDossierForTransmission?.new_department_id}
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
              <CheckCircle2 className="w-3.5 h-3.5" /> Accuser Réception
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


