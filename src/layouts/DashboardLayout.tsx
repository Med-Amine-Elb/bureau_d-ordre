import { Outlet, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Package, Users, FileText,
  Settings, LogOut,
  Sun, Moon, Bell, RotateCcw,
  Calendar, Trash2, AlertTriangle, Inbox
} from "lucide-react"
import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { dataService } from "@/lib/dataService"
import type { Dossier } from "@/lib/dataService"
import { generateNotifications } from "@/lib/notificationEngine"
import type { AppNotification } from "@/lib/notificationEngine"

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const role = localStorage.getItem('userRole') || 'BO';
  const userAgence = localStorage.getItem('userAgence') || '';

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
    } catch {
      return [];
    }
  });
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("readNotifications") || "[]");
    } catch {
      return [];
    }
  });
  const [prevNotifIds, setPrevNotifIds] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleDismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = [...dismissedNotifIds, id];
    setDismissedNotifIds(updated);
    localStorage.setItem("dismissedNotifications", JSON.stringify(updated));
  };

  const handleDismissAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedNotifIds, ...allIds]));
    setDismissedNotifIds(updated);
    localStorage.setItem("dismissedNotifications", JSON.stringify(updated));
  };

  const handleMarkAsRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      localStorage.setItem("readNotifications", JSON.stringify(updated));
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(updated);
    localStorage.setItem("readNotifications", JSON.stringify(updated));
  };

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const data = await dataService.getDossiers();
        setDossiers(data);
      } catch (err) {
        console.error("Error fetching dossiers for notifications:", err);
      }
    };

    fetchDossiers();
    const interval = setInterval(fetchDossiers, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generated = generateNotifications(dossiers, role, userAgence);
    setNotifications(generated);
  }, [dossiers, role, userAgence]);

  useEffect(() => {
    if (notifications.length > 0) {
      if (!isInitialLoad) {
        // Find notifications that are new (not in prevNotifIds) and not dismissed
        const newNotifs = notifications.filter(
          (n) => !prevNotifIds.includes(n.id) && !dismissedNotifIds.includes(n.id)
        );
        newNotifs.forEach((notif) => {
          toast.info(notif.title, {
            description: notif.message,
            action: {
              label: "Voir",
              onClick: () => navigate(notif.path),
            },
          });
        });
      } else {
        setIsInitialLoad(false);
      }
      setPrevNotifIds(notifications.map((n) => n.id));
    } else {
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notifications-container")) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeNotifications = notifications.filter(n => !dismissedNotifIds.includes(n.id));

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

  // Dynamic counts for sidebar badges
  const countPrescripteurAssignes = dossiers.filter(d => d.new_status === 40).length;
  const countPrescripteurCorrections = dossiers.filter(d => d.new_status === 90).length;
  const countDcfATraiter = dossiers.filter(d => d.new_status === 80).length;
  const countTresorerieAPayer = dossiers.filter(d => d.new_status === 110).length;
  const countAgenceCheques = dossiers.filter(d =>
    (d.new_status === 130 || d.new_status === 140) &&
    d.new_destination_branch_id === userAgence
  ).length;
  const countBoRemises = dossiers.filter(d => d.new_status === 120 && d.new_payment_method === 1).length;
  const countBoCorrections = dossiers.filter(d => d.new_status === 90).length;

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: FileText, label: "Supervision", path: "/admin/dossiers" },
    { icon: Users, label: "Utilisateurs", path: "/admin/utilisateurs" },
    { icon: Package, label: "Tables Réf", path: "/admin/references" },
    { icon: Settings, label: "Configuration", path: "/admin/configuration" }
  ] : isPrescripteur ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/prescripteur/dashboard" },
    { icon: FileText, label: "Dossiers Assignés", path: "/prescripteur/dossiers", badge: countPrescripteurAssignes > 0 ? String(countPrescripteurAssignes) : undefined },
    { icon: RotateCcw, label: "Retours Correction", path: "/prescripteur/corrections", badge: countPrescripteurCorrections > 0 ? String(countPrescripteurCorrections) : undefined }
  ] : isDCF ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dcf/dashboard" },
    { icon: FileText, label: "Dossiers à Traiter", path: "/dcf/dossiers", badge: countDcfATraiter > 0 ? String(countDcfATraiter) : undefined }
  ] : isTresorerie ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/tresorerie/dashboard" },
    { icon: FileText, label: "Dossiers à Payer", path: "/tresorerie/dossiers", badge: countTresorerieAPayer > 0 ? String(countTresorerieAPayer) : undefined }
  ] : isAgence ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/agence/dashboard" },
    { icon: FileText, label: "Chèques Agence", path: "/agence/cheques", badge: countAgenceCheques > 0 ? String(countAgenceCheques) : undefined }
  ] : [
    { icon: LayoutDashboard, label: "Dashboard", path: "/bo/dashboard" },
    { icon: FileText, label: "Tous les dossiers", path: "/bo/dossiers" },
    { icon: Package, label: "Chèques à Remettre", path: "/bo/remises", badge: countBoRemises > 0 ? String(countBoRemises) : undefined },
    { icon: Users, label: "Relances", path: "/bo/relances", badge: "12" },
    { icon: RotateCcw, label: "Corrections & Retours", path: "/bo/corrections", badge: countBoCorrections > 0 ? String(countBoCorrections) : undefined }
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
          <div className="px-4 py-6 flex flex-col items-center gap-1.5 border-b border-slate-100 dark:border-slate-800">
            <img
              src="/images/logo_sbm.png"
              alt="Groupe SBM"
              className="h-14 object-contain"
            />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
              Bureau d'Ordre
            </span>
          </div>

          <nav className="px-4 mt-4 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-4 px-2 text-slate-400 dark:text-slate-500">Overview</div>
            {menuItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 mx-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
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
                `flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#2b4c7e]/5 text-[#2b4c7e] dark:bg-slate-800 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
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
        <header className="h-20 bg-transparent flex items-center justify-end px-8 z-40 pt-4">
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
            <div className="notifications-container relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`w-10 h-10 rounded-full ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'} shadow-sm flex items-center justify-center relative hover:scale-105 transition-all`}
              >
                <Bell className="w-5 h-5" />
                {activeNotifications.some(n => !readNotifIds.includes(n.id)) && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifications ({activeNotifications.length})</span>
                    <div className="flex items-center gap-2">
                      {activeNotifications.some(n => !readNotifIds.includes(n.id)) && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-semibold text-[#2b4c7e] dark:text-blue-400 hover:underline border-r border-slate-200 dark:border-slate-700 pr-2 mr-2"
                        >
                          Tout lire
                        </button>
                      )}
                      {activeNotifications.length > 0 && (
                        <button
                          onClick={handleDismissAllNotifications}
                          className="text-[11px] font-semibold text-[#2b4c7e] dark:text-blue-400 hover:underline"
                        >
                          Tout effacer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {activeNotifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                        <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-semibold text-slate-400">Aucune notification</p>
                        <p className="text-[10px] text-slate-400">Tout est à jour !</p>
                      </div>
                    ) : (
                      activeNotifications.map((notif) => {
                        const Icon = notif.type === "transit"
                          ? Inbox
                          : notif.type === "correction"
                            ? AlertTriangle
                            : FileText;
                        const iconColor = notif.type === "transit"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : notif.type === "correction"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
                        const isUnread = !readNotifIds.includes(notif.id);

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              handleMarkAsRead(notif.id);
                              setShowNotificationsDropdown(false);
                              navigate(notif.path);
                            }}
                            className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors flex items-start gap-3 relative group ${
                              isUnread ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative ${iconColor}`}>
                              <Icon className="w-4 h-4" />
                              {isUnread && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className={`text-xs text-slate-800 dark:text-slate-200 mb-0.5 leading-tight ${isUnread ? "font-bold" : "font-medium text-slate-500 dark:text-slate-400"}`}>
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{notif.message}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                handleDismissNotification(notif.id, e);
                              }}
                              className="absolute right-2 top-3 p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:text-slate-600 dark:hover:text-slate-400 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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


