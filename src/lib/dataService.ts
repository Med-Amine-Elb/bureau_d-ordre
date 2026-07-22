// Ce service fait le pont entre l'application React et Dataverse.
// En mode local (sur votre PC), il utilise le LocalStorage pour simuler la base de données.
// En production (Power Apps), il utilisera window.Xrm.WebApi.

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
  new_invoice_number?: string;
  new_po_number?: string;
  new_invoice_date?: string;
  new_description?: string;
  new_reception_date: string;
  new_is_blocked?: boolean;
  new_documents_complements?: string[];
  new_destination_branch_id?: string;
  new_accuse_par?: string;
  new_date_accuse?: string;
  new_motif_blocage?: string;
  new_est_comptabilise?: boolean;
  new_collecteur_treso?: string;
  new_motif_retour?: string;
  new_livreur_nom?: string;
  new_personne_a_livrer?: string;
  new_date_livraison?: string;
  
  // Trésorerie specific fields
  new_payment_method?: number; // 1 = Chèque, 2 = Virement
  new_cheque_number?: string;
  new_wire_reference?: string;
  new_cheque_preparation_date?: string;
  new_final_delivery_date?: string;
  new_date_virement?: string;
  new_compte_bancaire_dest?: string;
  new_banque_emettrice?: string;
  new_date_transmission_bo?: string;
  new_commentaire_treso?: string;
  new_source_blocage?: string; // Fournisseur, Document, Système, Autre
  new_date_deblocage?: string;
  new_resolution_blocage?: string;
  new_cheque_recu_bo?: boolean;
  new_commentaire_reception?: string;
  
  // Agence specific fields
  new_reception_date_agence?: string;
  new_accuse_reception_agence_par?: string;
  new_recu_signe_scan?: string;
  new_fournisseur_signe?: boolean;
  new_commentaire_agence?: string;

  // Tracking dates for each stage
  new_date_trans_prescripteur?: string;
  new_date_accuse_prescripteur?: string;
  new_date_val_prescripteur?: string;
  new_date_retour_bo?: string;
  new_date_trans_dcf?: string;
  new_date_accuse_dcf?: string;
  new_date_val_dcf?: string;
}

export interface SystemUser {
  systemuserid: string;
  fullname: string;
  internalemailaddress: string;
  new_role: string; // BO, Prescripteur, DCF, Tresorerie, Agence, Admin
  new_destination_branch_id?: string;
  new_status: string; // Actif, Inactif
  new_derniere_connexion?: string;
}

export interface FournisseurLookup {
  new_supplierid: string;
  new_name: string;
  new_code: string;
  new_is_active: boolean;
}

export interface AgenceLookup {
  new_branchid: string;
  new_name: string;
  new_city: string;
  new_is_active: boolean;
}

export interface SystemConfig {
  new_systemconfigid: string;
  new_regle_5_jours_limite: number;
  new_relance_seuil_jours: number;
  new_alerte_blocage_jours: number;
}

const LOCAL_STORAGE_KEY = "gbm_mock_dossiers_v8";
const USERS_STORAGE_KEY = "gbm_mock_users";
const FOURNISSEURS_STORAGE_KEY = "gbm_mock_fournisseurs";
const AGENCES_STORAGE_KEY = "gbm_mock_agences";
const CONFIG_STORAGE_KEY = "gbm_mock_config";

