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
    { id: 20, label: 'Rejeté 5 Jours', color: 'bg-red-500', hex: '#ef4444' },
    { id: 30, label: 'Transit Prescripteur', color: 'bg-blue-400', hex: '#60a5fa' },
    { id: 40, label: 'Chez Prescripteur', color: 'bg-indigo-500', hex: '#6366f1' },
    { id: 50, label: 'Validé Prescripteur', color: 'bg-emerald-400', hex: '#34d399' },
    { id: 60, label: 'Transit DCF', color: 'bg-blue-500', hex: '#3b82f6' },
    { id: 70, label: 'Chez DCF', color: 'bg-purple-500', hex: '#8b5cf6' },
    { id: 80, label: 'Bloqué DCF', color: 'bg-red-400', hex: '#f87171' },
    { id: 90, label: 'Comptabilisé', color: 'bg-emerald-500', hex: '#10b981' },
    { id: 100, label: 'Transit Trésorerie', color: 'bg-blue-600', hex: '#2563eb' },
    { id: 110, label: 'Chez Trésorerie', color: 'bg-amber-500', hex: '#f59e0b' },
    { id: 120, label: 'Prép. Règlement', color: 'bg-amber-400', hex: '#fbbf24' },
    { id: 130, label: 'Transit Agence', color: 'bg-blue-700', hex: '#1d4ed8' },
    { id: 140, label: 'Chez Agence', color: 'bg-orange-500', hex: '#f97316' },
    { id: 150, label: 'Payé (Clôturé)', color: 'bg-emerald-600', hex: '#059669' },
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
        <KPICard title="Dossiers en cours" value={enCoursTotal} trend="+12%" positive icon={<Eye className="w-4 h-4 text-blue-500" />} />
        <KPICard title="Attente BO" value={enAttenteBO} trend="-2%" positive={false} icon={<Clock className="w-4 h-4 text-indigo-500" />} />
        <KPICard title="En Retard (>5j)" value={enRetard} trend="-5%" positive icon={<AlertTriangle className="w-4 h-4 text-orange-500" />} />
        <KPICard title="Bloqués" value={bloques} trend="+1%" positive={false} icon={<Lock className="w-4 h-4 text-red-500" />} />
        <KPICard title="Chèques Attente" value={chequesAttente} trend="0%" positive icon={<PackageSearch className="w-4 h-4 text-purple-500" />} />
        <KPICard title="Clôturés J-0" value={cloturesAujourdhui} trend="+8%" positive icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 soft-shadow">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-slate-500 font-medium mb-2">Total Dossiers Traités</h3>
              <p className="text-3xl font-bold text-slate-900">{dossiers.filter(d => d.new_statut === 150).length}</p>
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium mt-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>+2.4%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">vs. last period</p>
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
          <div className="bg-white rounded-2xl p-6 flex-1 border border-slate-100 soft-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800 text-sm">Dossiers Créés (Par Semaine)</h3>
              <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" />
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.active ? '#3b82f6' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex-1 border border-slate-100 soft-shadow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 text-sm">Répartition par Statut</h3>
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
                  <span className="text-xl font-bold text-slate-900">{dossiers.length}</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Dossiers</span>
                </div>
              </div>

              {/* Custom Scrollable Legend */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mt-2" style={{ maxHeight: '100px' }}>
                {statusDistribution.filter(st => st.count > 0).map(st => (
                  <div key={st.id} className="flex justify-between items-center w-full group">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: st.hex }}></div>
                      <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{st.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800">{st.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau Alertes / Dossiers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 soft-shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Alertes & Dossiers Récents
            </h3>
            <button onClick={() => navigate("/bo/dossiers")} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Voir tout</button>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">N° Dossier</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fournisseur</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : (
                dossiers.filter(d => d.new_statut !== 150).slice(0, 5).map((dossier, i) => {
                  const isEnRetard = differenceInDays(new Date(), parseISO(dossier.new_date_reception)) > 5;
                  const inBoHand = dossier.new_statut === 10 || dossier.new_est_bloque || dossier.new_statut === 20;
                  
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 text-sm font-semibold text-slate-800 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${dossier.new_est_bloque || dossier.new_statut === 20 ? 'bg-red-500' : isEnRetard ? 'bg-orange-500' : 'bg-slate-800'}`}>
                          {dossier.new_est_bloque ? <Lock className="w-4 h-4"/> : <FileText className="w-4 h-4" />}
                        </div>
                        {dossier.new_numero_dossier}
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-600">
                        {dossier.new_fournisseur_nom || '-'}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          dossier.new_est_bloque || dossier.new_statut === 20 ? 'bg-red-100 text-red-700' : isEnRetard ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {dossier.new_statut === 20 ? 'Rejeté 5J' : dossier.new_est_bloque ? 'Bloqué' : isEnRetard ? 'En retard' : 'En cours'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => navigate(`/bo/dossiers/${dossier.new_dossierid}`)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
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
        <div className="bg-white rounded-2xl border border-slate-100 soft-shadow p-6">
          <h3 className="font-semibold text-slate-800 text-lg mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Flux Temps Réel
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
            {timelineEvents.map((evt, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div className="absolute left-0 w-6 h-6 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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

function KPICard({ title, value, trend, positive, icon }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 relative overflow-hidden group soft-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 text-sm font-semibold">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        <span className={`flex items-center text-xs font-bold mb-1 px-1.5 py-0.5 rounded-md ${positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wider">vs. mois dernier</p>
    </div>
  )
}

// Just an icon wrapper since lucide FileText wasn't imported at the top initially, though it is now. Keeping it for safety.
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);
