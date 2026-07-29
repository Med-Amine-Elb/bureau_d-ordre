import type { Dossier } from "./dataService";

export const cleanString = (str: string): string => {
  if (!str) return "";
  return str.replace(/[\s\-_]/g, "").toLowerCase();
};

export const filterDossiers = (dossiers: Dossier[], queryText: string): Dossier[] => {
  const query = cleanString(queryText);
  if (!query) return [];
  
  return dossiers.filter((d) => {
    const folderNum = cleanString(d.new_folder_number || "");
    const poNum = cleanString(d.new_po_number || "");
    const invNum = cleanString(d.new_invoice_number || "");
    const supplier = cleanString(d.new_supplier_id || "");
    
    return (
      folderNum.includes(query) ||
      poNum.includes(query) ||
      invNum.includes(query) ||
      supplier.includes(query)
    );
  });
};
