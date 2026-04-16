"use client";

import { AlarmList } from "@/components/dashboard/AlarmList";
import { DataQualityPanel } from "@/components/dashboard/DataQualityPanel";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LossSummary } from "@/components/dashboard/LossSummary";
import { OperationTimeline } from "@/components/dashboard/OperationTimeline";
import { ProductionSummaryPanel } from "@/components/dashboard/ProductionSummaryPanel";
import { StartStopEventsTable } from "@/components/dashboard/StartStopEventsTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ThresholdSettingsMenu } from "@/components/dashboard/ThresholdSettingsMenu";
import { TimeFilterPanel } from "@/components/dashboard/TimeFilterPanel";
import {
  getDefaultDataSource,
  loadPersistedDataSource,
  loadThingsBoardConfig,
  PersistedDataSource,
  savePersistedDataSource,
} from "@/lib/data-source";
import { DEFAULT_THRESHOLD_CONFIG, deriveDataQuality, deriveMonitoringData, formatDateTime, formatDuration } from "@/lib/monitoring";
import { fetchThingsBoardPoints } from "@/lib/thingsboard-client";
import { Activity, Gauge, PauseCircle, PlayCircle, Siren, Timer } from "lucide-react";
import { MachineStatus, ThresholdConfig } from "@/types/monitoring";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const CurrentTrendChart = dynamic(
  () => import("@/components/dashboard/CurrentTrendChart").then((module) => module.CurrentTrendChart),
  { ssr: false },
);
const HourlyLoadProfile = dynamic(
  () => import("@/components/dashboard/HourlyLoadProfile").then((module) => module.HourlyLoadProfile),
  { ssr: false },
);

