import { describe, expect, it } from "vitest";
import { DOSSIER_STATUS_LABELS, getDossierStatusLabel } from "@/lib/statusLabels";

describe("canonical dossier status labels", () => {
  it("returns the short agreed label for each workflow step", () => {
    expect(getDossierStatusLabel(10)).toBe("Au BO");
    expect(getDossierStatusLabel(30)).toBe("Vers prescripteur");
    expect(getDossierStatusLabel(50)).toBe("Vers BO");
    expect(getDossierStatusLabel(60)).toBe("Prêt pour DCF");
    expect(getDossierStatusLabel(70)).toBe("Vers DCF");
    expect(getDossierStatusLabel(90)).toBe("À corriger");
    expect(getDossierStatusLabel(100)).toBe("Vers trésorerie");
    expect(getDossierStatusLabel(120)).toBe("Prêt à remettre");
    expect(getDossierStatusLabel(130)).toBe("Vers agence");
    expect(getDossierStatusLabel(140)).toBe("À l’agence");
    expect(getDossierStatusLabel(150)).toBe("Clôturé");
  });

  it("covers every known Dataverse status and falls back for unknown values", () => {
    expect(Object.keys(DOSSIER_STATUS_LABELS).map(Number)).toEqual([
      10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 200,
    ]);
    expect(getDossierStatusLabel(999)).toBe("Statut 999");
  });
});
