/** User-facing step names used only inside the dossier audit timeline. */
export const DOSSIER_AUDIT_STEP_LABELS: Readonly<Record<number, string>> = {
  10: "Brouillon",
  20: "Hors délai",
  30: "En transit vers prescripteur",
  40: "Chez prescripteur",
  50: "En transit vers BO",
  60: "Complet, prêt pour DCF",
  70: "En transit vers DCF",
  80: "Chez DCF",
  90: "Retour pour correction",
  100: "En transit vers trésorerie",
  110: "Chez trésorerie",
  120: "En attente de remise finale",
  130: "En transport vers agence",
  140: "Disponible en agence",
  150: "Payé",
  160: "Payé – avance",
  170: "Clôturé – avance réglée",
  200: "Annulé",
};

export const getDossierAuditStepLabel = (status: number): string =>
  DOSSIER_AUDIT_STEP_LABELS[status] ?? `Statut ${status}`;
