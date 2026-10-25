import { Building2, X } from "lucide-react";

interface SupplierFilterInputProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function SupplierFilterInput({ value, onValueChange }: SupplierFilterInputProps) {
  return (
    <div className="relative w-full min-w-[200px]">
      <Building2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        aria-label="Rechercher par fournisseur"
        autoComplete="off"
        placeholder="Saisir le nom du fournisseur…"
        value={value}
        onChange={event => onValueChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      />
      {value && (
        <button
          type="button"
          aria-label="Effacer la recherche fournisseur"
          onClick={() => onValueChange("")}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
