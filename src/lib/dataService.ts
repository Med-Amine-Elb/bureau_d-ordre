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
}

const LOCAL_STORAGE_KEY = "gbm_mock_dossiers";

// Initialisation de fausses données si le local storage est vide
const initMockData = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
    const mockData: Dossier[] = [
      { new_dossierid: "DOS-001", new_numero_dossier: "DOS-2026-102 (Facture IT)", new_type_document: 100, new_statut: 150, new_date_reception: new Date().toISOString(), new_montant: 124839 },
      { new_dossierid: "DOS-002", new_numero_dossier: "DOS-2026-101 (Achat Matériel)", new_type_document: 100, new_statut: 40, new_date_reception: new Date().toISOString(), new_montant: 92662 },
      { new_dossierid: "DOS-003", new_numero_dossier: "DOS-2026-098 (Prestation Svc)", new_type_document: 300, new_statut: 70, new_date_reception: new Date().toISOString(), new_montant: 74048 },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockData));
  }
};

export const dataService = {
  getDossiers: async (): Promise<Dossier[]> => {
    // Mode Power Apps
    if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
      const result = await (window as any).Xrm.WebApi.retrieveMultipleRecords("new_dossier", "?$select=new_numero_dossier,new_statut,new_type_document,new_date_reception");
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
  }
};
