// Ce service fait le pont entre l'application React et Dataverse.
// Il utilise exclusivement les services officiels générés par PAC CLI.

import { New_foldersService } from '../generated/services/New_foldersService';
import { New_suppliersService } from '../generated/services/New_suppliersService';
import { New_branchsService } from '../generated/services/New_branchsService';
import { SystemusersService } from '../generated/services/SystemusersService';
import { New_companiesService } from '../generated/services/New_companiesService';
import { New_departementsService } from '../generated/services/New_departementsService';
import { New_transmissionsService } from '../generated/services/New_transmissionsService';
import { New_dossierauditeventsService } from '../generated/services/New_dossierauditeventsService';
import { New_reminderconfigurationsService } from '../generated/services/New_reminderconfigurationsService';
import type {
  New_dossierauditevents,
  New_dossierauditeventsBase,
  New_dossierauditeventsnew_actorrole,
  New_dossierauditeventsnew_channel,
  New_dossierauditeventsnew_eventtype,
  New_dossierauditeventsnew_fromrole,
  New_dossierauditeventsnew_newstatus,
  New_dossierauditeventsnew_previousstatus,
  New_dossierauditeventsnew_torole,
} from '../generated/models/New_dossierauditeventsModel';
import type {
  New_transmissions,
  New_transmissionsBase,
  New_transmissionsnew_fromrole,
  New_transmissionsnew_torole,
  New_transmissionsnew_transmissionstatus,
} from '../generated/models/New_transmissionsModel';
import { getContext } from '@microsoft/power-apps/app';
import { companyRecord, departmentRecord, supplierRecord } from './referenceForms';
import type { CompanyInput, DepartmentInput, SupplierInput } from './referenceForms';
import { buildDossierAuditDrafts, type DossierAuditDraft, type DossierAuditEventType, type DossierAuditSnapshot } from './auditEvents';
import { getDossierAuditStepLabel } from './auditStepLabels';
export type { CompanyInput, DepartmentInput, SupplierInput } from './referenceForms';

const getXrm = (): any => {
  if (typeof window === "undefined") return null;
  if ((window as any).Xrm) return (window as any).Xrm;
  try {
    if (window.parent && (window.parent as any).Xrm) {
      return (window.parent as any).Xrm;
    }
  } catch (e) {
    // Ignore cross-origin frame access restriction
  }
  return null;
};

export const isCrmMode = (): boolean => {
  return typeof window !== "undefined" && (!!getXrm() || (window as any).__vite_powerapps_plugin__ !== undefined);
};

export interface Dossier {
  new_folderid: string;
  new_folder_number: string;
  modifiedon?: string;
  new_document_type: number;
  new_status: number;
  new_supplier_id?: string;
  new_company_id?: string;
  new_department_id?: string;
  new_prescriber_id?: string;
  new_dcf_collector_id?: string;
  new_supplier_guid?: string;
  new_company_guid?: string;
  new_department_guid?: string;
  new_prescriber_guid?: string;
  new_dcf_collector_guid?: string;
  new_destination_branch_guid?: string;
  new_invoice_number?: string;
  new_po_number?: string;
  new_invoice_date?: string;
  new_description?: string;
  new_reception_date: string;
  new_is_blocked?: boolean;

  // Additional tracking columns
  new_date_accuse?: string;
  new_accuse_par?: string;
  new_date_accuse_prescripteur?: string;
  new_date_val_prescripteur?: string;
  new_date_accuse_dcf?: string;
  new_date_val_dcf?: string;

  // Action history details
  new_transmission_comment_bo?: string;
  new_validation_comment_prescriber?: string;
  new_rectification_comment_dcf?: string;
  new_accounting_date?: string;

  // Treasury specific columns
  new_payment_method?: number;
  new_cheque_number?: string;
  new_wire_reference?: string;
  new_cheque_preparation_date?: string;
  new_final_delivery_date?: string;
  new_cheque_recu_bo?: boolean;
  new_reception_comment?: string;

  // Delivery / Agence columns
  new_delivery_date?: string;
  new_delivery_person?: string;
  new_signed_receipt_url?: string;
  new_supplier_signed?: boolean;
  new_commentaire_agence?: string;
  new_person_to_deliver?: string;

  // Alerts, reason, links
  new_return_reason?: string;
  new_sharepoint_url?: string;
  new_cancellation_reason?: string;
  new_cancellation_status?: number;
  new_advance_phase?: number;
  new_last_alert_date?: string;
  new_linked_folder_id?: string;
  new_treasury_comment?: string;
  new_collecteur_treso?: string;

  // React Pages Required Fields
  new_destination_branch_id?: string;
  new_reception_date_agence?: string;
  new_date_trans_prescripteur?: string;
  new_date_retour_bo?: string;
  new_date_trans_dcf?: string;
  new_fournisseur_signe?: boolean;
  new_recu_signe_scan?: string;
  new_personne_a_livrer?: string;
  new_commentaire_treso?: string;
  new_banque_emettrice?: string;
  new_date_virement?: string;
  new_compte_bancaire_dest?: string;
  new_resolution_blocage?: string;
  new_date_deblocage?: string;
  new_source_blocage?: string;
  new_motif_blocage?: string;
  new_livreur_nom?: string;
  new_date_livraison?: string;
  new_documents_complements?: string[];
  new_est_comptabilise?: boolean;
  new_motif_retour?: string;
  new_commentaire_reception?: string;
  new_date_transmission_bo?: string;
}

export interface SystemUser {
  systemuserid: string;
  fullname: string;
  internalemailaddress: string;
  new_role: string; // BO, Prescripteur, DCF, Tresorerie, Agence, Admin
  new_destination_branch_id?: string;
  new_status: string; // Actif, Inactif
  new_derniere_connexion?: string;
  new_department_id?: string;
}

export interface ReferenceAudit {
  createdon?: string;
  modifiedon?: string;
}

export interface FournisseurLookup extends ReferenceAudit {
  new_supplierid: string;
  new_name: string;
  new_code: string;
  new_is_active: boolean;
  new_address?: string;
  new_city?: string;
  new_email?: string;
  new_phone?: string;
  new_branch_id?: string;
  new_branch_name?: string;
}

export interface AgenceLookup {
  new_branchid: string;
  new_name: string;
  new_city: string;
  new_is_active: boolean;
}

export interface CompanyLookup extends ReferenceAudit {
  new_companyid: string;
  new_name: string;
  new_code: string;
  new_is_active: boolean;
}

export interface DepartmentLookup extends ReferenceAudit {
  new_departmentid: string;
  new_name: string;
  new_code: string;
  new_is_active: boolean;
  new_company_id?: string;
  new_company_name?: string;
}

export interface SystemConfig {
  new_reminderconfigurationid: string;
  new_remindersenabled: boolean;
  new_initialdelaydays: number;
  new_repeatintervaldays: number;
  new_invoicereceiptlimitdays: number;
}

export type TransmissionRole = "BO" | "Prescripteur" | "DCF" | "Trésorerie" | "Agence" | "Admin";

export interface DossierTransmission extends New_transmissions {
  new_fromrole_label?: string;
  new_torole_label?: string;
}

export interface DossierAuditEvent extends New_dossierauditevents {
  eventTypeLabel?: string;
  actorRoleLabel?: string;
  fromRoleLabel?: string;
  toRoleLabel?: string;
  actorLabel?: string;
  recipientLabel?: string;
  previousStatusLabel?: string;
  newStatusLabel?: string;
}

