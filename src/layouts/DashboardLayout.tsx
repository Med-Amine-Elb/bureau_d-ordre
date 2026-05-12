import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, Package, Users, FileText, 
  Settings, HelpCircle, Search, LogOut,
  Sun, Moon, Bell, RotateCcw 
} from "lucide-react"
import { useState, useEffect } from "react"

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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

  // On récupère le rôle simulé (en vrai ça viendrait de Xrm)
  const role = localStorage.getItem('userRole') || 'BO';

  const isPrescripteur = role === 'Prescripteur';

  const menuItems = isPrescripteur ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/prescripteur/dashboard" },
    { icon: FileText, label: "Dossiers Assignés", path: "/prescripteur/dossiers", badge: "5" },
    { icon: RotateCcw, label: "Retours Correction", path: "/prescripteur/corrections" }
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
        ${isPrescripteur 
          ? (darkMode ? 'bg-[#0f1b40] border-slate-800' : 'bg-[#1E3A8A] border-blue-800')
          : (darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-r border-slate-100')
        }
      `}>
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPrescripteur ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'}`}>
              <Package className="w-6 h-6" />
            </div>
            <span className={`font-bold text-xl tracking-tight ${isPrescripteur ? 'text-white' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
              GBM <span className={isPrescripteur ? 'text-blue-300' : 'text-primary'}>Ordre</span>
            </span>
          </div>

          <nav className="px-4 mt-4 space-y-1">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-4 px-2 ${isPrescripteur ? 'text-blue-300/70' : 'text-slate-400'}`}>Menu Principal</div>
            {menuItems.map((item, idx) => (
              <NavLink 
                key={idx} 
                to={item.path}
                className={({ isActive }) => {
                  if (isPrescripteur) {
                    return `flex items-center justify-between px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20 text-white shadow-sm" 
                        : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                    }`;
                  }
                  return `flex items-center justify-between px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? (darkMode ? "bg-blue-600/20 text-blue-400" : "bg-[#EBF3FE] text-[#2563EB]") 
                      : (darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                  }`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${
                        isPrescripteur 
                          ? (isActive ? "text-white" : "opacity-70 text-blue-100") 
                          : (isActive ? "text-[#2563EB]" : "opacity-70")
                      }`} />
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
              to="/bo/settings" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isPrescripteur 
                    ? (isActive ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10') 
                    : (isActive ? 'bg-[#EBF3FE] text-[#2563EB] dark:bg-blue-600/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-800')
                }`
              }
            >
              <Settings className="w-5 h-5 opacity-70" /> Paramètres
            </NavLink>
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${isPrescripteur ? 'text-red-300 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
              <LogOut className="w-5 h-5 opacity-80" /> Déconnexion
            </button>
          </nav>
          
          {/* User Profile */}
          <div className={`p-4 mx-4 rounded-xl flex items-center justify-between transition-colors ${isPrescripteur ? 'bg-white/5 border border-white/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${isPrescripteur ? 'bg-blue-800 text-white' : 'bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white'}`}>
                {role === 'Prescripteur' ? 'PR' : 'MA'}
              </div>
              <div>
                <p className={`text-sm font-bold ${isPrescripteur ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {role === 'Prescripteur' ? 'Prescripteur' : 'Med Amine'}
                </p>
                <p className={`text-xs ${isPrescripteur ? 'text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {role === 'Prescripteur' ? 'Direction Métier' : 'Chef de Projet IT'}
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
