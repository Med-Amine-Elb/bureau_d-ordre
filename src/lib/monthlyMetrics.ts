import { isSameMonth, parseISO } from "date-fns";

/** Safely checks whether a Dataverse date belongs to the selected calendar month. */
export function isDateInMonth(value: string | undefined, month: Date): boolean {
  if (!value) return false;

  const parsedDate = parseISO(value);
  return !Number.isNaN(parsedDate.getTime()) && isSameMonth(parsedDate, month);
}

/** Uses the actual completion date for each settlement route. */
export function isDossierPaidInMonth(
  dossier: {
    new_status: number;
    new_payment_method?: number;
    new_date_virement?: string;
    new_final_delivery_date?: string;
  },
  month: Date,
): boolean {
  if (dossier.new_status !== 150) return false;
  const paidDate = dossier.new_payment_method === 2
    ? dossier.new_date_virement
    : dossier.new_final_delivery_date;
  return isDateInMonth(paidDate, month);
}
