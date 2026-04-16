import { DataQualityMetrics } from "@/types/monitoring";
import { ShieldCheck } from "lucide-react";

type DataQualityPanelProps = {
  quality: DataQualityMetrics;
};

export function DataQualityPanel({ quality }: DataQualityPanelProps) {
  const tone =
    quality.completenessPct >= 95 && quality.gapCount === 0
      ? "bg-emerald-100 text-emerald-700"
      : quality.completenessPct >= 85
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-700" />
          <h3 className="font-heading text-lg font-semibold text-slate-900">Data Quality</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
          Completeness {quality.completenessPct.toFixed(1)}%
        </span>
      </div>
      <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">Sample {quality.actualSamples}/{quality.expectedSamples}</div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">Missing {quality.missingSamples}</div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">Gap {quality.gapCount} (max {quality.largestGapMinutes}m)</div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">Freshness {quality.freshnessMinutes}m</div>
      </div>
    </section>
  );
}
