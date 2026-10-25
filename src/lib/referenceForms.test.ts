import { describe, expect, it } from "vitest";
import { companyRecord, departmentRecord, referenceLimits, supplierRecord } from "./referenceForms";
import suppliersSnapshot from "../../.power/schemas/dataverse/suppliers.Schema.json?raw";
import companiesSnapshot from "../../.power/schemas/dataverse/companies.Schema.json?raw";
import departmentsSnapshot from "../../.power/schemas/dataverse/departements.Schema.json?raw";

const linkedId = "11111111-2222-3333-4444-555555555555";

describe("Reference form validation and writable payloads", () => {
  it("uses the actual column lengths from each generated metadata snapshot", () => {
    for (const [table, snapshot] of [["suppliers", suppliersSnapshot], ["companies", companiesSnapshot], ["departements", departmentsSnapshot]]) {
      const schema = JSON.parse(snapshot);
      const columns = schema.schema.items.properties;
      expect(columns.new_name.maxLength).toBe(referenceLimits.name);
      expect(columns[table === "suppliers" ? "new_tax_id" : "new_code"].maxLength).toBe(referenceLimits.code);
      if (table === "suppliers") {
        for (const field of ["address", "city", "email", "phone"] as const) expect(columns[`new_${field}`].maxLength).toBe(referenceLimits[field]);
        expect(columns.new_branch["x-ms-schema-name"]).toBe("new_Branch");
      }
      if (table === "departements") expect(columns.new_company["x-ms-schema-name"]).toBe("new_Company");
    }
  });

  it("normalizes all supplier business fields and binds the actual agency navigation property", () => {
    expect(supplierRecord({ new_name: " TEST SARL ", new_code: " IF-TEST ", new_address: " 10 rue TEST ", new_city: " Ville TEST ", new_phone: " +212 600000000 ", new_email: " test@example.com ", new_branch_id: linkedId, new_is_active: false }, true)).toEqual({
      new_name: "TEST SARL", new_tax_id: "IF-TEST", new_address: "10 rue TEST", new_city: "Ville TEST", new_phone: "+212 600000000", new_email: "test@example.com", "new_Branch@odata.bind": `/new_branchs(${linkedId})`, new_isactive: false,
    });
  });
  it("omits existing contact and lookup fields during status-only supplier updates", () => {
    expect(supplierRecord({ new_is_active: false })).toEqual({ new_isactive: false });
  });
  it("explicitly clears optional supplier text values", () => {
    expect(supplierRecord({ new_address: "", new_email: " ", new_phone: "", new_city: "", new_code: "" })).toEqual({ new_address: "", new_email: "", new_phone: "", new_city: "", new_tax_id: "" });
  });
  it("clears an agency relationship only on an explicit update", () => {
    expect(supplierRecord({ new_branch_id: null })).toEqual({ new_Branch: null });
    expect(supplierRecord({ new_name: "TEST", new_branch_id: null }, true)).toEqual({ new_name: "TEST" });
    expect(supplierRecord({ new_branch_id: undefined })).toEqual({});
  });
  it("binds, clears or preserves a direction's company independently of other fields", () => {
    expect(departmentRecord({ new_company_id: linkedId })).toEqual({ "new_Company@odata.bind": `/new_companies(${linkedId})` });
    expect(departmentRecord({ new_company_id: null })).toEqual({ new_Company: null });
    expect(departmentRecord({ new_is_active: false })).toEqual({ new_isactive: false });
    expect(departmentRecord({ new_name: " TEST ", new_code: " DIR ", new_company_id: null }, true)).toEqual({ new_name: "TEST", new_code: "DIR" });
  });
  it.each(["not-a-guid", ")/accounts", "11111111-2222-3333-4444-555555555555/other"])("rejects invalid relationship IDs: %s", id => {
    expect(() => supplierRecord({ new_branch_id: id })).toThrow();
    expect(() => departmentRecord({ new_company_id: id })).toThrow();
  });
  it.each(["invalid", "a@", "a@b", "a b@example.com"])("rejects invalid email input: %s", new_email => {
    expect(() => supplierRecord({ new_email })).toThrow("e-mail");
  });
  it.each(["new_address", "new_city", "new_email", "new_phone", "new_code"] as const)("rejects overlong supplier %s", field => {
    const limit = field === "new_phone" ? referenceLimits.phone : referenceLimits.code;
    expect(() => supplierRecord({ [field]: "x".repeat(limit + 1) })).toThrow("maximum");
  });
  it("accepts exact text boundaries and rejects overlong names/codes", () => {
    expect(companyRecord({ new_name: "x".repeat(850), new_code: "x".repeat(100) }, true).new_name).toHaveLength(850);
    expect(() => companyRecord({ new_name: "x".repeat(851) })).toThrow("maximum");
    expect(() => departmentRecord({ new_code: "x".repeat(101) })).toThrow("maximum");
    expect(() => supplierRecord({ new_name: "x".repeat(851) })).toThrow("maximum");
  });
  it("never submits IDs, audit columns or ownership passed from read models", () => {
    const input = { new_name: "TEST", new_code: "IF", new_is_active: true, new_supplierid: linkedId, createdon: "2026-10-22", ownerid: linkedId, statecode: 1 };
    expect(supplierRecord(input, true)).toEqual({ new_name: "TEST", new_tax_id: "IF", new_isactive: true });
    expect(companyRecord(input, true)).toEqual({ new_name: "TEST", new_code: "IF", new_is_active: true });
    expect(departmentRecord(input, true)).toEqual({ new_name: "TEST", new_code: "IF", new_isactive: true });
  });
  it("requires a supplier name on create and when changing the name", () => {
    expect(() => supplierRecord({ new_name: " " }, true)).toThrow("obligatoire");
    expect(() => supplierRecord({ new_name: " " })).toThrow("obligatoire");
  });
});
