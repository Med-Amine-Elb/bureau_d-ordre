import { afterEach, describe, expect, it, vi } from "vitest";
import { New_foldersService } from "../generated/services/New_foldersService";
import type { New_folders } from "../generated/models/New_foldersModel";
import { dataService, mapCrmEntityToDossier, mapDossierToCrmEntity } from "./dataService";

// Generated-service contract fixture, not a connection to live Dataverse.
const savedFolder: New_folders = {
  new_folderid: "00000000-0000-0000-0000-000000000001",
  new_folder_number: "TEST-PERSISTENCE",
  new_bcnumber: "TEST-BC",
  "new_Department@odata.bind": "/new_departements(00000000-0000-0000-0000-000000000002)",
  new_documenttype: 871840003,
  new_invoicedate: "2026-10-22T00:00:00Z",
  new_invoicenumber: "TEST-PIECE",
  new_isblocked: false,
  new_receptiondate: "2026-10-22T00:00:00Z",
  new_status: 150,
  ownerid: "00000000-0000-0000-0000-000000000003",
  owneridtype: "systemuser",
  statecode: 0,
  createdbyyominame: "",
  createdonbehalfbyyominame: "",
  modifiedbyyominame: "",
  modifiedonbehalfbyyominame: "",
  owneridname: "Test owner",
  owneridyominame: "",
  owningbusinessunitname: "Test unit",
};

afterEach(() => vi.restoreAllMocks());

describe("Courrier recipient persistence contract", () => {
  it("sends the form recipient on creation and restores it on a fresh read", async () => {
    const stored = { ...savedFolder, new_person_to_deliver: "Destinataire TEST" };
    const create = vi.spyOn(New_foldersService, "create").mockResolvedValue({ success: true, data: stored });
    const read = vi.spyOn(New_foldersService, "getAll").mockResolvedValue({ success: true, data: [stored] });
    vi.spyOn(console, "log").mockImplementation(() => {});

    const id = await dataService.createDossier({
      new_document_type: 600,
      new_personne_a_livrer: "Destinataire TEST",
    });
    expect(id).toBe(stored.new_folderid);
    expect(create).toHaveBeenCalledWith({
      new_documenttype: 871840003,
      new_person_to_deliver: "Destinataire TEST",
    });

    const [reloaded] = await dataService.getDossiers();
    expect(read).toHaveBeenCalledWith({ select: expect.arrayContaining(["new_person_to_deliver"]) });
    expect(reloaded.new_personne_a_livrer).toBe("Destinataire TEST");
    expect(reloaded.new_person_to_deliver).toBe("Destinataire TEST");
  });

  it("supports editing and explicitly clearing the recipient", async () => {
    const update = vi.spyOn(New_foldersService, "update").mockResolvedValue({ success: true, data: savedFolder });
    await dataService.updateDossier(savedFolder.new_folderid, { new_personne_a_livrer: "" });
    expect(update).toHaveBeenCalledWith(savedFolder.new_folderid, { new_person_to_deliver: "" });
  });

  it("prefers the canonical recipient when both names are supplied", () => {
    expect(mapDossierToCrmEntity({ new_person_to_deliver: "Canonical", new_personne_a_livrer: "Legacy" }))
      .toEqual({ new_person_to_deliver: "Canonical" });
  });
});

describe("Supplier signature persistence contract", () => {
  it.each([true, false])("sends signature=%s and restores it for the agency/admin screens", async (signed) => {
    const stored = { ...savedFolder, new_supplier_signed: signed };
    const update = vi.spyOn(New_foldersService, "update").mockResolvedValue({ success: true, data: stored });
    vi.spyOn(New_foldersService, "getAll").mockResolvedValue({ success: true, data: [stored] });
    vi.spyOn(console, "log").mockImplementation(() => {});

    await dataService.updateDossier(stored.new_folderid, { new_fournisseur_signe: signed });
    expect(update).toHaveBeenCalledWith(stored.new_folderid, { new_supplier_signed: signed });
    const [reloaded] = await dataService.getDossiers();
    expect(reloaded.new_supplier_signed).toBe(signed);
    expect(reloaded.new_fournisseur_signe).toBe(signed);
    expect(mapDossierToCrmEntity(reloaded).new_supplier_signed).toBe(signed);
  });

  it("preserves an explicit false canonical value when aliases conflict", () => {
    expect(mapDossierToCrmEntity({ new_supplier_signed: false, new_fournisseur_signe: true }))
      .toEqual({ new_supplier_signed: false });
  });

  it("does not overwrite recipient or signature in unrelated partial updates", () => {
    expect(mapDossierToCrmEntity({ new_status: 140 })).toEqual({ new_status: 140 });
  });

  it("returns a consistent unsigned state when Dataverse omits the signature", () => {
    const reloaded = mapCrmEntityToDossier(savedFolder);
    expect(reloaded.new_supplier_signed).toBe(false);
    expect(reloaded.new_fournisseur_signe).toBe(false);
    expect(reloaded.new_personne_a_livrer).toBeUndefined();
  });
});
