import { useEffect, useState } from "react";
import {
  Package,
  Building,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  FileText,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type { FournisseurLookup, AgenceLookup } from "@/lib/dataService";

export default function AdminReferences() {
  const [activeTab, setActiveTab] = useState<"fournisseurs" | "agences">("fournisseurs");
  
  // Suppliers state
  const [fournisseurs, setFournisseurs] = useState<FournisseurLookup[]>([]);
  const [fourSearch, setFourSearch] = useState("");
  const [showFourModal, setShowFourModal] = useState(false);
  const [fourName, setFourName] = useState("");
  const [fourCode, setFourCode] = useState("");
  const [fourActif, setFourActif] = useState(true);
  const [isEditingFour, setIsEditingFour] = useState(false);
  const [editingFourId, setEditingFourId] = useState<string | null>(null);

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
      const [fourList, agList] = await Promise.all([
        dataService.getFournisseursLookup(),
        dataService.getAgencesLookup()
      ]);
      setFournisseurs(fourList);
      setAgences(agList);
    } catch (err) {
      toast.error("Erreur de chargement des tables de référence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Supplier handlers
  const handleOpenAddFour = () => {
    setIsEditingFour(false);
    setEditingFourId(null);
    setFourName("");
    setFourCode("");
    setFourActif(true);
    setShowFourModal(true);
  };

  const handleOpenEditFour = (four: FournisseurLookup) => {
    setIsEditingFour(true);
    setEditingFourId(four.new_supplierid);
    setFourName(four.new_name);
    setFourCode(four.new_code);
    setFourActif(four.new_is_active);
    setShowFourModal(true);
  };

  const handleSaveFour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fourName.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.");
      return;
    }

    const payload: Partial<FournisseurLookup> = {
      new_name: fourName,
      new_code: fourCode || undefined,
      new_is_active: fourActif
    };

    try {
      if (isEditingFour && editingFourId) {
        await dataService.updateFournisseurLookup(editingFourId, payload);
        toast.success("Fournisseur mis à jour.");
      } else {
        await dataService.createFournisseurLookup(payload);
        toast.success("Fournisseur ajouté avec succès.");
      }
      setShowFourModal(false);
      loadData();
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  const handleToggleFourStatus = async (four: FournisseurLookup) => {
    try {
      await dataService.updateFournisseurLookup(four.new_supplierid, {
        new_is_active: !four.new_is_active
      });
      toast.success(`Fournisseur ${four.new_is_active ? "désactivé" : "activé"}.`);
      loadData();
    } catch (err) {
      toast.error("Erreur lors du changement de statut");
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
    if (!agenceName.trim() || !agenceVille.trim()) {
      toast.error("Le nom et la ville sont requis.");
      return;
    }

    const payload: Partial<AgenceLookup> = {
      new_name: agenceName,
      new_city: agenceVille,
      new_is_active: agenceActif
    };

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
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  const handleToggleAgenceStatus = async (age: AgenceLookup) => {
    try {
      await dataService.updateAgenceLookup(age.new_branchid, {
        new_is_active: !age.new_is_active
      });
      toast.success(`Agence ${age.new_is_active ? "désactivée" : "activée"}.`);
      loadData();
    } catch (err) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tables de Référence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gérez les entités de lookup indispensables à la validation des dossiers (Fournisseurs et Agences).
          </p>
        </div>
        {activeTab === "fournisseurs" ? (
          <button
            onClick={handleOpenAddFour}
            className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-sm shadow-[#1F3B73]/20"
          >
            <Plus className="w-5 h-5" /> Ajouter un Fournisseur
          </button>
        ) : (
          <button
            onClick={handleOpenAddAgence}
            className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-sm shadow-[#1F3B73]/20"
          >
            <Plus className="w-5 h-5" /> Ajouter une Agence
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("fournisseurs")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-colors ${
            activeTab === "fournisseurs"
              ? "border-[#1F3B73] text-[#1F3B73] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-450 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" /> Fournisseurs (`new_fournisseur`)
        </button>
        <button
          onClick={() => setActiveTab("agences")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-colors ${
            activeTab === "agences"
              ? "border-[#1F3B73] text-[#1F3B73] dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-450 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
          }`}
        >
          <Building className="w-4 h-4" /> Agences Régionales (`new_agence`)
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "fournisseurs" ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un fournisseur par nom ou code..."
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
                      <th className="py-4 px-6">ID unique (Dataverse GUID)</th>
                      <th className="py-4 px-6">Nom du Fournisseur</th>
                      <th className="py-4 px-6">Code Lookup</th>
                      <th className="py-4 px-6">Statut d'activité</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredFournisseurs.map((f) => (
                      <tr key={f.new_supplierid} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {f.new_supplierid}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-100">
                          {f.new_name}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/40 px-2.5 py-1 rounded w-fit">
                          {f.new_code}
                        </td>
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
                              onClick={() => handleOpenEditFour(f)}
                              className="p-2 text-slate-400 hover:text-[#1F3B73] hover:bg-[#1F3B73]/5 rounded-lg transition-colors"
                              title="Modifier Fournisseur"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleFourStatus(f)}
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
                              title="Modifier l'Agence"
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

      {/* Supplier Modal */}
      {showFourModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowFourModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-[#1F3B73]" />
              {isEditingFour ? "Modifier Fournisseur" : "Nouveau Fournisseur"}
            </h2>

            <form onSubmit={handleSaveFour} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raison Sociale</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MAROC TELECOM"
                  value={fourName}
                  onChange={(e) => setFourName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Code Fournisseur (Facultatif - Auto si vide)</label>
                <input
                  type="text"
                  placeholder="Ex: FR-IAM-01"
                  value={fourCode}
                  onChange={(e) => setFourCode(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut d'activité</label>
                <select
                  value={fourActif ? "true" : "false"}
                  onChange={(e) => setFourActif(e.target.value === "true")}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFourModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-555 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl text-sm font-bold transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agency Modal */}
      {showAgenceModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAgenceModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Building className="w-6 h-6 text-rose-500" />
              {isEditingAgence ? "Modifier l'Agence" : "Nouvelle Agence"}
            </h2>

            <form onSubmit={handleSaveAgence} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de l'Agence</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Casa Anfa"
                  value={agenceName}
                  onChange={(e) => setAgenceName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ville</label>
                <input
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
                  className="px-5 py-2.5 bg-[#1F3B73] hover:bg-[#16294F] text-white rounded-xl text-sm font-bold transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


