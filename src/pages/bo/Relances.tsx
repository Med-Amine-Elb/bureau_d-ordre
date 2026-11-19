import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BellRing, CheckCircle2, ChevronDown, Clock3, Eye, Mail, RefreshCw, Search, Users, X } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { dataService } from "@/lib/dataService";
import type { Dossier, DueInternalReminder, InternalReminderTrackingEntry } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";

interface ManualReminderTarget {
  dossier: Dossier;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  relatedReference?: string;
}

export default function Relances() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<DueInternalReminder[]>([]);
  const [tracking, setTracking] = useState<InternalReminderTrackingEntry[]>([]);
  const [remindersThisMonth, setRemindersThisMonth] = useState(0);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<"due" | "history">("due");
  const [expandedDossierId, setExpandedDossierId] = useState("");
  const [manualTarget, setManualTarget] = useState<ManualReminderTarget | null>(null);
  const [manualSending, setManualSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError("");
    setHistoryError("");
    const [dueResult, monthlyResult, historyResult] = await Promise.allSettled([
      dataService.getDueInternalReminders(),
      dataService.getMonthlyReminderCount(),
      dataService.getInternalReminderTracking(),
    ]);

    if (dueResult.status === "fulfilled") setReminders(dueResult.value);
    else {
      console.error("Impossible de charger les échéances de relance :", dueResult.reason);
      setError(dueResult.reason instanceof Error ? dueResult.reason.message : "Impossible de charger les échéances.");
    }
    if (monthlyResult.status === "fulfilled") setRemindersThisMonth(monthlyResult.value);
    else console.error("Impossible de charger le compteur mensuel des relances :", monthlyResult.reason);
    if (historyResult.status === "fulfilled") setTracking(historyResult.value);
    else {
      console.error("Impossible de charger l’historique des relances :", historyResult.reason);
      setHistoryError(historyResult.reason instanceof Error ? historyResult.reason.message : "Impossible de charger l’historique des relances.");
    }
    setLoading(false);
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

  const visibleTracking = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    if (!normalizedSearch) return tracking;
    return tracking.filter(({ dossier, recipientName, recipientRole }) =>
      [dossier.new_folder_number, recipientName, recipientRole, getDossierStatusLabel(dossier.new_status)]
        .some((value) => value.toLocaleLowerCase("fr").includes(normalizedSearch)),
    );
  }, [tracking, search]);

  const prepareManualReminder = (target: ManualReminderTarget) => {
    if (!target.recipientEmail) {
      toast.error("Aucune adresse e-mail interne n’est disponible pour ce destinataire.");
      return;
    }
    const subject = `Relance — dossier ${target.dossier.new_folder_number}`;
    const body = [
      `Bonjour ${target.recipientName},`,
      "",
      `Le dossier ${target.dossier.new_folder_number} est toujours en attente à l’étape ${getDossierStatusLabel(target.dossier.new_status)}.`,
      "Merci de le traiter dans les meilleurs délais ou de mettre son statut à jour dans l’application.",
      "",
      "Cette relance est envoyée manuellement par le Bureau d’ordre.",
    ].join("\n");
    const mailto = `mailto:${target.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setManualTarget(target);
  };

  const confirmManualReminderSent = async () => {
    if (!manualTarget) return;
    setManualSending(true);
    try {
      await dataService.recordManualReminder({
        dossier: manualTarget.dossier,
        recipientId: manualTarget.recipientId,
        relatedReference: manualTarget.relatedReference,
      });
      toast.success("Relance ajoutée au suivi.", { description: "Le journal indique maintenant que vous avez confirmé son envoi." });
      setManualTarget(null);
      await loadReminders();
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Impossible d’enregistrer cette relance.");
    } finally {
      setManualSending(false);
    }
  };

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Vues des relances" className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:w-auto">
          <button
            type="button"
            aria-pressed={activeView === "due"}
            onClick={() => setActiveView("due")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ease-out ${activeView === "due" ? "bg-[#1F3B73] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"}`}
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            À relancer
            <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${activeView === "due" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{loading ? "—" : reminders.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeView === "history"}
            onClick={() => setActiveView("history")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ease-out ${activeView === "history" ? "bg-[#1F3B73] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"}`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Historique
            <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${activeView === "history" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{loading ? "—" : tracking.length}</span>
          </button>
        </nav>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Rechercher un dossier ou un utilisateur</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Dossier, nom ou rôle…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </label>
      </div>

      {activeView === "due" && (
      <section id="view-reminders-due" aria-label="Dossiers à relancer" className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Dossiers nécessitant une relance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              La cible est la personne interne de l’étape qui a accusé réception.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dossier</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Responsable interne</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Échéance</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dernière relance</th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
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
                visibleReminders.map(({ dossier, recipientId, recipientName, recipientEmail, recipientRole, receiptEventId, dueAt, lastReminderAt }) => {
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
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => prepareManualReminder({ dossier, recipientId, recipientName, recipientEmail, relatedReference: receiptEventId })} disabled={!recipientEmail} className="inline-flex items-center gap-2 rounded-lg bg-[#1F3B73] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#16294F] disabled:cursor-not-allowed disabled:opacity-50" title={!recipientEmail ? "Adresse e-mail interne indisponible" : "Préparer une relance manuelle"}>
                            <Mail className="h-4 w-4" aria-hidden="true" /> Relancer
                          </button>
                          <button type="button" onClick={() => navigate(`/bo/dossiers/${dossier.new_folderid}`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                            <Eye className="h-4 w-4" aria-hidden="true" /> Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeView === "history" && (
      <section aria-label="Historique des relances" className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Historique des relances</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Nombre de relances consignées par dossier, destinataire et date du dernier envoi.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dossier</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dernier destinataire</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</th>
                <th scope="col" className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Relances</th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dernier envoi</th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Chargement de l’historique…</td></tr>
              ) : historyError ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-red-700 dark:text-red-300">{historyError}</td></tr>
              ) : visibleTracking.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">{search ? "Aucun résultat pour cette recherche." : "Aucune relance n’est encore consignée."}</td></tr>
              ) : visibleTracking.map((item) => (
                <Fragment key={item.dossier.new_folderid}>
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.dossier.new_folder_number}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.dossier.new_document_type === 100 ? "Facture" : "Dossier"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.recipientName}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.recipientRole}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{getDossierStatusLabel(item.dossier.new_status)}</td>
                    <td className="px-5 py-4 text-center"><span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-[#1F3B73] dark:bg-blue-950/50 dark:text-blue-200">{item.reminderCount}</span></td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{format(new Date(item.lastReminderAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setExpandedDossierId(expandedDossierId === item.dossier.new_folderid ? "" : item.dossier.new_folderid)} aria-expanded={expandedDossierId === item.dossier.new_folderid} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          Historique <ChevronDown className={`h-4 w-4 transition-transform ${expandedDossierId === item.dossier.new_folderid ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => prepareManualReminder({ dossier: item.dossier, recipientId: item.recipientId, recipientName: item.recipientName, recipientEmail: item.recipientEmail, relatedReference: item.relatedReference })} disabled={!item.recipientEmail || !item.recipientId} className="inline-flex items-center gap-2 rounded-lg bg-[#1F3B73] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#16294F] disabled:cursor-not-allowed disabled:opacity-50" title={!item.recipientEmail ? "Adresse e-mail interne indisponible" : "Préparer une relance manuelle"}>
                          <Mail className="h-4 w-4" aria-hidden="true" /> Relancer
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedDossierId === item.dossier.new_folderid && (
                    <tr className="bg-slate-50/70 dark:bg-slate-900/40">
                      <td colSpan={6} className="px-5 py-4">
                        <ol className="space-y-3 border-l-2 border-blue-200 pl-4 dark:border-blue-900">
                          {item.history.map((event, index) => (
                            <li key={`${event.date}-${index}`} className="relative text-sm">
                              <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-[#1F3B73] dark:bg-blue-400" aria-hidden="true" />
                              <p className="font-medium text-slate-800 dark:text-slate-100">{format(new Date(event.date), "d MMM yyyy 'à' HH:mm", { locale: fr })} · {event.recipientName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {event.description}
                                {event.origin === "manual" && event.actorName ? ` par ${event.actorName}` : ""}
                              </p>
                            </li>
                          ))}
                        </ol>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {manualTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !manualSending) setManualTarget(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="manual-reminder-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#0F172B]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="manual-reminder-title" className="text-lg font-semibold text-slate-900 dark:text-white">Confirmer la relance</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Un brouillon a été ouvert dans votre messagerie. Après avoir envoyé le courriel, confirmez pour l’ajouter au suivi.</p>
              </div>
              <button type="button" onClick={() => setManualTarget(null)} disabled={manualSending} aria-label="Fermer" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{manualTarget.dossier.new_folder_number}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">À : {manualTarget.recipientName} · {manualTarget.recipientEmail}</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setManualTarget(null)} disabled={manualSending} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
              <button type="button" onClick={() => void confirmManualReminderSent()} disabled={manualSending} className="inline-flex items-center gap-2 rounded-xl bg-[#1F3B73] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16294F] disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />{manualSending ? "Enregistrement…" : "Confirmer l’envoi"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
