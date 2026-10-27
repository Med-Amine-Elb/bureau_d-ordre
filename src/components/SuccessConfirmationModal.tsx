import { CheckCircle2 } from "lucide-react";

interface SuccessConfirmationModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function SuccessConfirmationModal({ open, message, onClose }: SuccessConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="success-confirmation-title" className="w-full max-w-sm animate-in zoom-in-95 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-200 dark:border-slate-700 dark:bg-[#0F172B]">
        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
          </div>
          <h2 id="success-confirmation-title" className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Confirmation</h2>
          <p className="mb-8 leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
