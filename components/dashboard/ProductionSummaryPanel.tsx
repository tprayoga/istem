import { formatDuration } from "@/lib/monitoring";
import { MonitoringMetrics } from "@/types/monitoring";
import { Activity, Gauge, TimerReset } from "lucide-react";
import { SectionCard } from "./SectionCard";

type ProductionSummaryPanelProps = {
  metrics: MonitoringMetrics;
};

export function ProductionSummaryPanel({ metrics }: ProductionSummaryPanelProps) {
  const healthyPct = Math.max(0, Math.min(100, metrics.utilization));

  return (
    <SectionCard title="Production Summary" subtitle="Ringkasan visual operasional harian">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 rounded-full bg-slate-100">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#10b981 ${healthyPct * 3.6}deg, #e2e8f0 0deg)`,
              }}
            />
            <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white">
              <span className="font-heading text-xl font-semibold">{healthyPct.toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Utilization</p>
            <p className="font-heading text-2xl font-semibold text-slate-900">{healthyPct.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Runtime {formatDuration(metrics.runtime)}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Activity className="h-4 w-4 text-emerald-600" />
              Rata-rata Arus
            </div>
            <span className="font-semibold">{metrics.avg_current.toFixed(2)} A</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Gauge className="h-4 w-4 text-orange-600" />
              Beban Puncak
            </div>
            <span className="font-semibold">{metrics.max_current.toFixed(2)} A</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <TimerReset className="h-4 w-4 text-rose-600" />
              Downtime Total
            </div>
            <span className="font-semibold">{formatDuration(metrics.downtime)}</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
