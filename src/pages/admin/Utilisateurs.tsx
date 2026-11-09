import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit2,
  Lock,
  Mail,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type {
  AdminUserProfile,
  DepartmentLookup,
  AgenceLookup,
  TransmissionRole,
  UserProfileCandidate,
  UserProfileInput,
} from "@/lib/dataService";

const ROLE_OPTIONS: { value: TransmissionRole; label: string }[] = [
  { value: "BO", label: "Bureau d’Ordre" },
  { value: "Prescripteur", label: "Prescripteur" },
  { value: "DCF", label: "Comptabilité (DCF)" },
  { value: "Trésorerie", label: "Trésorerie" },
  { value: "Agence", label: "Agence" },
  { value: "Admin", label: "Admin" },
];

const ROLE_BADGE: Record<TransmissionRole, string> = {
  Admin: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  BO: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  Prescripteur: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  DCF: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
  "Trésorerie": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  Agence: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Une erreur est survenue pendant l’opération.";

export default function AdminUtilisateurs() {
  const [profiles, setProfiles] = useState<AdminUserProfile[]>([]);
  const [candidates, setCandidates] = useState<UserProfileCandidate[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [branches, setBranches] = useState<AgenceLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"Tous" | TransmissionRole>("Tous");

  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AdminUserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState<TransmissionRole>("BO");
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [active, setActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [userList, departmentList, branchList] = await Promise.all([
        dataService.getUserProfileCandidates(),
        dataService.getDepartmentsLookup(),
        dataService.getAgencesLookup(),
      ]);
      const profileList = await dataService.getUserProfiles(userList);
      setProfiles(profileList);
      setCandidates(userList);
      setDepartments(departmentList.filter((item) => item.new_is_active));
      setBranches(branchList.filter((item) => item.new_is_active));
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(
      profiles
        .filter((profile) => profile.id !== editingProfile?.id)
        .map((profile) => profile.userId.toLowerCase()),
    );
    const available = candidates.filter((candidate) => !assignedUserIds.has(candidate.systemuserid.toLowerCase()));

    // Keep the selected account visible while editing even if it was later disabled in Dataverse.
    if (editingProfile && !available.some((candidate) => candidate.systemuserid === editingProfile.userId)) {
      available.unshift({
        systemuserid: editingProfile.userId,
        fullname: editingProfile.userName,
        internalemailaddress: editingProfile.email,
      });
    }
    return available;
  }, [candidates, profiles, editingProfile]);

  const filteredProfiles = profiles.filter((profile) => {
    const query = searchTerm.trim().toLocaleLowerCase("fr");
    const matchesSearch = !query ||
      profile.userName.toLocaleLowerCase("fr").includes(query) ||
      profile.email.toLocaleLowerCase("fr").includes(query) ||
      (profile.departmentName ?? "").toLocaleLowerCase("fr").includes(query) ||
      (profile.branchName ?? "").toLocaleLowerCase("fr").includes(query);
    return matchesSearch && (roleFilter === "Tous" || profile.role === roleFilter);
  });

  const resetForm = () => {
    setEditingProfile(null);
    setSelectedUserId("");
    setRole("BO");
    setDepartmentId("");
    setBranchId("");
    setActive(true);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (profile: AdminUserProfile) => {
    setEditingProfile(profile);
    setSelectedUserId(profile.userId);
    setRole(profile.role);
    setDepartmentId(profile.departmentId ?? "");
    setBranchId(profile.branchId ?? "");
    setActive(profile.active);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    resetForm();
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = availableUsers.find((candidate) => candidate.systemuserid === selectedUserId);
    if (!account) {
      toast.error("Sélectionnez un utilisateur Dataverse.");
      return;
    }
    if (role === "Prescripteur" && !departmentId) {
      toast.error("Sélectionnez la direction du Prescripteur.");
      return;
    }
    if (role === "Agence" && !branchId) {
      toast.error("Sélectionnez l’agence de cet utilisateur.");
      return;
    }

    const input: UserProfileInput = {
      userId: selectedUserId,
      role,
      active,
      ...(role === "Prescripteur" ? { departmentId } : {}),
      ...(role === "Agence" ? { branchId } : {}),
    };

    setSaving(true);
    try {
      if (editingProfile) {
        await dataService.updateUserProfile(editingProfile.id, input, account.fullname);
        toast.success("Profil mis à jour.");
      } else {
        await dataService.createUserProfile(input, account.fullname);
        toast.success("Profil créé.");
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const toggleProfile = async (profile: AdminUserProfile) => {
    const account = candidates.find((candidate) => candidate.systemuserid === profile.userId);
    const input: UserProfileInput = {
      userId: profile.userId,
      role: profile.role,
      active: !profile.active,
      ...(profile.departmentId ? { departmentId: profile.departmentId } : {}),
      ...(profile.branchId ? { branchId: profile.branchId } : {}),
    };
    try {
      await dataService.updateUserProfile(profile.id, input, account?.fullname ?? profile.userName);
      toast.success(profile.active ? "Accès désactivé." : "Accès activé.");
      await loadData();
    } catch (error) {
      toast.error("Modification impossible", { description: getErrorMessage(error) });
    }
  };

  const inputClassName = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1F3B73] focus:ring-2 focus:ring-[#1F3B73]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div className="w-full space-y-7 pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profils utilisateur</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Attribuez un rôle et une affectation à un compte Dataverse existant.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3B73] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#16294F]"
        >
          <UserPlus className="h-5 w-5" /> Ajouter un profil
        </button>
      </div>

      <section className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F172B] lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un nom, un e-mail ou une affectation…"
            className={`${inputClassName} pl-10`}
            aria-label="Rechercher un profil"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Tous", ...ROLE_OPTIONS.map((item) => item.value)] as ("Tous" | TransmissionRole)[]).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setRoleFilter(item)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${roleFilter === item
                ? "border-[#1F3B73] bg-[#1F3B73] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              {item === "Tous" ? "Tous les rôles" : ROLE_OPTIONS.find((option) => option.value === item)?.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0F172B]">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Chargement des profils…</div>
        ) : loadError ? (
          <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            <p className="font-semibold">Impossible de charger les profils.</p>
            <p className="mt-1 break-words">{loadError}</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-blue-50 p-3 text-[#1F3B73] dark:bg-blue-950/40 dark:text-blue-300"><Users className="h-6 w-6" /></div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {profiles.length === 0 ? "Aucun profil configuré" : "Aucun résultat"}
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {profiles.length === 0
                ? "Ajoutez un profil pour rattacher un compte Dataverse à un rôle de l’application."
                : "Modifiez votre recherche ou le filtre de rôle."}
            </p>
            {profiles.length === 0 && (
              <button type="button" onClick={openAdd} className="mt-5 rounded-xl bg-[#1F3B73] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16294F]">
                Ajouter un profil
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                  <th className="px-5 py-4">Utilisateur</th>
                  <th className="px-5 py-4">Rôle</th>
                  <th className="px-5 py-4">Direction</th>
                  <th className="px-5 py-4">Agence</th>
                  <th className="px-5 py-4">Accès</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{profile.userName}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="h-3.5 w-3.5" />{profile.email || "E-mail indisponible"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[profile.role]}`}>
                        <Shield className="h-3.5 w-3.5" />
                        {ROLE_OPTIONS.find((item) => item.value === profile.role)?.label ?? profile.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{profile.departmentName || "—"}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{profile.branchName || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${profile.active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {profile.active ? <UserCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {profile.active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(profile)} title="Modifier le profil" className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-[#1F3B73] dark:hover:bg-blue-950/40 dark:hover:text-blue-300">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleProfile(profile)}
                          title={profile.active ? "Désactiver le profil" : "Activer le profil"}
                          className={`rounded-lg p-2 transition ${profile.active ? "text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"}`}
                        >
                          {profile.active ? <Lock className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="user-profile-title" className="my-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#0F172B]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="user-profile-title" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Users className="h-5 w-5 text-[#1F3B73] dark:text-blue-300" />
                  {editingProfile ? "Modifier le profil" : "Ajouter un profil"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Le compte Microsoft/Dataverse doit déjà exister.</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={(event) => void handleSave(event)} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="profile-user" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Utilisateur <span className="text-red-500">*</span></label>
                <select id="profile-user" required value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className={inputClassName}>
                  <option value="">Sélectionner un compte actif…</option>
                  {availableUsers.map((candidate) => (
                    <option key={candidate.systemuserid} value={candidate.systemuserid}>
                      {candidate.fullname} — {candidate.internalemailaddress || "E-mail indisponible"}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && <p className="text-xs text-amber-700 dark:text-amber-300">Aucun compte d’entreprise actif et disponible n’a été trouvé.</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="profile-role" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Rôle <span className="text-red-500">*</span></label>
                  <select id="profile-role" value={role} onChange={(event) => {
                    const nextRole = event.target.value as TransmissionRole;
                    setRole(nextRole);
                    if (nextRole !== "Prescripteur") setDepartmentId("");
                    if (nextRole !== "Agence") setBranchId("");
                  }} className={inputClassName}>
                    {ROLE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 accent-[#1F3B73]" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Profil actif</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Autoriser l’accès à l’application</span>
                  </span>
                </label>
              </div>

              {role === "Prescripteur" && (
                <div className="space-y-1.5">
                  <label htmlFor="profile-department" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"><Building2 className="h-4 w-4" /> Direction <span className="text-red-500">*</span></label>
                  <select id="profile-department" required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={inputClassName}>
                    <option value="">Sélectionner une direction…</option>
                    {departments.map((item) => <option key={item.new_departmentid} value={item.new_departmentid}>{item.new_name}</option>)}
                  </select>
                  {departments.length === 0 && <p className="text-xs text-amber-700 dark:text-amber-300">Aucune direction active disponible dans Dataverse.</p>}
                </div>
              )}

              {role === "Agence" && (
                <div className="space-y-1.5">
                  <label htmlFor="profile-branch" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"><Building2 className="h-4 w-4" /> Agence <span className="text-red-500">*</span></label>
                  <select id="profile-branch" required value={branchId} onChange={(event) => setBranchId(event.target.value)} className={inputClassName}>
                    <option value="">Sélectionner une agence…</option>
                    {branches.map((item) => <option key={item.new_branchid} value={item.new_branchid}>{item.new_name}{item.new_city ? ` — ${item.new_city}` : ""}</option>)}
                  </select>
                  {branches.length === 0 && <p className="text-xs text-amber-700 dark:text-amber-300">Aucune agence active disponible dans Dataverse.</p>}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
                <button type="submit" disabled={saving || availableUsers.length === 0} className="rounded-xl bg-[#1F3B73] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#16294F] disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? "Enregistrement…" : editingProfile ? "Enregistrer" : "Créer le profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
