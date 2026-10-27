import { getDossierAuditStepLabel } from "@/lib/auditStepLabels";
import type { Dossier } from "@/lib/dataService";

export type DossierAuditEventType =
  | "DossierCreated"
  | "DossierUpdated"
  | "DossierTransmitted"
  | "ReceiptConfirmed"
  | "DossierValidated"
  | "ReturnedforCorrection"
  | "CorrectionSubmitted"
  | "AccountingCompleted"
  | "PaymentRecorded"
  | "CheckPrepared"
  | "CheckSenttoOrderOffice"
  | "CheckReceivedbyOrderOffice"
  | "HandedtoSupplier"
  | "DossierClosed"
  | "BlockRemoved"
  | "DossierBlocked"
  | "ReminderSent"
  | "DossierArchived";

export interface DossierAuditDraft {
  type: DossierAuditEventType;
  title: string;
  description: string;
  reason?: string;
  previousStatus?: number;
  newStatus?: number;
  relatedReference?: string;
}

export interface DossierAuditSnapshot {
  status?: number;
  isBlocked?: boolean;
  documentType?: number;
  accountingCompleted?: boolean;
  checkReceived?: boolean;
  supplierSigned?: boolean;
  chequeNumber?: string;
  chequePreparationDate?: string;
  wireReference?: string;
  wireDate?: string;
}

const STATUS_EVENT_TYPES: Record<number, DossierAuditEventType> = {
  30: "DossierTransmitted",
  40: "ReceiptConfirmed",
  50: "DossierValidated",
  60: "ReceiptConfirmed",
  70: "DossierTransmitted",
  80: "ReceiptConfirmed",
  90: "ReturnedforCorrection",
  100: "DossierTransmitted",
  110: "ReceiptConfirmed",
  120: "CheckPrepared",
  130: "DossierTransmitted",
  140: "ReceiptConfirmed",
  170: "DossierClosed",
};

