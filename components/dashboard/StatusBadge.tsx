import { MachineStatus, RunningCondition, TimelineStatus } from "@/types/monitoring";

type StatusBadgeProps = {
  status: MachineStatus | RunningCondition | TimelineStatus;
};

const toneMap: Record<string, string> = {
  OFF: "bg-slate-200 text-slate-700",
  STANDBY: "bg-amber-100 text-amber-700",
  PRODUKSI: "bg-emerald-100 text-emerald-700",
  STOP: "bg-rose-100 text-rose-700",
  "STOP ABNORMAL": "bg-rose-100 text-rose-700",
  OVERLOAD: "bg-red-100 text-red-700",
  "Normal Load": "bg-emerald-100 text-emerald-700",
  "Low Load": "bg-amber-100 text-amber-700",
  "High Load": "bg-orange-100 text-orange-700",
  Unbalanced: "bg-rose-100 text-rose-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = toneMap[status] ?? "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}
