import { createBrowserRouter } from "react-router-dom"
import Login from "@/pages/login"
import DashboardLayout from "@/layouts/DashboardLayout"
import DashboardBO from "@/pages/bo/Dashboard"
import CreateDossier from "@/pages/bo/CreateDossier"
import DossiersList from "@/pages/bo/DossiersList"
import DossierDetail from "@/pages/bo/DossierDetail"
import Relances from "@/pages/bo/Relances"
import RemiseCheque from "@/pages/bo/RemiseCheque"
import Corrections from "@/pages/bo/Corrections"
import Settings from "@/pages/bo/Settings"
import ErrorPage from "@/pages/ErrorPage"

// Prescripteur Pages
import DashboardPrescripteur from "@/pages/prescripteur/Dashboard"
import DossiersListPrescripteur from "@/pages/prescripteur/DossiersList"
import DossierDetailPrescripteur from "@/pages/prescripteur/DossierDetail"
import CorrectionsPrescripteur from "@/pages/prescripteur/Corrections"

// DCF Pages
import DashboardDCF from "@/pages/dcf/Dashboard"
import DossiersListDCF from "@/pages/dcf/DossiersList"
import DossierDetailDCF from "@/pages/dcf/DossierDetail"

// Tresorerie Pages
import DashboardTresorerie from "@/pages/tresorerie/Dashboard"
import DossiersListTresorerie from "@/pages/tresorerie/DossiersList"
import DossierDetailTresorerie from "@/pages/tresorerie/DossierDetail"

// Agence Pages
import DashboardAgence from "@/pages/agence/Dashboard"
import DossiersListAgence from "@/pages/agence/DossiersList"

// Admin Pages
import DashboardAdmin from "@/pages/admin/Dashboard"
import UtilisateursAdmin from "@/pages/admin/Utilisateurs"
import DossiersAdmin from "@/pages/admin/Dossiers"
import ReferencesAdmin from "@/pages/admin/References"
import ConfigurationAdmin from "@/pages/admin/Configuration"

// Normalize basename when hosted in Power Apps
// We want to find the root directory regardless of current sub-path
const getBasename = () => {
  const path = window.location.pathname;
  if (path.includes("/index.html")) {
    return path.substring(0, path.lastIndexOf("/") + 1);
  }
  // In development mode (Vite), basename is usually "/"
  return "/"; 
};

const BASENAME = getBasename();

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "bo/dashboard", element: <DashboardBO /> },
      { path: "bo/dossiers/nouveau", element: <CreateDossier /> },
      { path: "bo/dossiers", element: <DossiersList /> },
      { path: "bo/dossiers/:id", element: <DossierDetail /> },
      { path: "bo/relances", element: <Relances /> },
      { path: "bo/remises", element: <RemiseCheque /> },
      { path: "bo/corrections", element: <Corrections /> },
      { path: "bo/settings", element: <Settings /> },
      
      // Prescripteur Routes
      { path: "prescripteur/dashboard", element: <DashboardPrescripteur /> },
      { path: "prescripteur/dossiers", element: <DossiersListPrescripteur /> },
      { path: "prescripteur/dossiers/:id", element: <DossierDetailPrescripteur /> },
      { path: "prescripteur/corrections", element: <CorrectionsPrescripteur /> },

      // DCF Routes
      { path: "dcf/dashboard", element: <DashboardDCF /> },
      { path: "dcf/dossiers", element: <DossiersListDCF /> },
      { path: "dcf/dossiers/:id", element: <DossierDetailDCF /> },

      // Tresorerie Routes
      { path: "tresorerie/dashboard", element: <DashboardTresorerie /> },
      { path: "tresorerie/dossiers", element: <DossiersListTresorerie /> },
      { path: "tresorerie/dossiers/:id", element: <DossierDetailTresorerie /> },

      // Agence Routes
      { path: "agence/dashboard", element: <DashboardAgence /> },
      { path: "agence/cheques", element: <DossiersListAgence /> },

      // Admin Routes
      { path: "admin/dashboard", element: <DashboardAdmin /> },
      { path: "admin/dossiers", element: <DossiersAdmin /> },
      { path: "admin/utilisateurs", element: <UtilisateursAdmin /> },
      { path: "admin/references", element: <ReferencesAdmin /> },
      { path: "admin/configuration", element: <ConfigurationAdmin /> },
    ],
  },
], { 
  basename: BASENAME 
});
// Vite HMR trigger

