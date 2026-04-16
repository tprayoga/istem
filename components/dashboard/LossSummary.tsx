import { formatDuration } from "@/lib/monitoring";
import { MonitoringMetrics } from "@/types/monitoring";
import { AlertTriangle, Clock3, GaugeCircle, Zap } from "lucide-react";
import { SectionCard } from "./SectionCard";

type LossSummaryProps = {
  metrics: MonitoringMetrics;
};

export function LossSummary({ metrics }: LossSummaryProps) {
  const items = [
    {
      label: "Downtime Loss",
      value: formatDuration(metrics.downtime),
      icon: Clock3,
      tone: "text-rose-600",
    },
    {
      label: "Microstop Count",
      value: `${metrics.microstop_count} kejadian`,
      icon: AlertTriangle,
      tone: "text-amber-600",
    },
    {
      label: "Overload Duration",
      value: formatDuration(metrics.overload_duration),
      icon: Zap,
      tone: "text-red-600",
    },
    {
      label: "Low Load Duration",
      value: formatDuration(metrics.low_load_duration),
      icon: GaugeCircle,
      tone: "text-orange-600",
    },
  ];

  return (
    <SectionCard title="Production Loss Summary" subtitle="Fokus pada waktu hilang dan kejadian kehilangan produksi">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <item.icon className={`h-4 w-4 ${item.tone}`} />
              {item.label}
            </div>
            <div className="font-heading text-2xl font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
