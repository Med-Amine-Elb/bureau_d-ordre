import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, History } from "lucide-react";
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0F172B]">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-700 dark:text-blue-400"><History className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Historique complet du dossier</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Actions enregistrées et transmissions Dataverse, dans l’ordre chronologique. Le journal commence à son activation.</p>
        </div>
      </div>

      {loading ? <p className="py-5 text-center text-sm text-slate-500">Chargement de l’historique…</p> : null}
      {error && entries.length === 0 ? <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />Impossible de charger l’historique Dataverse.</div> : null}
      {!loading && !error && entries.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700">Aucun événement enregistré. Les actions antérieures à l’activation du journal ne peuvent pas être reconstituées.</p> : null}

      {!loading && error && entries.length > 0 ? <div role="status" className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Une partie de l’historique n’a pas pu être chargée. Les éléments disponibles restent affichés; vérifiez les droits de lecture des tables d’audit et de transmission.</div> : null}

      {!loading && entries.length > 0 ? (
        <ol className="space-y-3">
          {entries.map(entry => (
            <li key={entry.key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{entry.title}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Par <strong>{entry.actor}</strong>{entry.actorRole ? <> · Rôle : <strong>{entry.actorRole}</strong></> : null}{entry.recipient ? <> · Destinataire : <strong>{entry.recipient}</strong></> : null}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {entry.source === "transmission" ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {formatDate(entry.date)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">{entry.description}</p>
              {(entry.route || entry.statusChange || entry.reference) ? (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {entry.route ? <span>Parcours : {entry.route}</span> : null}
                  {entry.statusChange ? <span>Statut : {entry.statusChange}</span> : null}
                  {entry.reference ? <span>Référence : {entry.reference}</span> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
