import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Mail,
  Building2,
  UserCheck,
  Shield,
  Search,
  X,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type { SystemUser, AgenceLookup } from "@/lib/dataService";

export default function AdminUtilisateurs() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [agences, setAgences] = useState<AgenceLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("BO");
  const [agence, setAgence] = useState("");
  const [status, setStatus] = useState("Actif");

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, aList] = await Promise.all([
        dataService.getUsers(),
        dataService.getAgencesLookup()
      ]);
      setUsers(uList);
      setAgences(aList.filter(a => a.new_is_active));
      if (aList.length > 0) {
        setAgence(aList[0].new_name);
      }
    } catch (err) {
      toast.error("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFullname("");
    setEmail("");
    setRole("BO");
    if (agences.length > 0) {
      setAgence(agences[0].new_name);
    } else {
      setAgence("");
    }
    setStatus("Actif");
    setShowModal(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setIsEditing(true);
    setEditingUserId(user.systemuserid);
    setFullname(user.fullname);
    setEmail(user.internalemailaddress);
    setRole(user.new_role);
    setAgence(user.new_destination_branch_id || "");
    setStatus(user.new_status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullname.trim() || !email.trim()) {
      toast.error("Veuillez remplir le nom et l'adresse email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("L'adresse email n'est pas valide.");
      return;
    }

    const payload: Partial<SystemUser> = {
      fullname,
      internalemailaddress: email,
      new_role: role,
      new_destination_branch_id: role === "Agence" ? agence : undefined,
      new_status: status
    };

    try {
      if (isEditing && editingUserId) {
        await dataService.updateUser(editingUserId, payload);
        toast.success("Utilisateur mis à jour.");
      } else {
        await dataService.createUser(payload);
        toast.success("Nouvel utilisateur créé avec succès.");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir désactiver cet utilisateur ?")) {
      try {
        await dataService.updateUser(id, { new_status: "Inactif" });
        toast.success("L'utilisateur a été marqué comme inactif.");
        loadData();
      } catch (err) {
        toast.error("Erreur lors de la désactivation");
      }
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.internalemailaddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "Tous" || u.new_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case "Admin":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-850 dark:text-slate-200 dark:border-slate-800";
      case "BO":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30";
      case "Prescripteur":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30";
      case "DCF":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/30";
      case "Tresorerie":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30";
      case "Agence":
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gérez les comptes utilisateurs (`systemuser`) et affectez leurs rôles métiers et agences de destination.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#2b4c7e] hover:bg-[#20395f] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-sm shadow-[#2b4c7e]/20"
        >
          <UserPlus className="w-5 h-5" /> Ajouter un Utilisateur
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2b4c7e]/20 transition-all text-slate-950 dark:text-white"
          />
        </div>

        {/* Roles Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["Tous", "Admin", "BO", "Prescripteur", "DCF", "Tresorerie", "Agence"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                roleFilter === r
                  ? "bg-[#2b4c7e] text-white border-[#2b4c7e] shadow-sm"
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {r === "Tous" ? "Tous les rôles" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <div className="bg-white dark:bg-[#0F172B] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Chargement de la liste...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Aucun utilisateur trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="py-4 px-6">Collaborateur</th>
                  <th className="py-4 px-6">Email interne</th>
                  <th className="py-4 px-6">Rôle Système</th>
                  <th className="py-4 px-6">Agence Destination</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6">Dernière Connexion</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredUsers.map((u) => (
                  <tr key={u.systemuserid} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    {/* User profile */}
                    <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center font-bold text-[#2b4c7e] text-sm">
                          {u.fullname.split(" ").map(n => n[0]).join("")}
                        </div>
                        {u.fullname}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 opacity-60" />
                        {u.internalemailaddress}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(u.new_role)}`}>
                        <Shield className="w-3 h-3" />
                        {u.new_role}
                      </span>
                    </td>

                    {/* Agency Destination */}
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      {u.new_role === "Agence" ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-rose-500" />
                          {u.new_destination_branch_id || "Non spécifiée"}
                        </div>
                      ) : (
                        <span className="text-slate-350 dark:text-slate-600 font-normal">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {u.new_status === "Actif" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                          <UserCheck className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                          <Lock className="w-3 h-3" /> Inactif
                        </span>
                      )}
                    </td>

                    {/* Last login */}
                    <td className="py-4 px-6 text-slate-400 text-xs font-medium">
                      {u.new_derniere_connexion ? (
                        new Date(u.new_derniere_connexion).toLocaleString("fr-FR")
                      ) : (
                        <span className="italic text-slate-300 dark:text-slate-750">Jamais connecté</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 text-slate-450 hover:text-[#2b4c7e] hover:bg-[#2b4c7e]/5 rounded-lg transition-colors"
                          title="Modifier l'utilisateur"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.new_status === "Actif" && (
                          <button
                            onClick={() => handleDelete(u.systemuserid)}
                            className="p-2 text-slate-450 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="Désactiver l'utilisateur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-[#2b4c7e]" />
              {isEditing ? "Modifier l'Utilisateur" : "Nouvel Utilisateur"}
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Fullname */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sarah Alaoui"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2b4c7e]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Interne</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: s.alaoui@gbm.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2b4c7e]/20 text-sm text-slate-950 dark:text-white"
                />
              </div>

              {/* Role & Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rôle Métier</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2b4c7e]/20 text-sm text-slate-950 dark:text-white font-semibold"
                  >
                    <option value="BO">Bureau d'Ordre</option>
                    <option value="Prescripteur">Prescripteur</option>
                    <option value="DCF">Comptabilité (DCF)</option>
                    <option value="Tresorerie">Trésorerie</option>
                    <option value="Agence">Agence Régionale</option>
                    <option value="Admin">Administrateur</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut Compte</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2b4c7e]/20 text-sm text-slate-950 dark:text-white font-semibold"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>

              {/* Agency dropdown - visible only for Agence role */}
              {role === "Agence" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-rose-500" /> Agence d'affectation
                  </label>
                  <select
                    value={agence}
                    onChange={(e) => setAgence(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2b4c7e]/20 text-sm text-slate-950 dark:text-white font-semibold"
                  >
                    {agences.map((a) => (
                      <option key={a.new_branchid} value={a.new_name}>
                        {a.new_name} ({a.new_city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2b4c7e] hover:bg-[#20395f] text-white rounded-xl text-sm font-bold transition-all"
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