export interface DossierCorrectionInfo {
  eventDate?: string;
  reason?: string;
  actorRoleLabel?: string;
  actorLabel?: string;
}

const TRANSMISSION_ROLE_CODES: Record<TransmissionRole, number> = {
  BO: 871840000,
  Prescripteur: 871840001,
  DCF: 871840002,
  "Trésorerie": 871840003,
  Agence: 871840004,
  Admin: 871840005,
};

const TRANSMISSION_AUDIT_STEP_LABELS: Record<TransmissionRole, string> = {
  BO: "En transit vers BO",
  Prescripteur: "En transit vers prescripteur",
  DCF: "En transit vers DCF",
  "Trésorerie": "En transit vers trésorerie",
  Agence: "En transport vers agence",
  Admin: "Dossier transmis",
};

const RECEIPT_ROLE_BY_STATUS: Partial<Record<number, TransmissionRole>> = {
  40: "Prescripteur",
  60: "BO",
  80: "DCF",
  110: "Trésorerie",
  140: "Agence",
};

const AUDIT_EVENT_TYPE_CODES: Record<DossierAuditEventType, number> = {
  DossierCreated: 871840000,
  DossierUpdated: 871840001,
  DossierTransmitted: 871840002,
  ReceiptConfirmed: 871840003,
  DossierValidated: 871840004,
  ReturnedforCorrection: 871840005,
  CorrectionSubmitted: 871840006,
  AccountingCompleted: 871840007,
  PaymentRecorded: 871840008,
  CheckPrepared: 871840009,
  CheckSenttoOrderOffice: 871840010,
  CheckReceivedbyOrderOffice: 871840011,
  HandedtoSupplier: 871840012,
  DossierClosed: 871840013,
  BlockRemoved: 871840014,
  ReminderSent: 871840015,
  DossierArchived: 871840016,
  DossierBlocked: 871840017,
};

const getCurrentAuditRole = (): TransmissionRole | undefined => {
  if (typeof window === "undefined") return undefined;
  const storedRole = window.localStorage.getItem("userRole");
  if (storedRole === "BO" || storedRole === "Prescripteur" || storedRole === "DCF" || storedRole === "Trésorerie" || storedRole === "Agence" || storedRole === "Admin") {
    return storedRole;
  }
  const route = `${window.location.pathname}${window.location.hash}`.toLowerCase();
  if (route.includes("/prescripteur/")) return "Prescripteur";
  if (route.includes("/tresorerie/")) return "Trésorerie";
  if (route.includes("/agence/")) return "Agence";
  if (route.includes("/dcf/")) return "DCF";
  if (route.includes("/admin/")) return "Admin";
  if (route.includes("/bo/")) return "BO";
  return undefined;
};

const notifyAuditWriteFailure = (folderNumber: string, error: unknown): void => {
  console.error("Dossier saved but its audit event could not be written:", error);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dossier-audit-write-failed", { detail: { folderNumber } }));
  }
};

const isGuid = (value: string | undefined): value is string =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const inferAuditRoutingContext = (
  status: number | undefined,
  dossier: Partial<Dossier>,
  actorRole: TransmissionRole | undefined,
  eventType?: DossierAuditEventType,
): Pick<AuditWriteContext, "fromRole" | "toRole" | "recipientId"> => {
  if (eventType === "CheckSenttoOrderOffice") return { fromRole: actorRole, toRole: "BO" };
  if (eventType === "CheckReceivedbyOrderOffice") return { fromRole: "Trésorerie", toRole: "BO" };
  const targetByStatus: Partial<Record<number, TransmissionRole>> = {
    30: "Prescripteur",
    50: "BO",
    70: "DCF",
    100: "Trésorerie",
    130: "Agence",
  };
  const toRole = status === 90 || status === 50 ? "BO" : (status === undefined ? undefined : targetByStatus[status]);
  if (!toRole) return {};

  const recipientId = toRole === "Prescripteur"
    ? dossier.new_prescriber_guid || dossier.new_prescriber_id
    : toRole === "DCF"
      ? dossier.new_dcf_collector_guid || dossier.new_dcf_collector_id
      : toRole === "Trésorerie"
        ? dossier.new_collecteur_treso
        : undefined;
  return { fromRole: actorRole, toRole, ...(isGuid(recipientId) ? { recipientId } : {}) };
};

const getCurrentSystemUserId = async (): Promise<string> => {
  const xrm = getXrm();
  const xrmUserId = xrm?.Utility?.getGlobalContext?.()?.userSettings?.userId?.replace(/[{}]/g, "");
  if (isGuid(xrmUserId)) return xrmUserId;

  try {
    const context = await getContext();
    const entraObjectId = context.user.objectId?.replace(/[{}]/g, "");
    if (isGuid(entraObjectId)) {
      const result = await SystemusersService.getAll({
        filter: `azureactivedirectoryobjectid eq ${entraObjectId}`,
        select: ["systemuserid", "azureactivedirectoryobjectid"],
        top: 2,
      });
      const systemUserId = result.data?.[0]?.systemuserid;
      if (!result.error && isGuid(systemUserId)) return systemUserId;
    }
  } catch {
    // Local Play may expose the Dataverse user only through Xrm.
  }
  throw new Error("Impossible de retrouver votre utilisateur Dataverse (systemuserid) à partir de votre compte Power Apps.");
};

const getDataverseErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Erreur Dataverse sans détail retourné.";
};

const createTransmissionRecord = async (input: {
  folderId: string;
  folderNumber: string;
  fromRole: TransmissionRole;
  toRole: TransmissionRole;
  collectorId: string;
  sendingComment?: string;
  branchId?: string;
}, senderId: string): Promise<void> => {
  const record = {
    new_transmissionname: `${input.folderNumber} — ${input.fromRole} → ${input.toRole}`,
    "new_Folder@odata.bind": `/new_folders(${input.folderId})`,
    "new_SentBy@odata.bind": `/systemusers(${senderId})`,
    "new_Collector@odata.bind": `/systemusers(${input.collectorId})`,
    new_fromrole: TRANSMISSION_ROLE_CODES[input.fromRole] as New_transmissionsnew_fromrole,
    new_torole: TRANSMISSION_ROLE_CODES[input.toRole] as New_transmissionsnew_torole,
    new_transmissiondate: new Date().toISOString(),
    new_transmissionstatus: 871840000 as New_transmissionsnew_transmissionstatus,
    ...(input.sendingComment ? { new_sendingcomment: input.sendingComment } : {}),
    ...(input.branchId ? { "new_Branch@odata.bind": `/new_branchs(${input.branchId})` } : {}),
  } as Omit<New_transmissionsBase, "new_transmissionid">;
  const result = await New_transmissionsService.create(record);
  if (result.error) {
    throw new Error(`Création de la transmission refusée par Dataverse : ${getDataverseErrorMessage(result.error)}`);
  }
};

interface AuditWriteContext {
  actorRole?: TransmissionRole;
  fromRole?: TransmissionRole;
  toRole?: TransmissionRole;
  recipientId?: string;
  suppressAudit?: boolean;
}

