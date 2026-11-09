import React, { useState, useEffect } from "react";
import { Send, X } from "lucide-react";
import { dataService } from "../lib/dataService";
import type { SystemUser } from "../lib/dataService";

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
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCollector(initialCollector);
      setComment("");
      setUsers([]);
      setLoadError("");
      if (targetRole === "Prescripteur" && !directionId) {
        setCollector("");
        setLoading(false);
        return;
      }

      setLoading(true);
      dataService.getActiveProfileUsers(
        targetRole === "DCF" ? "DCF" : targetRole === "Trésorerie" ? "Trésorerie" : "Prescripteur",
        directionId,
      )
        .then((res) => {
          setUsers(res);
          setCollector(res.some((user) => user.systemuserid === initialCollector) ? initialCollector : "");
        })
        .catch((err) => {
          console.error("Failed to load users for transmission modal:", err);
          setLoadError(err instanceof Error ? err.message : "Impossible de charger les profils actifs.");
          setCollector("");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, initialCollector, targetRole, directionId]);

  if (!isOpen) return null;

  const canConfirm = !!collector && users.some((user) => user.systemuserid === collector) && !loading && !loadError;
  const recipientLabel = targetRole === "DCF" ? "Collecteur DCF" : targetRole === "Trésorerie" ? "Collecteur Trésorerie" : "Prescripteur";

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
            <Send className="w-5 h-5 text-blue-500" /> Transmission du dossier
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
                Choisir le destinataire ({recipientLabel}) <span className="text-red-500">*</span>
              </label>
              <select
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
                required
                disabled={loading || !!loadError || (targetRole === "Prescripteur" && !directionId) || users.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="" disabled>
                  {loading
                    ? "Chargement des destinataires..."
                    : loadError
                    ? "Profils indisponibles"
                    : targetRole === "Prescripteur" && !directionId
                    ? "Direction du dossier manquante"
                    : users.length === 0
                    ? "Aucun profil actif correspondant"
                    : "Sélectionner un destinataire..."}
                </option>
                {users.map((item) => (
                  <option key={item.systemuserid} value={item.systemuserid}>
                    {item.fullname}
                  </option>
                ))}
              </select>
              {loadError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">Impossible de charger les destinataires depuis les profils actifs. Réessayez après vérification de la connexion Dataverse.</p>}
              {!loadError && !loading && targetRole === "Prescripteur" && !directionId && <p role="alert" className="text-sm text-red-600 dark:text-red-400">Ce dossier n’a pas de direction. Ajoutez une direction avant de le transmettre à un Prescripteur.</p>}
              {!loadError && !loading && directionId && users.length === 0 && <p className="text-sm text-amber-700 dark:text-amber-300">Aucun {recipientLabel} actif n’est configuré{targetRole === "Prescripteur" ? " pour la direction de ce dossier" : ""}.</p>}
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
                  ? "bg-primary hover:bg-primary-hover text-white shadow-primary/20 active:scale-95"
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
