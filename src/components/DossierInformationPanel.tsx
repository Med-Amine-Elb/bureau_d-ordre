import type { Dossier } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";

interface DossierInformationPanelProps {
  dossier: Dossier;
}

const documentTypeLabel = (type: number) => ({
  100: "Facture",
  200: "Avoir",
  300: "Note de frais",
  400: "Flux court",
  500: "Acompte",
  600: "Courrier",
} as Record<number, string>)[type] ?? "Autre";

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleDateString("fr-FR")
  : "—";

const statusLabel = (status: number) => getDossierStatusLabel(status);

function Information({ label, value }: { label: string; value?: string | number | boolean }) {
  const displayValue = value === undefined || value === null || value === "" ? "—" : typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/30">
      <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{displayValue}</dd>
    </div>
  );
}

export default function DossierInformationPanel({ dossier }: DossierInformationPanelProps) {
  const isCourrier = dossier.new_document_type === 600;
  const common = [
    { label: "N° Dossier", value: dossier.new_folder_number },
    { label: "Type de document", value: documentTypeLabel(dossier.new_document_type) },
    { label: "Date de réception", value: formatDate(dossier.new_reception_date) },
    { label: "Statut", value: statusLabel(dossier.new_status) },
  ];
  const routing = isCourrier
    ? [
        { label: "Livreur", value: dossier.new_livreur_nom },
        { label: "Société destinataire", value: dossier.new_company_id },
        { label: "Direction", value: dossier.new_department_id },
        { label: "Destinataire", value: dossier.new_personne_a_livrer || dossier.new_prescriber_id },
        { label: "Date de livraison", value: formatDate(dossier.new_date_livraison) },
      ]
    : [
        { label: "Fournisseur", value: dossier.new_supplier_id },
        { label: "Société GBM", value: dossier.new_company_id },
        { label: "Direction", value: dossier.new_department_id },
        { label: "Prescripteur", value: dossier.new_prescriber_id },
        { label: "Collecteur DCF", value: dossier.new_dcf_collector_id },
        { label: "N° Facture", value: dossier.new_invoice_number },
        { label: "Date de facture", value: formatDate(dossier.new_invoice_date) },
        { label: "N° Bon de commande", value: dossier.new_po_number },
        { label: "Dossier lié", value: dossier.new_linked_folder_id },
      ];
  const payment = [
    { label: "Mode de règlement", value: dossier.new_payment_method === 1 ? "Chèque" : dossier.new_payment_method === 2 ? "Virement" : undefined },
    { label: "N° Chèque", value: dossier.new_cheque_number },
    { label: "Banque émettrice", value: dossier.new_banque_emettrice },
    { label: "Préparé le", value: dossier.new_cheque_preparation_date ? formatDate(dossier.new_cheque_preparation_date) : undefined },
    { label: "Virement le", value: dossier.new_date_virement ? formatDate(dossier.new_date_virement) : undefined },
    { label: "Référence de virement", value: dossier.new_wire_reference },
    { label: "RIB destinataire", value: dossier.new_compte_bancaire_dest },
    { label: "Agence de destination", value: dossier.new_destination_branch_id },
    { label: "Remise finale le", value: dossier.new_final_delivery_date ? formatDate(dossier.new_final_delivery_date) : undefined },
  ].filter(item => item.value !== undefined && item.value !== "");

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#0F172B]" aria-label="Informations complètes du dossier">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Informations complètes du dossier</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Informations communes disponibles pour tous les rôles.</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {common.map(item => <Information key={item.label} {...item} />)}
      </dl>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">{isCourrier ? "Informations du courrier" : "Informations de traitement"}</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {routing.map(item => <Information key={item.label} {...item} />)}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Description / objet</h3>
        <p className="min-h-14 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
          {dossier.new_description || "Aucune description renseignée."}
        </p>
      </div>

      {payment.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Règlement et remise</h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {payment.map(item => <Information key={item.label} {...item} />)}
          </dl>
        </div>
      )}

      {!isCourrier && dossier.new_documents_complements && dossier.new_documents_complements.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Pièces déclarées</h3>
          <ul className="flex flex-wrap gap-2">
            {dossier.new_documents_complements.map(document => (
              <li key={document} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{document}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
