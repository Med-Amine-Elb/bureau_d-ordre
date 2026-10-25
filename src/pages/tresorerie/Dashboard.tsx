import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  Eye,
  Wallet,
  FileText,
  TrendingUp,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { dataService } from "@/lib/dataService";
import type { Dossier } from "@/lib/dataService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  PieChart, Pie, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from "recharts";
import TresoAccuseReceptionModal from "@/components/TresoAccuseReceptionModal";
import KpiCard from "@/components/KpiCard";
import { isDossierPaidInMonth } from "@/lib/monthlyMetrics";



export default function DashboardTresorerie() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [activeItemName, setActiveItemName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

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
  const payes = dossiers.filter((d) => isDossierPaidInMonth(d, new Date())).length;
  const moisEnCours = format(new Date(), "MMMM yyyy", { locale: fr });
  const titrePayes = `Payés — ${moisEnCours.charAt(0).toLocaleUpperCase("fr-FR")}${moisEnCours.slice(1)}`;

  const chartData = [
    { name: "À accuser", value: aAccuser, color: "#f97316", grad: "url(#grad-orange)", icon: Clock },
    { name: "Règlement", value: aRegler, color: "#3b82f6", grad: "url(#grad-blue)", icon: Wallet },
    { name: "En attente de remise", value: enAttenteRemise, color: "#8b5cf6", grad: "url(#grad-purple)", icon: FileText },
    { name: "Payés", value: payes, color: "#10b981", grad: "url(#grad-teal)", icon: CheckCircle }
  ];

  const filteredChartData = chartData.filter(d => d.value > 0);
  const totalDossiers = filteredChartData.reduce((sum, item) => sum + item.value, 0);
  
  // Find the active item by name, or default to the first available item
  const activeItem = filteredChartData.find(d => d.name === activeItemName) || filteredChartData[0] || chartData[0];
  const activePercentage = totalDossiers > 0 ? Math.round((activeItem.value / totalDossiers) * 100) : 0;

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
      setSuccessMessage("Réception confirmée.");
      setSuccessModalOpen(true);
      fetchDossiers();
      setTimeout(() => setSuccessModalOpen(false), 2000);
    } catch (err) {
      toast.error("Erreur", { description: "Impossible d'accuser réception." });
    }
  };

  const userName = localStorage.getItem("userName") || "Mohammed El Boubakri";

  // ── Radar Chart: compare Chèques per agence (excluding Casablanca) ──
  const DEFAULT_AGENCES = ["Rabat", "Tanger", "Marrakech", "Agadir", "Fès"];
  const agenceMap = new Map<string, { cheque: number; total: number }>();
  
  // Initialize map with default agencies so they always appear in the chart
  DEFAULT_AGENCES.forEach(ag => agenceMap.set(ag, { cheque: 0, total: 0 }));

  dossiers.forEach((d) => {
    let agence = d.new_destination_branch_id;
    // Exclude Casablanca or unassigned since virements typically go there
    if (!agence || agence.toLowerCase() === "casablanca") {
      return;
    }
    if (!agenceMap.has(agence)) {
      agenceMap.set(agence, { cheque: 0, total: 0 });
    }
    const entry = agenceMap.get(agence)!;
    entry.total++;
    if (d.new_payment_method === 1) {
      entry.cheque++;
    }
  });

  // Sort by total descending
  const agenceStats = Array.from(agenceMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);

  const radarData = agenceStats.map((a) => ({
    agence: a.name.length > 12 ? a.name.substring(0, 12) + '…' : a.name,
    fullName: a.name,
    Chèque: a.cheque,
  }));

  const totalCheque = agenceStats.reduce((sum, a) => sum + a.cheque, 0);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const SmoothRadarPolygon = (props: any) => {
    const { points, stroke, fill, fillOpacity, strokeWidth } = props;
    if (!points || points.length === 0) return null;

    const getSmoothPath = (pts: any[]) => {
      if (pts.length < 3) return "";
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[(i - 1 + pts.length) % pts.length];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const p3 = pts[(i + 2) % pts.length];
        
        const k = 0.2; // Tension
        const cp1x = p1.x + (p2.x - p0.x) * k;
        const cp1y = p1.y + (p2.y - p0.y) * k;
        const cp2x = p2.x - (p3.x - p1.x) * k;
        const cp2y = p2.y - (p3.y - p1.y) * k;
        
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      d += " Z";
      return d;
    };

    return (
      <path
        d={getSmoothPath(points)}
        stroke={stroke}
        strokeWidth={strokeWidth || 3}
        fill={fill}
        fillOpacity={fillOpacity}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="w-full space-y-6">

      {/* Greeting Section */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Dashboard trésorerie <span className="animate-pulse text-[#1F3B73]">⚡</span>
        </h1>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          Bonjour {userName}. Gérez vos règlements et flux financiers.
        </p>
      </div>

      {/* ═══════════ ROW 1: 4 STAT CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="À accuser réception"
          icon={Clock}
          value={aAccuser.toLocaleString()}
          loading={loading}
          iconColorClass="text-orange-500"
          iconBgClass="bg-orange-50 dark:bg-orange-500/10"
          animationDelay="0ms"
          onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 100 } })}
          subtext={
            aAccuser > 0 ? (
              <><TrendingUp className="w-3.5 h-3.5 text-orange-500" /><span className="text-xs font-semibold text-orange-500">Nouveaux</span></>
            ) : (
              <span className="text-xs text-slate-400">À jour</span>
            )
          }
        />
        <KpiCard
          title="Règlement"
          icon={Wallet}
          value={aRegler.toLocaleString()}
          loading={loading}
          iconColorClass="text-blue-500"
          iconBgClass="bg-blue-50 dark:bg-blue-500/10"
          animationDelay="60ms"
          onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 110 } })}
          subtext={<span className="text-xs text-slate-400">En attente de paiement</span>}
        />
        <KpiCard
          title="En attente de remise"
          icon={FileText}
          value={enAttenteRemise.toLocaleString()}
          loading={loading}
          iconColorClass="text-purple-500"
          iconBgClass="bg-purple-50 dark:bg-purple-500/10"
          animationDelay="120ms"
          onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 120 } })}
          subtext={<span className="text-xs text-slate-400">Chèques / Ordres prêts</span>}
        />
        <KpiCard
          title={titrePayes}
          icon={CheckCircle}
          value={payes.toLocaleString()}
          loading={loading}
          iconColorClass="text-emerald-500"
          iconBgClass="bg-emerald-50 dark:bg-emerald-500/10"
          animationDelay="180ms"
          onClick={() => navigate("/tresorerie/dossiers", { state: { filterStatus: 150 } })}
          subtext={<span className="text-xs text-slate-400">Remise finale effectuée durant ce mois</span>}
        />
      </div>

      {/* ═══════════ ROW 2: MAIN CONTENT + SIDEBAR ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table: À Accuser Réception */}
            <div
              style={{ animationDelay: "220ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[350px]"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Nouveaux reçus
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  {aAccuser} dossiers
                </span>
              </div>
              <div className="overflow-y-auto flex-1 pr-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                    ) : dossiers.filter((d) => d.new_status === 100).length === 0 ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Aucun dossier en attente d'accusé.</td></tr>
                    ) : (
                      dossiers.filter((d) => d.new_status === 100).map((dossier, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-3 px-4">
                            <Link to={`/tresorerie/dossiers/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {dossier.new_folder_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleAccuse(dossier)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold transition-all shadow-sm"
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

            {/* Table: Règlement */}
            <div
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[350px]"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1F3B73] animate-pulse" />
                  Règlement
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  {aRegler} dossiers
                </span>
              </div>
              <div className="overflow-y-auto flex-1 pr-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider rounded-l-lg">Dossier</th>
                      <th className="py-2.5 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Chargement...</td></tr>
                    ) : dossiers.filter((d) => d.new_status === 110 && !d.new_is_blocked).length === 0 ? (
                      <tr><td colSpan={2} className="py-4 text-center text-[11px] text-slate-400">Aucun règlement à traiter.</td></tr>
                    ) : (
                      dossiers.filter((d) => d.new_status === 110 && !d.new_is_blocked).map((dossier, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-3 px-4">
                            <Link to={`/tresorerie/dossiers/${dossier.new_folderid}`} className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {dossier.new_folder_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => navigate(`/tresorerie/dossiers/${dossier.new_folderid}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3B73]/10 hover:bg-[#1F3B73]/20 text-[#1F3B73] dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-[11px] font-bold transition-all"
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

          {/* PieChart */}
          <div
            style={{ animationDelay: "340ms", animationFillMode: "both" }}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-0 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row overflow-hidden"
          >
            {/* SVG Gradients */}
            <svg style={{ width: 0, height: 0, position: 'absolute' }}>
              <defs>
                <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
                <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex-1 p-6 relative">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-blue-500" /> Répartition des dossiers
              </h3>

              <div className="h-[240px] flex items-center justify-center relative -mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                      onMouseEnter={(data) => setActiveItemName(data.name)}
                    >
                      {filteredChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.grad}
                          style={{
                            opacity: activeItem.name === entry.name ? 1 : 0.7,
                            transition: 'all 0.3s ease-out',
                            filter: activeItem.name === entry.name ? `drop-shadow(0px 8px 16px ${entry.color}90)` : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Dynamic Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                  <div className={`p-2 rounded-full mb-1 transition-colors duration-300`} style={{ color: activeItem.color }}>
                    <activeItem.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-800 dark:text-white mb-0.5 transition-colors duration-300">
                    {activeItem.name}
                  </span>
                  <span className="text-xl font-semibold text-slate-900 dark:text-white transition-colors duration-300">
                    {activeItem.value} <span className="text-slate-400 text-sm font-medium">/ {activePercentage}%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Legend */}
            <div className="w-full xl:w-[280px] bg-[#0F172B] p-5 flex flex-col flex-none overflow-y-auto min-h-[250px] xl:rounded-r-2xl">
              <h4 className="text-[14px] font-medium mb-4 text-white tracking-wide">Légende:</h4>
              <div className="space-y-3 flex-1">
                {chartData.map((entry, index) => {
                  const entryPercentage = totalDossiers > 0 ? Math.round((entry.value / totalDossiers) * 100) : 0;
                  const isActive = activeItem.name === entry.name;
                  return (
                    <div
                      key={index}
                      className={`flex flex-col gap-2 p-3 -mx-3 rounded-2xl transition-all duration-300 cursor-pointer ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onMouseEnter={() => setActiveItemName(entry.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-1.5 rounded-lg border-2 transition-colors duration-300`} style={{ borderColor: isActive ? entry.color : `${entry.color}40`, color: entry.color }}>
                            <entry.icon className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <span className="text-[13px] text-slate-300 font-medium">{entry.name}</span>
                        </div>
                        <span className="text-[13px] font-medium text-white">{entry.value} <span className="text-slate-500 font-normal">/ {entryPercentage}%</span></span>
                      </div>
                      {/* Progress bar */}
                      <div className="ml-[42px] h-[4px] bg-white/10 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full rounded-full transition-all duration-[1500ms] ease-out" style={{ width: isMounted ? `${entryPercentage}%` : '0%', background: entry.grad }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="flex flex-col gap-6 flex-1">

          {/* ── Radar Chart: Comparaison par Agence ── */}
          <div className="flex flex-col h-fit">
            <div
              style={{ animationDelay: "400ms", animationFillMode: "both" }}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-3xl p-7 border border-slate-100/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative flex flex-col"
            >
              {/* Header */}
              <h3 className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight mb-6 tracking-tight">Comparaison par agence</h3>

              {/* Radar Chart */}
              <div className="relative w-full h-[260px] flex items-center justify-center -mt-4">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="agence"
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      />
                      <Radar
                        name="Chèque"
                        dataKey="Chèque"
                        stroke="#f97316"
                        strokeWidth={3}
                        fill="url(#radar-grad-cheque)"
                        fillOpacity={0.4}
                        shape={<SmoothRadarPolygon />}
                      />
                      <defs>
                        <linearGradient id="radar-grad-cheque" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center text-slate-400 text-sm">Aucune donnée disponible</div>
                )}
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-slate-800 dark:bg-slate-300 transform rotate-45"></div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">Chèques ({totalCheque})</span>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800/60 mb-4" />

              {/* Agences List (real data) */}
              <div className="flex flex-col gap-3">
                {agenceStats.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-orange-600 dark:text-orange-500">{item.cheque} chèques</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>



        </div>
      </div>

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
              Confirmation
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed">
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
