import { describe, it, expect } from "vitest";
import { generateNotifications } from "./notificationEngine";
import type { Dossier } from "./dataService";

describe("Notification Engine and Role-Based Flows", () => {
  const baseDossier: Dossier = {
    new_folderid: "test-id",
    new_folder_number: "DOS-2026-1001",
    new_document_type: 100, // Facture
    new_status: 10,
    new_reception_date: "2026-07-28"
  };

  describe("Bureau d'Ordre (BO) Role Flow", () => {
    it("should return notification for dossier in status 50 (Transit BO)", () => {
      const dossier = { ...baseDossier, new_status: 50 };
      const results = generateNotifications([dossier], "BO", "");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Dossier DOS-2026-1001");
      expect(results[0].message).toBe("Dossier en attente d'accusé de réception");
      expect(results[0].path).toBe(`/bo/dossiers/${dossier.new_folderid}`);
    });

    it("should return notification for dossier in status 60 (Ready for DCF)", () => {
      const dossier = { ...baseDossier, new_status: 60 };
      const results = generateNotifications([dossier], "BO", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente de transmission à la DCF");
    });

    it("should not return notification for dossier in status 90 (Retour BO is email-based)", () => {
      const dossier = { ...baseDossier, new_status: 90 };
      const results = generateNotifications([dossier], "BO", "");
      expect(results).toHaveLength(0);
    });

    it("should return notification for cheque in status 120 (not received yet by BO)", () => {
      const dossier: Dossier = {
        ...baseDossier,
        new_status: 120,
        new_payment_method: 1, // Chèque
        new_cheque_recu_bo: false,
        new_cheque_number: "CHQ-888"
      };
      const results = generateNotifications([dossier], "BO", "");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Chèque CHQ-888");
      expect(results[0].message).toBe("Chèque en attente d'accusé de réception");
      expect(results[0].path).toBe("/bo/remises");
    });

    it("should return notification for cheque in status 120 (received by BO, ready for remise/expedition)", () => {
      const dossier: Dossier = {
        ...baseDossier,
        new_status: 120,
        new_payment_method: 1, // Chèque
        new_cheque_recu_bo: true,
        new_cheque_number: "CHQ-888"
      };
      const results = generateNotifications([dossier], "BO", "");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Chèque CHQ-888");
      expect(results[0].message).toBe("Chèque en attente d'expédition ou remise");
    });

    it("should return notification for wire payment in status 150 (Virement completed)", () => {
      const dossier: Dossier = {
        ...baseDossier,
        new_status: 150,
        new_payment_method: 2 // Virement
      };
      const results = generateNotifications([dossier], "BO", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier réglé par virement bancaire");
    });
  });

  describe("Prescripteur Role Flow", () => {
    it("should return notification in status 30 (Transit Prescripteur)", () => {
      const dossier = { ...baseDossier, new_status: 30 };
      const results = generateNotifications([dossier], "Prescripteur", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente d'accusé de réception");
      expect(results[0].path).toBe(`/prescripteur/dossiers/${dossier.new_folderid}`);
    });

    it("should return notification in status 40 (Chez Prescripteur - validation)", () => {
      const dossier = { ...baseDossier, new_status: 40 };
      const results = generateNotifications([dossier], "Prescripteur", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente de validation");
    });

    it("should not return notification in status 90 (Correction Prescripteur is email-based)", () => {
      const dossier = { ...baseDossier, new_status: 90 };
      const results = generateNotifications([dossier], "Prescripteur", "");
      expect(results).toHaveLength(0);
    });
  });

  describe("DCF (Comptabilité) Role Flow", () => {
    it("should return notification in status 70 (Transit DCF)", () => {
      const dossier = { ...baseDossier, new_status: 70 };
      const results = generateNotifications([dossier], "DCF", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente d'accusé de réception");
      expect(results[0].path).toBe(`/dcf/dossiers/${dossier.new_folderid}`);
    });

    it("should return notification in status 80 (Chez DCF)", () => {
      const dossier = { ...baseDossier, new_status: 80 };
      const results = generateNotifications([dossier], "DCF", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente de traitement/comptabilisation");
    });
  });

  describe("Trésorerie Role Flow", () => {
    it("should return notification in status 100 (Transit Trésorerie)", () => {
      const dossier = { ...baseDossier, new_status: 100 };
      const results = generateNotifications([dossier], "Tresorerie", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente d'accusé de réception");
      expect(results[0].path).toBe(`/tresorerie/dossiers/${dossier.new_folderid}`);
    });

    it("should return notification in status 110 (Chez Trésorerie)", () => {
      const dossier = { ...baseDossier, new_status: 110 };
      const results = generateNotifications([dossier], "Tresorerie", "");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Dossier en attente de règlement");
    });
  });

  describe("Agence Régionale Role Flow", () => {
    const agenceDossier: Dossier = {
      ...baseDossier,
      new_destination_branch_id: "Tanger"
    };

    it("should return notification in status 130 if branch matches", () => {
      const dossier = { ...agenceDossier, new_status: 130, new_cheque_number: "CHQ-001" };
      const results = generateNotifications([dossier], "Agence", "Tanger");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Chèque CHQ-001");
      expect(results[0].message).toBe("Chèque en transit (en attente d'accusé de réception)");
      expect(results[0].path).toBe("/agence/cheques");
    });

    it("should not return notification in status 130 if branch mismatch", () => {
      const dossier = { ...agenceDossier, new_status: 130 };
      const results = generateNotifications([dossier], "Agence", "Marrakech");
      expect(results).toHaveLength(0);
    });

    it("should return notification in status 140 if branch matches (Disponible)", () => {
      const dossier = { ...agenceDossier, new_status: 140, new_cheque_number: "CHQ-001" };
      const results = generateNotifications([dossier], "Agence", "Tanger");
      expect(results).toHaveLength(1);
      expect(results[0].message).toBe("Chèque en attente de remise fournisseur");
    });
  });
});
