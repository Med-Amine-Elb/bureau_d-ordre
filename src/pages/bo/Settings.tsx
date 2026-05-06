import { useState } from "react";
import { User, Bell, Shield, Moon, Sun, Monitor, Save, LogOut, Check, HelpCircle } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(false);

  const [notifs, setNotifs] = useState({
    email: true,
    delays: true,
    rejections: true,
    reminders: false
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Paramètres enregistrés", {
        description: "Vos préférences ont été mises à jour avec succès."
      });
    }, 1000);
  };

  const sections = [
    { id: "profile", label: "Profil & Compte", icon: User },
    { id: "appearance", label: "Apparence", icon: Moon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité & Système", icon: Shield },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos préférences de compte et configurez l'application.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow overflow-hidden">
            <nav className="flex flex-col">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-all border-l-4 ${
                    activeSection === section.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
             <div className="flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Besoin d'aide ? Consultez la documentation utilisateur ou contactez le support technique GBM.
                </p>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6">
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-700 soft-shadow overflow-hidden">
            {/* Header of Section */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {sections.find(s => s.id === activeSection)?.label}
               </h2>
               <button 
                 onClick={handleSave}
                 disabled={loading}
                 className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold soft-shadow transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                 Enregistrer
               </button>
            </div>

            <div className="p-8">
               {/* Profile Section */}
               {activeSection === "profile" && (
                 <div className="space-y-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                       <div className="relative group">
                          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold border-4 border-white dark:border-slate-800 soft-shadow">
                            MB
                          </div>
                          <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 soft-shadow group-hover:scale-110 transition-transform">
                             <Monitor className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                          </button>
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Med Amine El Boubakri</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Responsable Bureau d'Ordre • GBM Casablanca</p>
                          <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                             Compte Actif
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                       <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nom Complet</label>
                          <input type="text" defaultValue="Med Amine El Boubakri" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adresse Email</label>
                          <input type="email" defaultValue="amine.elb@gbm.ma" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                       </div>
                    </div>
                 </div>
               )}

               {/* Appearance Section */}
               {activeSection === "appearance" && (
                 <div className="space-y-6">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Personnalisez l'interface de l'application selon vos préférences.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {[
                         { id: "light", label: "Clair", icon: Sun, desc: "Affinage classique" },
                         { id: "dark", label: "Sombre", icon: Moon, desc: "Deep Navy Premium" },
                         { id: "system", label: "Système", icon: Monitor, desc: "Auto-adaptatif" }
                       ].map((mode) => (
                         <button
                           key={mode.id}
                           onClick={() => setTheme(mode.id as any)}
                           className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all gap-4 text-center ${
                             theme === mode.id
                               ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                               : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                           }`}
                         >
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === mode.id ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                             <mode.icon className="w-6 h-6" />
                           </div>
                           <div>
                             <p className="font-bold text-sm">{mode.label}</p>
                             <p className="text-xs mt-1 opacity-70">{mode.desc}</p>
                           </div>
                           {theme === mode.id && <Check className="w-5 h-5 absolute top-4 right-4" />}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               {/* Notifications Section */}
               {activeSection === "notifications" && (
                 <div className="space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Choisissez les événements pour lesquels vous souhaitez être notifié.</p>
                    
                    {[
                      { id: "email", label: "Alertes Email", desc: "Recevoir un récapitulatif quotidien des dossiers en cours." },
                      { id: "delays", label: "Dossiers en Retard", desc: "Notification instantanée quand un dossier dépasse 5 jours." },
                      { id: "rejections", label: "Rejets & Blocages", desc: "Être alerté dès qu'un prescripteur rejette un dossier." },
                      { id: "reminders", label: "Relances Automatiques", desc: "Activer les relances automatiques vers les prescripteurs." }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <div className="space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                         </div>
                         <button 
                           onClick={() => setNotifs({...notifs, [item.id]: !notifs[item.id as keyof typeof notifs]})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifs[item.id as keyof typeof notifs] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                         >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifs[item.id as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-1'}`} />
                         </button>
                      </div>
                    ))}
                 </div>
               )}

               {/* Security Section */}
               {activeSection === "security" && (
                 <div className="space-y-6 text-center py-12">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sécurité & Système</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">La gestion de la sécurité et les logs avancés sont réservés aux administrateurs système GBM.</p>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-8 flex justify-center gap-4">
                       <button className="text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                          <LogOut className="w-4 h-4" /> Déconnexion
                       </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-600 px-4">
             <p>Application Bureau d'Ordre GBM v2.1.0</p>
             <p>© 2026 Groupe GBM IT</p>
          </div>
        </main>
      </div>
    </div>
  );
}
