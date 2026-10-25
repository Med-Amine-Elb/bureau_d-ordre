import React, { useState, useEffect } from "react";
import { X, CheckCircle, Check } from "lucide-react";
import type { Dossier } from "@/lib/dataService";
import DossierInformationPanel from "@/components/DossierInformationPanel";

interface AgenceValiderRemiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { dateRemise: string; scanNom: string; commentaire: string }) => void;
  dossier: Dossier | null;
}

export default function AgenceValiderRemiseModal({
  isOpen,
  onClose,
  onConfirm,
  dossier,
}: AgenceValiderRemiseModalProps) {
  const [dateRemise, setDateRemise] = useState("");
  const [comment, setComment] = useState("");
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (isOpen && dossier) {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];
      setDateRemise(today);
      setComment("");
      setHasSigned(false);
    }
  }, [isOpen, dossier]);

  if (!isOpen || !dossier) return null;

  const canConfirm = hasSigned && dateRemise !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canConfirm) {
      onConfirm({
        dateRemise: new Date(dateRemise).toISOString(),
        scanNom: "",
        commentaire: comment,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-[#1F3B73] dark:text-blue-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Confirmer la remise du chèque
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            
            {/* Chèque details */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Bénéficiaire :</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dossier.new_supplier_id || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">N° Chèque :</span>
                <span className="font-bold text-[#1F3B73] dark:text-blue-400">{dossier.new_cheque_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Banque Émettrice :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_banque_emettrice || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Dossier :</span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">{dossier.new_folder_number}</span>
              </div>
            </div>

            <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">Afficher toutes les informations du dossier</summary>
              <div className="mt-4"><DossierInformationPanel dossier={dossier} /></div>
            </details>

            {/* Date remise effective */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Date de remise effective <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateRemise}
                  onChange={(e) => setDateRemise(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                />
              </div>
            </div>



            {/* Checkbox signature */}
            <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={hasSigned}
                onChange={(e) => setHasSigned(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-blue-500 h-4 w-4"
                required
              />
              <div className="select-none leading-tight">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Signature confirmée <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  Je certifie que le représentant autorisé du fournisseur a signé le cahier de traçabilité d'agence.
                </span>
              </div>
            </label>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Commentaires additionnels (Optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: Remis à Mr. Alaoui (Carte d'identité nationale présentée)..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white resize-none"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className={`px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
                canConfirm
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" /> Valider la remise du chèque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


