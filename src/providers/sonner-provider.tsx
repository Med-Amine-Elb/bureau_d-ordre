import * as React from "react"
import { Toaster, toast } from "sonner"
import { useTheme } from "@/hooks/use-theme"

type SonnerProviderProps = { children: React.ReactNode }

export function SonnerProvider({ children }: SonnerProviderProps) {
  const { theme } = useTheme();

  React.useEffect(() => {
    const handleAuditFailure = (event: Event) => {
      const folderNumber = (event as CustomEvent<{ folderNumber?: string }>).detail?.folderNumber;
      toast.error("Historique non enregistré", {
        description: `Le dossier ${folderNumber || "concerné"} a été enregistré, mais son événement d’audit n’a pas pu être ajouté. Prévenez l’administrateur.`,
        duration: 8000,
      });
    };
    window.addEventListener("dossier-audit-write-failed", handleAuditFailure);
    return () => window.removeEventListener("dossier-audit-write-failed", handleAuditFailure);
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        theme={theme}
        richColors
        expand
        duration={3000}
        visibleToasts={3}
      />
    </>
  )
}

