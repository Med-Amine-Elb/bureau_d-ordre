import React, { useState, useEffect } from "react";
import { Send, X } from "lucide-react";
import { dataService } from "../lib/dataService";

interface TransmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { collecteur: string; commentaire: string }) => void;
  dossierNumber: string;
  targetRole: "Prescripteur" | "DCF" | "Trésorerie";
  initialCollector?: string;
  directionId?: string;
}

export default function TransmissionModal({
  isOpen,
  onClose,
  onConfirm,
  dossierNumber,
  targetRole,
  initialCollector = "",
  directionId,
}: TransmissionModalProps) {
  const [collector, setCollector] = useState(initialCollector);
  const [comment, setComment] = useState("");
  const [physicalHandoffConfirmed, setPhysicalHandoffConfirmed] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCollector(initialCollector);
      setComment("");
      setPhysicalHandoffConfirmed(false);
      setLoading(true);
      
      dataService.getUsers()
        .then((res) => {
          setUsers(res);
        })
        .catch((err) => {
          console.error("Failed to load users for transmission modal:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, initialCollector]);

  if (!isOpen) return null;

  // Filter users based on targetRole and directionId
  const filteredUsers = users.filter((u) => {
    if (targetRole === "Prescripteur") {
      // Filter by direction if directionId is specified
      return !directionId || u.new_department_id === directionId;
    }
    // For DCF and Trésorerie, show all users
    return true;
  });

  const canConfirm = collector !== "" && physicalHandoffConfirmed;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (canConfirm) {
      onConfirm({ collecteur: collector, commentaire: comment });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" /> Transmission du Dossier
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="p-6 space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-300">
              Vous vous apprêtez à transmettre le dossier <strong className="text-blue-900 dark:text-blue-100 font-bold">{dossierNumber}</strong> vers la direction cible : <span className="font-bold">{targetRole === "DCF" ? "Comptabilité (DCF)" : targetRole === "Trésorerie" ? "Trésorerie" : "Prescripteur"}</span>.
            </div>

            {/* Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Choisir le destinataire ({targetRole === "DCF" ? "Collecteur DCF" : targetRole === "Trésorerie" ? "Collecteur Trésorerie" : "Prescripteur"}) <span className="text-red-500">*</span>
              </label>
              <select
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">
                  {loading
                    ? "Chargement des destinataires..."
                    : filteredUsers.length === 0
                    ? "Aucun destinataire disponible pour cette direction"
                    : "Sélectionner un destinataire..."}
                </option>
                {filteredUsers.map((item) => (
                  <option key={item.systemuserid} value={item.systemuserid}>
                    {item.fullname}
                  </option>
                ))}
              </select>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Commentaires d'émission (Optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter des notes concernant la transmission physique..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Physical Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={physicalHandoffConfirmed}
                onChange={(e) => setPhysicalHandoffConfirmed(e.target.checked)}
                className="mt-1 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 select-none leading-relaxed">
                Je confirme avoir physiquement transmis ce dossier / pli à l'acteur ou au collecteur concerné. <span className="text-red-500">*</span>
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
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" /> Transmettre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
