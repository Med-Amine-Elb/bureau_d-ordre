import type { ReactNode } from "react";
import type { ReferenceAudit } from "@/lib/dataService";

export const referenceFieldClass = "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
export const referencePrimaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3B73] px-5 py-3 text-sm font-bold text-white hover:bg-[#16294F] disabled:cursor-not-allowed disabled:opacity-50";

export function ReferenceSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="space-y-4 border-b border-slate-200 pb-5 last:border-0 dark:border-slate-800">
    <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>{description && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}</div>
    {children}
  </section>;
}

export function ReferenceActivity({ checked, onChange, feminine = false }: { checked: boolean; onChange: (value: boolean) => void; feminine?: boolean }) {
  return <ReferenceSection title="Disponibilité" description="Une référence inactive reste dans l'historique, mais n'est plus proposée pour les nouveaux dossiers.">
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"><input type="checkbox" className="h-4 w-4 accent-[#1F3B73]" checked={checked} onChange={event => onChange(event.target.checked)} /><span className="font-semibold">{checked ? (feminine ? "Active" : "Actif") : (feminine ? "Inactive" : "Inactif")}</span></label>
  </ReferenceSection>;
}

export function ReferenceRelationshipField({ id, label, value, currentName, options, loading, error, onChange, onRetry }: {
  id: string; label: string; value: string; currentName?: string;
  options: { id: string; name: string; active: boolean }[];
  loading: boolean; error: boolean; onChange: (id: string) => void; onRetry: () => void;
}) {
  const visible = options.filter(option => option.active || option.id === value);
  const missingSelection = value && !visible.some(option => option.id === value);
  return <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-semibold">{label} <span className="font-normal text-slate-500">(facultatif)</span></label>
    <select id={id} value={value} disabled={loading || error} onChange={event => onChange(event.target.value)} aria-describedby={`${id}-help`} className={referenceFieldClass}>
      <option value="">Aucun rattachement</option>
      {missingSelection && <option value={value}>{currentName || "Rattachement actuel"} — indisponible dans la liste</option>}
      {visible.map(option => <option key={option.id} value={option.id}>{option.name}{option.active ? "" : " (inactive)"}</option>)}
    </select>
    <p id={`${id}-help`} className="text-xs text-slate-500 dark:text-slate-400">{loading ? "Chargement des références… Le rattachement actuel est conservé." : error ? "Liste indisponible. Le rattachement actuel est conservé ; les autres champs restent modifiables." : "Sélectionnez une référence active ou retirez le rattachement avec « Aucun rattachement »."}</p>
    {error && <button type="button" onClick={onRetry} className="text-xs font-semibold text-blue-700 underline dark:text-blue-300">Réessayer le chargement</button>}
    {!loading && !error && visible.length === 0 && <p className="text-xs text-amber-700 dark:text-amber-300">Aucune référence active. Ajoutez-en une dans l'onglet correspondant, puis rouvrez ce formulaire.</p>}
  </div>;
}

function dateLabel(value?: string) {
  if (!value) return "Non disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Non disponible" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ReferenceAuditPanel({ id, audit }: { id?: string; audit?: ReferenceAudit }) {
  if (!id) return <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-900 dark:text-slate-400">L'identifiant, les dates et les informations techniques sont renseignés automatiquement par Dataverse.</p>;
  return <details className="rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-700">
    <summary className="cursor-pointer font-semibold">Informations système · lecture seule</summary>
    <dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="sm:col-span-2"><dt className="text-slate-500">Identifiant Dataverse</dt><dd className="mt-1 break-all font-mono">{id}</dd></div><div><dt className="text-slate-500">Création</dt><dd className="mt-1">{dateLabel(audit?.createdon)}</dd></div><div><dt className="text-slate-500">Dernière modification</dt><dd className="mt-1">{dateLabel(audit?.modifiedon)}</dd></div></dl>
  </details>;
}
