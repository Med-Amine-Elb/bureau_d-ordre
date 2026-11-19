import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BellRing, Clock3, Eye, RefreshCw, Search, Users } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { dataService } from "@/lib/dataService";
import type { DueInternalReminder } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";

export default function Relances() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<DueInternalReminder[]>([]);
  const [remindersThisMonth, setRemindersThisMonth] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [due, monthlyCount] = await Promise.all([
        dataService.getDueInternalReminders(),
        dataService.getMonthlyReminderCount(),
      ]);
      setReminders(due);
      setRemindersThisMonth(monthlyCount);
    } catch (loadError) {
      console.error("Impossible de charger les relances internes :", loadError);
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les relances.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const visibleReminders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    if (!normalizedSearch) return reminders;
    return reminders.filter(({ dossier, recipientName, recipientRole }) =>
      [dossier.new_folder_number, recipientName, recipientRole, getDossierStatusLabel(dossier.new_status)]
        .some((value) => value.toLocaleLowerCase("fr").includes(normalizedSearch)),
    );
  }, [reminders, search]);

  return (
    <main className="w-full space-y-6 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Relances internes</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Dossiers en attente et utilisateurs internes à relancer.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadReminders()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualiser
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Synthèse des relances">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dossiers à relancer</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">
            {loading ? "—" : reminders.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Échéance atteinte, statut inchangé</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Relances envoyées ce mois</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Users className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">
            {loading ? "—" : remindersThisMonth}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Courriels internes consignés dans l’audit</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Dossiers nécessitant une relance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              La cible est la personne interne de l’étape qui a accusé réception, jamais le fournisseur.
            </p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Rechercher un dossier ou un utilisateur</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Dossier, nom ou rôle…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dossier</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Responsable interne</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Échéance</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dernière relance</th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Chargement des échéances…</td></tr>
              ) : !error && visibleReminders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <BellRing className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 font-medium text-slate-900 dark:text-white">
                      {search ? "Aucun résultat" : "Aucune relance à effectuer"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {search ? "Essaie un autre nom ou numéro de dossier." : "Les dossiers apparaîtront ici quand leur échéance sera atteinte et que leur statut n’aura pas changé."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleReminders.map(({ dossier, recipientName, recipientRole, dueAt, lastReminderAt }) => {
                  const lateDays = Math.max(0, differenceInCalendarDays(new Date(), new Date(dueAt)));
                  return (
                    <tr key={`${dossier.new_folderid}-${recipientName}`} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{dossier.new_folder_number}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{dossier.new_document_type === 100 ? "Facture" : "Dossier"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{recipientName}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{recipientRole}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{getDossierStatusLabel(dossier.new_status)}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          {lateDays === 0 ? "À relancer aujourd’hui" : `${lateDays} j de retard`}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{format(new Date(dueAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {lastReminderAt ? format(new Date(lastReminderAt), "d MMM yyyy 'à' HH:mm", { locale: fr }) : "Aucune"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/bo/dossiers/${dossier.new_folderid}`)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" /> Voir le dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
