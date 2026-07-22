import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";
import type { Dossier, SystemUser } from "@/lib/dataService";
import { PhoneCall, Mail, Clock, Search, Eye, MessageSquare, Send, FileText, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Relances() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [activeTab, setActiveTab] = useState("fournisseurs");
  const [loading, setLoading] = useState(true);

  // States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [relanceType, setRelanceType] = useState("email");
  const [relanceMessage, setRelanceMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [relanceSubject, setRelanceSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    const fetchDossiersAndUsers = async () => {
      const data = await dataService.getDossiers();
      setDossiers(data);
      const userList = await dataService.getUsers();
      setUsers(userList.filter(u => u.new_status === "Actif"));
      setLoading(false);
    };
    fetchDossiersAndUsers();
  }, []);

  // Fournisseurs: Dossiers en "Brouillon" ou bloqués manuellement (on exclut les rejets 5j de la relance directe)
  const fournisseursDossiers = dossiers.filter(d => d.new_status === 10 || d.new_is_blocked);
  
  // Prescripteurs: Dossiers "Chez Prescripteur" (Statut 40)
  const prescripteursDossiers = dossiers.filter(d => d.new_status === 40);

  const currentList = activeTab === "fournisseurs" ? fournisseursDossiers : prescripteursDossiers;

  const handleOpenRelance = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setRelanceType("email");
    setSelectedUserId("");
    setRelanceSubject("");
    setRelanceMessage("");
    setIsModalOpen(true);
  };

  const handleSendRelance = () => {
    if (!selectedUserId) {
      toast.error("Veuillez sélectionner un utilisateur destinataire.");
      return;
    }
    const selectedUser = users.find(u => u.systemuserid === selectedUserId);
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsModalOpen(false);
      if (relanceType === "email") {
        toast.success("Relance envoyée avec succès !", { 
          description: `L'email a été envoyé à ${selectedUser?.fullname} (${selectedUser?.internalemailaddress}) via le flux Power Automate.` 
        });
      } else {
        toast.success("Appel enregistré !", { 
          description: `La relance téléphonique avec ${selectedUser?.fullname} a été enregistrée dans l'historique.` 
        });
      }
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <PhoneCall className="w-8 h-8 text-blue-600" /> Gestion des Relances
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 ml-11">Centralisez les rappels et suivez les dossiers bloqués.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Fournisseurs à contacter</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{fournisseursDossiers.length}</div>
        </div>
        <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Prescripteurs hors délai</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{prescripteursDossiers.length}</div>
        </div>
        <div className="bg-white dark:bg-[#0F172B] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Relances effectuées ce mois</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">14</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <button 
            onClick={() => setActiveTab("fournisseurs")}
            className={`flex-1 md:flex-none px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "fournisseurs" 
                ? "border-blue-600 text-blue-600 bg-white dark:bg-[#0F172B]" 
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Relances Fournisseurs
          </button>
          <button 
            onClick={() => setActiveTab("prescripteurs")}
            className={`flex-1 md:flex-none px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "prescripteurs" 
                ? "border-blue-600 text-blue-600 bg-white dark:bg-[#0F172B]" 
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Relances Prescripteurs
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-[#0F172B]">
          <div className="relative w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cible</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jours en attente</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 animate-pulse">Chargement...</td></tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    Aucun dossier ne nécessite de relance pour le moment.
                  </td>
                </tr>
              ) : (
                currentList.map(dossier => (
                  <tr key={dossier.new_folderid} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{dossier.new_folder_number}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{dossier.new_document_type === 100 ? 'Facture' : 'Autre'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {activeTab === "fournisseurs" ? dossier.new_supplier_id : dossier.new_prescriber_id || "Prescripteur inconnu"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> +10 Jours
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/bo/dossiers/${dossier.new_folderid}`)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenRelance(dossier)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors">
                        <MessageSquare className="w-4 h-4" /> Relancer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Relance */}
      {isModalOpen && selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nouvelle Relance</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                <span className="sr-only">Fermer</span>&times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800/50">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Dossier concerné</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDossier.new_folder_number}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Canal de relance</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={relanceType === "email"} 
                      onChange={() => setRelanceType("email")} 
                      className="text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-sm flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400" /> Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={relanceType === "tel"} 
                      onChange={() => setRelanceType("tel")} 
                      className="text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-sm flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <PhoneCall className="w-4 h-4 text-slate-400" /> Téléphone
                    </span>
                  </label>
                </div>
              </div>

              {/* Destination user dropdown */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Destinataire (Utilisateur Interne)
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-none"
                >
                  <option value="">-- Sélectionner un destinataire --</option>
                  {users.map(u => (
                    <option key={u.systemuserid} value={u.systemuserid}>
                      {u.fullname} ({u.new_role})
                    </option>
                  ))}
                </select>
                {selectedUserId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {relanceType === "email" 
                      ? `Email : ${users.find(u => u.systemuserid === selectedUserId)?.internalemailaddress}`
                      : `Rôle : ${users.find(u => u.systemuserid === selectedUserId)?.new_role}`
                    }
                  </p>
                )}
              </div>

              {/* Subject (for email only) */}
              {relanceType === "email" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Objet de l'email
                  </label>
                  <input 
                    type="text" 
                    value={relanceSubject}
                    onChange={(e) => setRelanceSubject(e.target.value)}
                    placeholder="Saisir l'objet de l'email..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              {/* Message body */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {relanceType === "email" ? "Contenu de l'email" : "Notes de l'appel"}
                </label>
                <textarea 
                  rows={5}
                  value={relanceMessage}
                  onChange={e => setRelanceMessage(e.target.value)}
                  placeholder={relanceType === "email" ? "Écrire l'email de relance ici..." : "Résumé de la discussion téléphonique..."}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isSending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button 
                onClick={handleSendRelance} 
                disabled={isSending || !selectedUserId}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {relanceType === "email" ? "Envoyer le mail" : "Enregistrer"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}


