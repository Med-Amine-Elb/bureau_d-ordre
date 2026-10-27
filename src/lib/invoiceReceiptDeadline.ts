import { differenceInDays, parseISO } from "date-fns";

export function isInvoiceReceiptOverdue(
  invoiceDate: string | null | undefined,
  receptionDate: string | null | undefined,
  limitDays: number,
): boolean {
  if (!invoiceDate || !receptionDate) return false;
  return differenceInDays(parseISO(receptionDate), parseISO(invoiceDate)) > limitDays;
}
