import React, { useState, useEffect } from "react";
import { X, CheckCircle, Calendar, Check } from "lucide-react";
import type { Dossier } from "@/lib/dataService";
import DossierInformationPanel from "@/components/DossierInformationPanel";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface AgenceAccuseReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { commentaire: string }) => void;
  dossier: Dossier | null;
}

export default function AgenceAccuseReceptionModal({
  isOpen,
  onClose,
  onConfirm,
  dossier,
}: AgenceAccuseReceptionModalProps) {
  const [comment, setComment] = useState("");
  const [confirmedPhysical, setConfirmedPhysical] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setComment("");
      setConfirmedPhysical(false);
    }
  }, [isOpen, dossier]);

  if (!isOpen || !dossier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmedPhysical) {
      onConfirm({ commentaire: comment });
    }
  };

  const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });
  const dateExpedStr = dossier.new_date_transmission_bo
    ? format(parseISO(dossier.new_date_transmission_bo), "dd MMMM yyyy", { locale: fr })
    : "-";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-[#1F3B73] dark:text-blue-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Accusé de réception du chèque (agence)
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
            
            {/* Expedition details */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">N° Dossier :</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dossier.new_folder_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Fournisseur :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{dossier.new_supplier_id || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">N° Chèque / Banque :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {dossier.new_cheque_number || "-"} ({dossier.new_banque_emettrice || "-"})
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Expédié par le BO le :</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{dateExpedStr}</span>
              </div>
              {dossier.new_commentaire_agence && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Mode d'Expédition :</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{dossier.new_commentaire_agence}</span>
                </div>
              )}
              {dossier.new_livreur_nom && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Chauffeur :</span>
                  <span className="font-bold text-primary dark:text-blue-400">{dossier.new_livreur_nom}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Agence de destination :</span>
                <span className="font-semibold text-[#1F3B73] dark:text-blue-400">{dossier.new_destination_branch_id || "-"}</span>
              </div>
            </div>

            <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">Afficher toutes les informations du dossier</summary>
              <div className="mt-4"><DossierInformationPanel dossier={dossier} /></div>
            </details>

            {/* Date de réception (Automatic) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Date de Réception en Agence (Automatique)
              </label>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                <Calendar className="w-4 h-4 text-[#1F3B73] dark:text-blue-400" />
                {todayStr}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Commentaires / Notes (Optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Indiquez des détails supplémentaires (ex: enveloppe scellée, reçue par courrier interne)..."
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
                Je confirme avoir reçu physiquement le chèque signé correspondant à ce dossier. <span className="text-red-500">*</span>
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
              disabled={!confirmedPhysical}
              className={`px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
                confirmedPhysical
                  ? "bg-[#1F3B73] hover:bg-[#16294F] text-white shadow-primary/20 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" /> Enregistrer la réception
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


