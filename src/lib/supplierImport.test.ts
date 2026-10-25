import { describe, expect, it } from "vitest";
import type { AgenceLookup, FournisseurLookup } from "@/lib/dataService";
import { findSupplierImportHeader, validateSupplierImportRows } from "@/lib/supplierImport";

const agencies: AgenceLookup[] = [
  { new_branchid: "branch-1", new_name: "Casablanca", new_city: "Casablanca", new_is_active: true },
  { new_branchid: "branch-2", new_name: "Agence Fermée", new_city: "Rabat", new_is_active: false },
];
const existing: FournisseurLookup[] = [
  { new_supplierid: "supplier-1", new_name: "Fournisseur Existant", new_code: "IF-001", new_is_active: true },
];

describe("supplier Excel import validation", () => {
  it("finds recognized supplier headers below introductory rows and maps their columns", () => {
    const header = findSupplierImportHeader([
      { rowNumber: 1, headers: ["Import des fournisseurs"] },
      { rowNumber: 2, headers: ["Consignes : ne pas modifier les colonnes"] },
      { rowNumber: 3, headers: ["Nom fournisseur", "ICE", "E-mail"] },
    ]);
    expect(header?.rowNumber).toBe(3);
    expect(header?.columnPositions.get("name")).toBe(1);
    expect(header?.columnPositions.get("taxId")).toBe(2);
    expect(header?.columnPositions.get("email")).toBe(3);
  });

  it("recognizes the downloaded template header and ignores the required marker", () => {
    const header = findSupplierImportHeader([
      { rowNumber: 1, headers: ["Raison sociale *", "Identifiant fiscal"] },
    ]);
    expect(header?.columnPositions.get("name")).toBe(1);
  });

  it("returns no header when no supplier name column exists", () => {
    expect(findSupplierImportHeader([{ rowNumber: 1, headers: ["Code", "E-mail"] }])).toBeUndefined();
  });

  it("requires only the name and defaults optional active status to true", () => {
    const [row] = validateSupplierImportRows([{ rowNumber: 2, values: ["Nouveau Fournisseur"] }], existing, agencies);
    expect(row.errors).toEqual([]);
    expect(row.input).toMatchObject({ new_name: "Nouveau Fournisseur", new_is_active: true });
  });

  it("maps an exact active agency and parses optional fields", () => {
    const [row] = validateSupplierImportRows([{
      rowNumber: 2,
      values: ["Fournisseur Nouveau", "IF-002", "contact@example.com", "+212 600000000", "Rue 1", "Rabat", "casablanca", "Non"],
    }], existing, agencies);
    expect(row.errors).toEqual([]);
    expect(row.input).toMatchObject({ new_code: "IF-002", new_email: "contact@example.com", new_phone: "+212 600000000", new_address: "Rue 1", new_city: "Rabat", new_branch_id: "branch-1", new_is_active: false });
  });

  it("rejects missing names, invalid email, duplicates and unknown or inactive agencies", () => {
    const rows = validateSupplierImportRows([
      { rowNumber: 2, values: ["", "IF-EMPTY"] },
      { rowNumber: 3, values: ["Fournisseur Existant"] },
      { rowNumber: 4, values: ["Autre Fournisseur", "IF-001"] },
      { rowNumber: 5, values: ["Autre 2", "", "bad-email"] },
      { rowNumber: 6, values: ["Autre 3", "", "", "", "", "", "Agence Inconnue"] },
      { rowNumber: 7, values: ["Autre 4", "", "", "", "", "", "Agence Fermée"] },
    ], existing, agencies);
    expect(rows.find(row => row.rowNumber === 2)?.errors).toContain("La raison sociale est obligatoire.");
    expect(rows.find(row => row.rowNumber === 3)?.errors.join(" ")).toContain("déjà présente");
    expect(rows.find(row => row.rowNumber === 4)?.errors.join(" ")).toContain("Identifiant fiscal");
    expect(rows.find(row => row.rowNumber === 5)?.errors.join(" ")).toContain("e-mail");
    expect(rows.find(row => row.rowNumber === 6)?.errors.join(" ")).toContain("introuvable");
    expect(rows.find(row => row.rowNumber === 7)?.errors.join(" ")).toContain("inactive");
  });

  it("detects duplicates within the same spreadsheet and skips blank lines", () => {
    const rows = validateSupplierImportRows([
      { rowNumber: 2, values: ["Fournisseur Alpha", "IF-ALPHA"] },
      { rowNumber: 3, values: ["fournisseur alpha", "IF-ALPHA"] },
      { rowNumber: 4, values: ["", "", ""] },
    ], existing, agencies);
    expect(rows).toHaveLength(2);
    expect(rows[0].input?.new_name).toBe("Fournisseur Alpha");
    expect(rows[1].errors.join(" ")).toContain("déjà présente");
  });
});
