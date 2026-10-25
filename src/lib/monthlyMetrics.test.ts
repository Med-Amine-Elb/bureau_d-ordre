import { describe, expect, it } from "vitest";
import { isDateInMonth, isDossierPaidInMonth } from "@/lib/monthlyMetrics";

describe("isDateInMonth", () => {
  const month = new Date(2026, 9, 1);

  it("matches a date in the selected month", () => {
    expect(isDateInMonth("2026-10-22T10:00:00Z", month)).toBe(true);
  });

  it("does not match a different month or year", () => {
    expect(isDateInMonth("2026-05-22", month)).toBe(false);
    expect(isDateInMonth("2025-10-22", month)).toBe(false);
  });

  it("ignores missing or invalid dates", () => {
    expect(isDateInMonth(undefined, month)).toBe(false);
    expect(isDateInMonth("not-a-date", month)).toBe(false);
  });
});

describe("isDossierPaidInMonth", () => {
  const month = new Date(2026, 9, 1);

  it("counts a completed transfer using its transfer date", () => {
    expect(isDossierPaidInMonth({
      new_status: 150,
      new_payment_method: 2,
      new_date_virement: "2026-10-23",
    }, month)).toBe(true);
  });

  it("counts a cheque only after final delivery in the selected month", () => {
    expect(isDossierPaidInMonth({
      new_status: 150,
      new_payment_method: 1,
      new_final_delivery_date: "2026-10-21T12:00:00Z",
    }, month)).toBe(true);
  });

  it("does not count unpaid or differently dated dossiers", () => {
    expect(isDossierPaidInMonth({
      new_status: 120,
      new_payment_method: 2,
      new_date_virement: "2026-10-23",
    }, month)).toBe(false);
    expect(isDossierPaidInMonth({
      new_status: 150,
      new_payment_method: 2,
      new_date_virement: "2026-09-30",
    }, month)).toBe(false);
  });
});
