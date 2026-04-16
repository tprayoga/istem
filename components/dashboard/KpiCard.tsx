import { LucideIcon, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

type KpiCardProps = {
  title: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  accent?: "green" | "yellow" | "orange" | "red" | "gray";
  rightNode?: ReactNode;
};

const accentClass: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-rose-500",
  gray: "bg-slate-400",
};

export function KpiCard({ title, value, note, icon: Icon, accent = "gray", rightNode }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
      <div className={`absolute left-0 top-0 h-1 w-full ${accentClass[accent]}`} />
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
        {rightNode ?? (
          <div className="rounded-lg bg-slate-100 p-1.5">
            <Icon className="h-4 w-4 text-slate-700" />
          </div>
        )}
      </div>
      <div className="font-heading text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {note && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <TrendingUp className="h-3.5 w-3.5" />
          {note}
        </div>
      )}
    </div>
  );
}
