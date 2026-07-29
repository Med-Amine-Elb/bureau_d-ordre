import { describe, it, expect } from "vitest";

import {
  mapCrmPaymentMethodToFrontend,
  mapFrontendPaymentMethodToCrm,
  mapCrmDocumentTypeToFrontend,
  mapFrontendDocumentTypeToCrm,
  mapCrmEntityToDossier,
  mapDossierToCrmEntity
} from "./dataService";
import type { Dossier } from "./dataService";

describe("Dataverse Mappings and OptionSets", () => {
  describe("Payment Method optionSets", () => {
    it("should map CRM payment optionSets to frontend numbers", () => {
      expect(mapCrmPaymentMethodToFrontend(871840000)).toBe(1); // Chèque
      expect(mapCrmPaymentMethodToFrontend(871840001)).toBe(2); // Virement
      expect(mapCrmPaymentMethodToFrontend(null)).toBeUndefined();
      expect(mapCrmPaymentMethodToFrontend(undefined)).toBeUndefined();
      expect(mapCrmPaymentMethodToFrontend(999999999)).toBeUndefined();
    });

    it("should map frontend payment numbers to CRM optionSets", () => {
      expect(mapFrontendPaymentMethodToCrm(1)).toBe(871840000); // Chèque
      expect(mapFrontendPaymentMethodToCrm(2)).toBe(871840001); // Virement
      expect(mapFrontendPaymentMethodToCrm(null)).toBeUndefined();
      expect(mapFrontendPaymentMethodToCrm(undefined)).toBeUndefined();
      expect(mapFrontendPaymentMethodToCrm(3)).toBeUndefined();
    });
  });

  describe("Document Type optionSets", () => {
    it("should map CRM document types to frontend codes", () => {
      expect(mapCrmDocumentTypeToFrontend(871840000)).toBe(100); // Facture
      expect(mapCrmDocumentTypeToFrontend(871840001)).toBe(200); // Avoir
      expect(mapCrmDocumentTypeToFrontend(871840002)).toBe(500); // Acompte
      expect(mapCrmDocumentTypeToFrontend(871840003)).toBe(600); // Courrier
      expect(mapCrmDocumentTypeToFrontend(999)).toBe(100); // Default to Facture
    });

    it("should map frontend document codes to CRM types", () => {
      expect(mapFrontendDocumentTypeToCrm(100)).toBe(871840000); // Facture
      expect(mapFrontendDocumentTypeToCrm(200)).toBe(871840001); // Avoir
      expect(mapFrontendDocumentTypeToCrm(400)).toBe(871840000); // Flux Court (Facture)
      expect(mapFrontendDocumentTypeToCrm(500)).toBe(871840002); // Acompte
      expect(mapFrontendDocumentTypeToCrm(600)).toBe(871840003); // Courrier
    });
  });

  describe("mapCrmEntityToDossier & mapDossierToCrmEntity mapping", () => {
    it("should map a complete CRM entity to a Dossier model object", () => {
      const entity = {
        new_folderid: "test-guid-123",
        new_folder_number: "DOS-2026-0001",
        new_documenttype: 871840000,
        new_status: 120,
        new_paymentmethod: 871840001,
        new_chequenumber: "CHQ-9876",
        new_wirereference: "WIRE-REF-55",
        new_chequepreparationdate: "2026-07-28T00:00:00Z",
        new_date_virement: "2026-07-28",
        new_compte_bancaire_dest: "123456789012345678901234",
        new_banque_emettrice: "BMCE",
        new_treasury_comment: "Virement urgent",
        new_cheque_received_bo: true,
        new_delivery_person: "Chauffeur Amine",
        new_delivery_date: "2026-07-28T00:00:00Z",
        _new_destinationbranch_value: "branch-guid",
        "_new_destinationbranch_value@OData.Community.Display.V1.FormattedValue": "Casa Anfa"
      };

      const dossier = mapCrmEntityToDossier(entity);

      expect(dossier.new_folderid).toBe("test-guid-123");
      expect(dossier.new_folder_number).toBe("DOS-2026-0001");
      expect(dossier.new_document_type).toBe(100);
      expect(dossier.new_status).toBe(120);
      expect(dossier.new_payment_method).toBe(2); // Virement
      expect(dossier.new_cheque_number).toBe("CHQ-9876");
      expect(dossier.new_wire_reference).toBe("WIRE-REF-55");
      expect(dossier.new_date_virement).toBe("2026-07-28");
      expect(dossier.new_compte_bancaire_dest).toBe("123456789012345678901234");
      expect(dossier.new_banque_emettrice).toBe("BMCE");
      expect(dossier.new_commentaire_treso).toBe("Virement urgent");
      expect(dossier.new_cheque_recu_bo).toBe(true);
      expect(dossier.new_livreur_nom).toBe("Chauffeur Amine");
      expect(dossier.new_date_livraison).toBe("2026-07-28T00:00:00Z");
      expect(dossier.new_destination_branch_id).toBe("Casa Anfa");
    });

    it("should map a partial Dossier model object back to a CRM payload", () => {
      const dossier: Partial<Dossier> = {
        new_status: 150,
        new_payment_method: 2,
        new_date_virement: "2026-07-29",
        new_compte_bancaire_dest: "24-digits-rib",
        new_commentaire_treso: "Commentaire tresorier"
      };

      const entity = mapDossierToCrmEntity(dossier);

      expect(entity.new_status).toBe(150);
      expect(entity.new_paymentmethod).toBe(871840001); // Virement
      expect(entity.new_date_virement).toBe("2026-07-29");
      expect(entity.new_compte_bancaire_dest).toBe("24-digits-rib");
      expect(entity.new_treasury_comment).toBe("Commentaire tresorier");
    });
  });
});
