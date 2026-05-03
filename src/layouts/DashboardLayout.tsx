import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, Package, Users, FileText, 
  Settings, HelpCircle, Diamond, Search, 
  Sun, Bell, AlertOctagon 
} from "lucide-react"

export default function DashboardLayout() {
  const navigate = useNavigate();

  // On récupère le rôle simulé (en vrai ça viendrait de Xrm)
  const role = localStorage.getItem('userRole') || 'BO';

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/bo/dashboard" },
    { icon: FileText, label: "Tous les dossiers", path: "/bo/dossiers" },
    { icon: Package, label: "Chèques à Remettre", path: "/bo/remises", badge: "3" },
    { icon: Users, label: "Relances", path: "/bo/relances", badge: "12" },
    { icon: AlertOctagon, label: "Blocages", path: "/bo/blocages" },
    { icon: Settings, label: "Paramètres", path: "/bo/settings" }
  ];

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col justify-between z-20">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">GBM <span className="text-primary">Ordre</span></span>
          </div>

          <nav className="px-4 mt-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
            {menuItems.map((item, idx) => (
              <NavLink 
                key={idx} 
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center justify-between px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-[#EBF3FE] text-[#2563EB]" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? "text-[#2563EB]" : "opacity-70"}`} />
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
          <nav className="space-y-1 mb-4">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100/80">
              <Settings className="w-5 h-5 opacity-70" /> Paramètres
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100/80">
              <HelpCircle className="w-5 h-5 opacity-70" /> Support IT
            </a>
          </nav>

          <div className="bg-gradient-to-b from-[#1E3A8A] to-[#0F172A] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group mx-4 mb-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
              <Diamond className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-semibold text-sm mb-1">Espace {role}</h4>
            <p className="text-blue-100 text-[11px] mb-4 opacity-80 leading-relaxed">Vous êtes connecté en tant que {role}.</p>
            <button onClick={handleLogout} className="w-full bg-[#3B82F6] hover:bg-blue-500 transition-colors text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F4F7FE]">
        {/* Top Header */}
        <header className="h-20 bg-transparent flex items-center justify-between px-8 z-10 pt-4">
          <div className="flex items-center bg-slate-100/80 rounded-full px-4 py-2 w-96 border border-slate-200/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Rechercher un N° Dossier, Facture..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            />
            <div className="bg-white text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 shadow-sm ml-2">⌘K</div>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors">
              <Sun className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shadow-sm">
              <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
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
