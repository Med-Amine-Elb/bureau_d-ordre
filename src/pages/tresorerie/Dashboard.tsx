import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  Eye,
  Wallet,
  ArrowRight,
  Activity,
  Banknote,
  Lock,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { differenceInDays, parseISO } from "date-fns";
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import TresoAccuseReceptionModal from "@/components/TresoAccuseReceptionModal";

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2s animation

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

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
  const isAmber = variant === "amber";
  
  const iconBg = isBlue ? "bg-[#2b4c7e]/10 text-[#2b4c7e] dark:bg-blue-900/30 dark:text-blue-400" 
    : isEmerald ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    : isAmber ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
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

const ProfileProgressCard = ({ dossiersPayes, objPayes, aAccuser, enAttenteRemise }: any) => {
  const percentage = Math.round((dossiersPayes / objPayes) * 100) || 0;
  const avatarUrl = localStorage.getItem("userAvatar") || "https://api.dicebear.com/7.x/avataaars/svg?seed=Treasury";
  const role = localStorage.getItem("userRole") || "Trésorerie";
  const navigate = useNavigate();

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
           <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Objectif de Règlement</span>
           <span className="text-xl font-black text-[#2b4c7e] dark:text-blue-400">{percentage > 100 ? 100 : percentage}%</span>
         </div>
         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden relative">
           <div className="bg-[#2b4c7e] dark:bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${percentage > 100 ? 100 : percentage}%` }}>
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
           </div>
         </div>
         <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
            {dossiersPayes} réglés / {objPayes} cible
         </p>
       </div>

       {/* Section Dossiers en Transit / Attente */}
       <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 relative z-10">
         <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
           Flux de Transition
         </h4>
         <div className="grid grid-cols-2 gap-3">
           {/* À Accuser Réception */}
           <button
             onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 100 } })}
             className="bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 p-3 rounded-xl border border-amber-100/70 dark:border-amber-900/30 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group/btn min-h-[90px] shadow-sm hover:shadow"
           >
             <div className="flex items-center justify-between w-full mb-2">
               <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">À Accuser</span>
               <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover/btn:rotate-12 transition-transform" />
             </div>
             <div>
               <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-200 block leading-none">
                 <AnimatedNumber value={aAccuser} />
               </span>
               <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-1 block">
                 Nouveaux dossiers
               </span>
             </div>
           </button>

           {/* En Attente Remise */}
           <button
             onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 120 } })}
             className="bg-purple-50/50 hover:bg-purple-100/60 dark:bg-purple-950/10 dark:hover:bg-purple-950/20 p-3 rounded-xl border border-purple-100/70 dark:border-purple-900/30 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group/btn min-h-[90px] shadow-sm hover:shadow"
           >
             <div className="flex items-center justify-between w-full mb-2">
               <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">Attente Remise</span>
               <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover/btn:translate-x-0.5 transition-transform" />
             </div>
             <div>
               <span className="text-2xl font-extrabold text-purple-900 dark:text-purple-200 block leading-none">
                 <AnimatedNumber value={enAttenteRemise} />
               </span>
               <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 font-medium mt-1 block">
                 Chèques prêts
               </span>
             </div>
           </button>
         </div>
       </div>
    </div>
  );
}


const formatEventTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} j`;
  } catch (e) {
    return dateStr;
  }
};

const buildTimelineEvents = (dossiers: Dossier[]) => {
  const events: { action: string; dossier: string; time: string; timestamp: string }[] = [];
  
  dossiers.forEach((d) => {
    if (d.new_reception_date) {
      events.push({ action: "Réception au BO", dossier: d.new_folder_number, time: "", timestamp: d.new_reception_date });
    }
    if (d.new_date_accuse) {
      events.push({ action: "Accusé de réception BO", dossier: d.new_folder_number, time: "", timestamp: d.new_date_accuse });
    }
    if (d.new_date_trans_prescripteur) {
      events.push({ action: "Transmis au Prescripteur", dossier: d.new_folder_number, time: "", timestamp: d.new_date_trans_prescripteur });
    }
    if (d.new_date_accuse_prescripteur) {
      events.push({ action: "Accusé par le Prescripteur", dossier: d.new_folder_number, time: "", timestamp: d.new_date_accuse_prescripteur });
    }
    if (d.new_date_val_prescripteur) {
      events.push({ action: "Validé par le Prescripteur", dossier: d.new_folder_number, time: "", timestamp: d.new_date_val_prescripteur });
    }
    if (d.new_date_retour_bo) {
      events.push({ action: "Retourné pour Correction", dossier: d.new_folder_number, time: "", timestamp: d.new_date_retour_bo });
    }
    if (d.new_date_trans_dcf) {
      events.push({ action: "Transmis à la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_date_trans_dcf });
    }
    if (d.new_date_accuse_dcf) {
      events.push({ action: "Accusé par la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_date_accuse_dcf });
    }
    if (d.new_date_val_dcf) {
      events.push({ action: "Validé par la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_date_val_dcf });
    }
    if (d.new_accounting_date) {
      events.push({ action: "Comptabilisé par la DCF", dossier: d.new_folder_number, time: "", timestamp: d.new_accounting_date });
    }
    if (d.new_cheque_preparation_date) {
      events.push({ action: "Chèque préparé (Trésorerie)", dossier: d.new_folder_number, time: "", timestamp: d.new_cheque_preparation_date });
    }
    if (d.new_date_virement) {
      events.push({ action: "Réglé par Virement", dossier: d.new_folder_number, time: "", timestamp: d.new_date_virement });
    }
    const deliveryDate = d.new_delivery_date || d.new_reception_date_agence || d.new_date_livraison;
    if (deliveryDate) {
      events.push({ action: "Chèque reçu par l'Agence", dossier: d.new_folder_number, time: "", timestamp: deliveryDate });
    }
    if (d.new_final_delivery_date) {
      events.push({ action: "Chèque remis au Fournisseur", dossier: d.new_folder_number, time: "", timestamp: d.new_final_delivery_date });
    }
  });

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((evt) => ({
      ...evt,
      time: formatEventTime(evt.timestamp)
    }));
};

const ActivityTimeline = ({ timelineEvents }: any) => {
  return (
    <div className="bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-500"></div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-500" /> Flux d'Activité
      </h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {timelineEvents.map((evt: any, i: number) => (
          <div key={i} className="relative flex items-start gap-4">
            <div
              className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0F172B] flex items-center justify-center z-10 bg-blue-50 dark:bg-blue-900/20`}
            >
              <div className={`relative w-2 h-2 rounded-full bg-blue-500`}></div>
            </div>
            <div className="ml-10 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {evt.action}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                {evt.dossier}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                {evt.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardTresorerie() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isAccuseModalOpen, setIsAccuseModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const fetchDossiers = async () => {
    try {
      const result = await dataService.getDossiers();
      const visible = result.filter(
        (d) => d.new_status >= 100
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

  const aAccuser = dossiers.filter((d) => d.new_status === 100).length;
  const aRegler = dossiers.filter((d) => d.new_status === 110 && !d.new_is_blocked).length;
  const enAttenteRemise = dossiers.filter((d) => d.new_status === 120).length;
  const payes = dossiers.filter((d) => d.new_status === 150).length;
  const bloques = dossiers.filter((d) => d.new_is_blocked && (d.new_status === 100 || d.new_status === 110)).length;


  const chartData = [
    { name: "À Accuser", value: aAccuser, color: "#f97316" },
    { name: "À Régler", value: aRegler, color: "#3b82f6" },
    { name: "Attente Remise", value: enAttenteRemise, color: "#8b5cf6" },
    { name: "Payés/Clôturés", value: payes, color: "#10b981" }
  ];

  const handleAccuse = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setIsAccuseModalOpen(true);
  };

  const handleConfirmAccuse = async (data: { commentaire: string; documentsRecons: string[] }) => {
    if (!selectedDossier) return;
    try {
      setIsAccuseModalOpen(false);
      await dataService.updateDossier(selectedDossier.new_folderid, {
        new_status: 110, // Chez Trésorerie
        new_accuse_par: "Utilisateur Trésorerie",
        new_date_accuse: new Date().toISOString(),
        new_commentaire_reception: data.commentaire
      });
      setSuccessMessage(
        `Réception confirmée pour le dossier ${selectedDossier.new_folder_number}.`
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
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 w-full lg:w-2/3">
              <span className="inline-block py-1.5 px-3 rounded-lg bg-white/10 text-blue-100 text-xs font-bold tracking-wider mb-6 border border-white/20 backdrop-blur-md">
                ESPACE TRÉSORERIE
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Gérez vos règlements
              </h1>
              <p className="text-blue-100/90 text-sm md:text-base mb-8 max-w-xl">
                Vous avez <strong className="text-white">{aRegler} dossiers</strong> en attente de paiement et <strong className="text-white">{aAccuser} nouveaux dossiers</strong> à accuser réception aujourd'hui.
              </p>
              <button 
                onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 110 } })}
                className="bg-white text-[#2b4c7e] hover:bg-blue-50 px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 group"
              >
                Traiter les règlements
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:block relative w-48 h-48 z-10 mr-4">
              <div className="absolute top-4 right-4 w-32 h-40 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform rotate-12 transition-transform hover:rotate-6 flex flex-col p-4 gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/20"></div>
                 <div className="w-full h-2 rounded bg-white/20 mt-auto"></div>
                 <div className="w-2/3 h-2 rounded bg-white/20"></div>
              </div>
              <div className="absolute bottom-2 -left-4 w-36 h-20 bg-blue-500/30 backdrop-blur-xl rounded-2xl border border-blue-300/30 shadow-2xl transform -rotate-6 flex items-center justify-center">
                 <Banknote className="w-10 h-10 text-white opacity-90 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* KPI Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPIPill
              title="À Préparer"
              value={aRegler}
              onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 110 } })}
              icon={<Wallet className="w-5 h-5" />}
              variant="blue"
              index={0}
            />
            <KPIPill
              title="Dossiers Payés"
              value={payes}
              onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 150 } })}
              icon={<CheckCircle className="w-5 h-5" />}
              variant="emerald"
              index={1}
            />
            <KPIPill
              title="Dossiers Bloqués"
              value={bloques}
              onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: "BLOQUE" } })}
              icon={<Lock className="w-5 h-5 text-rose-500" />}
              variant="amber"
              index={2}
            />
          </div>

          <div className="space-y-8">
            {/* Table À Préparer (Chez Trésorerie) - Full Width */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Dossiers À Préparer (Chez Trésorerie)
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                  {aRegler} dossiers
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fournisseur</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mode Paiement</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jours d'attente</th>
                      <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Chargement...</td>
                      </tr>
                    ) : aRegler === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Aucun dossier à préparer.</td>
                      </tr>
                    ) : (
                      dossiers
                        .filter((d) => d.new_status === 110 && !d.new_is_blocked)
                        .slice(0, 5)
                        .map((dossier, i) => {
                          const waitDays = differenceInDays(new Date(), parseISO(dossier.new_date_accuse || dossier.new_reception_date));
                          return (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">{dossier.new_folder_number}</td>
                              <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">{dossier.new_supplier_id || "-"}</td>
                              <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                                {dossier.new_payment_method === 1 ? "Chèque" : dossier.new_payment_method === 2 ? "Virement" : "À définir"}
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${waitDays > 5 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {waitDays} jours
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => navigate(`/tresorerie/dossiers/${dossier.new_folderid}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-bold transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Traiter
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Table À Accuser Réception */}
              <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    À Accuser Réception
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                    {aAccuser} dossiers
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier</th>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400">Chargement...</td>
                        </tr>
                      ) : aAccuser === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400">Aucun dossier en attente d'accusé.</td>
                        </tr>
                      ) : (
                        dossiers
                          .filter((d) => d.new_status === 100)
                          .slice(0, 5)
                          .map((dossier, i) => (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">{dossier.new_folder_number}</td>
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

              {/* Table En Attente Remise */}
              <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    En Attente Remise
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                    {enAttenteRemise} chèques
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossier</th>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Détail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400">Chargement...</td>
                        </tr>
                      ) : enAttenteRemise === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400">Aucun chèque prêt.</td>
                        </tr>
                      ) : (
                        dossiers
                          .filter((d) => d.new_status === 120)
                          .slice(0, 5)
                          .map((dossier, i) => (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">{dossier.new_folder_number}</td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => navigate(`/tresorerie/dossiers/${dossier.new_folderid}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Voir
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
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-8">
            <ProfileProgressCard 
              dossiersPayes={payes + enAttenteRemise} 
              objPayes={(payes + enAttenteRemise + aRegler > 0) ? (payes + enAttenteRemise + aRegler) : 10} 
              aAccuser={aAccuser}
              enAttenteRemise={enAttenteRemise}
            />

            {/* Chart Section */}
            <div className="bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in zoom-in-95 duration-500 delay-200">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                Répartition des Dossiers
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.filter(d => d.value > 0).map((entry, index) => (
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

            <ActivityTimeline timelineEvents={buildTimelineEvents(dossiers)} />
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

      {/* Accusé Réception Modal */}
      <TresoAccuseReceptionModal
        isOpen={isAccuseModalOpen}
        dossier={selectedDossier}
        onClose={() => {
          setIsAccuseModalOpen(false);
          setSelectedDossier(null);
        }}
        onConfirm={handleConfirmAccuse}
      />
    </div>
  );
}


