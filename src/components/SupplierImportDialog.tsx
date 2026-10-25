import { useMemo, useRef, useState } from "react";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataService, type AgenceLookup, type FournisseurLookup } from "@/lib/dataService";
import { findSupplierImportHeader, supplierImportHeaders, validateSupplierImportRows, type SupplierImportColumn, type SupplierImportRow } from "@/lib/supplierImport";

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date) return value.toISOString();
  if ("text" in value && typeof value.text === "string") return value.text.trim();
  if ("result" in value) return cellText(value.result);
  if ("richText" in value && Array.isArray(value.richText)) return value.richText.map(part => part.text).join("").trim();
  return "";
}

async function downloadTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bureau d'ordre";
  const sheet = workbook.addWorksheet("Fournisseurs");
  sheet.addRow([...supplierImportHeaders]);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3B73" } };
  [38, 22, 30, 20, 38, 22, 25, 20].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRows([
    ["Import des fournisseurs"],
    ["La raison sociale est obligatoire."],
    ["Identifiant fiscal, e-mail, téléphone, adresse, ville et agence sont facultatifs."],
    ["L'agence doit correspondre au nom exact d'une agence active de l'application."],
    ["Actif (Oui/Non) est facultatif; vide signifie Oui. Valeurs acceptées : Oui/Non, true/false, 1/0."],
    ["Ne modifiez pas les en-têtes. Une ligne vide est ignorée."],
    ["Enregistrez le classeur au format .xlsx. Placez les identifiants fiscaux en texte pour préserver les zéros initiaux."],
    ["Les fournisseurs déjà présents (même raison sociale ou identifiant fiscal) seront ignorés et signalés."],
  ]);
  instructions.getColumn(1).width = 110;
  instructions.getRow(1).font = { bold: true, size: 14 };
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "modele_import_fournisseurs.xlsx");
}

