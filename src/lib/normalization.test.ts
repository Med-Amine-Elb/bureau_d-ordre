import { describe, it, expect } from "vitest";
import { cleanString, filterDossiers } from "./normalization";
import type { Dossier } from "./dataService";

describe("Text Normalization and Dossier Suggestions", () => {
  describe("cleanString", () => {
    it("should remove spaces, dashes, and underscores, and convert to lowercase", () => {
      expect(cleanString(" DOS 2026 ")).toBe("dos2026");
      expect(cleanString("DOS-2026_99")).toBe("dos202699");
      expect(cleanString("BC - 2026_TANGER")).toBe("bc2026tanger");
      expect(cleanString("")).toBe("");
      expect(cleanString(null as any)).toBe("");
    });
  });

  describe("filterDossiers", () => {
    const mockDossiers: Dossier[] = [
      {
        new_folderid: "1",
        new_folder_number: "DOS-2026-0001",
        new_po_number: "BC-2026-101",
        new_invoice_number: "INV-999-A",
        new_supplier_id: "Fournisseur Alpha",
        new_document_type: 100,
        new_status: 10,
        new_reception_date: "2026-07-28"
      },
      {
        new_folderid: "2",
        new_folder_number: "DOS-2026-0002",
        new_po_number: "BC-2026-102",
        new_invoice_number: "INV-999-B",
        new_supplier_id: "Fournisseur Beta",
        new_document_type: 100,
        new_status: 10,
        new_reception_date: "2026-07-28"
      }
    ];

    it("should return empty list if query is empty", () => {
      expect(filterDossiers(mockDossiers, "")).toEqual([]);
      expect(filterDossiers(mockDossiers, "   ")).toEqual([]);
    });

    it("should match by folder number (ignoring case, spaces, and dashes)", () => {
      const results = filterDossiers(mockDossiers, "dos20260002");
      expect(results).toHaveLength(1);
      expect(results[0].new_folderid).toBe("2");

      const partialResults = filterDossiers(mockDossiers, "dos-2026");
      expect(partialResults).toHaveLength(2);
    });

    it("should match by PO number (BC)", () => {
      const results = filterDossiers(mockDossiers, "bc 2026 101");
      expect(results).toHaveLength(1);
      expect(results[0].new_folderid).toBe("1");
    });

    it("should match by Invoice number", () => {
      const results = filterDossiers(mockDossiers, "inv999b");
      expect(results).toHaveLength(1);
      expect(results[0].new_folderid).toBe("2");
    });

    it("should match by Supplier name", () => {
      const results = filterDossiers(mockDossiers, "beta");
      expect(results).toHaveLength(1);
      expect(results[0].new_folderid).toBe("2");
    });
  });
});
