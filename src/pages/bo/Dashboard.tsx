import { useEffect, useState } from "react"
import { 
  ArrowUpRight, ArrowDownRight, PackageSearch,
  MoreHorizontal,
  Eye, FileText, PhoneCall, Truck, AlertTriangle, Clock, Lock, CheckCircle, Plus, Activity
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

import { useNavigate } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { differenceInDays, parseISO } from "date-fns";

const profitData = [
  { name: '1 Jan', value: 4000 },
  { name: '8 Jan', value: 3000 },
  { name: '15 Jan', value: 5000 },
  { name: '22 Jan', value: 9000 },
  { name: '29 Jan', value: 6500 },
  { name: '5 Feb', value: 12000 },
  { name: '12 Feb', value: 10000 },
];

const activeData = [
  { name: 'Sun', value: 4000 },
  { name: 'Mon', value: 3000 },
  { name: 'Tue', value: 8162, active: true },
  { name: 'Wed', value: 2780 },
  { name: 'Thu', value: 1890 },
  { name: 'Fri', value: 2390 },
  { name: 'Sat', value: 3490 },
];

export default function DashboardBO() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  // --- KPI Calculations ---
  const enCoursTotal = dossiers.filter(d => d.new_statut !== 150 && d.new_statut !== 20).length;
  const enAttenteBO = dossiers.filter(d => d.new_statut === 10).length; 
  const enRetard = dossiers.filter(d => d.new_statut === 20).length; 
  const bloques = dossiers.filter(d => d.new_est_bloque).length;
  const chequesAttente = dossiers.filter(d => d.new_statut > 70 && d.new_statut < 150).length;
  const cloturesAujourdhui = dossiers.filter(d => d.new_statut === 150).length;

  const statutCounts = dossiers.reduce((acc, curr) => {
    const s = curr.new_statut;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const allStatuses = [
    { id: 10, label: 'Brouillon', color: 'bg-slate-400', hex: '#94a3b8' },
    { id: 20, label: 'En Retard (>5j)', color: 'bg-red-500', hex: '#ef4444' },
    { id: 30, label: 'En Transit (Prescr.)', color: 'bg-blue-400', hex: '#60a5fa' },
    { id: 40, label: 'Chez Prescripteur', color: 'bg-indigo-500', hex: '#6366f1' },
    { id: 50, label: 'En Transit (BO)', color: 'bg-blue-500', hex: '#3b82f6' },
    { id: 60, label: 'Prêt DCF', color: 'bg-emerald-400', hex: '#34d399' },
    { id: 70, label: 'En Transit (DCF)', color: 'bg-blue-500', hex: '#3b82f6' },
    { id: 80, label: 'Chez DCF', color: 'bg-purple-500', hex: '#8b5cf6' },
    { id: 90, label: 'Retour Correction', color: 'bg-orange-500', hex: '#f97316' },
    { id: 100, label: 'En Transit (Tréso.)', color: 'bg-blue-600', hex: '#2563eb' },
    { id: 110, label: 'Chez Trésorerie', color: 'bg-indigo-600', hex: '#4f46e5' },
    { id: 120, label: 'Attente Remise', color: 'bg-emerald-500', hex: '#10b981' },
    { id: 130, label: 'En Transport', color: 'bg-orange-400', hex: '#fb923c' },
    { id: 140, label: 'Disponible Agence', color: 'bg-emerald-400', hex: '#34d399' },
    { id: 150, label: 'Payé', color: 'bg-emerald-600', hex: '#059669' },
  ];

  const totalDossiers = dossiers.length || 1;
  const statusDistribution = allStatuses.map(st => {
    const count = statutCounts[st.id] || 0;
    return { ...st, count, percent: Math.round((count / totalDossiers) * 100) };
  });

  const pieData = statusDistribution.filter(st => st.count > 0).map(st => ({
    name: st.label,
    value: st.count,
    color: st.hex
  }));
  if (pieData.length === 0) pieData.push({ name: 'Aucun', value: 1, color: '#e2e8f0' });

  const barData = [
    { name: 'Semaine 1', value: 12, active: false },
    { name: 'Semaine 2', value: 19, active: false },
    { name: 'Semaine 3', value: 8, active: false },
    { name: 'Semaine 4', value: dossiers.length, active: true },
  ];

  const timelineEvents = dossiers.slice(0, 4).map((d, i) => ({
    id: d.new_dossierid,
    action: i % 2 === 0 ? "Création Dossier" : "Mise à jour Statut",
    dossier: d.new_numero_dossier,
    time: i === 0 ? "A l'instant" : `Il y a ${i * 2} heures`
  }));

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const result = await dataService.getDossiers();
        setDossiers(result);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Bureau d'Ordre</h1>
          <p className="text-slate-500 mt-1">Supervision globale des flux fournisseurs</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate("/bo/relances")} className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 font-medium soft-shadow hover:bg-slate-50 flex items-center gap-2">
            <PhoneCall className="w-4 h-4" /> Relances
          </button>
          <button onClick={() => navigate("/bo/remises")} className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 font-medium soft-shadow hover:bg-slate-50 flex items-center gap-2">
            <Truck className="w-4 h-4" /> Remises Chèques
          </button>
          <button onClick={() => navigate("/bo/dossiers/nouveau")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-sm font-semibold soft-shadow transition-colors flex items-center gap-2 shadow-blue-500/20">
             <Plus className="w-4 h-4" /> Nouveau Dossier
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard index={0} variant="blue" title="Dossiers en cours" value={enCoursTotal} trend="+12%" positive icon={<Eye className="w-5 h-5 text-white group-hover:animate-pulse" />} />
        <KPICard index={1} title="Attente BO" value={enAttenteBO} trend="-2%" positive={false} icon={<Clock className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform duration-300" />} />
        <KPICard index={2} title="En Retard (>5j)" value={enRetard} trend="-5%" positive icon={<AlertTriangle className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform duration-300" />} />
        <KPICard index={3} title="Bloqués" value={bloques} trend="+1%" positive={false} icon={<Lock className="w-5 h-5 text-red-500 group-hover:-rotate-12 transition-transform duration-300" />} />
        <KPICard index={4} title="Chèques Attente" value={chequesAttente} trend="0%" positive icon={<PackageSearch className="w-5 h-5 text-purple-500 group-hover:-translate-y-1 transition-transform duration-300" />} />
        <KPICard index={5} variant="emerald" title="Clôturés" value={cloturesAujourdhui} trend="+8%" positive icon={<CheckCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 soft-shadow flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-2 uppercase tracking-wide text-xs">Évolution des traitements</h3>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{dossiers.filter(d => d.new_statut === 150).length}</p>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+14.2%</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dossiers clôturés vs. mois précédent</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 md:gap-8 md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Délai Moyen (TMT)</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">2.4 <span className="text-sm font-medium text-slate-400">Jours</span></p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Taux de Rejet</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">4.1 <span className="text-sm font-medium text-slate-400">%</span></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Conformité</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 98%
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(val) => `${val/1000}K`} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6, stroke: '#2563eb', strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Charts */}
        <div className="flex flex-col gap-6">
          <div className="bg-card dark:bg-slate-900 rounded-2xl p-6 flex-1 border border-slate-100 dark:border-slate-800 soft-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Dossiers Créés (Par Semaine)</h3>
              <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" />
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px'}}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.active ? '#3b82f6' : '#e2e8f0'} className="transition-all duration-300 hover:fill-blue-400" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card dark:bg-slate-900 rounded-2xl p-6 flex-1 border border-slate-100 dark:border-slate-800 soft-shadow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Répartition par Statut</h3>
              <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" />
            </div>
            
            <div className="flex flex-col h-full gap-4">
              {/* Donut Chart */}
              <div className="h-[120px] relative w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      innerRadius={35} 
                      outerRadius={55} 
                      paddingAngle={4} 
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{dossiers.length}</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Dossiers</span>
                </div>
              </div>

              {/* Custom Scrollable Legend */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mt-2" style={{ maxHeight: '100px' }}>
                {statusDistribution.filter(st => st.count > 0).map(st => (
                  <div key={st.id} className="flex justify-between items-center w-full group">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: st.hex }}></div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{st.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{st.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau Alertes / Dossiers */}
        <div className="bg-card dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 soft-shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Alertes & Dossiers Récents
            </h3>
            <button onClick={() => navigate("/bo/dossiers")} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Voir tout</button>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">N° Dossier</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fournisseur</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : (
                dossiers.filter(d => d.new_statut !== 150 && d.new_statut !== 20).slice(0, 5).map((dossier, i) => {
                  const isEnRetard = differenceInDays(new Date(), parseISO(dossier.new_date_reception)) > 5;
                  const inBoHand = dossier.new_statut === 10 || dossier.new_est_bloque || dossier.new_statut === 20;
                  
                  return (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${dossier.new_est_bloque || dossier.new_statut === 20 ? 'bg-red-500' : isEnRetard ? 'bg-orange-500' : 'bg-slate-800 dark:bg-slate-700'}`}>
                          {dossier.new_est_bloque ? <Lock className="w-4 h-4"/> : <FileText className="w-4 h-4" />}
                        </div>
                        {dossier.new_numero_dossier}
                      </td>
                      <td className="py-4">
                        {getTypeBadge(dossier.new_type_document)}
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {dossier.new_fournisseur_nom || '-'}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          dossier.new_est_bloque || dossier.new_statut === 20 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : isEnRetard ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {dossier.new_statut === 20 ? 'Rejeté 5J' : dossier.new_est_bloque ? 'Bloqué' : isEnRetard ? 'En retard' : 'En cours'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => navigate(`/bo/dossiers/${dossier.new_dossierid}`)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm">
                          {inBoHand ? 'Traiter' : 'Consulter'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Timeline Activité */}
        <div className="bg-card dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 soft-shadow p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Flux Temps Réel
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {timelineEvents.map((evt, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 ${i === 0 ? 'bg-emerald-50' : 'bg-slate-50 dark:bg-slate-800'}`}>
                  {i === 0 && (
                    <div className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-20"></div>
                  )}
                  <div className={`relative w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                </div>
                <div className="ml-10">
                  <p className="text-sm font-semibold text-slate-900">{evt.action}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{evt.dossier}</p>
                  <p className="text-xs text-slate-400 mt-1">{evt.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

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

function KPICard({ title, value, trend, positive, icon, index = 0, variant = 'default' }: any) {
  const isBlue = variant === 'blue';
  const isEmerald = variant === 'emerald';
  const isColored = isBlue || isEmerald;

  const bgClass = isBlue ? 'bg-blue-600 border-blue-500' : isEmerald ? 'bg-emerald-500 border-emerald-400' : 'bg-white border-slate-100';
  const titleClass = isColored ? 'text-blue-50' : 'text-slate-500';
  const valueClass = isColored ? 'text-white' : 'text-slate-900';
  const iconBgClass = isBlue ? 'bg-blue-500/50 group-hover:bg-blue-400/50' : isEmerald ? 'bg-emerald-600/30 group-hover:bg-emerald-500/30' : 'bg-slate-50 group-hover:bg-blue-50';
  const trendBgClass = isColored 
    ? (positive ? 'bg-white/20 text-white' : 'bg-black/20 text-white') 
    : (positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50');
  const footerClass = isColored ? 'text-white/60' : 'text-slate-400';

  return (
    <div 
      className={`${bgClass} rounded-2xl p-5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-6`}
      style={{ animationFillMode: 'both', animationDelay: `${index * 100}ms`, animationDuration: '700ms' }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className={`${titleClass} text-sm font-semibold`}>{title}</h3>
        <div className={`p-2 rounded-xl transition-colors ${iconBgClass}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className={`${valueClass} text-3xl font-bold tracking-tight`}>
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </span>
        <span className={`flex items-center text-xs font-bold mb-1 px-1.5 py-0.5 rounded-md ${trendBgClass}`}>
          {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
      </div>
      <p className={`text-[10px] font-medium mt-2 uppercase tracking-wider ${footerClass}`}>vs. mois dernier</p>
    </div>
  )
}

function getTypeBadge(type: number) {
  switch(type) {
    case 100: return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">FACTURE</span>;
    case 200: return <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">AVOIR</span>;
    case 300: return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">CONTRAT</span>;
    case 400: return <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">CHÈQUE</span>;
    case 500: return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">ACOMPTE</span>;
    default: return <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">INCONNU</span>;
  }
}

// Just an icon wrapper since lucide FileText wasn't imported at the top initially, though it is now. Keeping it for safety.
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);
