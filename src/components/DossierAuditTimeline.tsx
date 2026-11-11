import { useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, FileText, History, Send } from "lucide-react";
import { dataService } from "@/lib/dataService";
import type { DossierAuditEvent, DossierTransmission } from "@/lib/dataService";
import { getDossierAuditStepLabel } from "@/lib/auditStepLabels";

const STATUS_STEP_EVENT_TYPES = new Set([871840000, 871840002, 871840003, 871840004, 871840005, 871840006]);

type TimelineEntry = {
  key: string;
  date: string;
  title: string;
  description: string;
  actor: string;
  actorRole?: string;
  route?: string;
  recipient?: string;
  statusChange?: string;
  reference?: string;
  source: "audit" | "transmission";
};

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
  : "Date indisponible";

const formatDay = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Heure indisponible"
    : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const transmissionMatchesAudit = (transmission: DossierTransmission, event: DossierAuditEvent) => {
  const type = Number(event.new_eventtype);
  if (type !== 871840002 && type !== 871840003) return false;
  const transmissionDate = new Date(transmission.new_transmissiondate).getTime();
  const eventDate = new Date(event.new_eventdate).getTime();
  return Number.isFinite(transmissionDate) && Number.isFinite(eventDate) && Math.abs(transmissionDate - eventDate) < 120_000;
};

const auditEntry = (event: DossierAuditEvent): TimelineEntry => {
  const from = event.fromRoleLabel || event.new_fromrolename;
  const to = event.toRoleLabel || event.new_torolename;
  const previous = event.new_previousstatus !== undefined ? getDossierAuditStepLabel(Number(event.new_previousstatus)) : event.previousStatusLabel || "";
  const next = event.new_newstatus !== undefined ? getDossierAuditStepLabel(Number(event.new_newstatus)) : event.newStatusLabel || "";
  const eventType = Number(event.new_eventtype);
  const nextStatus = Number(event.new_newstatus);
  const title = STATUS_STEP_EVENT_TYPES.has(eventType) && Number.isFinite(nextStatus)
    ? getDossierAuditStepLabel(nextStatus)
    : event.new_newcolumn || event.eventTypeLabel || "Événement dossier";
  return {
    key: `audit-${event.new_dossierauditeventid}`,
    date: event.new_eventdate,
    title,
    description: [
      event.new_eventname || event.eventTypeLabel || "Action enregistrée.",
      event.new_reason ? `Détail / motif : ${event.new_reason}` : "",
    ].filter(Boolean).join("\n"),
    actor: event.actorLabel || "Utilisateur Dataverse",
    actorRole: event.actorRoleLabel || undefined,
    route: from && to ? `${from} → ${to}` : undefined,
    recipient: event.recipientLabel || undefined,
    statusChange: previous || next ? `${previous || "—"} → ${next || "—"}` : undefined,
    reference: event.new_relatedreference || undefined,
    source: "audit",
  };
};

const transmissionEntry = (event: DossierTransmission): TimelineEntry => ({
  key: `transmission-${event.new_transmissionid}`,
  date: event.new_transmissiondate,
  title: `${event.new_fromrole_label || event.new_fromrolename || "Service"} → ${event.new_torole_label || event.new_torolename || "Destinataire"}`,
  description: event.new_sendingcomment || "Transmission du dossier.",
  actor: event.new_sentbyname || "Utilisateur Dataverse",
  route: `${event.new_fromrole_label || event.new_fromrolename || "Service"} → ${event.new_torole_label || event.new_torolename || "Destinataire"}`,
  recipient: event.new_collectorname || undefined,
  statusChange: event.new_acknowledgmentdate
    ? `Réception confirmée le ${formatDate(event.new_acknowledgmentdate)}${event.new_acknowledgedbyname ? ` par ${event.new_acknowledgedbyname}` : ""}`
    : "En attente de réception",
  source: "transmission",
});