export function buildDossierAuditDrafts(
  dossier: Partial<Dossier>,
  previous: DossierAuditSnapshot = {},
): DossierAuditDraft[] {
  const nextStatus = typeof dossier.new_status === "number" ? dossier.new_status : undefined;
  const statusChanged = nextStatus !== undefined && previous.status !== undefined && nextStatus !== previous.status;
  const reason = dossier.new_return_reason
    || dossier.new_motif_retour
    || dossier.new_motif_blocage
    || dossier.new_resolution_blocage
    || dossier.new_commentaire_treso
    || dossier.new_commentaire_agence
    || dossier.new_commentaire_reception
    || dossier.new_description;
  const relatedReference = dossier.new_wire_reference
    || dossier.new_cheque_number
    || dossier.new_invoice_number
    || dossier.new_po_number
    || (dossier.new_status === 130 ? dossier.new_destination_branch_id : undefined);
  const base = { previousStatus: previous.status, newStatus: nextStatus, reason, relatedReference };

  if (dossier.new_is_blocked === true && previous.isBlocked !== true) {
    return [{ ...base, type: "DossierBlocked", title: "Dossier bloqué", description: "Le dossier a été bloqué." }];
  }
  if (dossier.new_is_blocked === false && previous.isBlocked === true) {
    return [{ ...base, type: "BlockRemoved", title: "Blocage levé", description: "Le blocage du dossier a été levé." }];
  }
  if (dossier.new_est_comptabilise === true && previous.accountingCompleted !== true) {
    return [{ ...base, type: "AccountingCompleted", title: "Comptabilisation terminée", description: "Le dossier a été marqué comme comptabilisé." }];
  }
  if (dossier.new_cheque_recu_bo === true && previous.checkReceived !== true) {
    return [{ ...base, type: "CheckReceivedbyOrderOffice", title: "Chèque reçu au Bureau d’ordre", description: "La réception du chèque au Bureau d’ordre a été confirmée." }];
  }
  if ((dossier.new_fournisseur_signe === true || dossier.new_supplier_signed === true) && previous.supplierSigned !== true) {
    return [
      { ...base, type: "HandedtoSupplier", title: "Remis au fournisseur", description: "La remise au fournisseur a été confirmée." },
      ...(nextStatus === 150 ? [{ ...base, type: "DossierClosed" as const, title: "Dossier clôturé", description: "Le dossier a été clôturé après remise." }] : []),
    ];
  }

  if (statusChanged && nextStatus !== undefined) {
    if (nextStatus === 10 && previous.status === 90) {
      return [{
        ...base,
        reason: undefined,
        type: "DossierUpdated",
        title: "Correction traitée — retour au Bureau d’ordre",
        description: "Le Bureau d’ordre a enregistré les corrections. Le dossier est prêt pour vérification et nouvelle transmission.",
      }];
    }
    if (nextStatus === 140) {
      return [{
        ...base,
        type: "ReceiptConfirmed",
        title: "Chèque reçu par l’agence",
        description: `L’agence ${dossier.new_destination_branch_id || "de destination"} a confirmé la réception physique du chèque.`,
      }];
    }
    if (nextStatus === 50 && previous.status === 90) {
      return [{ ...base, type: "CorrectionSubmitted", title: getDossierAuditStepLabel(nextStatus), description: "Le dossier corrigé a été validé et renvoyé au Bureau d’ordre." }];
    }
    if (nextStatus === 150) {
      const isTransfer = dossier.new_payment_method === 2
        || dossier.new_date_virement !== undefined
        || dossier.new_wire_reference !== undefined;
      const isCourier = previous.documentType === 600;
      const completion: DossierAuditDraft[] = isTransfer
        ? [{ ...base, type: "PaymentRecorded", title: "Virement enregistré", description: "Le virement a été enregistré et le dossier marqué payé." }]
        : isCourier
          ? [{ ...base, type: "DossierClosed", title: "Courrier livré et dossier clôturé", description: "La livraison du courrier a été confirmée." }]
          : [{ ...base, type: "HandedtoSupplier", title: "Remis au fournisseur", description: "La remise du chèque au fournisseur a été enregistrée." }];
      if (completion[0].type !== "DossierClosed") {
        completion.push({ ...base, type: "DossierClosed", title: "Dossier clôturé", description: "Le dossier a atteint le statut clôturé." });
      }
      return completion;
    }
    if (nextStatus === 120) {
      return [
        { ...base, type: "CheckPrepared", title: "Chèque préparé", description: "Le chèque a été préparé par la Trésorerie.", relatedReference: dossier.new_cheque_number || relatedReference },
        { ...base, type: "CheckSenttoOrderOffice", title: "Chèque transmis au Bureau d’ordre", description: "Le chèque préparé a été transmis au Bureau d’ordre.", relatedReference: dossier.new_cheque_number || relatedReference },
      ];
    }
    const type = STATUS_EVENT_TYPES[nextStatus] ?? "DossierUpdated";
    if (type === "DossierValidated") {
      return [{ ...base, type, title: getDossierAuditStepLabel(nextStatus), description: "La validation du prescripteur a été enregistrée et le dossier renvoyé au Bureau d’ordre." }];
    }
    return [{
      ...base,
      type,
      title: getDossierAuditStepLabel(nextStatus),
      description: `Le dossier est passé à l’étape « ${getDossierAuditStepLabel(nextStatus)} »${reason ? ` — ${reason}` : "."}`,
    }];
  }

  if ((dossier.new_cheque_preparation_date !== undefined && dossier.new_cheque_preparation_date !== previous.chequePreparationDate)
    || (dossier.new_cheque_number !== undefined && dossier.new_cheque_number !== previous.chequeNumber)) {
    return [{ ...base, type: "CheckPrepared", title: "Chèque préparé", description: "Les informations de préparation du chèque ont été enregistrées." }];
  }
  if ((dossier.new_date_virement !== undefined && dossier.new_date_virement !== previous.wireDate)
    || (dossier.new_wire_reference !== undefined && dossier.new_wire_reference !== previous.wireReference)) {
    return [{ ...base, type: "PaymentRecorded", title: "Règlement enregistré", description: "Les informations du virement ont été enregistrées." }];
  }
  return [{ ...base, type: "DossierUpdated", title: "Dossier mis à jour", description: "Les informations du dossier ont été modifiées." }];
}