const createDossierAuditEventRecord = async (input: {
  folderId: string;
  folderNumber: string;
  draft: DossierAuditDraft;
  context?: AuditWriteContext;
}): Promise<void> => {
  const actorId = await getCurrentSystemUserId();
  const actorRole = input.context?.actorRole ?? getCurrentAuditRole();
  if (!actorRole) throw new Error("Impossible de déterminer le rôle actif pour le journal d’audit.");
  const recipientId = input.context?.recipientId
    ?? (input.draft.type === "ReceiptConfirmed" || input.draft.type === "DossierCreated" ? actorId : undefined);

  const record = {
    new_newcolumn: `${input.folderNumber} — ${input.draft.title}`.slice(0, 850),
    new_eventname: input.draft.description.slice(0, 100),
    new_eventdate: new Date().toISOString(),
    new_eventtype: AUDIT_EVENT_TYPE_CODES[input.draft.type] as New_dossierauditeventsnew_eventtype,
    new_actorrole: TRANSMISSION_ROLE_CODES[actorRole] as New_dossierauditeventsnew_actorrole,
    new_channel: 871840000 as New_dossierauditeventsnew_channel,
    "new_Dossier@odata.bind": `/new_folders(${input.folderId})`,
    "new_Actor@odata.bind": `/systemusers(${actorId})`,
    ...(input.draft.previousStatus !== undefined ? { new_previousstatus: input.draft.previousStatus as New_dossierauditeventsnew_previousstatus } : {}),
    ...(input.draft.newStatus !== undefined ? { new_newstatus: input.draft.newStatus as New_dossierauditeventsnew_newstatus } : {}),
    ...(input.draft.reason ? { new_reason: input.draft.reason.slice(0, 2000) } : {}),
    ...(input.draft.relatedReference ? { new_relatedreference: input.draft.relatedReference.slice(0, 450) } : {}),
    ...(input.context?.fromRole ? { new_fromrole: TRANSMISSION_ROLE_CODES[input.context.fromRole] as New_dossierauditeventsnew_fromrole } : {}),
    ...(input.context?.toRole ? { new_torole: TRANSMISSION_ROLE_CODES[input.context.toRole] as New_dossierauditeventsnew_torole } : {}),
    ...(isGuid(recipientId) ? { "new_Recipient@odata.bind": `/systemusers(${recipientId})` } : {}),
  } as Omit<New_dossierauditeventsBase, "new_dossierauditeventid">;

  const result = await New_dossierauditeventsService.create(record);
  if (result.error) {
    throw new Error(`Création de l’événement d’audit refusée par Dataverse : ${getDataverseErrorMessage(result.error)}`);
  }
};

export const mapCrmDocumentTypeToFrontend = (crmVal: number): number => {
  switch (crmVal) {
    case 871840000: return 100; // Facture
    case 871840001: return 200; // Avoir
    case 871840002: return 500; // Acompte (also acts as 500 in frontend)
    case 871840003: return 600; // Courrier
    default: return 100;
  }
};

export const mapFrontendDocumentTypeToCrm = (frontVal: number): number => {
  switch (frontVal) {
    case 100: return 871840000; // Facture
    case 200: return 871840001; // Avoir
    case 400: return 871840000; // Flux Court (Facture) -> Maps to Facture in CRM
    case 500: return 871840002; // Acompte -> Maps to Acompte in CRM
    case 600: return 871840003; // Courrier -> Maps to Courrier in CRM
    default: return 871840000;
  }
};

export const mapCrmPaymentMethodToFrontend = (crmVal: any): number | undefined => {
  if (crmVal === undefined || crmVal === null) return undefined;
  switch (Number(crmVal)) {
    case 871840000: return 1; // Chèque
    case 871840001: return 2; // Virement
    default: return undefined;
  }
};

export const mapFrontendPaymentMethodToCrm = (frontVal: any): number | undefined => {
  if (frontVal === undefined || frontVal === null) return undefined;
  switch (Number(frontVal)) {
    case 1: return 871840000; // Chèque
    case 2: return 871840001; // Virement
    default: return undefined;
  }
};

export const mapCrmEntityToDossier = (entity: any): Dossier => {
  return {
    new_folderid: entity.new_folderid,
    new_folder_number: entity.new_folder_number,
    modifiedon: entity.modifiedon || undefined,
    new_document_type: mapCrmDocumentTypeToFrontend(entity.new_documenttype || 871840000),
    new_status: entity.new_status || 10,
    new_supplier_id: entity["_new_supplier_id_value@OData.Community.Display.V1.FormattedValue"] || entity._new_supplier_id_value || undefined,
    new_company_id: entity["_new_company_value@OData.Community.Display.V1.FormattedValue"] || entity._new_company_value || undefined,
    new_department_id: entity["_new_department_value@OData.Community.Display.V1.FormattedValue"] || entity._new_department_value || undefined,
    new_prescriber_id: entity["_new_prescripteur_value@OData.Community.Display.V1.FormattedValue"] || entity._new_prescripteur_value || undefined,
    new_dcf_collector_id: entity["_new_dcfcollector_value@OData.Community.Display.V1.FormattedValue"] || entity._new_dcfcollector_value || undefined,
    new_destination_branch_id: entity["_new_destinationbranch_value@OData.Community.Display.V1.FormattedValue"] || entity._new_destinationbranch_value || undefined,
    new_supplier_guid: entity._new_supplier_id_value || undefined,
    new_company_guid: entity._new_company_value || undefined,
    new_department_guid: entity._new_department_value || undefined,
    new_prescriber_guid: entity._new_prescripteur_value || undefined,
    new_dcf_collector_guid: entity._new_dcfcollector_value || undefined,
    new_destination_branch_guid: entity._new_destinationbranch_value || undefined,
    new_invoice_number: entity.new_invoicenumber || undefined,
    new_po_number: entity.new_bcnumber || undefined,
    new_invoice_date: entity.new_invoicedate || undefined,
    new_description: entity.new_description || undefined,
    new_reception_date: entity.new_receptiondate || new Date().toISOString(),
    new_is_blocked: entity.new_isblocked || false,
    new_documents_complements: [],
    new_accuse_par: entity._new_acknowledged_by_id_value || undefined,
    new_date_accuse: entity.new_acknowledgment_date || undefined,
    new_payment_method: mapCrmPaymentMethodToFrontend(entity.new_paymentmethod),
    new_cheque_number: entity.new_chequenumber || undefined,
    new_wire_reference: entity.new_wirereference || undefined,
    new_cheque_preparation_date: entity.new_chequepreparationdate || undefined,
    new_date_virement: entity.new_date_virement || undefined,
    new_compte_bancaire_dest: entity.new_compte_bancaire_dest || undefined,
    new_banque_emettrice: entity.new_banque_emettrice || undefined,
    new_commentaire_treso: entity.new_treasury_comment || undefined,
    new_final_delivery_date: entity.new_finaldeliverydate || undefined,
    new_reception_date_agence: entity.new_delivery_date || undefined,
    new_date_livraison: entity.new_delivery_date || undefined,
    new_livreur_nom: entity.new_delivery_person || undefined,
    new_signed_receipt_url: entity.new_signed_receipt_url || undefined,
    new_supplier_signed: entity.new_supplier_signed || false,
    new_fournisseur_signe: entity.new_supplier_signed || false,
    new_commentaire_agence: entity.new_branch_comment || undefined,
    new_date_trans_prescripteur: entity.new_date_trans_prescriber || undefined,
    new_date_accuse_prescripteur: entity.new_date_accuse_prescriber || undefined,
    new_date_val_prescripteur: entity.new_date_val_prescriber || undefined,
    new_date_retour_bo: entity.new_date_return_bo || undefined,
    new_date_trans_dcf: entity.new_date_trans_dcf || undefined,
    new_date_accuse_dcf: entity.new_date_accuse_dcf || undefined,
    new_date_val_dcf: entity.new_date_val_dcf || undefined,
    new_cheque_recu_bo: entity.new_cheque_received_bo || false,
    new_reception_comment: entity.new_reception_comment || undefined,
    new_date_transmission_bo: entity.new_bo_transmission_date || undefined,
    new_accounting_date: entity.new_accountingdate || undefined,
    new_est_comptabilise: !!entity.new_accountingdate,
    new_collecteur_treso: entity._new_treasury_collector_id_value || undefined,
    new_treasury_comment: entity.new_treasury_comment || undefined,
    new_return_reason: entity.new_return_reason || undefined,
    new_person_to_deliver: entity.new_person_to_deliver || undefined,
    new_personne_a_livrer: entity.new_person_to_deliver || undefined,
    new_sharepoint_url: entity.new_sharepointurl || undefined,
    new_cancellation_reason: entity.new_cancellationstatus || undefined,
    new_advance_phase: entity.new_advancephase || undefined,
    new_last_alert_date: entity.new_lastalertdate || undefined,
    new_linked_folder_id: entity._new_linkedfolder_value || undefined
  };
};

