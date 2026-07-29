import type { Dossier } from "./dataService";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "transit" | "action" | "correction";
  path: string;
  date: string;
  dossierNumber: string;
}

interface NotificationRule {
  status: number;
  message: string;
  type: "transit" | "action" | "correction";
  pathTemplate: string;
  paymentMethod?: number; // 1 = Chèque, 2 = Virement
  chequeRecuBo?: boolean;
}

export const NOTIFICATION_CONFIG: Record<string, NotificationRule[]> = {
  BO: [
    { status: 50, message: "Dossier en attente d'accusé de réception", type: "transit", pathTemplate: "/bo/dossiers/{id}" },
    { status: 60, message: "Dossier en attente de transmission à la DCF", type: "action", pathTemplate: "/bo/dossiers/{id}" },
    { status: 120, message: "Chèque en attente d'accusé de réception", type: "transit", pathTemplate: "/bo/remises", paymentMethod: 1, chequeRecuBo: false },
    { status: 120, message: "Chèque en attente d'expédition ou remise", type: "action", pathTemplate: "/bo/remises", paymentMethod: 1, chequeRecuBo: true },
    { status: 150, message: "Dossier réglé par virement bancaire", type: "action", pathTemplate: "/bo/dossiers/{id}", paymentMethod: 2 }
  ],
  Prescripteur: [
    { status: 30, message: "Dossier en attente d'accusé de réception", type: "transit", pathTemplate: "/prescripteur/dossiers/{id}" },
    { status: 40, message: "Dossier en attente de validation", type: "action", pathTemplate: "/prescripteur/dossiers/{id}" }
  ],
  DCF: [
    { status: 70, message: "Dossier en attente d'accusé de réception", type: "transit", pathTemplate: "/dcf/dossiers/{id}" },
    { status: 80, message: "Dossier en attente de traitement/comptabilisation", type: "action", pathTemplate: "/dcf/dossiers/{id}" }
  ],
  Tresorerie: [
    { status: 100, message: "Dossier en attente d'accusé de réception", type: "transit", pathTemplate: "/tresorerie/dossiers/{id}" },
    { status: 110, message: "Dossier en attente de règlement", type: "action", pathTemplate: "/tresorerie/dossiers/{id}" }
  ],
  Agence: [
    { status: 130, message: "Chèque en transit (en attente d'accusé de réception)", type: "transit", pathTemplate: "/agence/cheques" },
    { status: 140, message: "Chèque en attente de remise fournisseur", type: "action", pathTemplate: "/agence/cheques" }
  ]
};

export const generateNotifications = (
  dossiersList: Dossier[],
  role: string,
  userAgence: string
): AppNotification[] => {
  const list: AppNotification[] = [];
  const rules = NOTIFICATION_CONFIG[role];
  if (!rules) return [];

  dossiersList.forEach((d) => {
    // Agence branch checking isolation
    if (role === "Agence") {
      if (!userAgence || d.new_destination_branch_id !== userAgence) {
        return;
      }
    }

    rules.forEach((rule) => {
      // Check status matching
      if (d.new_status !== rule.status) return;

      // Check payment method filter if present
      if (rule.paymentMethod !== undefined && d.new_payment_method !== rule.paymentMethod) return;

      // Check physical cheque receipt status check if present
      if (rule.chequeRecuBo !== undefined && !!d.new_cheque_recu_bo !== rule.chequeRecuBo) return;

      // Determine correct title prefix (Chèque vs Dossier)
      const isCheque = rule.paymentMethod === 1 || role === "Agence";
      const title = isCheque
        ? `Chèque ${d.new_cheque_number || d.new_folder_number}`
        : `Dossier ${d.new_folder_number}`;

      // Build path from template
      const path = rule.pathTemplate.replace("{id}", d.new_folderid || "");

      // Dynamic unique ID generation
      const id = `${role.toLowerCase()}-${rule.status}-${d.new_folderid}`;

      list.push({
        id,
        title,
        message: rule.message,
        type: rule.type,
        path,
        date: d.new_reception_date || new Date().toISOString(),
        dossierNumber: d.new_folder_number
      });
    });
  });

  return list;
};
