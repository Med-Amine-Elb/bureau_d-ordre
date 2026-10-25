import type { AgenceLookup, FournisseurLookup } from "@/lib/dataService";
import type { SupplierInput } from "@/lib/referenceForms";
import { referenceLimits, supplierRecord } from "@/lib/referenceForms";

export const supplierImportHeaders = [
  "Raison sociale *",
  "Identifiant fiscal",
  "E-mail",
  "Téléphone",
  "Adresse",
  "Ville",
  "Agence",
  "Actif (Oui/Non)",
] as const;

export interface SupplierImportRow {
  rowNumber: number;
  input?: SupplierInput;
  errors: string[];
}

export interface SupplierImportInputRow {
  rowNumber: number;
  values: string[];
}

const headerAliases = {
  name: ["raison sociale", "raison sociale *", "nom du fournisseur", "nom fournisseur", "supplier name", "name"],
  taxId: ["identifiant fiscal", "if", "ice", "tax id"],
  email: ["e-mail", "email", "adresse e-mail", "adresse email"],
  phone: ["telephone", "tel", "phone"],
  address: ["adresse", "address"],
  city: ["ville", "city"],
  agency: ["agence", "agency"],
  active: ["actif oui/non", "actif", "active", "is active"],
} as const;

export type SupplierImportColumn = keyof typeof headerAliases;

export interface SupplierImportHeader {
  rowNumber: number;
  columnPositions: Map<SupplierImportColumn, number>;
}

function normalizeHeader(value: string) {
  return value.trim().replaceAll("*", "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR").replace(/\s+/g, " ");
}

function columnKey(header: string): SupplierImportColumn | undefined {
  const normalizedHeader = normalizeHeader(header);
  return (Object.keys(headerAliases) as SupplierImportColumn[]).find(key =>
    headerAliases[key].some(alias => normalizeHeader(alias) === normalizedHeader),
  );
}

export function findSupplierImportHeader(
  candidateRows: Array<{ rowNumber: number; headers: string[] }>,
): SupplierImportHeader | undefined {
  for (const row of candidateRows) {
    const columnPositions = new Map<SupplierImportColumn, number>();
    row.headers.forEach((header, index) => {
      const key = columnKey(header);
      if (key && !columnPositions.has(key)) columnPositions.set(key, index + 1);
    });
    if (columnPositions.has("name")) return { rowNumber: row.rowNumber, columnPositions };
  }
  return undefined;
}

function normalized(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
}

export function validateSupplierImportRows(
  rows: SupplierImportInputRow[],
  existingSuppliers: FournisseurLookup[],
  agencies: AgenceLookup[],
): SupplierImportRow[] {
  const seenNames = new Set(existingSuppliers.map(supplier => normalized(supplier.new_name)));
  const seenTaxIds = new Set(existingSuppliers.map(supplier => normalized(supplier.new_code)).filter(Boolean));

  return rows.map(({ rowNumber, values }) => {
    const [name = "", taxId = "", email = "", phone = "", address = "", city = "", agencyName = "", activeValue = ""] = values;
    if (values.every(value => !value.trim())) return { rowNumber, errors: [] };

    const input: SupplierInput = {
      new_name: name.trim(),
      new_code: taxId.trim(),
      new_email: email.trim(),
      new_phone: phone.trim(),
      new_address: address.trim(),
      new_city: city.trim(),
      new_is_active: true,
    };
    const errors: string[] = [];
    const nameKey = normalized(input.new_name);
    const taxKey = normalized(input.new_code ?? "");

    try {
      supplierRecord(input, true);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Données fournisseur invalides.");
    }

    if (input.new_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.new_email)) errors.push("L'adresse e-mail est invalide.");
    if (input.new_name.length > referenceLimits.name) errors.push(`La raison sociale dépasse ${referenceLimits.name} caractères.`);
    if ((input.new_code?.length ?? 0) > referenceLimits.code) errors.push(`L'identifiant fiscal dépasse ${referenceLimits.code} caractères.`);
    if ((input.new_email?.length ?? 0) > referenceLimits.email) errors.push(`L'e-mail dépasse ${referenceLimits.email} caractères.`);
    if ((input.new_phone?.length ?? 0) > referenceLimits.phone) errors.push(`Le téléphone dépasse ${referenceLimits.phone} caractères.`);
    if ((input.new_address?.length ?? 0) > referenceLimits.address) errors.push(`L'adresse dépasse ${referenceLimits.address} caractères.`);
    if ((input.new_city?.length ?? 0) > referenceLimits.city) errors.push(`La ville dépasse ${referenceLimits.city} caractères.`);

    if (nameKey && seenNames.has(nameKey)) errors.push("Raison sociale déjà présente dans Dataverse ou en double dans le fichier.");
    if (nameKey) seenNames.add(nameKey);
    if (taxKey && seenTaxIds.has(taxKey)) errors.push("Identifiant fiscal déjà présent dans Dataverse ou en double dans le fichier.");
    if (taxKey) seenTaxIds.add(taxKey);

    if (agencyName.trim()) {
      const agency = agencies.find(option => normalized(option.new_name) === normalized(agencyName));
      if (!agency) errors.push(`Agence « ${agencyName.trim()} » introuvable. Utilisez son nom exact ou laissez la cellule vide.`);
      else if (!agency.new_is_active) errors.push(`L'agence « ${agencyName.trim()} » est inactive.`);
      else input.new_branch_id = agency.new_branchid;
    }

    const active = normalized(activeValue);
    if (active) {
      if (["oui", "yes", "true", "1", "actif", "active"].includes(active)) input.new_is_active = true;
      else if (["non", "no", "false", "0", "inactif", "inactive"].includes(active)) input.new_is_active = false;
      else errors.push("La colonne Actif accepte Oui/Non, true/false ou 1/0.");
    }

    return { rowNumber, input: errors.length ? undefined : input, errors };
  }).filter(row => row.errors.length > 0 || row.input !== undefined);
}
