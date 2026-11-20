import { dataService, type CurrentUserProfile, type TransmissionRole } from "@/lib/dataService";

export interface AppSession {
  profile: CurrentUserProfile;
  appRole: string;
  dashboardPath: string;
}

const ROLE_ROUTES: Record<TransmissionRole, { appRole: string; dashboardPath: string }> = {
  BO: { appRole: "BO", dashboardPath: "/bo/dashboard" },
  Prescripteur: { appRole: "Prescripteur", dashboardPath: "/prescripteur/dashboard" },
  DCF: { appRole: "DCF", dashboardPath: "/dcf/dashboard" },
  "Trésorerie": { appRole: "Tresorerie", dashboardPath: "/tresorerie/dashboard" },
  Agence: { appRole: "Agence", dashboardPath: "/agence/dashboard" },
  Admin: { appRole: "Admin", dashboardPath: "/admin/dashboard" },
};

export function getDossierPathForRole(role: string | null, dossierId: string): string | null {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(dossierId)) return null;
  const encodedId = encodeURIComponent(dossierId);
  const routes: Record<string, string> = {
    BO: `/bo/dossiers/${encodedId}`,
    Prescripteur: `/prescripteur/dossiers/${encodedId}`,
    DCF: `/dcf/dossiers/${encodedId}`,
    "Trésorerie": `/tresorerie/dossiers/${encodedId}`,
    Tresorerie: `/tresorerie/dossiers/${encodedId}`,
    Agence: `/agence/cheques?dossierId=${encodedId}`,
    Admin: `/admin/dossiers?dossierId=${encodedId}`,
  };

  return role ? routes[role] ?? null : null;
}

export async function resolvePowerAppsSession(): Promise<AppSession> {
  const profile = await dataService.getCurrentUserProfile();
  const role = ROLE_ROUTES[profile.role];
  if (!role) throw new Error("Aucune page n'est configurée pour votre rôle.");

  localStorage.setItem("userRole", role.appRole);
  localStorage.setItem("userName", profile.userName);
  localStorage.setItem("powerAppsSystemUserId", profile.systemUserId);
  localStorage.setItem("powerAppsRole", profile.role);
  if (profile.departmentId) localStorage.setItem("userDepartment", profile.departmentId);
  else localStorage.removeItem("userDepartment");
  if (profile.branchId) localStorage.setItem("userBranch", profile.branchId);
  else localStorage.removeItem("userBranch");
  if (profile.branchName) localStorage.setItem("userAgence", profile.branchName);
  sessionStorage.setItem("appAuthMode", "powerapps");
  sessionStorage.removeItem("appSignedOut");
  sessionStorage.removeItem("appAuthError");

  return { profile, ...role };
}

export function clearAppSession(): void {
  for (const key of ["userRole", "userName", "userAgence", "userDepartment", "userBranch", "powerAppsSystemUserId", "powerAppsRole"]) {
    localStorage.removeItem(key);
  }
  sessionStorage.removeItem("appAuthMode");
}
