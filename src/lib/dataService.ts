// Ce service fait le pont entre l'application React et Dataverse.
// Il utilise exclusivement les services officiels générés par PAC CLI.

import { New_foldersService } from '../generated/services/New_foldersService';
import { New_suppliersService } from '../generated/services/New_suppliersService';
import { New_branchsService } from '../generated/services/New_branchsService';
import { SystemusersService } from '../generated/services/SystemusersService';
import { New_companiesService } from '../generated/services/New_companiesService';
import { New_departementsService } from '../generated/services/New_departementsService';
import { New_transmissionsService } from '../generated/services/New_transmissionsService';
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
  new_accuse_reception_agence_par?: string;
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
  new_systemconfigid: string;
  new_regle_5_jours_limite: number;
  new_relance_seuil_jours: number;
  new_alerte_blocage_jours: number;
}

export type TransmissionRole = "BO" | "Prescripteur" | "DCF" | "Trésorerie" | "Agence" | "Admin";

export interface DossierTransmission extends New_transmissions {
  new_fromrole_label?: string;
  new_torole_label?: string;
}

const TRANSMISSION_ROLE_CODES: Record<TransmissionRole, number> = {
  BO: 871840000,
  Prescripteur: 871840001,
  DCF: 871840002,
  "Trésorerie": 871840003,
  Agence: 871840004,
  Admin: 871840005,
};

const isGuid = (value: string | undefined): value is string =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

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
  if (d.new_return_reason !== undefined) entity.new_return_reason = d.new_return_reason;
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
    await dataService.updateDossier(input.folderId, input.dossierChanges);
    await createTransmissionRecord({
      folderId: input.folderId,
      folderNumber: input.folderNumber,
      fromRole: input.fromRole,
      toRole: input.toRole,
      collectorId: input.collectorId,
      sendingComment: input.sendingComment,
    }, senderId);
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
      return result.data.map(mapCrmEntityToDossier);
    }
    throw new Error("Failed to fetch folders: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },

  createDossier: async (dossier: Partial<Dossier>): Promise<string> => {
    const crmEntity = mapDossierToCrmEntity(dossier);
    const result = await New_foldersService.create(crmEntity);
    if (result.data) {
      return result.data.new_folderid;
    }
    throw new Error("Failed to create folder: " + (result.error ? JSON.stringify(result.error) : "Unknown error"));
  },

  updateDossierStatut: async (id: string, status: number): Promise<void> => {
    const result = await New_foldersService.update(id, { new_status: status as any });
    if (result.error) {
      throw new Error("Failed to update folder status: " + JSON.stringify(result.error));
    }
  },

  updateDossier: async (id: string, dossier: Partial<Dossier>): Promise<void> => {
    const crmEntity = mapDossierToCrmEntity(dossier);
    const result = await New_foldersService.update(id, crmEntity);
    if (result.error) {
      throw new Error("Failed to update folder: " + JSON.stringify(result.error));
    }
  },

  accuseReception: async (id: string, nextStatus: number, _user: string): Promise<boolean> => {
    const xrm = getXrm();
    const context = xrm ? xrm.Utility.getGlobalContext() : null;
    const userId = context ? context.userSettings.userId.replace(/[{}]/g, "") : "";
    const nowStr = new Date().toISOString();

    const updateData: any = {
      new_status: nextStatus,
      new_acknowledgment_date: nowStr
    };
    if (userId) {
      updateData["new_acknowledged_by_id@odata.bind"] = `/systemusers(${userId})`;
    }

    const result = await New_foldersService.update(id, updateData);
    if (result.error) {
      throw new Error("Failed to acknowledge receipt: " + JSON.stringify(result.error));
    }
    // The dossier receipt is the primary operation. Audit logging is a separate
    // Dataverse request and must not turn a successful receipt into a UI failure.
    try {
      const actorId = userId || await getCurrentSystemUserId();
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
    return {
      new_systemconfigid: "cfg-prod",
      new_regle_5_jours_limite: 5,
      new_relance_seuil_jours: 15,
      new_alerte_blocage_jours: 7
    };
  },
  updateSystemConfig: async (_config: Partial<SystemConfig>): Promise<void> => {
    // No-op for prod configuration
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
