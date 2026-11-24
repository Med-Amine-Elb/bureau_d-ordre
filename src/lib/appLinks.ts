/**
 * Builds links that open a dossier in the published Power Apps code app.
 * Set VITE_POWER_APPS_APP_URL to the app's play URL in local development;
 * when running inside Power Apps, the current URL is used automatically.
 */
export function getDossierActionUrl(folderId: string): string {
  const configuredAppUrl = import.meta.env.VITE_POWER_APPS_APP_URL?.trim();
  const appUrl = configuredAppUrl || window.location.href.split("#")[0];
  const baseUrl = appUrl.replace(/#.*$/, "").replace(/\/$/, "");

  return `${baseUrl}#/ouvrir-dossier/${encodeURIComponent(folderId)}`;
}
