import type { New_suppliersBase } from "../generated/models/New_suppliersModel";
import type { New_departementsBase } from "../generated/models/New_departementsModel";

// Limits from the checked-in Dataverse schema snapshot. Generated files stay untouched.
export const referenceLimits = { name: 850, code: 100, address: 100, city: 100, email: 100, phone: 20 } as const;

export interface CompanyInput {
  new_name: string;
  new_code: string;
  new_is_active: boolean;
}
export interface DepartmentInput extends CompanyInput {
  new_company_id?: string | null;
}
export interface SupplierInput {
  new_name: string;
  new_code?: string;
  new_is_active?: boolean;
  new_address?: string;
  new_city?: string;
  new_email?: string;
  new_phone?: string;
  new_branch_id?: string | null;
}

function text(value: string, label: string, length: number, required = false) {
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${label} est obligatoire.`);
  if (normalized.length > length) throw new Error(`${label} : ${length} caractères maximum.`);
  return normalized;
}

function bind(entitySet: string, id: string) {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    throw new Error("La référence sélectionnée est invalide. Actualisez la liste.");
  }
  return `/${entitySet}(${id})`;
}

export function companyRecord(input: Partial<CompanyInput>, create = false): Partial<CompanyInput> {
  const record: Partial<CompanyInput> = {};
  if (create || input.new_name !== undefined) record.new_name = text(input.new_name ?? "", "Le nom", referenceLimits.name, true);
  if (create || input.new_code !== undefined) record.new_code = text(input.new_code ?? "", "Le code", referenceLimits.code, true);
  if (input.new_is_active !== undefined) record.new_is_active = input.new_is_active;
  return record;
}

export function supplierRecord(input: Partial<SupplierInput>, create = false) {
  const record: Partial<New_suppliersBase> & { new_Branch?: null } = {};
  if (create || input.new_name !== undefined) record.new_name = text(input.new_name ?? "", "La raison sociale", referenceLimits.name, true);
  if (input.new_code !== undefined) record.new_tax_id = text(input.new_code, "L'identifiant fiscal", referenceLimits.code);
  if (input.new_address !== undefined) record.new_address = text(input.new_address, "L'adresse", referenceLimits.address);
  if (input.new_city !== undefined) record.new_city = text(input.new_city, "La ville", referenceLimits.city);
  if (input.new_phone !== undefined) record.new_phone = text(input.new_phone, "Le téléphone", referenceLimits.phone);
  if (input.new_email !== undefined) {
    record.new_email = text(input.new_email, "L'adresse e-mail", referenceLimits.email);
    if (record.new_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.new_email)) throw new Error("L'adresse e-mail est invalide.");
  }
  if (input.new_is_active !== undefined) record.new_isactive = input.new_is_active;
  if (input.new_branch_id) record["new_Branch@odata.bind"] = bind("new_branchs", input.new_branch_id);
  // Null removes the relationship; undefined deliberately leaves it unchanged.
  else if (input.new_branch_id !== undefined && !create) record.new_Branch = null;
  return record;
}

export function departmentRecord(input: Partial<DepartmentInput>, create = false) {
  const basic = companyRecord(input, create);
  const record: Partial<New_departementsBase> & { new_Company?: null } = {};
  if (basic.new_name !== undefined) record.new_name = basic.new_name;
  if (basic.new_code !== undefined) record.new_code = basic.new_code;
  if (basic.new_is_active !== undefined) record.new_isactive = basic.new_is_active;
  if (input.new_company_id) record["new_Company@odata.bind"] = bind("new_companies", input.new_company_id);
  else if (input.new_company_id !== undefined && !create) record.new_Company = null;
  return record;
}
