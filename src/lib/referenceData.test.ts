import { beforeEach, describe, expect, it, vi } from "vitest";

const clients = vi.hoisted(() => ({
  companies: { create: vi.fn(), update: vi.fn(), getAll: vi.fn() },
  departments: { create: vi.fn(), update: vi.fn(), getAll: vi.fn() },
  suppliers: { create: vi.fn(), update: vi.fn(), getAll: vi.fn() },
}));
vi.mock("../generated/services/New_companiesService", () => ({ New_companiesService: clients.companies }));
vi.mock("../generated/services/New_departementsService", () => ({ New_departementsService: clients.departments }));
vi.mock("../generated/services/New_suppliersService", () => ({ New_suppliersService: clients.suppliers }));

import { dataService } from "./dataService";

beforeEach(() => vi.resetAllMocks());

describe("Company and direction reference contracts", () => {
  it("creates a company with writable fields and reads it back for the dropdown", async () => {
    const stored = { new_companyid: "company-test", new_name: "GBM TEST", new_code: "GBM-TEST", new_is_active: true };
    clients.companies.create.mockResolvedValue({ success: true, data: stored });
    clients.companies.getAll.mockResolvedValue({ success: true, data: [stored] });
    await dataService.createCompanyLookup({ new_name: " GBM TEST ", new_code: " GBM-TEST ", new_is_active: true });
    expect(clients.companies.create).toHaveBeenCalledWith({ new_name: "GBM TEST", new_code: "GBM-TEST", new_is_active: true });
    expect(await dataService.getCompaniesLookup()).toEqual([stored]);
  });

  it("creates a direction using the actual new_isactive column and reads its UI alias", async () => {
    clients.departments.create.mockResolvedValue({ success: true });
    clients.departments.getAll.mockResolvedValue({ success: true, data: [{ new_departementid: "direction-test", new_name: "Direction TEST", new_code: "DIR-TEST", new_isactive: true }] });
    await dataService.createDepartmentLookup({ new_name: " Direction TEST ", new_code: " DIR-TEST ", new_is_active: true });
    expect(clients.departments.create).toHaveBeenCalledWith({ new_name: "Direction TEST", new_code: "DIR-TEST", new_isactive: true });
    expect(await dataService.getDepartmentsLookup()).toEqual([{ new_departmentid: "direction-test", new_name: "Direction TEST", new_code: "DIR-TEST", new_is_active: true }]);
  });

  it("updates company name/code without sending IDs or ownership", async () => {
    clients.companies.update.mockResolvedValue({ success: true });
    await dataService.updateCompanyLookup("company-test", { new_name: " Updated TEST ", new_code: " NEW " });
    expect(clients.companies.update).toHaveBeenCalledWith("company-test", { new_name: "Updated TEST", new_code: "NEW" });
  });

  it("changes only the company active flag during deactivation", async () => {
    clients.companies.update.mockResolvedValue({ success: true });
    await dataService.updateCompanyLookup("company-test", { new_is_active: false });
    expect(clients.companies.update).toHaveBeenCalledWith("company-test", { new_is_active: false });
  });

  it("changes only the direction active flag and preserves its company relationship", async () => {
    clients.departments.update.mockResolvedValue({ success: true });
    await dataService.updateDepartmentLookup("direction-test", { new_is_active: false });
    expect(clients.departments.update).toHaveBeenCalledWith("direction-test", { new_isactive: false });
  });

  it.each(["company", "direction"])("rejects blank required fields before creating a %s", async kind => {
    const create = kind === "company" ? dataService.createCompanyLookup : dataService.createDepartmentLookup;
    await expect(create({ new_name: "   ", new_code: "TEST", new_is_active: true })).rejects.toThrow();
    await expect(create({ new_name: "TEST", new_code: "   ", new_is_active: true })).rejects.toThrow();
    expect(clients.companies.create).not.toHaveBeenCalled();
    expect(clients.departments.create).not.toHaveBeenCalled();
  });

  it("rejects blank codes while editing a direction", async () => {
    await expect(dataService.updateDepartmentLookup("direction-test", { new_code: " " })).rejects.toThrow();
    expect(clients.departments.update).not.toHaveBeenCalled();
  });

  it("does not report success for a failed company write without an error object", async () => {
    clients.companies.create.mockResolvedValue({ success: false });
    await expect(dataService.createCompanyLookup({ new_name: "TEST", new_code: "TEST", new_is_active: true })).rejects.toThrow();
  });

  it("propagates a failed direction update for the UI error state", async () => {
    clients.departments.update.mockResolvedValue({ success: false, error: new Error("Denied") });
    await expect(dataService.updateDepartmentLookup("direction-test", { new_is_active: false })).rejects.toThrow();
  });

  it("does not display a failed reference read as a successful empty list", async () => {
    clients.companies.getAll.mockResolvedValue({ success: false, data: [] });
    await expect(dataService.getCompaniesLookup()).rejects.toThrow();
  });

  it("preserves the supplier tax-ID mapping used by the existing admin form", async () => {
    clients.suppliers.create.mockResolvedValue({ success: true });
    await dataService.createFournisseurLookup({ new_name: "Fournisseur TEST", new_code: "IF-TEST", new_is_active: true });
    expect(clients.suppliers.create).toHaveBeenCalledWith({ new_name: "Fournisseur TEST", new_tax_id: "IF-TEST", new_isactive: true });
  });

  it("does not report success for a failed supplier write", async () => {
    clients.suppliers.create.mockResolvedValue({ success: false });
    await expect(dataService.createFournisseurLookup({ new_name: "TEST", new_is_active: true })).rejects.toThrow();
  });

  it("creates and reloads supplier contact information, agency and read-only dates", async () => {
    const branch = "11111111-2222-3333-4444-555555555555";
    clients.suppliers.create.mockResolvedValue({ success: true });
    clients.suppliers.getAll.mockResolvedValue({ success: true, data: [{ new_supplierid: "supplier-test", new_name: "TEST", new_address: "Rue TEST", new_city: "Ville TEST", new_email: "test@example.com", new_phone: "0600000000", _new_branch_value: branch, new_isactive: true, createdon: "2026-10-22T10:00:00Z" }] });
    await dataService.createFournisseurLookup({ new_name: "TEST", new_address: "Rue TEST", new_city: "Ville TEST", new_email: "test@example.com", new_phone: "0600000000", new_branch_id: branch, new_is_active: true });
    expect(clients.suppliers.create).toHaveBeenCalledWith({ new_name: "TEST", new_address: "Rue TEST", new_city: "Ville TEST", new_email: "test@example.com", new_phone: "0600000000", "new_Branch@odata.bind": `/new_branchs(${branch})`, new_isactive: true });
    expect((await dataService.getFournisseursLookup())[0]).toMatchObject({ new_address: "Rue TEST", new_city: "Ville TEST", new_email: "test@example.com", new_phone: "0600000000", new_branch_id: branch, createdon: "2026-10-22T10:00:00Z" });
  });

  it("creates a direction attached to a company and reloads the relationship", async () => {
    const company = "11111111-2222-3333-4444-555555555555";
    clients.departments.create.mockResolvedValue({ success: true });
    clients.departments.getAll.mockResolvedValue({ success: true, data: [{ new_departementid: "direction-test", new_name: "TEST", new_code: "DIR", _new_company_value: company, new_isactive: true }] });
    await dataService.createDepartmentLookup({ new_name: "TEST", new_code: "DIR", new_is_active: true, new_company_id: company });
    expect(clients.departments.create).toHaveBeenCalledWith({ new_name: "TEST", new_code: "DIR", new_isactive: true, "new_Company@odata.bind": `/new_companies(${company})` });
    expect((await dataService.getDepartmentsLookup())[0].new_company_id).toBe(company);
  });

  it("passes explicit relationship removal through the generated update services", async () => {
    clients.suppliers.update.mockResolvedValue({ success: true });
    clients.departments.update.mockResolvedValue({ success: true });
    await dataService.updateFournisseurLookup("supplier-test", { new_branch_id: null });
    await dataService.updateDepartmentLookup("direction-test", { new_company_id: null });
    expect(clients.suppliers.update).toHaveBeenCalledWith("supplier-test", { new_Branch: null });
    expect(clients.departments.update).toHaveBeenCalledWith("direction-test", { new_Company: null });
  });
});