export default function SupplierImportDialog({
  suppliers,
  agencies,
  onClose,
  onImported,
}: {
  suppliers: FournisseurLookup[];
  agencies: AgenceLookup[];
  onClose: () => void;
  onImported: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<SupplierImportRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [completedRows, setCompletedRows] = useState<Set<number>>(() => new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const validRows = useMemo(() => rows.filter(row => row.input), [rows]);
  const invalidRows = useMemo(() => rows.filter(row => row.errors.length > 0 || rowErrors[row.rowNumber]), [rows, rowErrors]);
  const pendingRows = validRows.filter(row => !completedRows.has(row.rowNumber));

  const handleFile = async (file?: File) => {
    setRows([]);
    setRowErrors({});
    setCompletedRows(new Set());
    setImportMessage("");
    setParseError("");
    setFileName(file?.name ?? "");
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith(".xlsx")) {
      setParseError("Choisissez un fichier .xlsx. Les anciens fichiers .xls doivent être enregistrés au format .xlsx.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Le fichier dépasse la limite de 10 Mo.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets.find(worksheet => worksheet.name === "Fournisseurs") ?? workbook.worksheets[0];
      if (!sheet || sheet.rowCount < 1) throw new Error("Le classeur ne contient pas de feuille avec une ligne d'en-têtes.");

      const header = findSupplierImportHeader(
        Array.from({ length: Math.min(sheet.rowCount, 10) }, (_, index) => {
          const rowNumber = index + 1;
          const headers: string[] = [];
          sheet.getRow(rowNumber).eachCell({ includeEmpty: false }, cell => headers.push(cellText(cell.value)));
          return { rowNumber, headers };
        }),
      );
      if (!header) {
        throw new Error("Aucun en-tête de raison sociale reconnu dans les 10 premières lignes. Utilisez « Raison sociale * » (feuille Fournisseurs ou première feuille).");
      }

      if (sheet.rowCount - header.rowNumber > 2000) throw new Error("Le fichier dépasse la limite de 2 000 lignes de fournisseurs par import.");
      const inputRows: { rowNumber: number; values: string[] }[] = [];
      for (let rowNumber = header.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber);
        const values = (["name", "taxId", "email", "phone", "address", "city", "agency", "active"] as SupplierImportColumn[]).map(key => {
          const column = header.columnPositions.get(key);
          return column ? cellText(row.getCell(column).value) : "";
        });
        inputRows.push({ rowNumber, values });
      }
      setRows(validateSupplierImportRows(inputRows, suppliers, agencies));
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Lecture du fichier impossible. Vérifiez le format du classeur.");
    }
  };

  const handleImport = async () => {
    if (isImporting || pendingRows.length === 0) return;
    setIsImporting(true);
    setImportMessage("");
    const succeeded = new Set(completedRows);
    const failures: Record<number, string> = {};

    for (const row of pendingRows) {
      try {
        await dataService.createFournisseurLookup(row.input!);
        succeeded.add(row.rowNumber);
      } catch {
        failures[row.rowNumber] = "Échec de création Dataverse. Vérifiez vos droits et votre connexion, puis réessayez cette ligne.";
      }
      setCompletedRows(new Set(succeeded));
      setRowErrors({ ...failures });
    }

    setCompletedRows(succeeded);
    setRowErrors(failures);
    if (succeeded.size > completedRows.size) {
      setImportMessage(`${succeeded.size - completedRows.size} fournisseur(s) importé(s).`);
      await onImported();
    }
    if (Object.keys(failures).length > 0) setImportMessage("Certaines lignes n'ont pas pu être enregistrées; vous pouvez réessayer uniquement celles-ci.");
    setIsImporting(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try { await downloadTemplate(); }
    catch { setParseError("Téléchargement du modèle impossible."); }
    finally { setIsDownloading(false); }
  };

  return <Dialog open onOpenChange={open => { if (!open && !isImporting) onClose(); }}>
    <DialogContent showCloseButton={!isImporting} className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-4xl">
      <DialogHeader className="pr-6">
        <DialogTitle>Importer des fournisseurs depuis Excel</DialogTitle>
        <DialogDescription>Prévisualisez et validez les lignes avant leur création dans Dataverse.</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
          <p className="font-bold">Obligatoire : Raison sociale.</p>
          <p className="mt-1">Identifiant fiscal, e-mail, téléphone, adresse, ville et agence sont facultatifs. Le statut Actif est facultatif et vaut Oui par défaut.</p>
          <p className="mt-1 text-xs">L’agence doit être active et son nom doit correspondre à celui de l’application. Les doublons de raison sociale ou d’identifiant fiscal sont signalés, pas créés.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={isDownloading || isImporting} onClick={() => void handleDownload()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <Download className="h-4 w-4" />{isDownloading ? "Préparation…" : "Télécharger le modèle .xlsx"}
          </button>
          <button type="button" disabled={isImporting} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[#1F3B73] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16294F] disabled:opacity-50">
            <Upload className="h-4 w-4" />Choisir un fichier Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" aria-label="Sélectionner le fichier Excel des fournisseurs" onChange={event => void handleFile(event.target.files?.[0])} />
        </div>

        {fileName && <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />{fileName}</p>}
        {parseError && <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{parseError}</p>}
        {importMessage && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle className="h-4 w-4 shrink-0" />{importMessage}</p>}

        {rows.length > 0 && <>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><strong>{validRows.length}</strong> ligne(s) prêtes</span>
            <span className={invalidRows.length ? "text-red-600 dark:text-red-300" : "text-slate-500"}><strong>{invalidRows.length}</strong> à corriger/ignorer</span>
            <span className="text-emerald-700 dark:text-emerald-300"><strong>{completedRows.size}</strong> déjà importée(s)</span>
          </div>
          <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr><th className="px-3 py-2">Ligne</th><th className="px-3 py-2">Raison sociale</th><th className="px-3 py-2">Identifiant fiscal</th><th className="px-3 py-2">Résultat</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map(row => <tr key={row.rowNumber} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.input?.new_name ?? "—"}</td>
                  <td className="px-3 py-2">{row.input?.new_code || "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {completedRows.has(row.rowNumber) ? <span className="text-emerald-700 dark:text-emerald-300">Importé</span> : [...row.errors, rowErrors[row.rowNumber]].filter(Boolean).join(" ") || <span className="text-emerald-700 dark:text-emerald-300">Prêt</span>}
                  </td>
                </tr>)}
                {rows.length > 100 && <tr><td colSpan={4} className="px-3 py-2 text-center text-xs text-slate-500">Aperçu limité aux 100 premières lignes; toutes les lignes valides seront importées.</td></tr>}
              </tbody>
            </table>
          </div>
        </>}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" disabled={isImporting} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">Fermer</button>
          <button type="button" disabled={isImporting || pendingRows.length === 0} onClick={() => void handleImport()} className="inline-flex items-center gap-2 rounded-xl bg-[#1F3B73] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Upload className="h-4 w-4" />{isImporting ? "Import en cours…" : pendingRows.length ? `Importer ${pendingRows.length} fournisseur(s)` : "Aucune ligne à importer"}
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
