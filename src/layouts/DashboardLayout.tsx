import { Outlet, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Package, Users, FileText,
  Settings, LogOut,
  Sun, Moon, Bell, RotateCcw,
  Calendar
} from "lucide-react"
import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const role = localStorage.getItem('userRole') || 'BO';

  const [avatar, setAvatar] = useState(
    localStorage.getItem("userAvatar") || 
    (role === 'Prescripteur' ? "https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=b6e3f4" :
     role === 'DCF' ? "https://api.dicebear.com/7.x/micah/svg?seed=Lily&backgroundColor=ffdfbf" :
     role === 'Tresorerie' ? "https://api.dicebear.com/7.x/micah/svg?seed=Treasury&backgroundColor=c0aede" :
     role === 'Agence' ? "https://api.dicebear.com/7.x/micah/svg?seed=Regional&backgroundColor=ffd5e5" :
     role === 'Admin' ? "https://api.dicebear.com/7.x/micah/svg?seed=Admin&backgroundColor=d1c4e9" :
     "https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=c0aede")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("userAvatar");
      if (saved) setAvatar(saved);
    };
    const interval = setInterval(() => {
       const saved = localStorage.getItem("userAvatar");
       if (saved && saved !== avatar) {
          setAvatar(saved);
       }
    }, 1000);
    window.addEventListener("storage", handleStorageChange);
    return () => {
       window.removeEventListener("storage", handleStorageChange);
       clearInterval(interval);
    };
  }, [avatar]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Dynamic Date Range Calculation
  const [dateRangeText, setDateRangeText] = useState("");
  
  useEffect(() => {
    const today = new Date();
    const pastDate = subDays(today, 30);
    setDateRangeText(
      `${format(pastDate, "d MMM yyyy", { locale: fr })} - ${format(today, "d MMM yyyy", { locale: fr })}`
    );
  }, []);


  const isPrescripteur = role === 'Prescripteur';
  const isDCF = role === 'DCF';
  const isTresorerie = role === 'Tresorerie';
  const isAgence = role === 'Agence';
  const isAdmin = role === 'Admin';

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: FileText, label: "Supervision", path: "/admin/dossiers" },
    { icon: Users, label: "Utilisateurs", path: "/admin/utilisateurs" },
    { icon: Package, label: "Tables Réf", path: "/admin/references" },
    { icon: Settings, label: "Configuration", path: "/admin/configuration" }
  ] : isPrescripteur ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/prescripteur/dashboard" },
    { icon: FileText, label: "Dossiers Assignés", path: "/prescripteur/dossiers", badge: "5" },
    { icon: RotateCcw, label: "Retours Correction", path: "/prescripteur/corrections" }
  ] : isDCF ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dcf/dashboard" },
    { icon: FileText, label: "Dossiers à Traiter", path: "/dcf/dossiers", badge: "8" }
  ] : isTresorerie ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/tresorerie/dashboard" },
    { icon: FileText, label: "Dossiers à Payer", path: "/tresorerie/dossiers", badge: "4" }
  ] : isAgence ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/agence/dashboard" },
    { icon: FileText, label: "Chèques Agence", path: "/agence/cheques", badge: "2" }
  ] : [
    { icon: LayoutDashboard, label: "Dashboard", path: "/bo/dashboard" },
    { icon: FileText, label: "Tous les dossiers", path: "/bo/dossiers" },
    { icon: Package, label: "Chèques à Remettre", path: "/bo/remises", badge: "3" },
    { icon: Users, label: "Relances", path: "/bo/relances", badge: "12" },
    { icon: RotateCcw, label: "Corrections & Retours", path: "/bo/corrections" }
  ];

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-slate-950' : 'bg-[#F4F7FE]'} text-foreground overflow-hidden font-sans transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className={`w-[260px] flex-shrink-0 flex flex-col justify-between z-20 transition-colors duration-300
        ${darkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-200'}
      `}>
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#2b4c7e]/10 text-[#2b4c7e] dark:bg-[#2b4c7e]/30 dark:text-blue-400">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              SBM <span className="text-[#2b4c7e] dark:text-blue-400">Ordre</span>
            </span>
          </div>

          <nav className="px-4 mt-4 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-4 px-2 text-slate-400 dark:text-slate-500">Overview</div>
            {menuItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 mx-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#2b4c7e]/5 text-[#2b4c7e] dark:bg-[#2b4c7e]/20 dark:text-blue-400 shadow-sm relative overflow-hidden"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2b4c7e] dark:bg-blue-400 rounded-r-md"></div>
                    )}
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? "text-[#2b4c7e] dark:text-blue-400" : "opacity-70 text-slate-400 dark:text-slate-500"}`} />
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <nav className="space-y-1 mb-4 mx-4">
            <NavLink
              to={role === 'Admin' ? "/admin/configuration" : "/bo/settings"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#2b4c7e]/5 text-[#2b4c7e] dark:bg-slate-800 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <Settings className="w-5 h-5 opacity-70" /> Paramètres
            </NavLink>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm font-medium transition-colors text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20">
              <LogOut className="w-5 h-5 opacity-80" /> Déconnexion
            </button>
          </nav>
          
          {/* User Profile */}
          <div className="p-3 mx-4 mb-2 rounded-xl flex items-center justify-between transition-colors bg-white border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <img 
                src={avatar}
                alt="Profile Avatar" 
                className="w-10 h-10 rounded-full shadow-sm bg-slate-100"
              />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {role === 'Prescripteur' ? 'Prescripteur' : role === 'DCF' ? 'Comptabilité' : role === 'Tresorerie' ? 'Trésorerie' : role === 'Agence' ? 'Agence Régionale' : role === 'Admin' ? 'Administrateur' : 'Bureau d\'Ordre'}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {role === 'Prescripteur' ? 'Direction Métier' : role === 'DCF' ? 'Finances' : role === 'Tresorerie' ? 'Règlements' : role === 'Agence' ? 'Régional' : role === 'Admin' ? 'Admin Système' : 'Agent BO'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-slate-950' : 'bg-[#F4F7FE]'}`}>
        {/* Top Header */}
        <header className="h-20 bg-transparent flex items-center justify-end px-8 z-10 pt-4">
          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <div className={`flex items-center px-4 py-2.5 rounded-full shadow-sm border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                <span className="text-sm font-medium capitalize">{dateRangeText || "Chargement..."}</span>
              </div>
            </div>

            <button
              onClick={toggleDarkMode}
              className={`w-10 h-10 rounded-full ${darkMode ? 'bg-slate-900 text-yellow-400' : 'bg-white text-slate-500'} shadow-sm flex items-center justify-center hover:scale-110 transition-all`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className={`w-10 h-10 rounded-full ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'} shadow-sm flex items-center justify-center relative`}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


