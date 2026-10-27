import { useEffect, useState } from "react";
import {
  Settings,
  Clock,
  BellRing,
  Save,
  FileClock,
} from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type { SystemConfig } from "@/lib/dataService";

export default function AdminConfiguration() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [enabled, setEnabled] = useState(true);
  const [initialDelayDays, setInitialDelayDays] = useState(7);
  const [repeatIntervalDays, setRepeatIntervalDays] = useState(1);
  const [invoiceReceiptLimitDays, setInvoiceReceiptLimitDays] = useState(5);
  const [configId, setConfigId] = useState("");
  const [activeTab, setActiveTab] = useState<"reminders" | "invoice-receipt">("reminders");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await dataService.getSystemConfig();
        if (config) {
          setConfigId(config.new_reminderconfigurationid);
          setEnabled(config.new_remindersenabled);
          setInitialDelayDays(config.new_initialdelaydays);
          setRepeatIntervalDays(config.new_repeatintervaldays);
          setInvoiceReceiptLimitDays(config.new_invoicereceiptlimitdays);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de récupération de la configuration des relances.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const valid = activeTab === "reminders"
      ? Number.isInteger(initialDelayDays) && initialDelayDays >= 1 && Number.isInteger(repeatIntervalDays) && repeatIntervalDays >= 1
      : Number.isInteger(invoiceReceiptLimitDays) && invoiceReceiptLimitDays >= 1;
    if (!valid) {
      toast.error("Le délai doit être un nombre entier supérieur ou égal à 1.");
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<SystemConfig> = activeTab === "reminders"
        ? {
            new_reminderconfigurationid: configId,
            new_remindersenabled: enabled,
            new_initialdelaydays: Number(initialDelayDays),
            new_repeatintervaldays: Number(repeatIntervalDays),
          }
        : {
            new_reminderconfigurationid: configId,
            new_invoicereceiptlimitdays: Number(invoiceReceiptLimitDays),
          };

      await dataService.updateSystemConfig(payload);
      if (!configId) {
        const config = await dataService.getSystemConfig();
        setConfigId(config.new_reminderconfigurationid);
      }
      toast.success("Paramètres enregistrés.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement dans la configuration des relances.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Chargement de la configuration...</div>;
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Paramètres
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configurez les délais de traitement et les relances des dossiers.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0F172B]">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4 dark:border-slate-800" role="group" aria-label="Catégories de paramètres">
          <button
            type="button"
            aria-pressed={activeTab === "reminders"}
            onClick={() => setActiveTab("reminders")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "reminders" ? "bg-[#1F3B73] text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
          >
            <BellRing className="h-4 w-4" /> Relances
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "invoice-receipt"}
            onClick={() => setActiveTab("invoice-receipt")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "invoice-receipt" ? "bg-[#1F3B73] text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
          >
            <FileClock className="h-4 w-4" /> Délai facture et réception
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 p-6 md:p-8">
          {activeTab === "reminders" ? (
            <section aria-label="Relances" className="w-full space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Relances automatiques</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Définissez le premier envoi et la fréquence des rappels suivants.</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <div>
                  <label htmlFor="reminders-enabled" className="text-sm font-semibold text-slate-800 dark:text-slate-100">Activer les relances automatiques</label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Elles cessent lorsque le statut du dossier change.</p>
                </div>
                <input id="reminders-enabled" type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-[#1F3B73]" />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="initial-delay" className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200"><Clock className="h-4 w-4 text-blue-500" /> Première relance après</label>
                  <div className="relative">
                    <input id="initial-delay" type="number" min="1" required step="1" value={initialDelayDays} onChange={(e) => setInitialDelayDays(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">jours</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">À partir de l’accusé de réception par le rôle destinataire.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="repeat-interval" className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200"><BellRing className="h-4 w-4 text-indigo-500" /> Relances suivantes tous les</label>
                  <div className="relative">
                    <input id="repeat-interval" type="number" min="1" required step="1" value={repeatIntervalDays} onChange={(e) => setRepeatIntervalDays(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">jours</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tant que le dossier reste à la même étape.</p>
                </div>
              </div>
            </section>
          ) : (
            <section aria-label="Délai facture et réception" className="w-full space-y-6">
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Délai de réception d’une facture</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Définissez le délai autorisé entre la date de facture et sa réception au Bureau d’Ordre.</p>
                </div>
                <div className="max-w-xl space-y-2">
                  <label htmlFor="invoice-receipt-limit" className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200"><Clock className="h-4 w-4 text-amber-500" /> Délai maximal entre la facture et sa réception</label>
                  <div className="relative">
                    <input id="invoice-receipt-limit" type="number" min="1" required step="1" value={invoiceReceiptLimitDays} onChange={(e) => setInvoiceReceiptLimitDays(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">jours</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1F3B73] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#16294F] disabled:opacity-50">
              {saving ? <><Settings className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4" /> Enregistrer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


