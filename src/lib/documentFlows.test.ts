import { describe, it, expect } from "vitest";
import { generateNotifications } from "./notificationEngine";
import type { Dossier } from "./dataService";

// Helper function to calculate date differences similar to CreateDossier.tsx
const isInvoiceLate = (dateReception: string, dateFacture: string): boolean => {
  const diff = Math.floor(
    (new Date(dateReception).getTime() - new Date(dateFacture).getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 5;
};

describe("End-to-End Document Workflow Simulation (From Creation to Paid)", () => {
  
  describe("1. Facture Standard (100) / Avoir (200) - Long Flow with Virement", () => {
    it("should process standard flow step-by-step to paid status via Virement", () => {
      // Step 1: Creation (Draft)
      let dossier: Dossier = {
        new_folderid: "folder-long-virement",
        new_folder_number: "DOS-2026-9001",
        new_document_type: 100, // Facture
        new_status: 10, // Draft
        new_reception_date: "2026-07-28T00:00:00Z"
      };

      // Draft has no active workflow notifications
      expect(generateNotifications([dossier], "BO", "")).toHaveLength(0);
      expect(generateNotifications([dossier], "Prescripteur", "")).toHaveLength(0);

      // Step 2: Transmission by BO to Prescripteur
      dossier.new_status = 30; // Transit Prescripteur
      
      // Prescripteur should see the Transit notification
      let prescNotifs = generateNotifications([dossier], "Prescripteur", "");
      expect(prescNotifs).toHaveLength(1);
      expect(prescNotifs[0].message).toContain("attente d'accusé");

      // Step 3: Prescripteur Accuse
      dossier.new_status = 40; // Chez Prescripteur (En attente de validation)
      
      prescNotifs = generateNotifications([dossier], "Prescripteur", "");
      expect(prescNotifs).toHaveLength(1);
      expect(prescNotifs[0].message).toContain("attente de validation");

      // Step 4: Prescripteur Validates & Transmits back to BO
      dossier.new_status = 50; // Transit BO
      
      let boNotifs = generateNotifications([dossier], "BO", "");
      expect(boNotifs).toHaveLength(1);
      expect(boNotifs[0].message).toContain("attente d'accusé");

      // Step 5: BO Accuses
      dossier.new_status = 60; // Chez BO
      
      boNotifs = generateNotifications([dossier], "BO", "");
      expect(boNotifs).toHaveLength(1);
      expect(boNotifs[0].message).toContain("attente de transmission à la DCF");

      // Step 6: BO Transmits to DCF (Comptabilité)
      dossier.new_status = 70; // Transit DCF
      
      let dcfNotifs = generateNotifications([dossier], "DCF", "");
      expect(dcfNotifs).toHaveLength(1);
      expect(dcfNotifs[0].message).toContain("attente d'accusé");

      // Step 7: DCF Accuses
      dossier.new_status = 80; // Chez DCF (En attente de traitement/comptabilisation)
      
      dcfNotifs = generateNotifications([dossier], "DCF", "");
      expect(dcfNotifs).toHaveLength(1);
      expect(dcfNotifs[0].message).toContain("attente de traitement/comptabilisation");

      // Step 8: DCF Comptabilise & Transmits to Trésorerie
      dossier.new_status = 100; // Transit Trésorerie
      
      let tresoNotifs = generateNotifications([dossier], "Tresorerie", "");
      expect(tresoNotifs).toHaveLength(1);
      expect(tresoNotifs[0].message).toContain("attente d'accusé");

      // Step 9: Trésorerie Accuses
      dossier.new_status = 110; // Chez Trésorerie (En attente de règlement)
      
      tresoNotifs = generateNotifications([dossier], "Tresorerie", "");
      expect(tresoNotifs).toHaveLength(1);
      expect(tresoNotifs[0].message).toContain("attente de règlement");

      // Step 10: Trésorerie Pays by Virement (State becomes 150)
      dossier.new_status = 150;
      dossier.new_payment_method = 2; // Virement
      dossier.new_date_virement = "2026-07-29";
      dossier.new_compte_bancaire_dest = "123456789012345678901234";

      // Trésorerie and DCF have no notifications left for this folder
      expect(generateNotifications([dossier], "Tresorerie", "")).toHaveLength(0);
      expect(generateNotifications([dossier], "DCF", "")).toHaveLength(0);

      // BO receives notification informing that Virement is completed
      boNotifs = generateNotifications([dossier], "BO", "");
      expect(boNotifs).toHaveLength(1);
      expect(boNotifs[0].message).toBe("Dossier réglé par virement bancaire");
    });
  });

  describe("2. Facture Standard (100) - Flow with Chèque Payment & Agence Delivery", () => {
    it("should process flow to paid status via Chèque transit and remittance", () => {
      let dossier: Dossier = {
        new_folderid: "folder-cheque",
        new_folder_number: "DOS-2026-9002",
        new_document_type: 100,
        new_status: 110, // Arrived at Trésorerie step
        new_reception_date: "2026-07-28T00:00:00Z"
      };

      // Step 1: Trésorerie pays by Chèque
      dossier.new_status = 120; // Prêt Remise
      dossier.new_payment_method = 1; // Chèque
      dossier.new_cheque_number = "CHQ-1002";
      dossier.new_cheque_recu_bo = false;

      // BO should see notification for Cheque Accuse Receipt
      let boNotifs = generateNotifications([dossier], "BO", "");
      expect(boNotifs).toHaveLength(1);
      expect(boNotifs[0].message).toContain("Chèque en attente d'accusé de réception");

      // Step 2: BO Accuses receipt of physical cheque
      dossier.new_cheque_recu_bo = true;

      // BO should now see notification to Dispatch the cheque
      boNotifs = generateNotifications([dossier], "BO", "");
      expect(boNotifs).toHaveLength(1);
      expect(boNotifs[0].message).toContain("Chèque en attente d'expédition ou remise");

      // Step 3: BO Dispatches cheque via delivery driver to Agence (Tanger)
      dossier.new_status = 130; // Chèque en transit
      dossier.new_destination_branch_id = "Tanger";
      dossier.new_livreur_nom = "Chauffeur Amine";

      // Tanger Agence receives notification of transit cheque
      let agenceNotifs = generateNotifications([dossier], "Agence", "Tanger");
      expect(agenceNotifs).toHaveLength(1);
      expect(agenceNotifs[0].message).toContain("Chèque en transit");

      // Another Agence (e.g. Marrakech) should not see it
      expect(generateNotifications([dossier], "Agence", "Marrakech")).toHaveLength(0);

      // Step 4: Tanger Agence Accuses receipt of the cheque
      dossier.new_status = 140; // Chèque Disponible

      agenceNotifs = generateNotifications([dossier], "Agence", "Tanger");
      expect(agenceNotifs).toHaveLength(1);
      expect(agenceNotifs[0].message).toContain("Chèque en attente de remise fournisseur");

      // Step 5: Tanger Agence remits cheque to the Supplier (Paid)
      dossier.new_status = 150; // Paid

      // Workflow ends, no more notifications
      expect(generateNotifications([dossier], "Agence", "Tanger")).toHaveLength(0);
      expect(generateNotifications([dossier], "BO", "")).toHaveLength(0);
    });
  });

  describe("3. Flux Court (400) / Acompte (500) - Fast Flow", () => {
    it("should skip Prescripteur and route directly to DCF", () => {
      // Step 1: Create Acompte (500)
      let dossier: Dossier = {
        new_folderid: "folder-acompte",
        new_folder_number: "DOS-2026-9003",
        new_document_type: 500, // Acompte
        new_status: 10,
        new_reception_date: "2026-07-28T00:00:00Z"
      };

      // Step 2: Transmit -> Skips Prescripteur, goes straight to DCF (70)
      dossier.new_status = 70; // Transit DCF

      // Prescripteur receives nothing
      expect(generateNotifications([dossier], "Prescripteur", "")).toHaveLength(0);

      // DCF receives Transit notification
      let dcfNotifs = generateNotifications([dossier], "DCF", "");
      expect(dcfNotifs).toHaveLength(1);
      expect(dcfNotifs[0].message).toContain("attente d'accusé");
    });
  });

  describe("4. Courrier (600) - Direct Delivery Flow", () => {
    it("should go straight to closed status (150) on transmission", () => {
      let dossier: Dossier = {
        new_folderid: "folder-courrier",
        new_folder_number: "DOS-2026-9004",
        new_document_type: 600, // Courrier
        new_status: 150, // Directly 150 upon transmission
        new_reception_date: "2026-07-28T00:00:00Z"
      };

      // No roles receive any notification because it is completed instantly
      expect(generateNotifications([dossier], "BO", "")).toHaveLength(0);
      expect(generateNotifications([dossier], "Prescripteur", "")).toHaveLength(0);
      expect(generateNotifications([dossier], "DCF", "")).toHaveLength(0);
      expect(generateNotifications([dossier], "Tresorerie", "")).toHaveLength(0);
    });
  });

  describe("5. Hors Délai (Late Submissions) Rule", () => {
    it("should block Facture if days difference > 5", () => {
      const dateFacture = "2026-07-20T00:00:00Z";
      const dateReceptionLate = "2026-07-27T00:00:00Z"; // 7 days difference (> 5)
      const dateReceptionOntime = "2026-07-23T00:00:00Z"; // 3 days difference (<= 5)

      expect(isInvoiceLate(dateReceptionLate, dateFacture)).toBe(true);
      expect(isInvoiceLate(dateReceptionOntime, dateFacture)).toBe(false);
    });
  });
});