export default function DossierAuditTimeline({ folderId }: { folderId: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setEntries([]);
    Promise.allSettled([
      dataService.getDossierAuditEvents(folderId),
      dataService.getDossierTransmissions(folderId),
    ]).then(([auditResult, transmissionResult]) => {
      if (cancelled) return;
      const auditEvents = auditResult.status === "fulfilled" ? auditResult.value : [];
      const transmissions = transmissionResult.status === "fulfilled" ? transmissionResult.value : [];
      setError(auditResult.status === "rejected" || transmissionResult.status === "rejected");
      const auditEntries = auditEvents.map(auditEntry);
      const legacyTransmissions = transmissions
        .filter(transmission => !auditEvents.some(audit => transmissionMatchesAudit(transmission, audit)))
        .map(transmissionEntry);
      setEntries([...auditEntries, ...legacyTransmissions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [folderId]);

  const groupedEntries = entries.reduce<Array<{ day: string; entries: TimelineEntry[] }>>((groups, entry) => {
    const day = formatDay(entry.date);
    const group = groups[groups.length - 1];
    if (group?.day === day) group.entries.push(entry);
    else groups.push({ day, entries: [entry] });
    return groups;
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#0F172B]">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-[#1F3B73] dark:bg-blue-950/50 dark:text-blue-300"><History className="h-4 w-4" /></div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Parcours du dossier</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Actions et transmissions enregistrées dans Dataverse.</p>
        </div>
      </div>

      {loading ? <p role="status" className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Chargement du circuit…</p> : null}
      {error && entries.length === 0 ? <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />Impossible de charger le journal Dataverse. Vérifiez les droits de lecture des tables d’audit et de transmission.</div> : null}
      {!loading && !error && entries.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aucun événement enregistré</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les actions antérieures à l’activation du journal ne peuvent pas être reconstituées.</p></div> : null}

      {!loading && error && entries.length > 0 ? <div role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Une partie du circuit n’a pas pu être chargée. Les événements disponibles restent affichés.</div> : null}

      {!loading && entries.length > 0 ? (
        <div className="space-y-7">
          {groupedEntries.map(group => (
            <section key={group.day} aria-label={group.day}>
              <h4 className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">{group.day}</h4>
              <ol className="ml-3 border-l border-slate-200 dark:border-slate-700">
                {group.entries.map(entry => {
                  const title = entry.title.toLocaleLowerCase("fr-FR");
                  const Icon = entry.source === "transmission" || title.includes("transmis")
                    ? Send
                    : title.includes("relance")
                      ? Bell
                      : title.includes("réception") || title.includes("clôtur")
                        ? CheckCircle2
                        : FileText;

                  return (
                    <li key={entry.key} className="relative border-b border-slate-100 py-4 pl-7 last:border-b-0 dark:border-slate-800 sm:pl-9">
                      <span className={`absolute -left-[13px] top-4 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0F172B] ${title.includes("réception") || title.includes("clôtur") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-blue-50 text-[#1F3B73] dark:bg-blue-950/60 dark:text-blue-300"}`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.35fr)] lg:gap-6">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{entry.title}</p>
                            <time className="text-sm tabular-nums text-slate-500 dark:text-slate-400" dateTime={entry.date}>{formatTime(entry.date)}</time>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">{entry.description}</p>
                        </div>
                        <dl className="grid min-w-0 gap-x-5 gap-y-2 sm:grid-cols-2">
                          <div className="min-w-0">
                            <dt className="text-xs text-slate-500 dark:text-slate-400">Acteur{entry.actorRole ? " · Rôle" : ""}</dt>
                            <dd className="mt-0.5 break-words text-sm font-medium text-slate-800 dark:text-slate-200">{entry.actor}{entry.actorRole ? ` · ${entry.actorRole}` : ""}</dd>
                          </div>
                          {entry.recipient && (
                            <div className="min-w-0">
                              <dt className="text-xs text-slate-500 dark:text-slate-400">Destinataire</dt>
                              <dd className="mt-0.5 break-words text-sm font-medium text-slate-800 dark:text-slate-200">{entry.recipient}</dd>
                            </div>
                          )}
                          {entry.route && (
                            <div className="min-w-0 sm:col-span-2">
                              <dt className="text-xs text-slate-500 dark:text-slate-400">Transmission</dt>
                              <dd className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">{entry.route}</dd>
                            </div>
                          )}
                          {entry.statusChange && (
                            <div className="min-w-0 sm:col-span-2">
                              <dt className="text-xs text-slate-500 dark:text-slate-400">Changement de statut</dt>
                              <dd className="mt-1 inline-flex max-w-full rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{entry.statusChange}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : null}

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">Le journal commence à son activation et présente les événements d’audit ainsi que les transmissions disponibles.</p>
    </section>
  );
}
