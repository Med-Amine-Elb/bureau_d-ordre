import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  FileText,
  AlertTriangle,
  Pencil,
  Send,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

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

  const handleTransmit = async (dossier: Dossier) => {
    const nextStatus =
      dossier.new_type_document === 400 || dossier.new_type_document === 500
        ? 70
        : 30;

    try {
      await dataService.updateDossier(dossier.new_dossierid, {
        new_statut: nextStatus,
      });
      setSuccessMessage(
        `Le dossier ${dossier.new_numero_dossier} a été transmis avec succès vers ${nextStatus === 70 ? "la DCF" : "le Prescripteur"}.`,
      );
      setSuccessModalOpen(true);
      const updated = await dataService.getDossiers();
      setDossiers(updated);
    } catch (err) {
      toast.error("Erreur", {
        description: "Impossible de transmettre le dossier.",
      });
    }
  };

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(
        dossier.new_dossierid,
        60,
        "Med Amine (Liste)",
      );
      setSuccessMessage(
        `Réception accusée pour le dossier ${dossier.new_numero_dossier}. Il est maintenant prêt pour la DCF.`,
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
      case 300:
        return (
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            CONTRAT
          </span>
        );
      case 400:
        return (
          <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            DEMANDE CHÈQUE
          </span>
        );
      case 500:
        return (
          <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            ACOMPTE
          </span>
        );
      default:
        return (
          <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
            INCONNU
          </span>
        );
    }
  };

  const getStatusBadge = (status: number) => {
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
            <div className="w-2 h-2 rounded-full bg-red-500"></div>Rejeté 5
            Jours
          </span>
        );
      case 30:
        return (
          <span className="flex items-center gap-1.5 text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit
            Prescripteur
          </span>
        );
      case 40:
        return (
          <span className="flex items-center gap-1.5 text-indigo-600">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>Chez
            Prescripteur
          </span>
        );
      case 50:
        return (
          <span className="flex items-center gap-1.5 text-blue-600">
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
          <span className="flex items-center gap-1.5 text-blue-600">
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
          <span className="flex items-center gap-1.5 text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Transit
            Trésorerie
          </span>
        );
      case 110:
        return (
          <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>Chez
            Trésorerie
          </span>
        );
      case 120:
        return (
          <span className="flex items-center gap-1.5 text-blue-700 font-bold tracking-tight">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
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
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>Payé
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
    new Set(dossiers.map((d) => d.new_fournisseur_nom).filter(Boolean)),
  ).sort();

  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.new_numero_dossier?.toLowerCase().includes(search.toLowerCase()) ||
      d.new_fournisseur_nom?.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "ALL" || d.new_type_document === filterType;

    let matchesStatus = filterStatus === "ALL";
    if (filterStatus === "EN_COURS") {
      matchesStatus = d.new_statut !== 150 && d.new_statut !== 20;
    } else if (filterStatus === "CHEQUES") {
      matchesStatus = d.new_statut > 70 && d.new_statut < 150;
    } else if (filterStatus !== "ALL") {
      matchesStatus = d.new_statut === Number(filterStatus);
    }

    const matchesFournisseur =
      filterFournisseur === "ALL" ||
      d.new_fournisseur_nom === filterFournisseur;
    const matchesDate =
      !filterDate || d.new_date_reception.startsWith(filterDate);

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesFournisseur &&
      matchesDate
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            className="bg-blue-600 hover:bg-blue-700
          dark:bg-blue-800 dark:hover:bg-blue-900 dark:border dark:border-blue-700
          text-white rounded-lg px-6 py-2 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2 shadow-blue-500/20"
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
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Filter className="w-4 h-4" /> Filtres Avancés
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate.300 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download className="w-4 h-4" /> Exporter Excel
          </button>
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
              <option value="300">Contrat</option>
              <option value="400">Demande de Chèque</option>
              <option value="500">Acompte</option>
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
              <option value="20">Rejeté 5 Jours</option>
              <option value="30">Transit Prescripteur</option>
              <option value="40">Chez Prescripteur</option>
              <option value="50">Validé Prescripteur</option>
              <option value="60">Rejeté Prescripteur</option>
              <option value="70">Transit DCF</option>
              <option value="80">Chez DCF</option>
              <option value="CHEQUES">Chèques en attente</option>
              <option value="150">Payé</option>
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
      <div className="bg-white dark:bg-[#0F172B] rounded-b-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dossier
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Type / Document
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fournisseur
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Société / Direction
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Prescripteur
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dates (Fact. / Réc.)
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Chargement des données...
                </td>
              </tr>
            ) : filteredDossiers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  Aucun dossier trouvé.
                </td>
              </tr>
            ) : (
              filteredDossiers.map((dossier) => (
                <tr
                  key={dossier.new_dossierid}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                          {dossier.new_numero_dossier}
                        </div>
                        {dossier.new_est_bloque && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> BLOQUÉ
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      {getTypeBadge(dossier.new_type_document)}
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase ml-2.5">
                        {dossier.new_numero_facture || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {dossier.new_fournisseur_nom || "Non renseigné"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {dossier.new_societe_gbm || "GBM"}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {dossier.new_direction || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">
                      {dossier.new_prescripteur || "Non assigné"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-[11px]">
                      <span className="text-slate-400 dark:text-slate-500">
                        Doc:{" "}
                        {dossier.new_date_facture
                          ? new Date(
                              dossier.new_date_facture,
                            ).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">
                        Réc:{" "}
                        {new Date(
                          dossier.new_date_reception,
                        ).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(dossier.new_statut)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* Bouton Transmettre: Visible uniquement si le dossier est Chez BO (Sauvegarder) */}
                      {dossier.new_statut === 10 && (
                        <button
                          onClick={() => handleTransmit(dossier)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                          <Send className="w-3.5 h-3.5" /> Transmettre
                        </button>
                      )}

                      {/* Bouton Accuser Réception: Visible uniquement si le dossier est en Transit BO (Statut 50) */}
                      {dossier.new_statut === 50 && (
                        <button
                          onClick={() => handleAccuse(dossier)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                          Réception
                        </button>
                      )}

                      {/* Menu contextuel (3 points) */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === dossier.new_dossierid
                                ? null
                                : dossier.new_dossierid,
                            )
                          }
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            activeDropdown === dossier.new_dossierid
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeDropdown === dossier.new_dossierid && (
                          <>
                            {/* Overlay invisible pour fermer au clic extérieur */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden py-1.5 animate-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  navigate(
                                    `/bo/dossiers/${dossier.new_dossierid}`,
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-blue-500" /> Aperçu
                                / Consulter
                              </button>

                              {/* Modifier uniquement si non encore transmis (Statut 10) */}
                              {dossier.new_statut === 10 && (
                                <button
                                  onClick={() => {
                                    navigate("/bo/dossiers/nouveau", {
                                      state: { editDossier: dossier },
                                    });
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-50 dark:border-slate-800"
                                >
                                  <Pencil className="w-4 h-4 text-amber-500" />{" "}
                                  Modifier le dossier
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
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
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
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
    </div>
  );
}
