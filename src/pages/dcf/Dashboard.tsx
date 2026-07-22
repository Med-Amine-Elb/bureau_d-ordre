import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  RotateCcw,
  Eye,
  Wallet,
  ArrowRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2s animation

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart

      setCount(Math.floor(ease * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
};

function KPIPill({
  title,
  value,
  icon,
  index = 0,
  variant = "default",
  onClick,
}: any) {
  const isBlue = variant === "blue";
  const isEmerald = variant === "emerald";
  
  const iconBg = isBlue ? "bg-[#2b4c7e]/10 text-[#2b4c7e] dark:bg-blue-900/30 dark:text-blue-400" 
    : isEmerald ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#0F172B] rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-6"
      style={{ animationFillMode: "both", animationDelay: `${index * 100}ms`, animationDuration: "700ms" }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{title}</h3>
          <span className="text-slate-900 dark:text-slate-100 text-xl font-bold block leading-none mt-1">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </span>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[#2b4c7e] dark:group-hover:text-blue-400 transition-colors" />
    </div>
  );
}

const ProfileProgressCard = ({ dossiersTraites, objTraites }: any) => {
  const percentage = Math.round((dossiersTraites / objTraites) * 100) || 0;
  const avatarUrl = localStorage.getItem("userAvatar") || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
  const role = localStorage.getItem("userRole") || "DCF";

  return (
    <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-colors group-hover:bg-blue-500/20"></div>
       
       <div className="flex items-center gap-4 mb-6 relative z-10">
         <div className="relative">
           <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
           <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#0F172B] rounded-full"></div>
         </div>
         <div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Bonjour !</h3>
           <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{role}</p>
         </div>
       </div>

       <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 relative z-10">
         <div className="flex justify-between items-end mb-3">
           <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Objectif du mois</span>
           <span className="text-xl font-black text-[#2b4c7e] dark:text-blue-400">{percentage}%</span>
         </div>
         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden relative">
           <div className="bg-[#2b4c7e] dark:bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${percentage}%` }}>
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
           </div>
         </div>
         <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
            {dossiersTraites} traités / {objTraites} cible
         </p>
       </div>
    </div>
  );
}



const ActivityTimeline = () => {
  return (
    <div className="bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-500" /> Flux d'Activité
      </h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="relative flex items-start gap-4">
            <div
              className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0F172B] flex items-center justify-center z-10 bg-emerald-50 dark:bg-emerald-900/20`}
            >
              <div className={`relative w-2 h-2 rounded-full bg-emerald-500`}></div>
            </div>
            <div className="ml-10 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Dossier DOS-2026-00{i+1}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Comptabilisé
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                Il y a {i+2} heures
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardDCF() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      // On simule le filtrage Dataverse côté client pour DCF
      const visible = result.filter(
        (d) => [70, 80, 90, 100].includes(d.new_status)
      );
      setDossiers(visible);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const aAccuser = dossiers.filter((d) => d.new_status === 70).length;
  const aComptabiliser = dossiers.filter((d) => d.new_status === 80 && !d.new_est_comptabilise).length;
  const comptabilises = dossiers.filter((d) => d.new_status === 80 && d.new_est_comptabilise).length;
  const enCorrection = dossiers.filter((d) => d.new_status === 90).length;

  const chartData = [
    { name: "À Accuser", value: aAccuser, color: "#f97316" },
    { name: "Saisie Attendue", value: aComptabiliser, color: "#3b82f6" },
    { name: "Retours Corr.", value: enCorrection, color: "#ef4444" },
    { name: "Traités", value: comptabilises, color: "#10b981" }
  ];

  const handleAccuse = async (dossier: Dossier) => {
    try {
      await dataService.accuseReception(
        dossier.new_folderid,
        80, // Chez DCF
        "Utilisateur DCF" // Devrait être l'utilisateur connecté
      );
      setSuccessMessage(
        `Réception physique confirmée pour le dossier ${dossier.new_folder_number}.`
      );
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };



  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Left Content */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Hero Banner SBM Design */}
          <div className="bg-[#2b4c7e] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-[#2b4c7e]/20 flex justify-between items-center">
            {/* Cross/Stars Pattern */}
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 w-full lg:w-2/3">
              <span className="inline-block py-1.5 px-3 rounded-lg bg-white/10 text-blue-100 text-xs font-bold tracking-wider mb-6 border border-white/20 backdrop-blur-md">
                ESPACE COMPTABILITÉ
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Gérez vos saisies avec efficacité
              </h1>
              <p className="text-blue-100/90 text-sm md:text-base mb-8 max-w-xl">
                Vous avez <strong className="text-white">{aComptabiliser} factures</strong> en attente de traitement et <strong className="text-white">{aAccuser} nouveaux dossiers</strong> à accuser réception aujourd'hui.
              </p>
              <button 
                onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 80 } })}
                className="bg-white text-[#2b4c7e] hover:bg-blue-50 px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 group"
              >
                Traiter les urgences
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Illustration: Floating Glassmorphism Cards */}
            <div className="hidden lg:block relative w-48 h-48 z-10 mr-4">
              <div className="absolute top-4 right-4 w-32 h-40 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform rotate-12 transition-transform hover:rotate-6 flex flex-col p-4 gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20"></div>
                 <div className="w-full h-2 rounded bg-white/20 mt-auto"></div>
                 <div className="w-2/3 h-2 rounded bg-white/20"></div>
              </div>
              <div className="absolute bottom-2 -left-4 w-36 h-20 bg-blue-500/30 backdrop-blur-xl rounded-2xl border border-blue-300/30 shadow-2xl transform -rotate-6 flex items-center justify-center">
                 <CheckCircle2 className="w-10 h-10 text-white opacity-90 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* KPI Pills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPIPill
              title="À Comptabiliser"
              value={aComptabiliser}
              onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 80 } })}
              icon={<Wallet className="w-5 h-5" />}
              variant="blue"
              index={0}
            />
            <KPIPill
              title="À Accuser Réception"
              value={aAccuser}
              onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 70 } })}
              icon={<Clock className="w-5 h-5" />}
              variant="default"
              index={1}
            />
            <KPIPill
              title="Retours Correction"
              value={enCorrection}
              onClick={() => navigate("/dcf/dossiers", { state: { filterStatus: 90 } })}
              icon={<RotateCcw className="w-5 h-5" />}
              variant="default"
              index={2}
            />
            <KPIPill
              title="Prêts pour Trésorerie"
              value={comptabilises}
              onClick={() => navigate("/dcf/dossiers")}
              icon={<CheckCircle className="w-5 h-5" />}
              variant="emerald"
              index={3}
            />
          </div>

          {/* Chart Section */}
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in zoom-in-95 duration-500 delay-200">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              Répartition des Dossiers
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    formatter={(value: any, name: any) => [`${value} dossiers`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Table À Accuser Réception */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Nouveaux reçus
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                  {aAccuser} dossiers
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Dossier
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400">
                          Chargement...
                        </td>
                      </tr>
                    ) : dossiers.filter((d) => d.new_status === 70).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400">
                          Aucun dossier en attente d'accusé.
                        </td>
                      </tr>
                    ) : (
                      dossiers
                        .filter((d) => d.new_status === 70)
                        .map((dossier, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {dossier.new_folder_number}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleAccuse(dossier)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accuser
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table À Comptabiliser */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2b4c7e] animate-pulse" />
                  Saisie Comptable
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                  {aComptabiliser} dossiers
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Dossier
                      </th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400">
                          Chargement...
                        </td>
                      </tr>
                    ) : dossiers.filter((d) => d.new_status === 80 && !d.new_est_comptabilise).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400">
                          Aucun dossier à comptabiliser.
                        </td>
                      </tr>
                    ) : (
                      dossiers
                        .filter((d) => d.new_status === 80 && !d.new_est_comptabilise)
                        .map((dossier, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {dossier.new_folder_number}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => navigate(`/dcf/dossiers/${dossier.new_folderid}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-bold transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" /> Traiter
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-8">
            <ProfileProgressCard dossiersTraites={comptabilises} objTraites={comptabilises + aComptabiliser > 0 ? comptabilises + aComptabiliser : 10} />

            <ActivityTimeline />
        </div>
      </div>

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Action réussie
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