function toInputDateTime(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function HomePage() {
  const [thresholdConfig, setThresholdConfig] = useState<ThresholdConfig>(DEFAULT_THRESHOLD_CONFIG);
  const [sourceState, setSourceState] = useState<PersistedDataSource>(() => loadPersistedDataSource() ?? getDefaultDataSource());
  const [filterRange, setFilterRange] = useState(() => {
    const first = sourceState.points[0]?.timestamp ?? new Date().toISOString();
    const last = sourceState.points[sourceState.points.length - 1]?.timestamp ?? new Date().toISOString();
    return {
      start: toInputDateTime(first),
      end: toInputDateTime(last),
    };
  });

  const filteredPoints = useMemo(() => {
    const startMs = new Date(filterRange.start).getTime();
    const endMs = new Date(filterRange.end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return sourceState.points;
    return sourceState.points.filter((point) => {
      const ts = new Date(point.timestamp).getTime();
      return ts >= startMs && ts <= endMs;
    });
  }, [sourceState.points, filterRange.start, filterRange.end]);

  const { points, metrics } = useMemo(
    () => deriveMonitoringData(filteredPoints, thresholdConfig),
    [filteredPoints, thresholdConfig],
  );
  const quality = useMemo(() => deriveDataQuality(filteredPoints), [filteredPoints]);
  const lastTimestamp = points[points.length - 1]?.timestamp ?? new Date().toISOString();

  useEffect(() => {
    if (sourceState.sourceType !== "thingsboard") return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      const config = loadThingsBoardConfig();
      const nextDelayMs = Math.max(10, config.autoRefreshSec) * 1000;

      if (config.autoRefreshEnabled) {
        try {
          const result = await fetchThingsBoardPoints(config);
          const next: PersistedDataSource = {
            sourceType: "thingsboard",
            points: result.points,
            lastSyncAt: new Date().toISOString(),
          };
          savePersistedDataSource(next);
          setSourceState(next);
        } catch {
          // silent retry on next cycle
        }
      }

      timeoutId = setTimeout(tick, nextDelayMs);
    };

    timeoutId = setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sourceState.sourceType]);

  const machineStatusAccent: Record<MachineStatus, "green" | "yellow" | "orange" | "red" | "gray"> = {
    OFF: "gray",
    STANDBY: "yellow",
    PRODUKSI: "green",
    "STOP ABNORMAL": "red",
    OVERLOAD: "red",
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1900px] px-4 py-5 md:px-6">
        <DashboardHeader
          lastUpdate={formatDateTime(lastTimestamp)}
          actions={
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Source: {sourceState.sourceType === "mock" ? "Mock JSON" : "ThingsBoard"}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Records: {sourceState.points.length}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Sync: {formatDateTime(sourceState.lastSyncAt)}
              </span>
              <ThresholdSettingsMenu
                value={thresholdConfig}
                onChange={setThresholdConfig}
                onReset={() => setThresholdConfig(DEFAULT_THRESHOLD_CONFIG)}
              />
            </div>
          }
        />

        <TimeFilterPanel
          startValue={filterRange.start}
          endValue={filterRange.end}
          onChangeStart={(value) => setFilterRange((prev) => ({ ...prev, start: value }))}
          onChangeEnd={(value) => setFilterRange((prev) => ({ ...prev, end: value }))}
          onReset={() => {
            const first = sourceState.points[0]?.timestamp ?? new Date().toISOString();
            const last = sourceState.points[sourceState.points.length - 1]?.timestamp ?? new Date().toISOString();
            setFilterRange({ start: toInputDateTime(first), end: toInputDateTime(last) });
          }}
          onPresetHours={(hours) => {
            const last = sourceState.points[sourceState.points.length - 1]?.timestamp ?? new Date().toISOString();
            const end = new Date(last);
            const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
            setFilterRange({ start: toInputDateTime(start.toISOString()), end: toInputDateTime(end.toISOString()) });
          }}
          filteredCount={filteredPoints.length}
          totalCount={sourceState.points.length}
        />
        <DataQualityPanel quality={quality} />

        <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            title="Machine Status"
            value={metrics.machineStatus}
            icon={Siren}
            accent={machineStatusAccent[metrics.machineStatus]}
            rightNode={<StatusBadge status={metrics.machineStatus} />}
          />
          <KpiCard
            title="Production Runtime"
            value={formatDuration(metrics.runtime)}
            note={`${metrics.runtime} menit`}
            icon={PlayCircle}
            accent="green"
          />
          <KpiCard
            title="Downtime"
            value={formatDuration(metrics.downtime)}
            note={`Standby ${formatDuration(metrics.standby_time)}`}
            icon={PauseCircle}
            accent="red"
          />
          <KpiCard
            title="Utilization"
            value={`${metrics.utilization.toFixed(1)}%`}
            note="Runtime / total observasi"
            icon={Timer}
            accent={metrics.utilization >= 70 ? "green" : "yellow"}
          />
          <KpiCard
            title="Stop Count"
            value={`${metrics.stop_count}x`}
            note={`Microstop ${metrics.microstop_count}x`}
            icon={Activity}
            accent={metrics.stop_count > 3 ? "red" : "yellow"}
          />
          <KpiCard
            title="Running Condition"
            value={metrics.runningCondition}
            icon={Gauge}
            accent={metrics.runningCondition === "High Load" ? "orange" : metrics.runningCondition === "Unbalanced" ? "red" : "green"}
            rightNode={<StatusBadge status={metrics.runningCondition} />}
          />
        </section>

        <div className="mb-6">
          <OperationTimeline blocks={metrics.timelineBlocks} />
        </div>

        <section className="mb-6 grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-3">
            <ProductionSummaryPanel metrics={metrics} />
          </div>
          <div className="xl:col-span-6">
            <CurrentTrendChart points={points} />
          </div>
          <div className="xl:col-span-3">
            <LossSummary metrics={metrics} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-3">
            <HourlyLoadProfile data={metrics.hourly_load_profile} />
          </div>
          <div className="xl:col-span-6">
            <StartStopEventsTable events={metrics.start_stop_events} />
          </div>
          <div className="xl:col-span-3">
            <AlarmList alarms={metrics.alarms} />
          </div>
        </section>
      </div>
    </main>
  );
}
