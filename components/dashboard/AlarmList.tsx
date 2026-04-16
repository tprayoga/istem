import { formatDateTime } from "@/lib/monitoring";
import { AlarmItem } from "@/types/monitoring";
import { AlertCircle, BellRing, Info } from "lucide-react";
import { SectionCard } from "./SectionCard";

type AlarmListProps = {
  alarms: AlarmItem[];
};

const iconMap = {
  alarm: AlertCircle,
  warning: BellRing,
  info: Info,
};

const toneMap = {
  alarm: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export function AlarmList({ alarms }: AlarmListProps) {
  return (
    <SectionCard title="Alarm & Warnings" subtitle="Peringatan operasional untuk tindak lanjut cepat">
      <div className="space-y-2">
        {alarms.map((alarm) => {
          const Icon = iconMap[alarm.level];
          return (
            <div key={`${alarm.title}-${alarm.timestamp}`} className={`rounded-lg border p-3 ${toneMap[alarm.level]}`}>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {alarm.title}
              </div>
              <p className="text-xs">{alarm.detail}</p>
              <p className="mt-1 text-[11px] opacity-80">{formatDateTime(alarm.timestamp)}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
