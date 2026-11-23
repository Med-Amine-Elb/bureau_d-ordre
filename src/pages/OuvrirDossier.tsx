import { Navigate, useParams } from "react-router-dom";
import { useAppRole } from "@/contexts/AppRoleContext";
import { getDossierPathForRole } from "@/lib/powerAppsSession";

export default function OuvrirDossier() {
  const { id = "" } = useParams();
  const role = useAppRole();
  const destination = getDossierPathForRole(role, id);

  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">Le lien du dossier est invalide.</p>;
  }

  if (destination) return <Navigate to={destination} replace />;

  return <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">Aucune page de dossier n’est configurée pour votre profil. Contactez l’administrateur.</p>;
}