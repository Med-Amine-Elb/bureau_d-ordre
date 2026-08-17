import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Dossier } from "../lib/dataService";

/**
 * Format a date string safely
 */
export const formatDateSafely = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: fr });
  } catch (e) {
    return dateString;
  }
};

export const getTypeLabel = (type: number) => {
  switch (type) {
    case 100: return "Facture";
    case 200: return "Avoir";
    case 500: return "Acompte";
    case 600: return "Courrier";
    default: return `Type ${type}`;
  }
};

export const getStatusLabel = (status: number) => {
  switch (status) {
    case 10: return "Nouveau";
    case 20: return "En cours de numérisation";
    case 30: return "Transmis au prescripteur";
    case 40: return "Réception physique par prescripteur";
    case 50: return "En cours de validation";
    case 60: return "Validé";
    case 70: return "En transit DCF";
    case 80: return "Chez DCF";
    case 90: return "Retour (Correction demandée)";
    case 100: return "Transmis Trésorerie";
    case 110: return "Chez Trésorerie (À Préparer)";
    case 120: return "En Attente Remise Finale";
    case 130: return "En Transport";
    case 140: return "Disponible en Agence";
    case 150: return "Remis / Clôturé";
    case 160: return "Archivé";
    default: return `Statut ${status}`;
  }
};

/**
 * Legacy export for any object array (keeps old pages working until updated)
 */
export const exportToExcel = async (data: any[], filename: string, sheetName: string = "Données") => {
  if (!data || data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Add Header Row
  worksheet.addRow(headers);
  
  // Add Data Rows
  data.forEach(item => {
    worksheet.addRow(headers.map(h => item[h]));
  });

  // Style Header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F3B73" } // Navy blue background
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  
  // Auto-fit columns
  worksheet.columns.forEach((col, i) => {
    let maxLength = headers[i].length;
    data.forEach(row => {
      const val = row[headers[i]];
      if (val) {
        const valStr = String(val);
        if (valStr.length > maxLength) {
          maxLength = valStr.length;
        }
      }
    });
    col.width = Math.min(maxLength + 2, 50);
    
    // Add thin borders to all cells
    col.eachCell!({ includeEmpty: true }, (cell, rowNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      // Alternate row colors for data
      if (rowNumber > 1) {
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" } // Slate-50
          };
        }
      }
    });
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = format(new Date(), "yyyyMMdd_HHmmss");
  saveAs(new Blob([buffer]), `${filename}_${dateStr}.xlsx`);
};

/**
 * Detailed export for Dossiers with beautiful formatting
 */
export const exportDossiersToExcelDetailed = async (dossiers: Dossier[], filename: string) => {
  if (!dossiers || dossiers.length === 0) return;

  const dataToExport = dossiers.map(d => ({
    "N° Dossier": d.new_folder_number || "",
    "Fournisseur": d.new_supplier_id || d.new_livreur_nom || "",
    "Société": d.new_company_id || "",
    "N° Facture": d.new_invoice_number || "",
    "N° BC": d.new_po_number || "",
    "Date Facture": formatDateSafely(d.new_invoice_date),
    "Type Document": getTypeLabel(d.new_document_type),
    "Statut Code": d.new_status,
    "Statut Libellé": getStatusLabel(d.new_status),
    "Bloqué Administratif": d.new_is_blocked ? "OUI" : "NON",
    "Motif de Blocage": d.new_motif_blocage || "",
    "Date Réception BO": formatDateSafely(d.new_reception_date),
    "Prescripteur Actuel": d.new_prescriber_id || "",
    "Date Envoi Prescripteur": formatDateSafely(d.new_date_trans_prescripteur),
    "Date Accusé Prescripteur": formatDateSafely(d.new_date_accuse_prescripteur),
    "Date Validation Prescripteur": formatDateSafely(d.new_date_val_prescripteur),
    "Comptable DCF": d.new_dcf_collector_id || "",
    "Date Envoi DCF": formatDateSafely(d.new_date_trans_dcf),
    "Date Accusé DCF": formatDateSafely(d.new_date_accuse_dcf),
    "Date Validation DCF": formatDateSafely(d.new_date_val_dcf),
    "Agent Trésorerie": d.new_collecteur_treso || "",
    "Mode de Paiement": d.new_payment_method === 1 ? "Virement" : d.new_payment_method === 2 ? "Chèque" : d.new_payment_method === 3 ? "Espèces" : "Non défini",
    "N° Chèque / Virement": d.new_cheque_number || d.new_wire_reference || "",
    "Date Disponibilité": formatDateSafely(d.new_cheque_preparation_date),
    "Date Remise Finale": formatDateSafely(d.new_final_delivery_date),
    "Remis à (Personne)": d.new_person_to_deliver || "",
    "Observation Générale": d.new_description || ""
  }));

  await exportToExcel(dataToExport, filename, "Dossiers Extraction");
};
