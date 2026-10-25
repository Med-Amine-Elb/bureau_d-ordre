/** Canonical user-facing labels for Dataverse dossier status values. */
export const DOSSIER_STATUS_LABELS: Readonly<Record<number, string>> = {
  10: "Au BO",
  20: "Hors délai",
  30: "Vers prescripteur",
  40: "Chez prescripteur",
  50: "Vers BO",
  60: "Prêt pour DCF",
  70: "Vers DCF",
  80: "Chez DCF",
  90: "À corriger",
  100: "Vers trésorerie",
  110: "Chez trésorerie",
  120: "Prêt à remettre",
  130: "Vers agence",
  140: "À l’agence",
  150: "Clôturé",
  160: "Archivé",
  170: "Avance clôturée",
  200: "Annulé",
};

export const getDossierStatusLabel = (status: number): string =>
  DOSSIER_STATUS_LABELS[status] ?? `Statut ${status}`;
