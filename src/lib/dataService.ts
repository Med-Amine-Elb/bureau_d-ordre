// Ce service fait le pont entre l'application React et Dataverse.
// En mode local (sur votre PC), il utilise le LocalStorage pour simuler la base de données.
// En production (Power Apps), il utilisera window.Xrm.WebApi.

export interface Dossier {
  new_dossierid: string;
  new_numero_dossier: string;
  new_type_document: number;
  new_statut: number;
  new_fournisseur_nom?: string;
  new_societe_gbm?: string;
  new_direction?: string;
  new_prescripteur?: string;
  new_collecteur_dcf?: string;
  new_numero_facture?: string;
  new_numero_bc?: string;
  new_date_facture?: string;
  new_devise?: string;
  new_description?: string;
  new_montant?: number;
  new_date_reception: string;
  new_est_bloque?: boolean;
  new_documents_complements?: string[];
  new_agence_destination?: string;
  new_accuse_par?: string;
  new_date_accuse?: string;
}

const LOCAL_STORAGE_KEY = "gbm_mock_dossiers_v3";

// Initialisation de fausses données si le local storage est vide
const initMockData = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
    const mockData: Dossier[] = [
      { 
        new_dossierid: "DOS-001", 
        new_numero_dossier: "DOS-2026-001", 
        new_type_document: 100, 
        new_statut: 150, 
        new_fournisseur_nom: "MAROC TELECOM",
        new_societe_gbm: "GBM_CASA",
        new_direction: "IT",
        new_prescripteur: "Amine Elboubakri",
        new_date_reception: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 4500.00,
        new_numero_facture: "FACT-MT-998",
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_dossierid: "DOS-002", 
        new_numero_dossier: "DOS-2026-002", 
        new_type_document: 100, 
        new_statut: 40, 
        new_fournisseur_nom: "OFFICE DEPOT",
        new_societe_gbm: "GBM_RABAT",
        new_direction: "ACHATS",
        new_prescripteur: "Sarah Alaoui",
        new_date_reception: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 1250.50,
        new_numero_facture: "OD-2026-ABC",
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf"]
      },
      { 
        new_dossierid: "DOS-003", 
        new_numero_dossier: "DOS-2026-003", 
        new_type_document: 300, 
        new_statut: 70, 
        new_fournisseur_nom: "SGS MAROC",
        new_societe_gbm: "GBM_CASA",
        new_direction: "RH",
        new_prescripteur: "Youssef Naciri",
        new_date_reception: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 8900.00,
        new_numero_facture: "SGS-INV-001",
        new_documents_complements: ["Contrat cadre.pdf", "Annexe technique.pdf"]
      },
      { 
        new_dossierid: "DOS-004", 
        new_numero_dossier: "DOS-2026-004", 
        new_type_document: 100, 
        new_statut: 20, 
        new_fournisseur_nom: "LYDEC",
        new_societe_gbm: "GBM_CASA",
        new_direction: "MOYENS GENERAUX",
        new_prescripteur: "Rida Benali",
        new_date_reception: new Date().toISOString(), 
        new_date_facture: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // > 5 days diff
        new_montant: 320.00,
        new_numero_facture: "LYD-09-2026",
        new_est_bloque: true,
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_dossierid: "DOS-005", 
        new_numero_dossier: "DOS-2026-005", 
        new_type_document: 400, 
        new_statut: 120, 
        new_fournisseur_nom: "CLEANING SERVICES SARL",
        new_societe_gbm: "GBM_RABAT",
        new_direction: "RH",
        new_prescripteur: "Mouna El Fassi",
        new_date_reception: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 15000.00,
        new_numero_facture: "DEM-CHQ-001",
        new_documents_complements: ["Demande de chèque.pdf", "Proforma.pdf"]
      },
      { 
        new_dossierid: "DOS-006", 
        new_numero_dossier: "DOS-2026-006", 
        new_type_document: 200, 
        new_statut: 10, 
        new_fournisseur_nom: "ACER MAROC",
        new_societe_gbm: "GBM_CASA",
        new_direction: "IT",
        new_prescripteur: "Amine Elboubakri",
        new_date_reception: new Date().toISOString(), 
        new_date_facture: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: -500.00,
        new_numero_facture: "AVOIR-ACER-12",
        new_documents_complements: ["Note de crédit.pdf"]
      },
      { 
        new_dossierid: "DOS-007", 
        new_numero_dossier: "DOS-2026-007", 
        new_type_document: 100, 
        new_statut: 30, 
        new_fournisseur_nom: "LABEL VIE",
        new_societe_gbm: "GBM_CASA",
        new_direction: "ACHATS",
        new_prescripteur: "Sarah Alaoui",
        new_date_reception: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 2450.00,
        new_numero_facture: "LV-P12",
        new_documents_complements: ["Facture originale.pdf", "Bon de réception (BR).pdf"]
      },
      { 
        new_dossierid: "DOS-008", 
        new_numero_dossier: "DOS-2026-008", 
        new_type_document: 500, 
        new_statut: 80, 
        new_fournisseur_nom: "COSUMAR",
        new_societe_gbm: "GBM_RABAT",
        new_direction: "IT",
        new_prescripteur: "Hicham Berrada",
        new_collecteur_dcf: "Karim Idrissi",
        new_date_reception: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 50000.00,
        new_numero_facture: "ACP-COS-01",
        new_documents_complements: ["Document divers.pdf"]
      },
      { 
        new_dossierid: "DOS-009", 
        new_numero_dossier: "DOS-2026-009", 
        new_type_document: 100, 
        new_statut: 90, 
        new_fournisseur_nom: "HPS",
        new_societe_gbm: "GBM_CASA",
        new_direction: "IT",
        new_prescripteur: "Amine Elboubakri",
        new_date_reception: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 12000.00,
        new_numero_facture: "HPS-INV-01",
        new_documents_complements: ["Facture originale.pdf", "Bon de commande.pdf"]
      },
      { 
        new_dossierid: "DOS-010", 
        new_numero_dossier: "DOS-2026-010", 
        new_type_document: 100, 
        new_statut: 140, 
        new_fournisseur_nom: "AFRIQUIA",
        new_societe_gbm: "GBM_CASA",
        new_direction: "ACHATS",
        new_prescripteur: "Sarah Alaoui",
        new_agence_destination: "Casa Anfa",
        new_date_reception: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), 
        new_date_facture: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        new_montant: 3500.00,
        new_numero_facture: "AFR-GAS-01",
        new_documents_complements: ["Facture originale.pdf", "Bon de réception (BR).pdf"]
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockData));
  }
};

