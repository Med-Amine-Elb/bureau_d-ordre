import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dataService } from "./dataService";
import { loadDossierLookups } from "./dossierLookups";

beforeEach(() => {
  vi.spyOn(dataService, "getFournisseursLookup").mockResolvedValue([{ new_supplierid: "supplier-test", new_name: "Supplier TEST", new_code: "TEST", new_is_active: true }]);
  vi.spyOn(dataService, "getCompaniesLookup").mockResolvedValue([{ new_companyid: "company-test", new_name: "Company TEST", new_code: "TEST", new_is_active: true }]);
  vi.spyOn(dataService, "getDepartmentsLookup").mockResolvedValue([{ new_departmentid: "direction-test", new_name: "Direction TEST", new_code: "TEST", new_is_active: true }]);
  vi.spyOn(dataService, "getUsers").mockResolvedValue([]);
  vi.spyOn(dataService, "getDossiers").mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

describe("Independent dossier dropdown loading", () => {
  it("loads all references without errors", async () => {
    const result = await loadDossierLookups();
    expect(result.suppliers).toHaveLength(1);
    expect(result.companies).toHaveLength(1);
    expect(result.departments).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  it("keeps successful reference lists when dossiers and users are denied", async () => {
    vi.mocked(dataService.getUsers).mockRejectedValue(new Error("Denied"));
    vi.mocked(dataService.getDossiers).mockRejectedValue(new Error("Denied"));
    const result = await loadDossierLookups();
    expect(result.suppliers).toHaveLength(1);
    expect(result.companies).toHaveLength(1);
    expect(result.departments).toHaveLength(1);
    expect(result.errors).toEqual(["utilisateurs", "dossiers liés"]);
  });

  it("reports a supplier failure without discarding companies or directions", async () => {
    vi.mocked(dataService.getFournisseursLookup).mockRejectedValue(new Error("Offline"));
    const result = await loadDossierLookups();
    expect(result.suppliers).toEqual([]);
    expect(result.companies).toHaveLength(1);
    expect(result.departments).toHaveLength(1);
    expect(result.errors).toEqual(["fournisseurs"]);
  });
});
