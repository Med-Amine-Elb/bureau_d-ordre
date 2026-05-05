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
import ErrorPage from "@/pages/ErrorPage"

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
      { path: "bo/blocages", element: <Blocages /> },
    ],
  },
], { 
  basename: BASENAME 
})