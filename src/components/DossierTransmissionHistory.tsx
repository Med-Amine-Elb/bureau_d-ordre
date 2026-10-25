import { useEffect, useState } from "react";
import { dataService } from "@/lib/dataService";
import type { DossierTransmission } from "@/lib/dataService";
import { AlertCircle, CheckCircle2, Clock3, Send } from "lucide-react";

const dateLabel = (value?: string) => value
  ? new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
  : "En attente";

export default function DossierTransmissionHistory({ folderId }: { folderId: string }) {
  const [events, setEvents] = useState<DossierTransmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    dataService.getDossierTransmissions(folderId)
      .then(rows => { if (!cancelled) setEvents(rows); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [folderId]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0F172B]">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-700 dark:text-blue-400"><Send className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Historique réel des transmissions</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Journal des transmissions Dataverse — les anciennes étapes sans ligne journalisée ne peuvent pas être reconstituées ici.</p>
        </div>
      </div>

      {loading ? <p className="py-5 text-center text-sm text-slate-500">Chargement de l’historique…</p> : null}
      {error ? <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />Impossible de charger l’historique Dataverse.</div> : null}
      {!loading && !error && events.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700">Aucune transmission enregistrée pour ce dossier.</p> : null}

      {!loading && !error && events.length > 0 ? (
        <ol className="space-y-3">
          {events.map(event => {
            const completed = event.new_transmissionstatus === 871840001;
            return (
              <li key={event.new_transmissionid} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {event.new_fromrole_label || event.new_fromrolename || "Émetteur"} <span className="text-slate-400">→</span> {event.new_torole_label || event.new_torolename || "Destinataire"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Transmis par <strong>{event.new_sentbyname || "Utilisateur non renseigné"}</strong> à <strong>{event.new_collectorname || "Destinataire non renseigné"}</strong>
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                    {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                    {completed ? "Réception accusée" : "En attente de réception"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 dark:text-slate-400">
                  <p>Transmission : <span className="font-medium text-slate-700 dark:text-slate-300">{dateLabel(event.new_transmissiondate)}</span></p>
                  <p>Accusé : <span className="font-medium text-slate-700 dark:text-slate-300">{dateLabel(event.new_acknowledgmentdate)}</span>{event.new_acknowledgedbyname ? ` par ${event.new_acknowledgedbyname}` : ""}</p>
                </div>
                {event.new_sendingcomment ? <p className="mt-3 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">Note d’envoi : {event.new_sendingcomment}</p> : null}
                {event.new_receiptcomment ? <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">Note de réception : {event.new_receiptcomment}</p> : null}
                {event.new_branchname ? <p className="mt-1 text-xs text-slate-500">Agence : {event.new_branchname}</p> : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
