import { useEffect, useState } from "react";
import {
  Settings,
  Clock,
  BellRing,
  AlertOctagon,
  Save,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type { SystemConfig } from "@/lib/dataService";

export default function AdminConfiguration() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings states mapping directly to Dataverse new_systemconfiguration properties
  const [regle5Jours, setRegle5Jours] = useState(5);
  const [relanceJours, setRelanceJours] = useState(15);
  const [alerteBlocageJours, setAlerteBlocageJours] = useState(7);
  const [configId, setConfigId] = useState("cfg-001");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await dataService.getSystemConfig();
        if (config && config.new_systemconfigid) {
          setConfigId(config.new_systemconfigid);
          setRegle5Jours(config.new_regle_5_jours_limite);
          setRelanceJours(config.new_relance_seuil_jours);
          setAlerteBlocageJours(config.new_alerte_blocage_jours);
        }
      } catch (err) {
        toast.error("Erreur de récupération des paramètres système");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (regle5Jours <= 0 || relanceJours <= 0 || alerteBlocageJours <= 0) {
      toast.error("Tous les seuils doivent être des entiers strictement positifs.");
      setSaving(false);
      return;
    }

    try {
      const payload: SystemConfig = {
        new_systemconfigid: configId,
        new_regle_5_jours_limite: Number(regle5Jours),
        new_relance_seuil_jours: Number(relanceJours),
        new_alerte_blocage_jours: Number(alerteBlocageJours)
      };

      await dataService.updateSystemConfig(payload);
      toast.success("Paramètres système enregistrés avec succès !");
    } catch (err) {
      toast.error("Erreur d'enregistrement dans la table de configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Chargement de la configuration...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Paramètres du système
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Ajustez les seuils opérationnels et les règles métiers. Les modifications s'appliquent globalement dans la table Dataverse `new_systemconfiguration`.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Form Column */}
        <div className="md:col-span-2 bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSave} className="space-y-6">
            <h2 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Settings className="w-5 h-5 text-[#1F3B73]" /> Configuration des seuils
            </h2>

            {/* Threshold 1: 5-Day Rule */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Règle des 5 Jours (Dépôt Facture)
                </label>
                <span className="text-xs text-[#1F3B73] font-semibold bg-[#1F3B73]/10 px-2 py-0.5 rounded-lg">Valeur active : {regle5Jours} jours</span>
              </div>
              <p className="text-xs text-slate-400">
                Nombre maximal de jours autorisés entre la date d'émission de la facture par le fournisseur et sa réception au Bureau d'Ordre avant de déclencher un rejet automatique.
              </p>
              <input
                type="number"
                min="1"
                required
                value={regle5Jours}
                onChange={(e) => setRegle5Jours(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-bold"
              />
            </div>

            {/* Threshold 2: Relance auto */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-indigo-500" />
                  Seuil de relance automatique
                </label>
                <span className="text-xs text-primary font-semibold bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg">Valeur active : {relanceJours} jours</span>
              </div>
              <p className="text-xs text-slate-400">
                Délai en jours d'inactivité sur un dossier (bloqué ou en attente d'approbation chez un prescripteur) avant que le flux Power Automate n'envoie une relance email automatique.
              </p>
              <input
                type="number"
                min="1"
                required
                value={relanceJours}
                onChange={(e) => setRelanceJours(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-bold"
              />
            </div>

            {/* Threshold 3: Alert Blocage SLA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                  Alerte Blocage Persistant (SLA)
                </label>
                <span className="text-xs text-red-600 font-semibold bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-lg">Valeur active : {alerteBlocageJours} jours</span>
              </div>
              <p className="text-xs text-slate-400">
                Seuil de jours à partir duquel un dossier bloqué n'ayant reçu aucune modification remonte en statut critique dans le moniteur de supervision.
              </p>
              <input
                type="number"
                min="1"
                required
                value={alerteBlocageJours}
                onChange={(e) => setAlerteBlocageJours(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 text-sm text-slate-950 dark:text-white font-bold"
              />
            </div>

            {/* Form actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#1F3B73] hover:bg-[#16294F] text-white px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Settings className="w-5 h-5 animate-spin" /> Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          {/* Help Card */}
          <div className="bg-[#1F3B73]/5 dark:bg-blue-950/20 border border-[#1F3B73]/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#1F3B73]" /> Comment ça marche ?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les paramètres enregistrés ici sont liés à la ligne unique de configuration de l'entité unique <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded font-mono">new_systemconfiguration</code>.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              En production, le déclencheur de flux Power Automate est configuré pour écouter les modifications de cette table. Lors d'une modification, le service de cache se met à jour instantanément pour appliquer les nouvelles règles métiers lors des opérations de validation.
            </p>
          </div>

          {/* Validation Card */}
          <div className="bg-white dark:bg-[#0F172B] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-full text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm">Contrôle de conformité PCF</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tous les champs sont typés en entier et validés par le schéma de base de données Power Apps avant toute validation de transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


