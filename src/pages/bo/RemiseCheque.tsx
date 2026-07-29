import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier, AgenceLookup } from "@/lib/dataService";
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function RemiseCheque() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [activeTab, setActiveTab] = useState("casa");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [signatureChecked, setSignatureChecked] = useState(false);
  const [agenceDestination, setAgenceDestination] = useState("Rabat Agdal");
  const [modeEnvoi, setModeEnvoi] = useState("");
  const [agences, setAgences] = useState<AgenceLookup[]>([]);
  const [typeExpedition, setTypeExpedition] = useState("camion"); // "camion" | "courrier"
  const [nomChauffeur, setNomChauffeur] = useState("");

  // Cheque Accusé modal states
  const [isAccuseChequeModalOpen, setIsAccuseChequeModalOpen] = useState(false);
  const [selectedForAccuse, setSelectedForAccuse] = useState<Dossier | null>(null);
  const [accuseComment, setAccuseComment] = useState("");

  const fetchDossiers = async () => {
    setLoading(true);
    const data = await dataService.getDossiers();
    // On filtre pour ne garder que ceux "En Attente Remise Finale" (120) et de type "Chèque" (new_payment_method === 1)
    const aRemettre = data.filter(
      (d) => d.new_status === 120 && d.new_payment_method === 1,
    );
    setDossiers(aRemettre);
    setLoading(false);
  };

  useEffect(() => {
    fetchDossiers();
    const loadAgences = async () => {
      try {
        const list = await dataService.getAgencesLookup();
        setAgences(list.filter(a => a.new_is_active));
      } catch (e) {
        console.error("Erreur de chargement des agences", e);
      }
    };
    loadAgences();
  }, []);

  const handleOpenRemise = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setSignatureChecked(false);
    setAgenceDestination(dossier.new_destination_branch_id || (agences.length > 0 ? agences[0].new_name : "Rabat Agdal"));
    setModeEnvoi("");
    setTypeExpedition("camion");
    setNomChauffeur("");
    setIsModalOpen(true);
  };

  const handleConfirmAccuseCheque = async () => {
    if (!selectedForAccuse) return;
    try {
      await dataService.updateDossier(selectedForAccuse.new_folderid, {
        new_cheque_recu_bo: true,
        new_commentaire_reception: accuseComment || undefined
      });
      toast.success("Réception du chèque accusée avec succès.");
      fetchDossiers();
      setIsAccuseChequeModalOpen(false);
      setSelectedForAccuse(null);
    } catch (e) {
      toast.error("Erreur", { description: "Impossible de valider la réception." });
    }
  };

  const handleConfirmRemise = async () => {
    if (!selectedDossier) return;

    const isCasa = activeTab === "casa";
    const successMsg = isCasa
      ? "Chèque remis avec succès !"
      : "Chèque expédié avec succès !";
    const successDesc = isCasa
      ? "Le dossier est maintenant clôturé."
      : "Le dossier est en transit vers l'agence.";

    try {
      if (isCasa) {
        await dataService.updateDossier(selectedDossier.new_folderid, {
          new_status: 150,
          new_fournisseur_signe: true,
          new_final_delivery_date: new Date().toISOString()
        });
      } else {
        const selectedAg = agences.find(a => a.new_name === agenceDestination);
        const commentary = typeExpedition === "camion" 
          ? "Expédié via Camion de la société" 
          : `Expédié via Courrier (${modeEnvoi})`;
        
        await dataService.updateDossier(selectedDossier.new_folderid, {
          new_status: 130,
          new_destination_branch_id: agenceDestination,
          new_destination_branch_guid: selectedAg ? selectedAg.new_branchid : undefined,
          new_commentaire_agence: commentary,
          new_livreur_nom: typeExpedition === "camion" ? nomChauffeur : undefined
        });
      }
      toast.success(successMsg, { description: successDesc });
      fetchDossiers();
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Erreur", { description: "Impossible de valider l'action." });
    }
  };

  const filteredDossiers = dossiers.filter((d) => {
    const isCasaBranch = !d.new_destination_branch_id || 
                         d.new_destination_branch_id === "Casa Anfa" || 
                         d.new_destination_branch_id.toLowerCase().includes("casa");
    if (activeTab === "casa") {
      return isCasaBranch;
    } else {
      return !isCasaBranch;
    }
  });

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 dark:text-slate-100">
          <Package className="w-8 h-8 text-blue-600 dark:text-blue-600 " />{" "}
          Remise des Chèques
        </h1>
        <p className="text-slate-500 mt-1 ml-11 dark:text-slate-400">
          Gestion de la remise physique des chèques aux fournisseurs ou agences.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab("casa")}
            className={`flex-1 md:flex-none px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "casa"
                ? "border-blue-600 text-blue-600 bg-white dark:bg-[#0F172B]"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Chèques Casa (Remise Directe)
          </button>
          <button
            onClick={() => setActiveTab("hors_casa")}
            className={`flex-1 md:flex-none px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "hors_casa"
                ? "border-blue-600 text-blue-600 bg-white dark:bg-[#0F172B]"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Chèques Hors Casa (Expédition)
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-[#0F172B]">
          <div className="relative w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par N° Chèque, Fournisseur..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-black dark:text-slate-200 placeholder:text-black/60 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  N° Chèque / Dossier
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-8 text-center text-slate-400 animate-pulse"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : filteredDossiers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <CheckCircle className="w-12 h-12 text-emerald-200 dark:text-emerald-800 mx-auto mb-4" />
                    Aucun chèque en attente de remise.
                  </td>
                </tr>
              ) : (
                filteredDossiers.map((dossier) => {
                  const isRecu = !!dossier.new_cheque_recu_bo;
                  return (
                    <tr
                      key={dossier.new_folderid}
                      className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {dossier.new_cheque_number || "N/A"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {dossier.new_folder_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {dossier.new_supplier_id || "Fournisseur inconnu"}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          Banque : {dossier.new_banque_emettrice || "Non renseignée"} | Agence : <span className="font-semibold text-blue-600 dark:text-blue-400">{dossier.new_destination_branch_id || "Casa Anfa (Siège)"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isRecu ? (
                          <button
                            onClick={() => {
                              setSelectedForAccuse(dossier);
                              setAccuseComment("");
                              setIsAccuseChequeModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            <UserCheck className="w-4 h-4" /> Accuser Réception
                          </button>
                        ) : activeTab === "casa" ? (
                          <button
                            onClick={() => handleOpenRemise(dossier)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            <UserCheck className="w-4 h-4" /> Remettre Chèque
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenRemise(dossier)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            <Truck className="w-4 h-4" /> Expédier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Remise / Expédition */}
      {isModalOpen && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {activeTab === "casa"
                  ? "Validation Remise Chèque"
                  : "Expédition vers Agence"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <span className="sr-only">Fermer</span>&times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800/50">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                    Bénéficiaire
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedDossier.new_supplier_id}
                  </p>
                </div>
              </div>

              {activeTab === "casa" ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      Date de Remise Effective
                    </label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/30">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={signatureChecked}
                        onChange={(e) => setSignatureChecked(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                          Cahier de Traçabilité signé
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Le fournisseur a signé le registre physique de
                          réception du chèque.
                        </span>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      Agence de Destination
                    </label>
                    <select 
                      value={agenceDestination}
                      onChange={(e) => setAgenceDestination(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {agences.map(ag => (
                        <option key={ag.new_branchid} value={ag.new_name}>{ag.new_name}</option>
                      ))}
                      {agences.length === 0 && (
                        <>
                          <option value="Rabat Agdal">Rabat Agdal</option>
                          <option value="Casa Anfa">Casa Anfa</option>
                          <option value="Tanger Ville">Tanger Ville</option>
                          <option value="Marrakech Guéliz">Marrakech Guéliz</option>
                          <option value="Fès Ville">Fès Ville</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      Moyen d'Expédition
                    </label>
                    <div className="flex gap-4 mb-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="typeExpedition"
                          value="camion"
                          checked={typeExpedition === "camion"}
                          onChange={() => setTypeExpedition("camion")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Camion de la société</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="typeExpedition"
                          value="courrier"
                          checked={typeExpedition === "courrier"}
                          onChange={() => setTypeExpedition("courrier")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Courrier / Autre</span>
                      </label>
                    </div>

                    {typeExpedition === "camion" ? (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Nom du Chauffeur
                        </label>
                        <input
                          type="text"
                          required
                          value={nomChauffeur}
                          onChange={(e) => setNomChauffeur(e.target.value)}
                          placeholder="Saisir le nom du chauffeur du camion..."
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Détails d'envoi / N° de Suivi
                        </label>
                        <input
                          type="text"
                          required
                          value={modeEnvoi}
                          onChange={(e) => setModeEnvoi(e.target.value)}
                          placeholder="Ex: Amana Express (N° Suivi: AB12345)"
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={activeTab === "casa" && !signatureChecked}
                onClick={handleConfirmRemise}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle className="w-4 h-4" />{" "}
                {activeTab === "casa"
                  ? "Confirmer Remise"
                  : "Confirmer Expédition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BO Accusé Réception Chèque Modal */}
      {isAccuseChequeModalOpen && selectedForAccuse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-500" /> Accuser Réception du Chèque
              </h2>
              <button
                onClick={() => {
                  setIsAccuseChequeModalOpen(false);
                  setSelectedForAccuse(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-sm">
                Veuillez accuser réception du chèque physique envoyé par la Trésorerie avant de pouvoir l'expédier ou le remettre au fournisseur.
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">N° Dossier :</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedForAccuse.new_folder_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">N° Chèque :</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedForAccuse.new_cheque_number || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Banque Émettrice :</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedForAccuse.new_banque_emettrice || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Bénéficiaire :</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedForAccuse.new_supplier_id || "N/A"}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Date de Réception (Automatique)
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Commentaires (Optionnel)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Notes sur la réception du chèque physique..."
                  value={accuseComment}
                  onChange={(e) => setAccuseComment(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => {
                  setIsAccuseChequeModalOpen(false);
                  setSelectedForAccuse(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAccuseCheque}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Confirmer la réception du chèque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


