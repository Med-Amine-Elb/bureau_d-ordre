import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  Package,
  Building,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  MapPin,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type { FournisseurLookup, AgenceLookup, SupplierInput } from "@/lib/dataService";
import CompanyDepartmentReferences from "@/components/CompanyDepartmentReferences";
import SupplierReferenceForm from "@/components/SupplierReferenceForm";
import SupplierImportDialog from "@/components/SupplierImportDialog";

export default function AdminReferences() {
  const [activeTab, setActiveTab] = useState<"fournisseurs" | "agences" | "societes" | "directions">("fournisseurs");
  const [savingFour, setSavingFour] = useState(false);
  const [savingAgence, setSavingAgence] = useState(false);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  
  // Suppliers state
  const [fournisseurs, setFournisseurs] = useState<FournisseurLookup[]>([]);
  const [fourSearch, setFourSearch] = useState("");
  const [showFourModal, setShowFourModal] = useState(false);
  const [showSupplierImport, setShowSupplierImport] = useState(false);
  const [editingFour, setEditingFour] = useState<FournisseurLookup>();
  const supplierReturnFocus = useRef<HTMLElement | null>(null);

  // Agencies state
  const [agences, setAgences] = useState<AgenceLookup[]>([]);
  const [agenceSearch, setAgenceSearch] = useState("");
  const [showAgenceModal, setShowAgenceModal] = useState(false);
  const [agenceName, setAgenceName] = useState("");
  const [agenceVille, setAgenceVille] = useState("");
  const [agenceActif, setAgenceActif] = useState(true);
  const [isEditingAgence, setIsEditingAgence] = useState(false);
  const [editingAgenceId, setEditingAgenceId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fourList, agList] = await Promise.allSettled([
        dataService.getFournisseursLookup(),
        dataService.getAgencesLookup()
      ]);
      const failures: string[] = [];
      if (fourList.status === "fulfilled") setFournisseurs(fourList.value);
      else failures.push("fournisseurs");
      if (agList.status === "fulfilled") setAgences(agList.value);
      else failures.push("agences");
      setLoadErrors(failures);
    } catch {
      toast.error("Erreur de chargement des tables de référence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Supplier handlers
  const handleOpenAddFour = (event: MouseEvent<HTMLButtonElement>) => {
    supplierReturnFocus.current = event.currentTarget;
    setEditingFour(undefined);
    setShowFourModal(true);
  };

  const handleOpenEditFour = (four: FournisseurLookup, event: MouseEvent<HTMLButtonElement>) => {
    supplierReturnFocus.current = event.currentTarget;
    setEditingFour(four);
    setShowFourModal(true);
  };

  const handleSaveFour = async (payload: SupplierInput) => {
    if (savingFour) return;
    setSavingFour(true);
    try {
      if (editingFour) {
        await dataService.updateFournisseurLookup(editingFour.new_supplierid, payload);
        toast.success("Fournisseur mis à jour.");
      } else {
        await dataService.createFournisseurLookup(payload);
        toast.success("Fournisseur ajouté avec succès.");
      }
      setShowFourModal(false);
      loadData();
    } catch {
      throw new Error("Enregistrement impossible. Vérifiez votre connexion, vos droits Dataverse et le rattachement choisi. Vos saisies sont conservées.");
    } finally {
      setSavingFour(false);
    }
  };

  const handleToggleFourStatus = async (four: FournisseurLookup) => {
    if (savingFour) return;
    setSavingFour(true);
    try {
      await dataService.updateFournisseurLookup(four.new_supplierid, {
        new_is_active: !four.new_is_active
      });
      toast.success(`Fournisseur ${four.new_is_active ? "désactivé" : "activé"}.`);
      loadData();
    } catch {
      toast.error("Erreur lors du changement de statut");
    } finally {
      setSavingFour(false);
    }
  };

  // Agency handlers
  const handleOpenAddAgence = () => {
    setIsEditingAgence(false);
    setEditingAgenceId(null);
    setAgenceName("");
    setAgenceVille("");
    setAgenceActif(true);
    setShowAgenceModal(true);
  };

  const handleOpenEditAgence = (age: AgenceLookup) => {
    setIsEditingAgence(true);
    setEditingAgenceId(age.new_branchid);
    setAgenceName(age.new_name);
    setAgenceVille(age.new_city);
    setAgenceActif(age.new_is_active);
    setShowAgenceModal(true);
  };

  const handleSaveAgence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAgence) return;
    if (!agenceName.trim() || !agenceVille.trim()) {
      toast.error("Le nom et la ville sont requis.");
      return;
    }

    const payload: Partial<AgenceLookup> = {
      new_name: agenceName.trim(),
      new_city: agenceVille.trim(),
      new_is_active: agenceActif
    };

    setSavingAgence(true);
    try {
      if (isEditingAgence && editingAgenceId) {
        await dataService.updateAgenceLookup(editingAgenceId, payload);
        toast.success("Agence régionale mise à jour.");
      } else {
        await dataService.createAgenceLookup(payload);
        toast.success("Agence régionale ajoutée avec succès.");
      }
      setShowAgenceModal(false);
      loadData();
    } catch {
      toast.error("Enregistrement impossible. Vérifiez votre connexion et vos droits Dataverse.");
    } finally {
      setSavingAgence(false);
    }
  };

  const handleToggleAgenceStatus = async (age: AgenceLookup) => {
    try {
      await dataService.updateAgenceLookup(age.new_branchid, {
        new_is_active: !age.new_is_active
      });
      toast.success(`Agence ${age.new_is_active ? "désactivée" : "activée"}.`);
      loadData();
    } catch {
      toast.error("Erreur lors du changement de statut");
    }
  };

  // Filter lists
  const filteredFournisseurs = fournisseurs.filter((f) =>
    f.new_name.toLowerCase().includes(fourSearch.toLowerCase()) ||
    f.new_code.toLowerCase().includes(fourSearch.toLowerCase())
  );

  const filteredAgences = agences.filter((a) =>
    a.new_name.toLowerCase().includes(agenceSearch.toLowerCase()) ||
    a.new_city.toLowerCase().includes(agenceSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tables de référence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gérez les fournisseurs, sociétés GBM, directions et agences utilisés dans les dossiers.
          </p>
        </div>
        {activeTab === "fournisseurs" ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowSupplierImport(true)}
              disabled={savingFour || loading || loadErrors.includes("fournisseurs")}
              className="flex items-center gap-2 rounded-xl border border-[#1F3B73] px-5 py-3 font-bold text-[#1F3B73] transition-all hover:bg-[#1F3B73]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300"
            >
              <Upload className="h-5 w-5" /> Importer un fichier Excel
            </button>
            <button
              onClick={handleOpenAddFour}
              disabled={savingFour}
              className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-sm shadow-[#1F3B73]/20 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" /> Ajouter un fournisseur
            </button>
          </div>
        ) : activeTab === "agences" ? (
          <button
            onClick={handleOpenAddAgence}
            className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-sm shadow-[#1F3B73]/20"
          >
            <Plus className="w-5 h-5" /> Ajouter une agence
          </button>
        ) : null}
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800" aria-label="Catégories de références">
        <button
          onClick={() => setActiveTab("fournisseurs")}
          aria-pressed={activeTab === "fournisseurs"}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-colors ${
            activeTab === "fournisseurs"
              ? "border-[#1F3B73] text-[#1F3B73] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-450 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" /> Fournisseurs
        </button>
        <button
          onClick={() => setActiveTab("agences")}
          aria-pressed={activeTab === "agences"}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-colors ${
            activeTab === "agences"
              ? "border-[#1F3B73] text-[#1F3B73] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-450 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
          }`}
        >
          <Building className="w-4 h-4" /> Agences régionales
        </button>
        {(["societes", "directions"] as const).map(tab => (
          <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={`flex shrink-0 items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors ${activeTab === tab ? "border-[#1F3B73] text-[#1F3B73] dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}>
            <Building className="h-4 w-4" />{tab === "societes" ? "Sociétés GBM" : "Directions"}
          </button>
        ))}
      </div>

      {(activeTab === "societes" || activeTab === "directions") && <CompanyDepartmentReferences key={activeTab} kind={activeTab} />}
      {(activeTab === "fournisseurs" || activeTab === "agences") && <>
      {loadErrors.length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">Impossible de charger : {loadErrors.join(", ")}. Vérifiez votre connexion et vos droits. <button type="button" onClick={() => void loadData()} disabled={loading} className="ml-2 font-bold underline disabled:opacity-50">Réessayer</button></div>}

      {/* Main Content Area */}
      {activeTab === "fournisseurs" ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                aria-label="Rechercher un fournisseur"
                placeholder="Rechercher par raison sociale ou identifiant fiscal..."
                value={fourSearch}
                onChange={(e) => setFourSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 transition-all text-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Supplier Grid */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des fournisseurs...</div>
            ) : filteredFournisseurs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Aucun fournisseur trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                      <th className="py-4 px-6">Nom du fournisseur</th>
                      <th className="py-4 px-6">Identifiant fiscal</th>
                      <th className="py-4 px-6">Coordonnées</th>
                      <th className="py-4 px-6">Statut d'activité</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredFournisseurs.map((f) => (
                      <tr key={f.new_supplierid} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-100">
                          {f.new_name}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/40 px-2.5 py-1 rounded w-fit">
                          {f.new_code}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400"><div>{f.new_email || "E-mail non renseigné"}</div><div className="mt-1">{f.new_phone || "Téléphone non renseigné"}</div><div className="mt-1">{f.new_city}</div></td>
                        <td className="py-4 px-6">
                          {f.new_is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                              <XCircle className="w-3.5 h-3.5" /> Inactif (Bloqué)
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={event => handleOpenEditFour(f, event)}
                              disabled={savingFour}
                              className="p-2 text-slate-400 hover:text-[#1F3B73] hover:bg-[#1F3B73]/5 rounded-lg transition-colors"
                              title="Modifier fournisseur"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleFourStatus(f)}
                              disabled={savingFour}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                f.new_is_active
                                  ? "bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100"
                                  : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 hover:bg-emerald-100"
                              }`}
                            >
                              {f.new_is_active ? "Désactiver" : "Activer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une agence par nom ou ville..."
                value={agenceSearch}
                onChange={(e) => setAgenceSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 transition-all text-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Agencies Grid */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des agences...</div>
            ) : filteredAgences.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Aucune agence trouvée.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                      <th className="py-4 px-6">ID unique (Dataverse GUID)</th>
                      <th className="py-4 px-6">Nom de l'Agence</th>
                      <th className="py-4 px-6">Ville</th>
                      <th className="py-4 px-6">Statut d'activité</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredAgences.map((a) => (
                      <tr key={a.new_branchid} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {a.new_branchid}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-rose-500" />
                            {a.new_name}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-650 dark:text-slate-355 font-semibold">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {a.new_city}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {a.new_is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditAgence(a)}
                              className="p-2 text-slate-400 hover:text-[#1F3B73] hover:bg-[#1F3B73]/5 rounded-lg transition-colors"
                              title="Modifier l'agence"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleAgenceStatus(a)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                a.new_is_active
                                  ? "bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100"
                                  : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 hover:bg-emerald-100"
                              }`}
                            >
                              {a.new_is_active ? "Désactiver" : "Activer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      </>}

      {/* Supplier Modal */}
      {showFourModal && <SupplierReferenceForm initial={editingFour} pending={savingFour} onClose={() => setShowFourModal(false)} onSave={handleSaveFour} onRestoreFocus={() => supplierReturnFocus.current?.focus()} />}

      {showSupplierImport && <SupplierImportDialog suppliers={fournisseurs} agencies={agences} onClose={() => setShowSupplierImport(false)} onImported={loadData} />}

      {/* Agency Modal */}
      {showAgenceModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAgenceModal(false)}
              disabled={savingAgence}
              aria-label="Fermer le formulaire agence"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Building className="w-6 h-6 text-rose-500" />
              {isEditingAgence ? "Modifier l'agence" : "Nouvelle agence"}
            </h2>

            <form onSubmit={handleSaveAgence} className="space-y-4" aria-busy={savingAgence}>
              <fieldset disabled={savingAgence} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="agency-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de l'Agence</label>
                <input
                  id="agency-name"
                  type="text"
                  required
                  placeholder="Ex: Casa Anfa"
                  value={agenceName}
                  onChange={(e) => setAgenceName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="agency-city" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ville</label>
                <input
                  id="agency-city"
                  type="text"
                  required
                  placeholder="Ex: Casablanca"
                  value={agenceVille}
                  onChange={(e) => setAgenceVille(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut d'activité</label>
                <select
                  aria-label="Statut de l'agence"
                  value={agenceActif ? "true" : "false"}
                  onChange={(e) => setAgenceActif(e.target.value === "true")}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAgenceModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-555 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingAgence}
                  className="px-5 py-2.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {savingAgence ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