export const mapDossierToCrmEntity = (d: Partial<Dossier>): any => {
  const entity: any = {};

  if (d.new_folder_number !== undefined) entity.new_folder_number = d.new_folder_number;
  if (d.new_document_type !== undefined) entity.new_documenttype = mapFrontendDocumentTypeToCrm(d.new_document_type);
  if (d.new_status !== undefined) entity.new_status = d.new_status;
  if (d.new_invoice_number !== undefined) entity.new_invoicenumber = d.new_invoice_number;
  if (d.new_po_number !== undefined) entity.new_bcnumber = d.new_po_number;
  if (d.new_invoice_date !== undefined) entity.new_invoicedate = d.new_invoice_date;
  if (d.new_description !== undefined) entity.new_description = d.new_description;
  if (d.new_reception_date !== undefined) entity.new_receptiondate = d.new_reception_date;
  if (d.new_is_blocked !== undefined) entity.new_isblocked = d.new_is_blocked;
  if (d.new_payment_method !== undefined) entity.new_paymentmethod = mapFrontendPaymentMethodToCrm(d.new_payment_method);
  if (d.new_cheque_number !== undefined) entity.new_chequenumber = d.new_cheque_number;
  if (d.new_wire_reference !== undefined) entity.new_wirereference = d.new_wire_reference;
  if (d.new_cheque_preparation_date !== undefined) entity.new_chequepreparationdate = d.new_cheque_preparation_date;
  if (d.new_date_virement !== undefined) entity.new_date_virement = d.new_date_virement;
  if (d.new_compte_bancaire_dest !== undefined) entity.new_compte_bancaire_dest = d.new_compte_bancaire_dest;
  if (d.new_banque_emettrice !== undefined) entity.new_banque_emettrice = d.new_banque_emettrice;
  if (d.new_commentaire_treso !== undefined) entity.new_treasury_comment = d.new_commentaire_treso;
  if (d.new_final_delivery_date !== undefined) entity.new_finaldeliverydate = d.new_final_delivery_date;

  if (d.new_reception_date_agence !== undefined) entity.new_delivery_date = d.new_reception_date_agence;
  if (d.new_date_livraison !== undefined) entity.new_delivery_date = d.new_date_livraison;
  if (d.new_livreur_nom !== undefined) entity.new_delivery_person = d.new_livreur_nom;
  if (d.new_signed_receipt_url !== undefined) entity.new_signed_receipt_url = d.new_signed_receipt_url;
  if (d.new_recu_signe_scan !== undefined) entity.new_signed_receipt_url = d.new_recu_signe_scan;
  // Prefer the Dataverse-facing name if a caller supplies both aliases.
  const supplierSigned = d.new_supplier_signed ?? d.new_fournisseur_signe;
  if (supplierSigned !== undefined) entity.new_supplier_signed = supplierSigned;
  if (d.new_commentaire_agence !== undefined) entity.new_branch_comment = d.new_commentaire_agence;

  if (d.new_date_trans_prescripteur !== undefined) entity.new_date_trans_prescriber = d.new_date_trans_prescripteur;
  if (d.new_date_accuse_prescripteur !== undefined) entity.new_date_accuse_prescriber = d.new_date_accuse_prescripteur;
  if (d.new_date_val_prescripteur !== undefined) entity.new_date_val_prescriber = d.new_date_val_prescripteur;
  if (d.new_date_retour_bo !== undefined) entity.new_date_return_bo = d.new_date_retour_bo;
  if (d.new_date_trans_dcf !== undefined) entity.new_date_trans_dcf = d.new_date_trans_dcf;
  if (d.new_date_accuse_dcf !== undefined) entity.new_date_accuse_dcf = d.new_date_accuse_dcf;
  if (d.new_date_val_dcf !== undefined) entity.new_date_val_dcf = d.new_date_val_dcf;

  if (d.new_cheque_recu_bo !== undefined) entity.new_cheque_received_bo = d.new_cheque_recu_bo;
  if (d.new_reception_comment !== undefined) entity.new_reception_comment = d.new_reception_comment;
  if (d.new_date_accuse !== undefined) entity.new_acknowledgment_date = d.new_date_accuse;
  if (d.new_date_transmission_bo !== undefined) entity.new_bo_transmission_date = d.new_date_transmission_bo;

  if (d.new_accounting_date !== undefined) entity.new_accountingdate = d.new_accounting_date;
  if (d.new_est_comptabilise !== undefined) {
    entity.new_accountingdate = d.new_est_comptabilise ? new Date().toISOString() : null;
  }
  if (d.new_treasury_comment !== undefined) entity.new_treasury_comment = d.new_treasury_comment;
  const returnReason = d.new_return_reason ?? d.new_motif_retour ?? d.new_motif_blocage;
  if (returnReason !== undefined) entity.new_return_reason = returnReason;
  const recipient = d.new_person_to_deliver ?? d.new_personne_a_livrer;
  if (recipient !== undefined) entity.new_person_to_deliver = recipient;
  if (d.new_sharepoint_url !== undefined) entity.new_sharepointurl = d.new_sharepoint_url;
  if (d.new_cancellation_reason !== undefined) entity.new_cancellationstatus = d.new_cancellation_reason;
  if (d.new_advance_phase !== undefined) entity.new_advancephase = d.new_advance_phase;
  if (d.new_last_alert_date !== undefined) entity.new_lastalertdate = d.new_last_alert_date;

  // Bind Lookups
  const isGuid = (val: string): boolean => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
  };

  const sup = d.new_supplier_guid || d.new_supplier_id;
  if (sup && isGuid(sup)) {
    entity["new_supplier_id@odata.bind"] = `/new_suppliers(${sup})`;
  }
  const comp = d.new_company_guid || d.new_company_id;
  if (comp && isGuid(comp)) {
    entity["new_Company@odata.bind"] = `/new_companies(${comp})`;
  }
  const dept = d.new_department_guid || d.new_department_id;
  if (dept && isGuid(dept)) {
    entity["new_Department@odata.bind"] = `/new_departements(${dept})`;
  }
  const presc = d.new_prescriber_guid || d.new_prescriber_id;
  if (presc && isGuid(presc)) {
    entity["new_Prescripteur@odata.bind"] = `/systemusers(${presc})`;
  }
  const dcf = d.new_dcf_collector_guid || d.new_dcf_collector_id;
  if (dcf && isGuid(dcf)) {
    entity["new_DCFCollector@odata.bind"] = `/systemusers(${dcf})`;
  }
  const branch = d.new_destination_branch_guid || d.new_destination_branch_id;
  if (branch) {
    if (isGuid(branch)) {
      entity["new_DestinationBranch@odata.bind"] = `/new_branchs(${branch})`;
    } else if (!isCrmMode()) {
      entity._new_destinationbranch_value = branch;
      entity["_new_destinationbranch_value@OData.Community.Display.V1.FormattedValue"] = branch;
    }
  }
  if (d.new_accuse_par && isGuid(d.new_accuse_par)) {
    entity["new_acknowledged_by_id@odata.bind"] = `/systemusers(${d.new_accuse_par})`;
  }
  if (d.new_linked_folder_id && isGuid(d.new_linked_folder_id)) {
    entity["new_LinkedFolder@odata.bind"] = `/new_folders(${d.new_linked_folder_id})`;
  }
  if (d.new_collecteur_treso && isGuid(d.new_collecteur_treso)) {
    entity["new_treasury_collector_id@odata.bind"] = `/systemusers(${d.new_collecteur_treso})`;
  }

  return entity;
};

