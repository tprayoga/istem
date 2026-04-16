import { formatDuration, formatTime } from "@/lib/monitoring";
import { TimelineBlock, TimelineStatus } from "@/types/monitoring";
import { SectionCard } from "./SectionCard";
import { StatusBadge } from "./StatusBadge";

type OperationTimelineProps = {
  blocks: TimelineBlock[];
};

const statusColor: Record<TimelineStatus, string> = {
  OFF: "bg-slate-400",
  STANDBY: "bg-amber-400",
  PRODUKSI: "bg-emerald-500",
  STOP: "bg-rose-500",
};

export function OperationTimeline({ blocks }: OperationTimelineProps) {
  const totalMinutes = blocks.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <SectionCard title="Operation Timeline" subtitle="Distribusi status mesin sepanjang periode monitoring">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-4 flex h-7 overflow-hidden rounded-lg">
          {blocks.map((block, index) => (
            <div
              key={`${block.start}-${index}`}
              className={`${statusColor[block.status]} transition-opacity hover:opacity-80`}
              style={{ width: `${(block.minutes / totalMinutes) * 100}%` }}
              title={`${block.status} (${formatDuration(block.minutes)})`}
            />
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {blocks.map((block, index) => (
            <div key={`${block.start}-${index}`} className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <StatusBadge status={block.status} />
                <span className="text-xs font-semibold text-slate-600">{formatDuration(block.minutes)}</span>
              </div>
              <p className="text-xs text-slate-500">
                {formatTime(block.start)} - {formatTime(block.end)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