// Initialisation de fausses données si le local storage est vide
const initMockData = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
    const mockData: Dossier[] = [
      { 
        new_folderid: "DOS-001", 
        new_folder_number: "DOS-2026-001", 
        new_document_type: 100, 
        new_status: 150, 
        new_supplier_id: "MAROC TELECOM",
        new_company_id: "GBM_CASA",
        new_department_id: "IT",
        new_prescriber_id: "Amine Elboubakri",
        new_reception_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "FACT-MT-998",
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_folderid: "DOS-002", 
        new_folder_number: "DOS-2026-002", 
        new_document_type: 100, 
        new_status: 40, 
        new_supplier_id: "OFFICE DEPOT",
        new_company_id: "GBM_RABAT",
        new_department_id: "ACHATS",
        new_prescriber_id: "Sarah Alaoui",
        new_reception_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "OD-2026-ABC",
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf"]
      },
      { 
        new_folderid: "DOS-003", 
        new_folder_number: "DOS-2026-003", 
        new_document_type: 300, 
        new_status: 70, 
        new_supplier_id: "SGS MAROC",
        new_company_id: "GBM_CASA",
        new_department_id: "RH",
        new_prescriber_id: "Youssef Naciri",
        new_reception_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "SGS-INV-001",
        new_documents_complements: ["Contrat cadre.pdf", "Annexe technique.pdf"]
      },
      { 
        new_folderid: "DOS-004", 
        new_folder_number: "DOS-2026-004", 
        new_document_type: 100, 
        new_status: 20, 
        new_supplier_id: "LYDEC",
        new_company_id: "GBM_CASA",
        new_department_id: "MOYENS GENERAUX",
        new_prescriber_id: "Rida Benali",
        new_reception_date: new Date().toISOString(), 
        new_invoice_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // > 5 days diff
        new_invoice_number: "LYD-09-2026",
        new_is_blocked: true,
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_folderid: "DOS-005", 
        new_folder_number: "DOS-2026-005", 
        new_document_type: 400, 
        new_status: 120, 
        new_supplier_id: "CLEANING SERVICES SARL",
        new_company_id: "GBM_RABAT",
        new_department_id: "RH",
        new_prescriber_id: "Mouna El Fassi",
        new_reception_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "DEM-CHQ-001",
        new_documents_complements: ["Demande de chèque.pdf", "Proforma.pdf"]
      },
      { 
        new_folderid: "DOS-006", 
        new_folder_number: "DOS-2026-006", 
        new_document_type: 200, 
        new_status: 10, 
        new_supplier_id: "ACER MAROC",
        new_company_id: "GBM_CASA",
        new_department_id: "IT",
        new_prescriber_id: "Amine Elboubakri",
        new_reception_date: new Date().toISOString(), 
        new_invoice_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "AVOIR-ACER-12",
        new_documents_complements: ["Note de crédit.pdf"]
      },
      { 
        new_folderid: "DOS-007", 
        new_folder_number: "DOS-2026-007", 
        new_document_type: 100, 
        new_status: 30, 
        new_supplier_id: "LABEL VIE",
        new_company_id: "GBM_CASA",
        new_department_id: "ACHATS",
        new_prescriber_id: "Sarah Alaoui",
        new_reception_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "LV-P12",
        new_documents_complements: ["Facture originale.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_folderid: "DOS-008", 
        new_folder_number: "DOS-2026-008", 
        new_document_type: 500, 
        new_status: 80, 
        new_supplier_id: "COSUMAR",
        new_company_id: "GBM_RABAT",
        new_department_id: "IT",
        new_prescriber_id: "Hicham Berrada",
        new_dcf_collector_id: "Karim Idrissi",
        new_reception_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "ACP-COS-01",
        new_documents_complements: ["Document divers.pdf"]
      },
      { 
        new_folderid: "DOS-009", 
        new_folder_number: "DOS-2026-009", 
        new_document_type: 100, 
        new_status: 90, 
        new_supplier_id: "HPS",
        new_company_id: "GBM_CASA",
        new_department_id: "IT",
        new_prescriber_id: "Amine Elboubakri",
        new_reception_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "HPS-INV-01",
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf"]
      },
      { 
        new_folderid: "DOS-010", 
        new_folder_number: "DOS-2026-010", 
        new_document_type: 100, 
        new_status: 140, 
        new_supplier_id: "AFRIQUIA",
        new_company_id: "GBM_CASA",
        new_department_id: "ACHATS",
        new_prescriber_id: "Sarah Alaoui",
        new_destination_branch_id: "Casa Anfa",
        new_reception_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "AFR-GAS-01",
        new_documents_complements: ["Facture originale.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_folderid: "DOS-011", 
        new_folder_number: "DOS-2026-011", 
        new_document_type: 100, 
        new_status: 100, 
        new_supplier_id: "INWI",
        new_company_id: "GBM_CASA",
        new_department_id: "IT",
        new_prescriber_id: "Tariq Bensouda",
        new_reception_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "FACT-INWI-2026-90",
        new_documents_complements: ["Facture INWI.pdf"]
      },
      { 
        new_folderid: "DOS-012", 
        new_folder_number: "DOS-2026-012", 
        new_document_type: 100, 
        new_status: 110, 
        new_supplier_id: "SOCIETE GENERALE",
        new_company_id: "GBM_CASA",
        new_department_id: "FINANCE",
        new_prescriber_id: "Meryem Touimi",
        new_reception_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "SG-FAC-887",
        new_documents_complements: ["Facture Frais.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        new_folderid: "DOS-013", 
        new_folder_number: "DOS-2026-013", 
        new_document_type: 100, 
        new_status: 110, 
        new_supplier_id: "IMPRIMERIE NATIONALE",
        new_company_id: "GBM_RABAT",
        new_department_id: "MOYENS GENERAUX",
        new_prescriber_id: "Adil Cherkaoui",
        new_reception_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "IMP-2026-45",
        new_documents_complements: ["Facture Imp.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        new_folderid: "DOS-014", 
        new_folder_number: "DOS-2026-014", 
        new_document_type: 100, 
        new_status: 120, 
        new_supplier_id: "DESK MAROC",
        new_company_id: "GBM_CASA",
        new_department_id: "ACHATS",
        new_prescriber_id: "Sarah Alaoui",
        new_reception_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "DESK-9902",
        new_documents_complements: ["Facture Mobilier.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-889021",
        new_banque_emettrice: "ATTIJARIWAFA BANK",
        new_cheque_preparation_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: false,
        new_commentaire_treso: "Chèque signé et prêt. Transmis au Bureau d'Ordre pour remise."
      },
      { 
        new_folderid: "DOS-015", 
        new_folder_number: "DOS-2026-015", 
        new_document_type: 100, 
        new_status: 120, 
        new_supplier_id: "COPY RAPIDE",
        new_company_id: "GBM_RABAT",
        new_department_id: "RH",
        new_prescriber_id: "Mouna El Fassi",
        new_reception_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
        new_invoice_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_number: "CR-0021",
        new_documents_complements: ["Facture Imp.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-773121",
        new_banque_emettrice: "BMCE",
        new_cheque_preparation_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: true,
        new_commentaire_treso: "Chèque pour agence de Rabat."
      },
      {
        new_folderid: "DOS-016",
        new_folder_number: "DOS-2026-016",
        new_document_type: 100,
        new_status: 130, // En Transport Vers Agence
        new_supplier_id: "BRICOMA",
        new_company_id: "GBM_RABAT",
        new_department_id: "MOYENS GENERAUX",
        new_prescriber_id: "Sarah Alaoui",
        new_reception_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        new_documents_complements: ["Facture Bricoma.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-112233",
        new_banque_emettrice: "SOCIETE GENERALE",
        new_cheque_preparation_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: true,
        new_date_transmission_bo: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_destination_branch_id: "Rabat Agdal"
      },
      {
        new_folderid: "DOS-017",
        new_folder_number: "DOS-2026-017",
        new_document_type: 100,
        new_status: 140, // Disponible Agence
        new_supplier_id: "ELECTROPLANET",
        new_company_id: "GBM_CASA",
        new_department_id: "MOYENS GENERAUX",
        new_prescriber_id: "Sarah Alaoui",
        new_reception_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        new_documents_complements: ["Facture Electro.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-445566",
        new_banque_emettrice: "ATTIJARIWAFA BANK",
        new_cheque_preparation_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: true,
        new_date_transmission_bo: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        new_destination_branch_id: "Casa Anfa",
        new_reception_date_agence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_accuse_reception_agence_par: "Agent Casa Anfa"
      },
      {
        new_folderid: "DOS-018",
        new_folder_number: "DOS-2026-018",
        new_document_type: 100,
        new_status: 150, // Payé / Remis
        new_supplier_id: "KITEA",
        new_company_id: "GBM_TANGER",
        new_department_id: "ACHATS",
        new_prescriber_id: "Sarah Alaoui",
        new_reception_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        new_documents_complements: ["Facture Kitea.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-778899",
        new_banque_emettrice: "BMCI",
        new_cheque_preparation_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: true,
        new_date_transmission_bo: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        new_destination_branch_id: "Tanger Ville",
        new_reception_date_agence: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_accuse_reception_agence_par: "Agent Tanger",
        new_final_delivery_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_recu_signe_scan: "recu_kitea_signe.pdf",
        new_fournisseur_signe: true,
        new_commentaire_agence: "Chèque remis en mains propres au responsable régional de KITEA."
      },
      {
        new_folderid: "DOS-019",
        new_folder_number: "DOS-2026-019",
        new_document_type: 100,
        new_status: 130, // En Transport Vers Agence
        new_supplier_id: "SOPRIAM",
        new_company_id: "GBM_MARRAKECH",
        new_department_id: "MOYENS GENERAUX",
        new_prescriber_id: "Hicham Berrada",
        new_reception_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new_documents_complements: ["Facture Sopriam.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-112244",
        new_banque_emettrice: "CIH BANK",
        new_cheque_preparation_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: true,
        new_date_transmission_bo: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        new_destination_branch_id: "Marrakech Guéliz"
      },
      {
        new_folderid: "DOS-020",
        new_folder_number: "DOS-2026-020",
        new_document_type: 100,
        new_status: 130, // En Transport Vers Agence
        new_supplier_id: "AUTO HALL",
        new_company_id: "GBM_FES",
        new_department_id: "ACHATS",
        new_prescriber_id: "Mouna El Fassi",
        new_reception_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_invoice_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        new_documents_complements: ["Facture Auto Hall.pdf"],
        new_accuse_par: "Trésorier Ahmed",
        new_date_accuse: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_payment_method: 1,
        new_cheque_number: "CHQ-998877",
        new_banque_emettrice: "AL BARID BANK",
        new_cheque_preparation_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        new_cheque_recu_bo: true,
        new_date_transmission_bo: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_destination_branch_id: "Fès Ville"
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockData));
  }

  // 2. Users
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    const mockUsers: SystemUser[] = [
      { systemuserid: "usr-001", fullname: "Ahmed Alami", internalemailaddress: "a.alami@gbm.ma", new_role: "BO", new_status: "Actif", new_derniere_connexion: new Date(Date.now() - 1 * 3600000).toISOString() },
      { systemuserid: "usr-002", fullname: "Meryem Touimi", internalemailaddress: "m.touimi@gbm.ma", new_role: "Tresorerie", new_status: "Actif", new_derniere_connexion: new Date(Date.now() - 2 * 3600000).toISOString() },
      { systemuserid: "usr-003", fullname: "Karim Idrissi", internalemailaddress: "k.idrissi@gbm.ma", new_role: "DCF", new_status: "Actif", new_derniere_connexion: new Date(Date.now() - 24 * 3600000).toISOString() },
      { systemuserid: "usr-004", fullname: "Rachid Agdal", internalemailaddress: "r.agdal@gbm.ma", new_role: "Agence", new_destination_branch_id: "Rabat Agdal", new_status: "Actif", new_derniere_connexion: new Date(Date.now() - 4 * 3600000).toISOString() },
      { systemuserid: "usr-005", fullname: "Yassine Anfa", internalemailaddress: "y.anfa@gbm.ma", new_role: "Agence", new_destination_branch_id: "Casa Anfa", new_status: "Actif", new_derniere_connexion: new Date(Date.now() - 30 * 60000).toISOString() },
      { systemuserid: "usr-006", fullname: "Adil Admin", internalemailaddress: "a.admin@gbm.ma", new_role: "Admin", new_status: "Actif", new_derniere_connexion: new Date().toISOString() },
      { systemuserid: "usr-007", fullname: "Fatima Bennani", internalemailaddress: "f.bennani@gbm.ma", new_role: "Prescripteur", new_status: "Inactif", new_derniere_connexion: new Date(Date.now() - 10 * 24 * 3600000).toISOString() }
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  }

  // 3. Fournisseurs lookup
  if (!localStorage.getItem(FOURNISSEURS_STORAGE_KEY)) {
    const mockFournisseurs: FournisseurLookup[] = [
      { new_supplierid: "four-001", new_name: "MAROC TELECOM", new_code: "FR-IAM-01", new_is_active: true },
      { new_supplierid: "four-002", new_name: "OFFICE DEPOT", new_code: "FR-OD-02", new_is_active: true },
      { new_supplierid: "four-003", new_name: "SGS MAROC", new_code: "FR-SGS-03", new_is_active: true },
      { new_supplierid: "four-004", new_name: "LYDEC", new_code: "FR-LYDEC-04", new_is_active: true },
      { new_supplierid: "four-005", new_name: "CLEANING SERVICES SARL", new_code: "FR-CLEAN-05", new_is_active: true },
      { new_supplierid: "four-006", new_name: "ACER MAROC", new_code: "FR-ACER-06", new_is_active: true },
      { new_supplierid: "four-007", new_name: "LABEL VIE", new_code: "FR-LVIE-07", new_is_active: true },
      { new_supplierid: "four-008", new_name: "COSUMAR", new_code: "FR-COSU-08", new_is_active: true },
      { new_supplierid: "four-009", new_name: "HPS", new_code: "FR-HPS-09", new_is_active: true },
      { new_supplierid: "four-010", new_name: "AFRIQUIA", new_code: "FR-AFR-10", new_is_active: true },
      { new_supplierid: "four-011", new_name: "INWI", new_code: "FR-INWI-11", new_is_active: true },
      { new_supplierid: "four-012", new_name: "SOCIETE GENERALE", new_code: "FR-SG-12", new_is_active: true },
      { new_supplierid: "four-013", new_name: "IMPRIMERIE NATIONALE", new_code: "FR-IMP-13", new_is_active: true },
      { new_supplierid: "four-014", new_name: "DESK MAROC", new_code: "FR-DESK-14", new_is_active: true },
      { new_supplierid: "four-015", new_name: "COPY RAPIDE", new_code: "FR-COPY-15", new_is_active: true },
      { new_supplierid: "four-016", new_name: "BRICOMA", new_code: "FR-BRIC-16", new_is_active: true },
      { new_supplierid: "four-017", new_name: "ELECTROPLANET", new_code: "FR-EPLANET-17", new_is_active: true },
      { new_supplierid: "four-018", new_name: "KITEA", new_code: "FR-KITEA-18", new_is_active: true },
      { new_supplierid: "four-019", new_name: "SOPRIAM", new_code: "FR-SOPR-19", new_is_active: true },
      { new_supplierid: "four-020", new_name: "AUTO HALL", new_code: "FR-AH-20", new_is_active: true }
    ];
    localStorage.setItem(FOURNISSEURS_STORAGE_KEY, JSON.stringify(mockFournisseurs));
  }

  // 4. Agences lookup
  if (!localStorage.getItem(AGENCES_STORAGE_KEY)) {
    const mockAgences: AgenceLookup[] = [
      { new_branchid: "age-001", new_name: "Rabat Agdal", new_city: "Rabat", new_is_active: true },
      { new_branchid: "age-002", new_name: "Casa Anfa", new_city: "Casablanca", new_is_active: true },
      { new_branchid: "age-003", new_name: "Tanger Ville", new_city: "Tanger", new_is_active: true },
      { new_branchid: "age-004", new_name: "Marrakech Guéliz", new_city: "Marrakech", new_is_active: true },
      { new_branchid: "age-005", new_name: "Fès Ville", new_city: "Fès", new_is_active: true }
    ];
    localStorage.setItem(AGENCES_STORAGE_KEY, JSON.stringify(mockAgences));
  }

  // 5. Config
  if (!localStorage.getItem(CONFIG_STORAGE_KEY)) {
    const mockConfig: SystemConfig = {
      new_systemconfigid: "cfg-001",
      new_regle_5_jours_limite: 5,
      new_relance_seuil_jours: 15,
      new_alerte_blocage_jours: 7
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(mockConfig));
  }
};

const enrichDossierWithTrackingDates = (d: Dossier): Dossier => {
  if (!d.new_reception_date) return d;
  
  const baseTime = new Date(d.new_reception_date).getTime();
  
  // 1. Transmission to Prescripteur (1 hour after reception)
  if (d.new_status >= 30 && !d.new_date_trans_prescripteur) {
    d.new_date_trans_prescripteur = new Date(baseTime + 1 * 3600 * 1000).toISOString();
  }
  
  // 2. Accused by Prescripteur (4 hours after transmission)
  if (d.new_status >= 40 && !d.new_date_accuse_prescripteur) {
    const transTime = d.new_date_trans_prescripteur ? new Date(d.new_date_trans_prescripteur).getTime() : baseTime + 1 * 3600 * 1000;
    d.new_date_accuse_prescripteur = new Date(transTime + 4 * 3600 * 1000).toISOString();
  }
  
  // 3. Validated by Prescripteur (1.5 days after accusation)
  if (d.new_status >= 50 && !d.new_date_val_prescripteur) {
    const accuseTime = d.new_date_accuse_prescripteur ? new Date(d.new_date_accuse_prescripteur).getTime() : baseTime + 5 * 3600 * 1000;
    d.new_date_val_prescripteur = new Date(accuseTime + 36 * 3600 * 1000).toISOString();
  }
  
  // 4. BO prep / retour (2 hours after prescripteur validation)
  if (d.new_status >= 60 && !d.new_date_retour_bo) {
    const valTime = d.new_date_val_prescripteur ? new Date(d.new_date_val_prescripteur).getTime() : baseTime + 41 * 3600 * 1000;
    d.new_date_retour_bo = new Date(valTime + 2 * 3600 * 1000).toISOString();
  }
  
  // 5. Transmitted to DCF (1 hour after BO prep or direct creation if flux court)
  if (d.new_status >= 70 && !d.new_date_trans_dcf) {
    const isFluxCourt = d.new_document_type === 400 || d.new_document_type === 500;
    if (isFluxCourt) {
      d.new_date_trans_dcf = new Date(baseTime + 1 * 3600 * 1000).toISOString();
    } else {
      const boTime = d.new_date_retour_bo ? new Date(d.new_date_retour_bo).getTime() : baseTime + 43 * 3600 * 1000;
      d.new_date_trans_dcf = new Date(boTime + 1 * 3600 * 1000).toISOString();
    }
  }
  
  // 6. Accused by DCF (6 hours after transmission to DCF)
  if (d.new_status >= 80 && !d.new_date_accuse_dcf) {
    const transDcfTime = d.new_date_trans_dcf ? new Date(d.new_date_trans_dcf).getTime() : baseTime + 44 * 3600 * 1000;
    d.new_date_accuse_dcf = new Date(transDcfTime + 6 * 3600 * 1000).toISOString();
  }
  
  // 7. Validated by DCF (2 days after DCF accusation)
  if (d.new_status >= 100 && !d.new_date_val_dcf) {
    const accuseDcfTime = d.new_date_accuse_dcf ? new Date(d.new_date_accuse_dcf).getTime() : baseTime + 50 * 3600 * 1000;
    d.new_date_val_dcf = new Date(accuseDcfTime + 48 * 3600 * 1000).toISOString();
  }
  
  // 8. Accused by Trésorerie (if not present and status >= 110, compute as 4 hours after DCF validation)
  if (d.new_status >= 110 && !d.new_date_accuse) {
    const valDcfTime = d.new_date_val_dcf ? new Date(d.new_date_val_dcf).getTime() : baseTime + 98 * 3600 * 1000;
    d.new_date_accuse = new Date(valDcfTime + 4 * 3600 * 1000).toISOString();
  }
  
  return d;
};

export const dataService = {
  getDossiers: async (): Promise<Dossier[]> => {
    // Mode Power Apps
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      const result = await (window as any).Xrm.WebApi.retrieveMultipleRecords("new_dossier", "?$select=new_folder_number,new_status,new_document_type,new_reception_date,new_supplier_id,new_company_id,new_department_id,new_prescriber_id,new_invoice_number,new_po_number,new_invoice_date,new_description,new_dcf_collector_id,new_documents_complements,new_destination_branch_id,new_accuse_par,new_date_accuse");
      return result.entities;
    }
    
    // Mode Local
    initMockData();
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const enriched = data.map(enrichDossierWithTrackingDates);
    return new Promise((resolve) => setTimeout(() => resolve(enriched), 400));
  },

  createDossier: async (dossier: Partial<Dossier>): Promise<string> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      const result = await (window as any).Xrm.WebApi.createRecord("new_dossier", dossier);
      return result.id;
    }

    // Mode Local
    initMockData();
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    
    const newDossier: Dossier = {
      new_folderid: `ID-${Math.random().toString(36).substr(2, 9)}`,
      new_folder_number: dossier.new_folder_number || `DOS-2026-${Math.floor(Math.random() * 1000)}`,
      new_document_type: dossier.new_document_type || 100,
      new_status: dossier.new_status || 10,
      new_supplier_id: dossier.new_supplier_id,
      new_company_id: dossier.new_company_id,
      new_department_id: dossier.new_department_id,
      new_prescriber_id: dossier.new_prescriber_id,
      new_dcf_collector_id: dossier.new_dcf_collector_id,
      new_invoice_number: dossier.new_invoice_number,
      new_po_number: dossier.new_po_number,
      new_invoice_date: dossier.new_invoice_date,
      new_description: dossier.new_description,
      new_documents_complements: dossier.new_documents_complements,
      new_reception_date: dossier.new_reception_date || new Date().toISOString(),
      new_is_blocked: false,
      new_livreur_nom: dossier.new_livreur_nom,
      new_personne_a_livrer: dossier.new_personne_a_livrer,
      new_date_livraison: dossier.new_date_livraison
    };

    data.unshift(newDossier);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    
    return new Promise((resolve) => setTimeout(() => resolve(newDossier.new_folderid), 500));
  },

  updateDossierStatut: async (id: string, status: number): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      await (window as any).Xrm.WebApi.updateRecord("new_dossier", id, { new_status: status });
      return;
    }

    // Mode Local
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const index = data.findIndex(d => d.new_folderid === id);
    if (index !== -1) {
      data[index].new_status = status;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  updateDossier: async (id: string, dossier: Partial<Dossier>): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      await (window as any).Xrm.WebApi.updateRecord("new_dossier", id, dossier);
      return;
    }

    // Mode Local
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const index = data.findIndex(d => d.new_folderid === id);
    if (index !== -1) {
      const nowStr = new Date().toISOString();
      const updatedFields: Partial<Dossier> = { ...dossier };

      if (dossier.new_status !== undefined) {
        const nextStatus = dossier.new_status;
        if (nextStatus === 30) {
          updatedFields.new_date_trans_prescripteur = nowStr;
        } else if (nextStatus === 50) {
          updatedFields.new_date_val_prescripteur = nowStr;
        } else if (nextStatus === 60) {
          updatedFields.new_date_retour_bo = nowStr;
        } else if (nextStatus === 70) {
          updatedFields.new_date_trans_dcf = nowStr;
        } else if (nextStatus === 100) {
          updatedFields.new_date_val_dcf = nowStr;
        }
      }

      data[index] = { ...data[index], ...updatedFields };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  accuseReception: async (id: string, nextStatus: number, user: string): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      const updateData: any = { 
        new_status: nextStatus,
        new_accuse_par: user,
        new_date_accuse: new Date().toISOString()
      };
      await (window as any).Xrm.WebApi.updateRecord("new_dossier", id, updateData);
      return;
    }

    // Mode Local
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const index = data.findIndex(d => d.new_folderid === id);
    if (index !== -1) {
      const nowStr = new Date().toISOString();
      data[index].new_status = nextStatus;
      data[index].new_accuse_par = user;
      data[index].new_date_accuse = nowStr;

      if (nextStatus === 40) {
        data[index].new_date_accuse_prescripteur = nowStr;
      } else if (nextStatus === 80) {
        data[index].new_date_accuse_dcf = nowStr;
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  // User Management
  getUsers: async (): Promise<SystemUser[]> => {
    initMockData();
    const data = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    return new Promise((resolve) => setTimeout(() => resolve(data), 300));
  },
  updateUser: async (id: string, user: Partial<SystemUser>): Promise<void> => {
    const data: SystemUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const index = data.findIndex(u => u.systemuserid === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...user };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 200));
  },
  createUser: async (user: Partial<SystemUser>): Promise<void> => {
    const data: SystemUser[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const newUser: SystemUser = {
      systemuserid: `usr-${Math.random().toString(36).substr(2, 9)}`,
      fullname: user.fullname || "",
      internalemailaddress: user.internalemailaddress || "",
      new_role: user.new_role || "BO",
      new_destination_branch_id: user.new_destination_branch_id,
      new_status: user.new_status || "Actif",
      new_derniere_connexion: undefined
    };
    data.unshift(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
    return new Promise((resolve) => setTimeout(resolve, 200));
  },

  // Fournisseur Reference
  getFournisseursLookup: async (): Promise<FournisseurLookup[]> => {
    initMockData();
    const data = JSON.parse(localStorage.getItem(FOURNISSEURS_STORAGE_KEY) || "[]");
    return new Promise((resolve) => setTimeout(() => resolve(data), 300));
  },
  updateFournisseurLookup: async (id: string, four: Partial<FournisseurLookup>): Promise<void> => {
    const data: FournisseurLookup[] = JSON.parse(localStorage.getItem(FOURNISSEURS_STORAGE_KEY) || "[]");
    const index = data.findIndex(f => f.new_supplierid === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...four };
      localStorage.setItem(FOURNISSEURS_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 200));
  },
  createFournisseurLookup: async (four: Partial<FournisseurLookup>): Promise<void> => {
    const data: FournisseurLookup[] = JSON.parse(localStorage.getItem(FOURNISSEURS_STORAGE_KEY) || "[]");
    const newFour: FournisseurLookup = {
      new_supplierid: `four-${Math.random().toString(36).substr(2, 9)}`,
      new_name: four.new_name || "",
      new_code: four.new_code || `FR-${four.new_name?.toUpperCase().slice(0, 4) || "VND"}-${Math.floor(Math.random() * 90 + 10)}`,
      new_is_active: four.new_is_active !== undefined ? four.new_is_active : true
    };
    data.unshift(newFour);
    localStorage.setItem(FOURNISSEURS_STORAGE_KEY, JSON.stringify(data));
    return new Promise((resolve) => setTimeout(resolve, 200));
  },

  // Agence Reference
  getAgencesLookup: async (): Promise<AgenceLookup[]> => {
    initMockData();
    const data = JSON.parse(localStorage.getItem(AGENCES_STORAGE_KEY) || "[]");
    return new Promise((resolve) => setTimeout(() => resolve(data), 300));
  },
  updateAgenceLookup: async (id: string, agence: Partial<AgenceLookup>): Promise<void> => {
    const data: AgenceLookup[] = JSON.parse(localStorage.getItem(AGENCES_STORAGE_KEY) || "[]");
    const index = data.findIndex(a => a.new_branchid === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...agence };
      localStorage.setItem(AGENCES_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 200));
  },
  createAgenceLookup: async (agence: Partial<AgenceLookup>): Promise<void> => {
    const data: AgenceLookup[] = JSON.parse(localStorage.getItem(AGENCES_STORAGE_KEY) || "[]");
    const newAgence: AgenceLookup = {
      new_branchid: `age-${Math.random().toString(36).substr(2, 9)}`,
      new_name: agence.new_name || "",
      new_city: agence.new_city || "",
      new_is_active: agence.new_is_active !== undefined ? agence.new_is_active : true
    };
    data.unshift(newAgence);
    localStorage.setItem(AGENCES_STORAGE_KEY, JSON.stringify(data));
    return new Promise((resolve) => setTimeout(resolve, 200));
  },

  // System Config
  getSystemConfig: async (): Promise<SystemConfig> => {
    initMockData();
    const data: SystemConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
    return new Promise((resolve) => setTimeout(() => resolve(data), 200));
  },
  updateSystemConfig: async (config: Partial<SystemConfig>): Promise<void> => {
    const data: SystemConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
    const updated = { ...data, ...config };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    return new Promise((resolve) => setTimeout(resolve, 200));
  },

  // Admin Overrides
  deleteDossier: async (id: string): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      await (window as any).Xrm.WebApi.deleteRecord("new_dossier", id);
      return;
    }
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const filtered = data.filter(d => d.new_folderid !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
};

