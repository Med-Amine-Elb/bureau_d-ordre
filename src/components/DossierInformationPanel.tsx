import { Banknote, Building2, FileText, PackageCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { Dossier } from "@/lib/dataService";
import { getDossierStatusLabel } from "@/lib/statusLabels";

interface DossierInformationPanelProps {
  dossier: Dossier;
}

type InformationItem = {
  label: string;
  value?: string | number | boolean;
  wide?: boolean;
};

const GUID_PATTERN = /^[{]?[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}[}]?$/i;

const documentTypeLabel = (type: number) => ({
  100: "Facture",
  200: "Avoir",
  300: "Note de frais",
  400: "Flux court",
  500: "Acompte",
  600: "Courrier",
} as Record<number, string>)[type] ?? "Autre";

const formatDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const humanValue = (value: InformationItem["value"]) => {
  if (value === undefined || value === null || value === "") return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  const text = String(value);
  return GUID_PATTERN.test(text) ? "Nom indisponible" : text;
};

function DataSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: InformationItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0 dark:border-slate-700">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <span className="text-blue-700 dark:text-blue-300" aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {items.map(item => (
          <div
            key={item.label}
            className={`grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-slate-100 py-2.5 last:border-b-0 dark:border-slate-800 ${item.wide ? "sm:col-span-2" : ""}`}
          >
            <dt className="text-sm text-slate-500 dark:text-slate-400">{item.label}</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{humanValue(item.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function DossierInformationPanel({ dossier }: DossierInformationPanelProps) {
  const isCourrier = dossier.new_document_type === 600;
  const dossierItems: InformationItem[] = [
    { label: "N° dossier", value: dossier.new_folder_number },
    { label: "Type de document", value: documentTypeLabel(dossier.new_document_type) },
    { label: "Date de réception", value: formatDate(dossier.new_reception_date) },
    { label: "Statut", value: getDossierStatusLabel(dossier.new_status) },
  ];

  const participantItems: InformationItem[] = isCourrier
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
        { label: "Collecteur Trésorerie", value: dossier.new_collecteur_treso_name || dossier.new_collecteur_treso },
      ];

  const documentItems: InformationItem[] = isCourrier
    ? []
    : [
        { label: "N° facture / pièce", value: dossier.new_invoice_number },
        { label: "Date de facture", value: formatDate(dossier.new_invoice_date) },
        { label: "N° bon de commande", value: dossier.new_po_number },
        { label: "Dossier lié", value: dossier.new_linked_folder_id },
      ];

  const paymentItems: InformationItem[] = [
    { label: "Mode de règlement", value: dossier.new_payment_method === 1 ? "Chèque" : dossier.new_payment_method === 2 ? "Virement" : undefined },
    { label: "N° chèque", value: dossier.new_cheque_number },
    { label: "Banque émettrice", value: dossier.new_banque_emettrice },
    { label: "Préparé le", value: formatDate(dossier.new_cheque_preparation_date) },
    { label: "Date du virement", value: formatDate(dossier.new_date_virement) },
    { label: "Référence du virement", value: dossier.new_wire_reference },
    { label: "RIB destinataire", value: dossier.new_compte_bancaire_dest },
    { label: "Agence de destination", value: dossier.new_destination_branch_id },
    { label: "Remise finale le", value: formatDate(dossier.new_final_delivery_date) },
  ].filter(item => item.value !== undefined && item.value !== "");

  const description = dossier.new_description?.trim();
  const declaredDocuments = dossier.new_documents_complements ?? [];

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#0F172B]"
      aria-label="Informations complètes du dossier"
    >
      <header className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Détails du dossier</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Informations organisées par thème pour consulter rapidement le dossier.</p>
      </header>

      <div className="space-y-5">
        <DataSection title="Dossier" icon={<FileText className="h-4 w-4" />} items={dossierItems} />
        <DataSection title={isCourrier ? "Destinataires et livraison" : "Circuit et intervenants"} icon={<Users className="h-4 w-4" />} items={participantItems} />
        {!isCourrier && <DataSection title="Références du document" icon={<Building2 className="h-4 w-4" />} items={documentItems} />}

        <section aria-label="Objet" className="border-t border-slate-200 pt-5 dark:border-slate-700">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span className="text-blue-700 dark:text-blue-300" aria-hidden="true"><FileText className="h-4 w-4" /></span>
            {isCourrier ? "Objet du courrier" : "Objet / description"}
          </h3>
          <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            {description || "Aucune description renseignée."}
          </p>
        </section>

        {paymentItems.length > 0 && (
          <DataSection title="Règlement et remise" icon={<Banknote className="h-4 w-4" />} items={paymentItems} />
        )}

        {!isCourrier && declaredDocuments.length > 0 && (
          <section aria-label="Pièces déclarées" className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="text-blue-700 dark:text-blue-300" aria-hidden="true"><PackageCheck className="h-4 w-4" /></span>
              Pièces déclarées
            </h3>
            <ul className="flex flex-wrap gap-2">
              {declaredDocuments.map(document => (
                <li key={document} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                  {document}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}
