import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  icon: LucideIcon;
  value: number | string;
  subtext: ReactNode;
  iconColorClass: string;
  iconBgClass: string;
  animationDelay: string;
  loading?: boolean;
  onClick?: () => void;
}

export default function KpiCard({
  title,
  icon: Icon,
  value,
  subtext,
  iconColorClass,
  iconBgClass,
  animationDelay,
  loading = false,
  onClick
}: KpiCardProps) {
  return (
    <div
      style={{ animationDelay, animationFillMode: "both" }}
      className={`animate-in fade-in slide-in-from-bottom-3 duration-500 bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-all ${
        onClick ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl ${iconBgClass}`}>
          <Icon className={`w-4 h-4 ${iconColorClass}`} />
        </div>
      </div>
      <h3 className="text-[28px] font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
        {loading ? "—" : value}
      </h3>
      <div className="mt-1.5 flex items-center gap-1.5">
        {subtext}
      </div>
    </div>
  );
}
