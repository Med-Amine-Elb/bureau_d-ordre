import { describe, expect, it } from "vitest";
import { matchesSupplierFilter } from "@/lib/supplierFilter";

describe("supplier name filter", () => {
  it("matches supplier names by any typed substring, ignoring case", () => {
    expect(matchesSupplierFilter("Atlas Fournitures", "atlas" )).toBe(true);
    expect(matchesSupplierFilter("Atlas Fournitures", "fourni" )).toBe(true);
    expect(matchesSupplierFilter("Atlas Fournitures", "maghreb" )).toBe(false);
  });

  it("matches names without requiring accents to be typed", () => {
    expect(matchesSupplierFilter("Électricité Générale", "electricite generale")).toBe(true);
  });

  it("shows all rows when the search is blank", () => {
    expect(matchesSupplierFilter("Atlas Fournitures", "  ")).toBe(true);
    expect(matchesSupplierFilter(undefined, "")).toBe(true);
  });
});
