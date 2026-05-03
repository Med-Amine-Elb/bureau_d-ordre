import { createBrowserRouter } from "react-router-dom"
import Login from "@/pages/login"
import DashboardLayout from "@/layouts/DashboardLayout"
import DashboardBO from "@/pages/bo/Dashboard"
import CreateDossier from "@/pages/bo/CreateDossier"
import DossiersList from "@/pages/bo/DossiersList"
import DossierDetail from "@/pages/bo/DossierDetail"
import Relances from "@/pages/bo/Relances"
import RemiseCheque from "@/pages/bo/RemiseCheque"
import Blocages from "@/pages/bo/Blocages"

// IMPORTANT: Do not remove or modify the code below!
// Normalize basename when hosted in Power Apps
const BASENAME = new URL(".", location.href).pathname
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    // LayoutRoute without a path acts as a wrapper for its children
    element: <DashboardLayout />,
    children: [
      { path: "bo/dashboard", element: <DashboardBO /> },
      { path: "bo/dossiers/nouveau", element: <CreateDossier /> },
      { path: "bo/dossiers", element: <DossiersList /> },
      { path: "bo/dossiers/:id", element: <DossierDetail /> },
      { path: "bo/relances", element: <Relances /> },
      { path: "bo/remises", element: <RemiseCheque /> },
      { path: "bo/blocages", element: <Blocages /> },
    ],
  },
], { 
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})