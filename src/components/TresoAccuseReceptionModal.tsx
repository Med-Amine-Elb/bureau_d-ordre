import React, { useState, useEffect } from "react";
import { X, CheckCircle, Calendar, FileText, Check } from "lucide-react";
import type { Dossier } from "@/lib/dataService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TresoAccuseReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { commentaire: string; documentsRecons: string[] }) => void;
  dossier: Dossier | null;
}

export default function TresoAccuseReceptionModal({
  isOpen,
  onClose,
  onConfirm,
  dossier,
}: TresoAccuseReceptionModalProps) {
  const [comment, setComment] = useState("");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [confirmedPhysical, setConfirmedPhysical] = useState(false);

  // Get documents checklist based on type or existing complements
  const getChecklist = (): string[] => {
    if (!dossier) return [];
    if (dossier.new_documents_complements && dossier.new_documents_complements.length > 0) {
      return dossier.new_documents_complements;
    }
    // Default checklists if complements are empty
    switch (dossier.new_document_type) {
      case 100:
        return ["Facture Originale", "Bon de Commande (BC)", "Bon de Livraison (BL) / Attestation de Service", "Attestation Fiscale"];
      case 200:
        return ["Avoir Original"];
      case 500:
        return ["Demande d'acompte", "Facture / Devis"];
      default:
        return ["Document principal"];
    }
  };

  const checklist = getChecklist();

  useEffect(() => {
    if (isOpen) {
      setComment("");
      setConfirmedPhysical(false);
      // Initialize all docs as checked (or unchecked)
      const initialChecked: Record<string, boolean> = {};
      checklist.forEach((doc) => {
        initialChecked[doc] = false;
      });
      setCheckedDocs(initialChecked);
    }
  }, [isOpen, dossier]);

  if (!isOpen || !dossier) return null;

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc],
    }));
  };

  const allDocsChecked = checklist.length === 0 || checklist.every((doc) => checkedDocs[doc]);
  const canConfirm = allDocsChecked && confirmedPhysical;

  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {};
    checklist.forEach((doc) => {
      updated[doc] = true;
    });
    setCheckedDocs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canConfirm) {
      const selected = checklist.filter((doc) => checkedDocs[doc]);
      onConfirm({ commentaire: comment, documentsRecons: selected });
    }
  };

  const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-[#1F3B73] dark:text-blue-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Accusé de réception (trésorerie)
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
            
            {/* transmission details */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">N° Dossier :</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dossier.new_folder_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Fournisseur :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_supplier_id || "-"}</span>
              </div>
            </div>

            {/* Date de réception (Automatic) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Date de Réception (Automatique)
              </label>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                <Calendar className="w-4 h-4 text-[#1F3B73] dark:text-blue-400" />
                {todayStr}
              </div>
            </div>

            {/* Checklist des documents reçus */}
            {checklist.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Vérification des pièces jointes <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-[#1F3B73] dark:text-blue-400 hover:underline"
                  >
                    Tout cocher
                  </button>
                </div>
                <div className="space-y-2">
                  {checklist.map((doc) => (
                    <label
                      key={doc}
                      onClick={() => toggleDoc(doc)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        checkedDocs[doc]
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-400"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          checkedDocs[doc]
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {checkedDocs[doc] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="w-4 h-4 opacity-70" />
                        {doc}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Commentaires de réception (Optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: Dossier reçu complet, signature sur le cahier de transmission."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Physical Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={confirmedPhysical}
                onChange={(e) => setConfirmedPhysical(e.target.checked)}
                className="mt-1 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 select-none leading-relaxed">
                Je confirme avoir reçu physiquement le dossier et ses pièces jointes conformes. <span className="text-red-500">*</span>
              </span>
            </label>
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
                  ? "bg-[#1F3B73] hover:bg-[#16294F] text-white shadow-primary/20 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" /> Confirmer la réception
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


