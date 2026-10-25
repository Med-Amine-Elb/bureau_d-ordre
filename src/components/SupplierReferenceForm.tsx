import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReferenceActivity, ReferenceAuditPanel, ReferenceRelationshipField, ReferenceSection, referenceFieldClass, referencePrimaryClass } from "@/components/ReferenceFormFields";
import { dataService } from "@/lib/dataService";
import type { FournisseurLookup, SupplierInput } from "@/lib/dataService";
import { referenceLimits, supplierRecord } from "@/lib/referenceForms";

// Mounted for each edit session, so data from another supplier never leaks into the form.
export default function SupplierReferenceForm({ initial, pending, onClose, onSave, onRestoreFocus }: {
  initial?: FournisseurLookup; pending: boolean; onClose: () => void; onSave: (input: SupplierInput) => Promise<void>; onRestoreFocus: () => void;
}) {
  const [form, setForm] = useState({
    new_name: initial?.new_name ?? "", new_code: initial?.new_code ?? "", new_is_active: initial?.new_is_active ?? true,
    new_address: initial?.new_address ?? "", new_city: initial?.new_city ?? "", new_email: initial?.new_email ?? "", new_phone: initial?.new_phone ?? "",
    new_branch_id: initial?.new_branch_id ?? "",
  });
  const [error, setError] = useState("");
  const branches = useQuery({ queryKey: ["reference-options", "agencies"], queryFn: dataService.getAgencesLookup, staleTime: 0 });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    const input: SupplierInput = { ...form, new_branch_id: undefined };
    if (form.new_branch_id !== (initial?.new_branch_id ?? "")) input.new_branch_id = form.new_branch_id || null;
    try {
      supplierRecord(input, !initial);
      await onSave(input);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Enregistrement impossible. Vos saisies sont conservées.");
    }
  };

  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus(); }} showCloseButton={!pending} className="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl sm:max-w-3xl">
      <DialogHeader className="pr-5"><DialogTitle>{initial ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle><DialogDescription>Identification, coordonnées et rattachement. Les champs marqués * sont obligatoires.</DialogDescription></DialogHeader>
      <form onSubmit={submit} aria-busy={pending} className="flex min-h-0 flex-col">
        <fieldset disabled={pending} className="min-h-0 min-w-0 space-y-5 overflow-y-auto px-1 pb-2">
          <ReferenceSection title="Identification" description="L'identifiant fiscal est enregistré dans le champ fiscal, et non comme un code fournisseur généré.">
            <div className="space-y-2"><label htmlFor="supplier-name" className="text-sm font-semibold">Raison sociale *</label><input id="supplier-name" autoComplete="organization" required maxLength={referenceLimits.name} value={form.new_name} onChange={event => set("new_name", event.target.value)} className={referenceFieldClass} /></div>
            <div className="space-y-2"><label htmlFor="supplier-tax-id" className="text-sm font-semibold">Identifiant fiscal <span className="font-normal text-slate-500">(facultatif)</span></label><input id="supplier-tax-id" maxLength={referenceLimits.code} value={form.new_code} onChange={event => set("new_code", event.target.value)} className={referenceFieldClass} /></div>
          </ReferenceSection>
          <ReferenceSection title="Coordonnées" description="Informations de contact facultatives utilisées pour identifier et joindre le fournisseur.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><label htmlFor="supplier-email" className="text-sm font-semibold">Adresse e-mail</label><input id="supplier-email" type="email" autoComplete="email" maxLength={referenceLimits.email} value={form.new_email} onChange={event => set("new_email", event.target.value)} className={referenceFieldClass} /></div>
              <div className="space-y-2"><label htmlFor="supplier-phone" className="text-sm font-semibold">Téléphone</label><input id="supplier-phone" type="tel" autoComplete="tel" maxLength={referenceLimits.phone} value={form.new_phone} onChange={event => set("new_phone", event.target.value)} className={referenceFieldClass} /></div>
              <div className="space-y-2 sm:col-span-2"><label htmlFor="supplier-address" className="text-sm font-semibold">Adresse</label><textarea id="supplier-address" autoComplete="street-address" rows={2} maxLength={referenceLimits.address} value={form.new_address} onChange={event => set("new_address", event.target.value)} aria-describedby="supplier-address-help" className={referenceFieldClass} /><p id="supplier-address-help" className="text-xs text-slate-500">{form.new_address.length}/{referenceLimits.address} caractères — limite de la colonne actuelle.</p></div>
              <div className="space-y-2"><label htmlFor="supplier-city" className="text-sm font-semibold">Ville</label><input id="supplier-city" autoComplete="address-level2" maxLength={referenceLimits.city} value={form.new_city} onChange={event => set("new_city", event.target.value)} className={referenceFieldClass} /></div>
            </div>
          </ReferenceSection>
          <ReferenceSection title="Rattachement organisationnel"><ReferenceRelationshipField id="supplier-branch" label="Agence" value={form.new_branch_id} currentName={initial?.new_branch_name} options={(branches.data ?? []).map(row => ({ id: row.new_branchid, name: row.new_name, active: row.new_is_active }))} loading={branches.isPending} error={branches.isError} onChange={id => set("new_branch_id", id)} onRetry={() => void branches.refetch()} /></ReferenceSection>
          <ReferenceActivity checked={form.new_is_active} onChange={active => set("new_is_active", active)} />
          <ReferenceAuditPanel id={initial?.new_supplierid} audit={initial} />
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">{error}</p>}
        </fieldset>
        <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700"><button type="button" disabled={pending} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">Annuler</button><button type="submit" disabled={pending} className={referencePrimaryClass}><CheckCircle className="h-4 w-4" />{pending ? "Enregistrement…" : "Enregistrer le fournisseur"}</button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
