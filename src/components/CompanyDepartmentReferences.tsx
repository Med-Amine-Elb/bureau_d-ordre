import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle, Edit2, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataService } from "@/lib/dataService";
import type { DepartmentInput, ReferenceAudit } from "@/lib/dataService";
import { companyRecord, referenceLimits } from "@/lib/referenceForms";
import { ReferenceActivity, ReferenceAuditPanel, ReferenceRelationshipField, ReferenceSection, referenceFieldClass, referencePrimaryClass } from "@/components/ReferenceFormFields";

type ReferenceKind = "societes" | "directions";
interface ReferenceRow extends DepartmentInput, ReferenceAudit { id: string; new_company_name?: string }

const fieldClass = referenceFieldClass;
const primaryClass = referencePrimaryClass;

export default function CompanyDepartmentReferences({ kind }: { kind: ReferenceKind }) {
  const isCompany = kind === "societes";
  const label = isCompany ? "société GBM" : "direction";
  const title = isCompany ? "Sociétés GBM" : "Directions";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<DepartmentInput>({ new_name: "", new_code: "", new_is_active: true });
  const [initialRow, setInitialRow] = useState<ReferenceRow>();
  const [validationError, setValidationError] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const queryKey = ["admin-references", kind];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ReferenceRow[]> => {
      if (isCompany) {
        const rows = await dataService.getCompaniesLookup();
        return rows.map(row => ({ ...row, id: row.new_companyid }));
      }
      const rows = await dataService.getDepartmentsLookup();
      return rows.map(row => ({ ...row, id: row.new_departmentid }));
    },
  });
  const companies = useQuery({ queryKey: ["reference-options", "companies"], queryFn: dataService.getCompaniesLookup, enabled: open && !isCompany, staleTime: 0 });

  const save = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<DepartmentInput> }) => {
      if (id) {
        if (isCompany) await dataService.updateCompanyLookup(id, values);
        else await dataService.updateDepartmentLookup(id, values);
      } else {
        const input: DepartmentInput = {
          new_name: values.new_name?.trim() ?? "",
          new_code: values.new_code?.trim() ?? "",
          new_is_active: values.new_is_active ?? true,
          new_company_id: values.new_company_id,
        };
        if (isCompany) await dataService.createCompanyLookup(input);
        else await dataService.createDepartmentLookup(input);
      }
    },
    onSuccess: async () => {
      setOpen(false);
      toast.success(isCompany ? "Société GBM enregistrée." : "Direction enregistrée.");
      await queryClient.invalidateQueries({ queryKey: ["admin-references", kind] });
      if (isCompany) await queryClient.invalidateQueries({ queryKey: ["reference-options", "companies"] });
    },
    onError: () => {
      toast.error("Enregistrement impossible", { description: "Vérifiez votre connexion et vos droits Dataverse, puis réessayez." });
    },
  });

  const openForm = (row: ReferenceRow | undefined, trigger: HTMLButtonElement) => {
    returnFocus.current = trigger;
    save.reset();
    setEditingId(row?.id);
    setInitialRow(row);
    setValidationError("");
    setForm({ new_name: row?.new_name ?? "", new_code: row?.new_code ?? "", new_is_active: row?.new_is_active ?? true, new_company_id: row?.new_company_id ?? "" });
    setOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (save.isPending) return;
    try { companyRecord(form, true); } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Vérifiez les champs obligatoires.");
      return;
    }
    setValidationError("");
    const values: DepartmentInput = { ...form, new_company_id: undefined };
    if (!isCompany && form.new_company_id !== (initialRow?.new_company_id ?? "")) values.new_company_id = form.new_company_id || null;
    save.mutate({ id: editingId, values });
  };

  const term = search.trim().toLocaleLowerCase("fr");
  const rows = (query.data ?? []).filter(row =>
    row.new_name.toLocaleLowerCase("fr").includes(term) || row.new_code.toLocaleLowerCase("fr").includes(term));

  return (
    <section className="space-y-6" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Building2 className="h-5 w-5" />{title}</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching || save.isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
          <button type="button" onClick={event => openForm(undefined, event.currentTarget)} disabled={save.isPending} className={primaryClass}><Plus className="h-4 w-4" />Ajouter une {label}</button>
        </div>
      </div>

      <div className="relative max-w-md">
        <label className="sr-only" htmlFor={`search-${kind}`}>Rechercher dans {title}</label>
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        <input id={`search-${kind}`} type="search" placeholder="Rechercher par nom ou code…" value={search} onChange={event => setSearch(event.target.value)} className={`${fieldClass} pl-10`} />
      </div>

      {query.isError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">Impossible de charger les {title.toLocaleLowerCase("fr")}. Vérifiez votre connexion et vos droits Dataverse, puis cliquez sur Actualiser.</p>}
      {save.isError && !open && <p role="alert" className="text-sm text-red-600">Le changement de statut n'a pas été enregistré. Vous pouvez réessayer.</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0F172B]" aria-busy={query.isFetching}>
        {query.isPending ? <p role="status" className="p-10 text-center text-slate-500">Chargement…</p> : !query.isError && rows.length === 0 ? (
          <p className="p-10 text-center text-slate-500">{term ? "Aucun résultat pour cette recherche." : `Aucune ${label} enregistrée. Cliquez sur Ajouter pour commencer.`}</p>
        ) : rows.length > 0 ? (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th scope="col" className="p-4">Nom</th><th scope="col" className="p-4">Code</th><th scope="col" className="p-4">Statut</th><th scope="col" className="p-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map(row => <tr key={row.id}>
                <td className="p-4 font-semibold">{row.new_name}</td><td className="p-4">{row.new_code}</td>
                <td className="p-4"><span className={row.new_is_active ? "text-emerald-600" : "text-slate-500"}>{row.new_is_active ? "Active" : "Inactive"}</span></td>
                <td className="p-4"><div className="flex justify-end gap-3">
                  <button type="button" aria-label={`Modifier ${row.new_name}`} onClick={event => openForm(row, event.currentTarget)} disabled={save.isPending} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"><Edit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => save.mutate({ id: row.id, values: { new_is_active: !row.new_is_active } })} disabled={save.isPending} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold dark:border-slate-700 disabled:opacity-50">{row.new_is_active ? "Désactiver" : "Activer"}</button>
                </div></td>
              </tr>)}
            </tbody>
          </table>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={value => { if (!save.isPending) setOpen(value); }}>
        <DialogContent onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }} showCloseButton={!save.isPending} className="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl sm:max-w-2xl">
          <DialogHeader className="pr-5"><DialogTitle>{editingId ? `Modifier la ${label}` : `Ajouter une ${label}`}</DialogTitle><DialogDescription>{isCompany ? "Identification et disponibilité de la société GBM." : "Identification, société de rattachement et disponibilité de la direction."} Les champs marqués * sont obligatoires.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="flex min-h-0 flex-col" aria-busy={save.isPending}>
            <fieldset disabled={save.isPending} className="min-h-0 min-w-0 space-y-4 overflow-y-auto px-1 pb-2">
              <ReferenceSection title="Identification" description={isCompany ? "Le nom et le code permettent d'identifier la société dans les dossiers." : "Utilisez un nom explicite et le code de référence de votre direction."}>
                <div className="space-y-2"><label htmlFor={`name-${kind}`} className="text-sm font-semibold">Nom *</label><input id={`name-${kind}`} required maxLength={referenceLimits.name} value={form.new_name} onChange={event => setForm(current => ({ ...current, new_name: event.target.value }))} className={fieldClass} /></div>
                <div className="space-y-2"><label htmlFor={`code-${kind}`} className="text-sm font-semibold">Code *</label><input id={`code-${kind}`} required maxLength={referenceLimits.code} value={form.new_code} onChange={event => setForm(current => ({ ...current, new_code: event.target.value }))} className={fieldClass} /></div>
              </ReferenceSection>
              {!isCompany && <ReferenceSection title="Rattachement organisationnel"><ReferenceRelationshipField id="direction-company" label="Société GBM" value={form.new_company_id ?? ""} currentName={initialRow?.new_company_name} options={(companies.data ?? []).map(row => ({ id: row.new_companyid, name: row.new_name, active: row.new_is_active }))} loading={companies.isPending} error={companies.isError} onChange={id => setForm(current => ({ ...current, new_company_id: id }))} onRetry={() => void companies.refetch()} /></ReferenceSection>}
              <ReferenceActivity feminine checked={form.new_is_active} onChange={active => setForm(current => ({ ...current, new_is_active: active }))} />
              <ReferenceAuditPanel id={editingId} audit={initialRow} />
              {validationError && <p role="alert" className="text-sm text-red-600">{validationError}</p>}
              {save.isError && <p role="alert" className="text-sm text-red-600">L'enregistrement a échoué. Vos saisies sont conservées. Vérifiez vos droits et réessayez.</p>}
            </fieldset>
            <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700"><button type="button" disabled={save.isPending} onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">Annuler</button><button type="submit" disabled={save.isPending} className={primaryClass}><CheckCircle className="h-4 w-4" />{save.isPending ? "Enregistrement…" : "Enregistrer"}</button></div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