export const dataService = {
  getDossiers: async (): Promise<Dossier[]> => {
    // Mode Power Apps
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      const result = await (window as any).Xrm.WebApi.retrieveMultipleRecords("new_dossier", "?$select=new_numero_dossier,new_statut,new_type_document,new_date_reception,new_fournisseur_nom,new_societe_gbm,new_direction,new_prescripteur,new_numero_facture,new_numero_bc,new_date_facture,new_description,new_collecteur_dcf,new_documents_complements,new_agence_destination,new_accuse_par,new_date_accuse");
      return result.entities;
    }
    
    // Mode Local
    initMockData();
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    return new Promise((resolve) => setTimeout(() => resolve(data), 400)); // Simule un chargement
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
      new_dossierid: `ID-${Math.random().toString(36).substr(2, 9)}`,
      new_numero_dossier: dossier.new_numero_dossier || `DOS-2026-${Math.floor(Math.random() * 1000)}`,
      new_type_document: dossier.new_type_document || 100,
      new_statut: dossier.new_statut || 10,
      new_fournisseur_nom: dossier.new_fournisseur_nom,
      new_societe_gbm: dossier.new_societe_gbm,
      new_direction: dossier.new_direction,
      new_prescripteur: dossier.new_prescripteur,
      new_collecteur_dcf: dossier.new_collecteur_dcf,
      new_numero_facture: dossier.new_numero_facture,
      new_numero_bc: dossier.new_numero_bc,
      new_date_facture: dossier.new_date_facture,
      new_devise: dossier.new_devise,
      new_description: dossier.new_description,
      new_montant: dossier.new_montant,
      new_documents_complements: dossier.new_documents_complements,
      new_date_reception: dossier.new_date_reception || new Date().toISOString(),
      new_est_bloque: false
    };

    data.unshift(newDossier); // Ajoute au début
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    
    return new Promise((resolve) => setTimeout(() => resolve(newDossier.new_dossierid), 500));
  },

  updateDossierStatut: async (id: string, statut: number): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      await (window as any).Xrm.WebApi.updateRecord("new_dossier", id, { new_statut: statut });
      return;
    }

    // Mode Local
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const index = data.findIndex(d => d.new_dossierid === id);
    if (index !== -1) {
      data[index].new_statut = statut;
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
    const index = data.findIndex(d => d.new_dossierid === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...dossier };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  },

  accuseReception: async (id: string, nextStatus: number, user: string): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      await (window as any).Xrm.WebApi.updateRecord("new_dossier", id, { 
        new_statut: nextStatus,
        new_accuse_par: user,
        new_date_accuse: new Date().toISOString()
      });
      return;
    }

    // Mode Local
    const data: Dossier[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const index = data.findIndex(d => d.new_dossierid === id);
    if (index !== -1) {
      data[index].new_statut = nextStatus;
      data[index].new_accuse_par = user;
      data[index].new_date_accuse = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
};