export const dataService = {
  getLatestCorrectionReturnInfo: async (folderIds: string[]): Promise<Record<string, DossierCorrectionInfo>> => {
    if (folderIds.length === 0) return {};
    const result = await New_dossierauditeventsService.getAll({
      filter: `new_eventtype eq ${AUDIT_EVENT_TYPE_CODES.ReturnedforCorrection}`,
      select: [
        "new_dossierauditeventid", "new_eventdate", "new_eventtype", "new_actorrole", "new_eventname",
        "new_reason", "_new_actor_value", "_new_dossier_value",
      ],
      orderBy: ["new_eventdate desc"],
      top: 5000,
    });
    if (result.error) throw new Error("Impossible de charger les informations des retours de correction.");

    const requestedFolders = new Set(folderIds.map((id) => id.toLowerCase()));
    const infoByFolder: Record<string, DossierCorrectionInfo> = {};
    for (const row of result.data ?? []) {
      const raw = row as New_dossierauditevents & Record<string, unknown>;
      const folderId = String(row._new_dossier_value ?? "").toLowerCase();
      if (!folderId || !requestedFolders.has(folderId) || infoByFolder[folderId]) continue;
      infoByFolder[folderId] = {
        eventDate: row.new_eventdate,
        reason: row.new_reason || row.new_eventname || undefined,
        actorRoleLabel: String(raw["new_actorrole@OData.Community.Display.V1.FormattedValue"] ?? row.new_actorrolename ?? "") || undefined,
        actorLabel: String(raw["_new_actor_value@OData.Community.Display.V1.FormattedValue"] ?? row.new_actorname ?? "") || undefined,
      };
    }
    return infoByFolder;
  },

  getMonthlyReminderCount: async (): Promise<number> => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const result = await New_dossierauditeventsService.getAll({
      filter: `new_eventtype eq ${AUDIT_EVENT_TYPE_CODES.ReminderSent} and new_eventdate ge ${monthStart.toISOString()} and new_eventdate lt ${nextMonthStart.toISOString()}`,
      select: ["new_dossierauditeventid"],
      top: 5000,
    });
    if (result.error) throw new Error("Impossible de charger le nombre de relances du mois.");
    return result.data?.length ?? 0;
  },

  getDossierAuditEvents: async (folderId: string): Promise<DossierAuditEvent[]> => {
    if (!isGuid(folderId)) throw new Error("Identifiant de dossier invalide.");
    const result = await New_dossierauditeventsService.getAll({
      filter: `_new_dossier_value eq ${folderId}`,
      select: [
        "new_dossierauditeventid", "new_newcolumn", "new_eventname", "new_eventdate", "new_eventtype",
        "new_actorrole", "new_previousstatus", "new_newstatus", "new_fromrole", "new_torole", "new_reason",
        "new_relatedreference", "_new_actor_value", "_new_recipient_value", "_new_dossier_value",
      ],
      orderBy: ["new_eventdate asc"],
      top: 1000,
    });
    if (result.error) throw new Error("Impossible de charger le journal d’audit Dataverse.");
    return (result.data ?? []).map((row) => {
      const raw = row as New_dossierauditevents & Record<string, unknown>;
      const formatted = (field: string, fallback?: string) => String(raw[field] ?? fallback ?? "");
      return {
        ...row,
        eventTypeLabel: formatted("new_eventtype@OData.Community.Display.V1.FormattedValue", row.new_eventtypename),
        actorRoleLabel: formatted("new_actorrole@OData.Community.Display.V1.FormattedValue", row.new_actorrolename),
        fromRoleLabel: formatted("new_fromrole@OData.Community.Display.V1.FormattedValue", row.new_fromrolename),
        toRoleLabel: formatted("new_torole@OData.Community.Display.V1.FormattedValue", row.new_torolename),
        actorLabel: formatted("_new_actor_value@OData.Community.Display.V1.FormattedValue", row.new_actorname),
        recipientLabel: formatted("_new_recipient_value@OData.Community.Display.V1.FormattedValue", row.new_recipientname),
        previousStatusLabel: formatted("new_previousstatus@OData.Community.Display.V1.FormattedValue"),
        newStatusLabel: formatted("new_newstatus@OData.Community.Display.V1.FormattedValue"),
      };
    });
  },

  getDossierTransmissions: async (folderId: string): Promise<DossierTransmission[]> => {
    if (!isGuid(folderId)) throw new Error("Identifiant de dossier invalide.");
    const result = await New_transmissionsService.getAll({
      filter: `_new_folder_value eq ${folderId}`,
      select: [
        "new_transmissionid", "new_transmissionname", "new_fromrole", "new_torole",
        "new_transmissiondate", "new_acknowledgmentdate", "new_sendingcomment", "new_receiptcomment",
        "new_transmissionstatus", "_new_folder_value", "_new_sentby_value", "_new_collector_value",
        "_new_acknowledgedby_value", "_new_branch_value",
      ],
      orderBy: ["new_transmissiondate desc"],
    });
    if (result.error) throw new Error("Impossible de charger l’historique des transmissions.");
    return (result.data ?? []).map((row) => {
      const raw = row as New_transmissions & Record<string, unknown>;
      return {
        ...row,
        new_fromrole_label: String(raw["new_fromrole@OData.Community.Display.V1.FormattedValue"] ?? row.new_fromrolename ?? ""),
        new_torole_label: String(raw["new_torole@OData.Community.Display.V1.FormattedValue"] ?? row.new_torolename ?? ""),
        new_sentbyname: String(raw["_new_sentby_value@OData.Community.Display.V1.FormattedValue"] ?? row.new_sentbyname ?? ""),
        new_collectorname: String(raw["_new_collector_value@OData.Community.Display.V1.FormattedValue"] ?? row.new_collectorname ?? ""),
        new_acknowledgedbyname: String(raw["_new_acknowledgedby_value@OData.Community.Display.V1.FormattedValue"] ?? row.new_acknowledgedbyname ?? ""),
        new_branchname: String(raw["_new_branch_value@OData.Community.Display.V1.FormattedValue"] ?? row.new_branchname ?? ""),
      };
    });
  },

  createDossierTransmission: async (input: {
    folderId: string;
    folderNumber: string;
    fromRole: TransmissionRole;
    toRole: TransmissionRole;
    collectorId: string;
    sendingComment?: string;
    branchId?: string;
  }): Promise<void> => {
    if (!isGuid(input.folderId) || !isGuid(input.collectorId) || (input.branchId && !isGuid(input.branchId))) {
      throw new Error("Le dossier, le destinataire et l’agence éventuelle doivent avoir des identifiants Dataverse valides.");
    }
    const senderId = await getCurrentSystemUserId();
    await createTransmissionRecord(input, senderId);
    const roleLabel = input.fromRole;
    try {
      await createDossierAuditEventRecord({
        folderId: input.folderId,
        folderNumber: input.folderNumber,
        context: { actorRole: roleLabel, fromRole: input.fromRole, toRole: input.toRole, recipientId: input.collectorId },
        draft: {
          type: "DossierTransmitted",
          title: TRANSMISSION_AUDIT_STEP_LABELS[input.toRole],
          description: `Dossier transmis par ${input.fromRole} à ${input.toRole}.`,
          reason: input.sendingComment,
        },
      });
    } catch (error) {
      notifyAuditWriteFailure(input.folderNumber, error);
    }
  },

  transmitDossier: async (input: {
    folderId: string;
    folderNumber: string;
    dossierChanges: Partial<Dossier>;
    fromRole: TransmissionRole;
    toRole: TransmissionRole;
    collectorId: string;
    sendingComment?: string;
  }): Promise<void> => {
    if (!isGuid(input.folderId) || !isGuid(input.collectorId)) {
      throw new Error("Le dossier et le destinataire doivent avoir des identifiants Dataverse valides.");
    }
    const senderId = await getCurrentSystemUserId();
    let previousStatus: number | undefined;
    try {
      const current = await New_foldersService.get(input.folderId, { select: ["new_status"] });
      if (typeof current.data?.new_status === "number") previousStatus = current.data.new_status;
    } catch (error) {
      console.warn("Could not read the pre-transmission status for its audit event:", error);
    }
    await dataService.updateDossier(input.folderId, input.dossierChanges, {
      actorRole: input.fromRole,
      fromRole: input.fromRole,
      toRole: input.toRole,
      recipientId: input.collectorId,
      suppressAudit: true,
    });
    await createTransmissionRecord({
      folderId: input.folderId,
      folderNumber: input.folderNumber,
      fromRole: input.fromRole,
      toRole: input.toRole,
      collectorId: input.collectorId,
      sendingComment: input.sendingComment,
    }, senderId);
    try {
      await createDossierAuditEventRecord({
        folderId: input.folderId,
        folderNumber: input.folderNumber,
        context: {
          actorRole: input.fromRole,
          fromRole: input.fromRole,
          toRole: input.toRole,
          recipientId: input.collectorId,
        },
        draft: {
          type: "DossierTransmitted",
          title: input.dossierChanges.new_status !== undefined
            ? getDossierAuditStepLabel(input.dossierChanges.new_status)
            : TRANSMISSION_AUDIT_STEP_LABELS[input.toRole],
          description: `Dossier transmis par ${input.fromRole} au destinataire sélectionné dans ${input.toRole}.`,
          reason: input.sendingComment,
          previousStatus,
          newStatus: input.dossierChanges.new_status,
        },
      });
    } catch (error) {
      notifyAuditWriteFailure(input.folderNumber, error);
    }
  },

  completeCourierDelivery: async (folderId: string): Promise<void> => {
    if (!isGuid(folderId)) throw new Error("Identifiant de dossier invalide.");
    await dataService.updateDossier(folderId, {
      new_status: 150,
      new_final_delivery_date: new Date().toISOString(),
    });
  },

  acknowledgeLatestDossierTransmission: async (
    folderId: string,
    receiptComment?: string,
    acknowledgedById?: string,
  ): Promise<boolean> => {
    if (!isGuid(folderId)) throw new Error("Identifiant de dossier invalide.");
    const result = await New_transmissionsService.getAll({
      filter: `_new_folder_value eq ${folderId} and new_transmissionstatus eq 871840000`,
      select: ["new_transmissionid", "_new_collector_value", "new_transmissiondate"],
      orderBy: ["new_transmissiondate desc"],
      top: 1,
    });
    if (result.error) throw new Error("Impossible de retrouver la transmission à accuser.");
    const pending = result.data?.[0];
    if (!pending) return false;
    const currentUserId = acknowledgedById || await getCurrentSystemUserId();
    if (pending._new_collector_value?.toLowerCase() !== currentUserId.toLowerCase()) {
      return false;
    }
    const update = await New_transmissionsService.update(pending.new_transmissionid, {
      new_acknowledgmentdate: new Date().toISOString(),
      "new_AcknowledgedBy@odata.bind": `/systemusers(${currentUserId})`,
      new_transmissionstatus: 871840001 as New_transmissionsnew_transmissionstatus,
      ...(receiptComment ? { new_receiptcomment: receiptComment } : {}),
    });
    if (update.error) throw new Error("Impossible d’enregistrer l’accusé de réception dans l’historique.");
    return true;
  },

  getDossiers: async (): Promise<Dossier[]> => {
    const selectFields = [
      "new_folder_number",
      "modifiedon",
      "new_status",
      "new_documenttype",
      "new_receptiondate",
      "new_invoicenumber",
      "new_bcnumber",
      "new_invoicedate",
      "new_description",
      "new_isblocked",
      "new_accountingdate",
      "new_paymentmethod",
      "new_chequenumber",
      "new_wirereference",
      "new_chequepreparationdate",
      "new_finaldeliverydate",
      "new_cheque_received_bo",
      "new_reception_comment",
      "new_delivery_date",
      "new_delivery_person",
      "new_signed_receipt_url",
      "new_supplier_signed",
      "new_branch_comment",
      "new_date_trans_prescriber",
      "new_date_accuse_prescriber",
      "new_date_val_prescriber",
      "new_date_return_bo",
      "new_date_trans_dcf",
      "new_date_accuse_dcf",
      "new_date_val_dcf",
      "new_acknowledgment_date",
      "new_person_to_deliver",
      "new_return_reason",
      "new_bo_transmission_date",
      "new_sharepointurl",
      "new_cancellationstatus",
      "new_advancephase",
      "new_lastalertdate",
      "new_treasury_comment",
      "_new_supplier_id_value",
      "_new_company_value",
      "_new_department_value",
      "_new_prescripteur_value",
      "_new_dcfcollector_value",
      "_new_destinationbranch_value",
      "_new_acknowledged_by_id_value",
      "_new_linkedfolder_value",
      "_new_treasury_collector_id_value"
    ];

    const result = await New_foldersService.getAll({ select: selectFields });
    if (result.data) {
      const dossiers = result.data.map(mapCrmEntityToDossier);
      const lastActionTimestamp = (dossier: Dossier): number => {
        const dates = [
          dossier.modifiedon,
          dossier.new_final_delivery_date,
          dossier.new_reception_date_agence,
          dossier.new_date_livraison,
          dossier.new_date_accuse_dcf,
          dossier.new_date_val_dcf,
          dossier.new_date_trans_dcf,
          dossier.new_date_retour_bo,
          dossier.new_date_val_prescripteur,
          dossier.new_date_accuse_prescripteur,
          dossier.new_date_trans_prescripteur,
          dossier.new_date_transmission_bo,
          dossier.new_cheque_preparation_date,
          dossier.new_accounting_date,
          dossier.new_date_virement,
          dossier.new_date_accuse,
          dossier.new_reception_date,
        ];
        return dates.reduce((latest, value) => {
          const timestamp = value ? Date.parse(value) : Number.NaN;
          return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
        }, 0);
      };

      return dossiers.sort((a, b) => lastActionTimestamp(b) - lastActionTimestamp(a));
    }
    throw new Error("Failed to fetch folders: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },

  createDossier: async (dossier: Partial<Dossier>): Promise<string> => {
    const crmEntity = mapDossierToCrmEntity(dossier);
    const result = await New_foldersService.create(crmEntity);
    if (result.data) {
      const id = result.data.new_folderid;
      const number = dossier.new_folder_number || result.data.new_folder_number || id;
      try {
        await createDossierAuditEventRecord({
          folderId: id,
          folderNumber: number,
          context: { actorRole: "BO" },
          draft: {
            type: "DossierCreated",
            title: getDossierAuditStepLabel(dossier.new_status ?? 10),
            description: `Dossier créé à l’étape « ${getDossierAuditStepLabel(dossier.new_status ?? 10)} ».`,
            newStatus: dossier.new_status ?? 10,
          },
        });
      } catch (error) {
        notifyAuditWriteFailure(number, error);
      }
      return id;
    }
    throw new Error("Failed to create folder: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },

  updateDossierStatut: async (id: string, status: number): Promise<void> => {
    await dataService.updateDossier(id, { new_status: status });
  },

  updateDossier: async (id: string, dossier: Partial<Dossier>, auditContext?: AuditWriteContext): Promise<void> => {
    let previous: DossierAuditSnapshot & { folderNumber?: string } = {};
    try {
      const current = await New_foldersService.get(id, { select: [
        "new_status", "new_isblocked", "new_documenttype", "new_folder_number", "new_accountingdate",
        "new_cheque_received_bo", "new_supplier_signed", "new_chequenumber", "new_chequepreparationdate",
        "new_wirereference", "new_date_virement",
      ] });
      if (current.data) {
        const raw = current.data as unknown as Record<string, unknown>;
        previous = {
          status: Number.isFinite(Number(raw.new_status)) ? Number(raw.new_status) : undefined,
          isBlocked: Boolean(raw.new_isblocked),
          documentType: Number(raw.new_documenttype),
          folderNumber: String(raw.new_folder_number ?? ""),
          accountingCompleted: Boolean(raw.new_accountingdate),
          checkReceived: Boolean(raw.new_cheque_received_bo),
          supplierSigned: Boolean(raw.new_supplier_signed),
          chequeNumber: String(raw.new_chequenumber ?? ""),
          chequePreparationDate: String(raw.new_chequepreparationdate ?? ""),
          wireReference: String(raw.new_wirereference ?? ""),
          wireDate: String(raw.new_date_virement ?? ""),
        };
      }
    } catch (error) {
      console.warn("Could not read the pre-update dossier snapshot for its audit event:", error);
    }
    const crmEntity = mapDossierToCrmEntity(dossier);
    const result = await New_foldersService.update(id, crmEntity);
    if (result.error) {
      throw new Error("Failed to update folder: " + JSON.stringify(result.error));
    }
    const folderNumber = dossier.new_folder_number || previous.folderNumber || id;
    const drafts = auditContext?.suppressAudit ? [] : buildDossierAuditDrafts(dossier, previous);
    for (const draft of drafts) {
      try {
        const actorRole = auditContext?.actorRole ?? getCurrentAuditRole();
        const inferredRoute = draft.type === "DossierTransmitted"
          || draft.type === "DossierValidated"
          || draft.type === "CorrectionSubmitted"
          || draft.type === "ReturnedforCorrection"
          || draft.type === "CheckSenttoOrderOffice"
          || draft.type === "CheckReceivedbyOrderOffice"
          ? inferAuditRoutingContext(dossier.new_status, dossier, actorRole, draft.type)
          : {};
        await createDossierAuditEventRecord({
          folderId: id,
          folderNumber,
          draft,
          context: { ...inferredRoute, ...auditContext, actorRole },
        });
      } catch (error) {
        notifyAuditWriteFailure(folderNumber, error);
      }
    }
  },

  accuseReception: async (
    id: string,
    nextStatus: number,
    _user: string,
    additionalUpdates: Partial<Dossier> = {},
  ): Promise<boolean> => {
    const xrm = getXrm();
    const context = xrm ? xrm.Utility.getGlobalContext() : null;
    const userId = context ? context.userSettings.userId.replace(/[{}]/g, "") : "";
    let acknowledgingUserId = isGuid(userId) ? userId : undefined;
    if (!acknowledgingUserId) {
      try {
        acknowledgingUserId = await getCurrentSystemUserId();
      } catch {
        // Preserve receipt processing if user identity cannot be resolved;
        // the audit writer will still report its own identity error.
      }
    }
    const nowStr = new Date().toISOString();
    await dataService.updateDossier(id, {
      ...additionalUpdates,
      new_status: nextStatus,
      new_date_accuse: nowStr,
      ...(acknowledgingUserId ? { new_accuse_par: acknowledgingUserId } : {}),
    }, {
      recipientId: acknowledgingUserId,
      actorRole: RECEIPT_ROLE_BY_STATUS[nextStatus],
    });
    // The dossier receipt is the primary operation. Audit logging is a separate
    // Dataverse request and must not turn a successful receipt into a UI failure.
    try {
      const actorId = acknowledgingUserId || await getCurrentSystemUserId();
      await dataService.acknowledgeLatestDossierTransmission(id, undefined, actorId);
      return true;
    } catch (error) {
      console.error("Transmission audit acknowledgment failed after dossier receipt was saved:", error);
      return false;
    }
  },

  // User Management
  getUsers: async (): Promise<SystemUser[]> => {
    const result = await SystemusersService.getAll({ select: ["systemuserid", "fullname", "internalemailaddress", "_new_department_id_value"] });
    if (result.data) {
      return result.data.map((e: any) => ({
        systemuserid: e.systemuserid,
        fullname: e.fullname,
        internalemailaddress: e.internalemailaddress,
        new_department_id: e._new_department_id_value,
        new_role: "BO",
        new_status: "Actif"
      }));
    }
    throw new Error("Failed to retrieve systemusers: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },
  updateUser: async (id: string, user: Partial<SystemUser>): Promise<void> => {
    const result = await SystemusersService.update(id, user as any);
    if (result.error) {
      throw new Error("Failed to update user: " + JSON.stringify(result.error));
    }
  },
  createUser: async (user: Partial<SystemUser>): Promise<void> => {
    const result = await SystemusersService.create(user as any);
    if (result.error) {
      throw new Error("Failed to create user: " + JSON.stringify(result.error));
    }
  },

  // Fournisseur Reference
  getFournisseursLookup: async (): Promise<FournisseurLookup[]> => {
    const result = await New_suppliersService.getAll({ select: ["new_supplierid", "new_name", "new_tax_id", "new_isactive", "new_address", "new_city", "new_email", "new_phone", "_new_branch_value", "createdon", "modifiedon"] });
    if (result.success && result.data) {
      return result.data.map((e) => ({
        new_supplierid: e.new_supplierid,
        new_name: e.new_name,
        new_code: e.new_tax_id || "",
        new_is_active: e.new_isactive ?? false,
        new_address: e.new_address ?? "",
        new_city: e.new_city ?? "",
        new_email: e.new_email ?? "",
        new_phone: e.new_phone ?? "",
        new_branch_id: e._new_branch_value,
        new_branch_name: e.new_branchname,
        createdon: e.createdon,
        modifiedon: e.modifiedon,
      }));
    }
    throw new Error("Failed to retrieve suppliers: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },
  updateFournisseurLookup: async (id: string, four: Partial<SupplierInput>): Promise<void> => {
    const updateData = supplierRecord(four);
    const result = await New_suppliersService.update(id, updateData);
    if (!result.success || result.error) {
      throw new Error("Failed to update supplier: " + JSON.stringify(result.error));
    }
  },
  createFournisseurLookup: async (four: SupplierInput): Promise<void> => {
    const createData = supplierRecord(four, true);
    // Generated create signatures require managed ownership/state columns; Dataverse supplies them.
    const result = await New_suppliersService.create(createData as Parameters<typeof New_suppliersService.create>[0]);
    if (!result.success || result.error) {
      throw new Error("Failed to create supplier: " + JSON.stringify(result.error));
    }
  },

  // Agence Reference
  getAgencesLookup: async (): Promise<AgenceLookup[]> => {
    const result = await New_branchsService.getAll({ select: ["new_branchid", "new_name", "new_code", "new_city", "new_is_active"] });
    if (result.success && result.data) {
      return result.data.map((e) => ({
        new_branchid: e.new_branchid,
        new_name: e.new_name,
        new_city: e.new_city,
        new_is_active: e.new_is_active
      }));
    }
    throw new Error("Failed to retrieve branches: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },
  updateAgenceLookup: async (id: string, agence: Partial<AgenceLookup>): Promise<void> => {
    const result = await New_branchsService.update(id, {
      new_name: agence.new_name,
      new_city: agence.new_city,
      new_is_active: agence.new_is_active,
    });
    if (!result.success || result.error) {
      throw new Error("Failed to update branch: " + JSON.stringify(result.error));
    }
  },
  createAgenceLookup: async (agence: Partial<AgenceLookup>): Promise<void> => {
    const result = await New_branchsService.create(agence as any);
    if (!result.success || result.error) {
      throw new Error("Failed to create branch: " + JSON.stringify(result.error));
    }
  },

  getCompaniesLookup: async (): Promise<CompanyLookup[]> => {
    const result = await New_companiesService.getAll({ select: ["new_companyid", "new_name", "new_code", "new_is_active", "createdon", "modifiedon"] });
    if (result.success && result.data) {
      return result.data.map((e) => ({
        new_companyid: e.new_companyid,
        new_name: e.new_name,
        new_code: e.new_code,
        new_is_active: e.new_is_active ?? false,
        createdon: e.createdon,
        modifiedon: e.modifiedon,
      }));
    }
    throw new Error("Failed to retrieve companies: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },

  getDepartmentsLookup: async (): Promise<DepartmentLookup[]> => {
    const result = await New_departementsService.getAll({ select: ["new_departementid", "new_name", "new_code", "new_isactive", "_new_company_value", "createdon", "modifiedon"] });
    if (result.success && result.data) {
      return result.data.map((e) => ({
        new_departmentid: e.new_departementid,
        new_name: e.new_name,
        new_code: e.new_code,
        new_is_active: e.new_isactive ?? false,
        new_company_id: e._new_company_value,
        new_company_name: e.new_companyname,
        createdon: e.createdon,
        modifiedon: e.modifiedon,
      }));
    }
    throw new Error("Failed to retrieve departments: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },

  createCompanyLookup: async (company: CompanyInput): Promise<void> => {
    const record = companyRecord(company, true);
    // Generated create signatures include system-managed ownership fields;
    // Dataverse supplies those fields. Send only the writable business columns.
    const result = await New_companiesService.create(record as Parameters<typeof New_companiesService.create>[0]);
    if (!result.success || result.error) throw new Error("Impossible de créer la société. Vérifiez vos droits Dataverse et les champs saisis.");
  },
  updateCompanyLookup: async (id: string, company: Partial<CompanyInput>): Promise<void> => {
    const record = companyRecord(company);
    const result = await New_companiesService.update(id, record);
    if (!result.success || result.error) throw new Error("Impossible de modifier la société. Vérifiez vos droits Dataverse.");
  },
  createDepartmentLookup: async (department: DepartmentInput): Promise<void> => {
    const record = departmentRecord(department, true);
    const result = await New_departementsService.create(record as Parameters<typeof New_departementsService.create>[0]);
    if (!result.success || result.error) throw new Error("Impossible de créer la direction. Vérifiez vos droits Dataverse et les champs saisis.");
  },
  updateDepartmentLookup: async (id: string, department: Partial<DepartmentInput>): Promise<void> => {
    const record = departmentRecord(department);
    const result = await New_departementsService.update(id, record);
    if (!result.success || result.error) throw new Error("Impossible de modifier la direction. Vérifiez vos droits Dataverse.");
  },

  // System Config
  getSystemConfig: async (): Promise<SystemConfig> => {
    const result = await New_reminderconfigurationsService.getAll({ top: 2 });
    if (!result.success || result.error) throw new Error("Impossible de lire la configuration des relances dans Dataverse.");
    const rows = result.data ?? [];
    if (rows.length > 1) throw new Error("La table Reminder Configuration doit contenir une seule ligne de configuration globale.");
    const row = rows[0];
    if (!row) return { new_reminderconfigurationid: "", new_remindersenabled: true, new_initialdelaydays: 7, new_repeatintervaldays: 1, new_invoicereceiptlimitdays: 5 };
    return {
      new_reminderconfigurationid: row.new_reminderconfigurationid,
      new_remindersenabled: row.new_remindersenabled ?? true,
      new_initialdelaydays: row.new_initialdelaydays ?? 7,
      new_repeatintervaldays: row.new_repeatintervaldays ?? 1,
      new_invoicereceiptlimitdays: row.new_invoicereceiptlimitdays ?? 5,
    };
  },
  updateSystemConfig: async (config: Partial<SystemConfig>): Promise<void> => {
    const { new_reminderconfigurationid: id, ...fields } = config;
    if (id) {
      const result = await New_reminderconfigurationsService.update(id, fields);
      if (!result.success || result.error) throw new Error("Impossible d'enregistrer la configuration des relances dans Dataverse.");
      return;
    }
    const result = await New_reminderconfigurationsService.create({
      new_newcolumn: "Configuration globale des relances",
      new_remindersenabled: config.new_remindersenabled ?? true,
      new_initialdelaydays: config.new_initialdelaydays ?? 7,
      new_repeatintervaldays: config.new_repeatintervaldays ?? 1,
      new_invoicereceiptlimitdays: config.new_invoicereceiptlimitdays ?? 5,
    });
    if (!result.success || result.error) throw new Error("Impossible de créer la configuration des relances dans Dataverse.");
  },

  // Admin Overrides
  deleteDossier: async (id: string): Promise<void> => {
    await New_foldersService.delete(id);
  },

  checkDuplicateInvoice: async (supplierId: string, invoiceNumber: string, excludeFolderId?: string): Promise<boolean> => {
    if (!supplierId || !invoiceNumber) return false;
    let filter = `_new_supplier_id_value eq ${supplierId} and new_invoicenumber eq '${invoiceNumber.replace(/'/g, "''")}'`;
    if (excludeFolderId) {
      filter += ` and new_folderid ne ${excludeFolderId}`;
    }
    const result = await New_foldersService.getAll({
      filter,
      select: ["new_folderid"],
      top: 1
    });
    return !!(result.data && result.data.length > 0);
  }
};
