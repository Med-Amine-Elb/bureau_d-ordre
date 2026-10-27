import { afterEach, describe, expect, it, vi } from "vitest";
import { New_transmissionsService } from "@/generated/services/New_transmissionsService";
import { New_foldersService } from "@/generated/services/New_foldersService";
import { SystemusersService } from "@/generated/services/SystemusersService";
import { New_dossierauditeventsService } from "@/generated/services/New_dossierauditeventsService";
import { getContext } from "@microsoft/power-apps/app";
import { dataService } from "@/lib/dataService";

vi.mock("@microsoft/power-apps/app", () => ({
  getContext: vi.fn(),
}));

const actorId = "11111111-1111-4111-8111-111111111111";
const actorEntraId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const receiverId = "22222222-2222-4222-8222-222222222222";
const receiverEntraId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const folderId = "33333333-3333-4333-8333-333333333333";

afterEach(() => vi.restoreAllMocks());

describe("Dataverse transmission audit", () => {
  it("creates a real transmission row with the selected actor, recipient, route, and comment", async () => {
    vi.mocked(getContext).mockResolvedValue({
      app: { appId: "app", appSettings: {}, environmentId: "env", queryParams: {} },
      host: { sessionId: "session" },
      user: { objectId: actorEntraId },
    });
    vi.spyOn(SystemusersService, "getAll").mockResolvedValue({
      success: true,
      data: [{ systemuserid: actorId, azureactivedirectoryobjectid: actorEntraId } as never],
    });
    const create = vi.spyOn(New_transmissionsService, "create").mockResolvedValue({ success: true, data: {} as never });

    await dataService.createDossierTransmission({
      folderId,
      folderNumber: "DOS-2026-001",
      fromRole: "BO",
      toRole: "Prescripteur",
      collectorId: receiverId,
      sendingComment: "Dossier complet",
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      new_transmissionname: "DOS-2026-001 — BO → Prescripteur",
      "new_Folder@odata.bind": `/new_folders(${folderId})`,
      "new_SentBy@odata.bind": `/systemusers(${actorId})`,
      "new_Collector@odata.bind": `/systemusers(${receiverId})`,
      new_fromrole: 871840000,
      new_torole: 871840001,
      new_sendingcomment: "Dossier complet",
    }));
  });

  it("marks the latest pending transmission received only by its assigned recipient", async () => {
    vi.mocked(getContext).mockResolvedValue({
      app: { appId: "app", appSettings: {}, environmentId: "env", queryParams: {} },
      host: { sessionId: "session" },
      user: { objectId: receiverEntraId },
    });
    vi.spyOn(SystemusersService, "getAll").mockResolvedValue({
      success: true,
      data: [{ systemuserid: receiverId, azureactivedirectoryobjectid: receiverEntraId } as never],
    });
    vi.spyOn(New_transmissionsService, "getAll").mockResolvedValue({
      success: true,
      data: [{ new_transmissionid: "44444444-4444-4444-8444-444444444444", _new_collector_value: receiverId } as never],
    });
    const update = vi.spyOn(New_transmissionsService, "update").mockResolvedValue({ success: true, data: {} as never });

    await dataService.acknowledgeLatestDossierTransmission(folderId, "Bien reçu");

    expect(update).toHaveBeenCalledWith("44444444-4444-4444-8444-444444444444", expect.objectContaining({
      new_transmissionstatus: 871840001,
      "new_AcknowledgedBy@odata.bind": `/systemusers(${receiverId})`,
      new_receiptcomment: "Bien reçu",
    }));
  });

  it("keeps a saved dossier receipt successful when the separate audit request fails", async () => {
    vi.mocked(getContext).mockResolvedValue({
      app: { appId: "app", appSettings: {}, environmentId: "env", queryParams: {} },
      host: { sessionId: "session" },
      user: { objectId: receiverEntraId },
    });
    vi.spyOn(SystemusersService, "getAll").mockResolvedValue({
      success: true,
      data: [{ systemuserid: receiverId, azureactivedirectoryobjectid: receiverEntraId } as never],
    });
    vi.spyOn(New_foldersService, "get").mockResolvedValue({
      success: true,
      data: { new_status: 30, new_folder_number: "DOS-2026-001" } as never,
    });
    const folderUpdate = vi.spyOn(New_foldersService, "update").mockResolvedValue({ success: true, data: {} as never });
    const auditCreate = vi.spyOn(New_dossierauditeventsService, "create").mockResolvedValue({ success: true, data: {} as never });
    vi.spyOn(New_transmissionsService, "getAll").mockRejectedValue(new Error("request timed out"));

    await expect(dataService.accuseReception(folderId, 40, "Prescripteur")).resolves.toBe(false);
    expect(folderUpdate).toHaveBeenCalledWith(folderId, expect.objectContaining({
      new_status: 40,
      new_acknowledgment_date: expect.any(String),
    }));
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      new_eventtype: 871840003,
      new_actorrole: 871840001,
      "new_Actor@odata.bind": `/systemusers(${receiverId})`,
      "new_Recipient@odata.bind": `/systemusers(${receiverId})`,
    }));
  });
});
