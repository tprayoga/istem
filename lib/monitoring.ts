import {
  AlarmItem,
  EnrichedPoint,
  HourlyLoadItem,
  MachineStatus,
  MonitoringMetrics,
  RawCtPoint,
  RunningCondition,
  SampleStatus,
  StartStopEvent,
  ThresholdConfig,
  DataQualityMetrics,
  TimelineBlock,
  TimelineStatus,
} from "@/types/monitoring";

export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
  offMax: 1,
  standbyMax: 3,
  productionMax: 20,
  highLoadMax: 25,
  unbalanceMaxPct: 10,
  lowLoadMax: 8,
};

function normalizeThresholdConfig(config?: Partial<ThresholdConfig>): ThresholdConfig {
  const safe = {
    ...DEFAULT_THRESHOLD_CONFIG,
    ...config,
  };
  const standbyMax = Math.max(safe.standbyMax, safe.offMax + 0.1);
  const productionMax = Math.max(safe.productionMax, standbyMax + 0.1);
  const highLoadMax = Math.max(safe.highLoadMax, productionMax + 0.1);
  const lowLoadMax = Math.min(Math.max(safe.lowLoadMax, standbyMax), productionMax - 0.1);
  return {
    ...safe,
    standbyMax,
    productionMax,
    highLoadMax,
    lowLoadMax,
  };
}

export function classifyStatus(avgCurrent: number, thresholdConfig: ThresholdConfig): SampleStatus {
  if (avgCurrent < thresholdConfig.offMax) return "OFF";
  if (avgCurrent < thresholdConfig.standbyMax) return "STANDBY";
  if (avgCurrent < thresholdConfig.productionMax) return "PRODUKSI";
  if (avgCurrent < thresholdConfig.highLoadMax) return "HIGH_LOAD";
  return "OVERLOAD";
}

export function calculateUnbalancePct(r: number, s: number, t: number): number {
  const avg = (r + s + t) / 3;
  if (avg <= 0) return 0;
  const maxDeviation = Math.max(Math.abs(r - avg), Math.abs(s - avg), Math.abs(t - avg));
  return (maxDeviation / avg) * 100;
}

function toTimelineStatus(
  point: Omit<EnrichedPoint, "timelineStatus">,
  prev: Omit<EnrichedPoint, "timelineStatus"> | undefined,
  next: Omit<EnrichedPoint, "timelineStatus"> | undefined,
): TimelineStatus {
  if (point.status === "STANDBY") return "STANDBY";
  if (point.status === "PRODUKSI" || point.status === "HIGH_LOAD" || point.status === "OVERLOAD") {
    return "PRODUKSI";
  }

  const prevRunning = Boolean(prev && (prev.status === "PRODUKSI" || prev.status === "HIGH_LOAD" || prev.status === "OVERLOAD"));
  const nextRunning = Boolean(next && (next.status === "PRODUKSI" || next.status === "HIGH_LOAD" || next.status === "OVERLOAD"));
  return prevRunning || nextRunning ? "STOP" : "OFF";
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hour = Math.floor(minutes / 60);
  const minute = Math.round(minutes % 60);
  if (hour === 0) return `${minute}m`;
  if (minute === 0) return `${hour}j`;
  return `${hour}j ${minute}m`;
}

export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getIntervalMinutes(points: RawCtPoint[]): number {
  if (points.length < 2) return 1;
  const first = new Date(points[0].timestamp).getTime();
  const second = new Date(points[1].timestamp).getTime();
  return Math.max(1, Math.round((second - first) / 60000));
}

function isRunning(status: SampleStatus): boolean {
  return status === "PRODUKSI" || status === "HIGH_LOAD" || status === "OVERLOAD";
}

function getRunningCondition(point: EnrichedPoint, thresholdConfig: ThresholdConfig): RunningCondition {
  if (point.unbalancePct > thresholdConfig.unbalanceMaxPct) return "Unbalanced";
  if (point.avgCurrent >= thresholdConfig.productionMax) return "High Load";
  if (point.avgCurrent < thresholdConfig.lowLoadMax) return "Low Load";
  return "Normal Load";
}

function getMachineStatus(points: EnrichedPoint[]): MachineStatus {
  const current = points[points.length - 1];
  if (!current) return "OFF";
  if (current.status === "OVERLOAD") return "OVERLOAD";
  if (current.status === "STANDBY") return "STANDBY";
  if (current.timelineStatus === "STOP") return "STOP ABNORMAL";
  if (current.status === "OFF") return "OFF";
  return "PRODUKSI";
}

function buildTimelineBlocks(points: EnrichedPoint[], intervalMinutes: number): TimelineBlock[] {
  if (!points.length) return [];
  const blocks: TimelineBlock[] = [];
  let cursorStatus = points[0].timelineStatus;
  let cursorStart = points[0].timestamp;
  let minutes = intervalMinutes;

  for (let i = 1; i < points.length; i += 1) {
    if (points[i].timelineStatus === cursorStatus) {
      minutes += intervalMinutes;
    } else {
      blocks.push({
        status: cursorStatus,
        start: cursorStart,
        end: points[i - 1].timestamp,
        minutes,
      });
      cursorStatus = points[i].timelineStatus;
      cursorStart = points[i].timestamp;
      minutes = intervalMinutes;
    }
  }

  blocks.push({
    status: cursorStatus,
    start: cursorStart,
    end: points[points.length - 1].timestamp,
    minutes,
  });

  return blocks;
}

function buildStartStopEvents(points: EnrichedPoint[], intervalMinutes: number): StartStopEvent[] {
  const events: StartStopEvent[] = [];
  let stopStartIndex = -1;
  let stopType: TimelineStatus = "STOP";

  for (let i = 1; i < points.length; i += 1) {
    const wasRunning = isRunning(points[i - 1].status);
    const nowRunning = isRunning(points[i].status);

    if (wasRunning && !nowRunning && stopStartIndex === -1) {
      stopStartIndex = i;
      stopType = points[i].timelineStatus;
    }

    if (!wasRunning && nowRunning && stopStartIndex !== -1) {
      const duration = (i - stopStartIndex) * intervalMinutes;
      const description =
        duration <= 20 ? "Microstop - Recovery cepat" : stopType === "STANDBY" ? "Standby / setup" : "Downtime produksi";
      events.push({
        startTime: points[stopStartIndex].timestamp,
        stopTime: points[i].timestamp,
        durationMinutes: duration,
        description,
      });
      stopStartIndex = -1;
    }
  }

  return events.slice(-8).reverse();
}

function buildHourlyProfile(points: EnrichedPoint[], intervalMinutes: number): HourlyLoadItem[] {
  const bucket = new Map<
    string,
    {
      avgSum: number;
      count: number;
      runtimeMinutes: number;
    }
  >();

  points.forEach((point) => {
    const key = `${new Date(point.timestamp).getHours().toString().padStart(2, "0")}:00`;
    const current = bucket.get(key) ?? { avgSum: 0, count: 0, runtimeMinutes: 0 };
    current.avgSum += point.avgCurrent;
    current.count += 1;
    if (isRunning(point.status)) current.runtimeMinutes += intervalMinutes;
    bucket.set(key, current);
  });

  return [...bucket.entries()].map(([hour, value]) => ({
    hour,
    avgCurrent: Number((value.avgSum / value.count).toFixed(2)),
    runtimeMinutes: value.runtimeMinutes,
  }));
}

function buildAlarms(
  points: EnrichedPoint[],
  metrics: Omit<MonitoringMetrics, "alarms">,
  thresholdConfig: ThresholdConfig,
): AlarmItem[] {
  const latest = points[points.length - 1];
  const alarms: AlarmItem[] = [];

  if (metrics.overload_duration > 0) {
    alarms.push({
      level: "alarm",
      title: "Overload Terdeteksi",
      detail: `Durasi overload ${formatDuration(metrics.overload_duration)} dalam periode monitoring.`,
      timestamp: latest.timestamp,
    });
  }

  if (metrics.unbalance_pct > thresholdConfig.unbalanceMaxPct) {
    alarms.push({
      level: "warning",
      title: "Ketidakseimbangan Fasa",
      detail: `Unbalance rata-rata ${metrics.unbalance_pct.toFixed(1)}%. Cek distribusi beban mesin.`,
      timestamp: latest.timestamp,
    });
  }

  if (metrics.stop_count >= 3) {
    alarms.push({
      level: "warning",
      title: "Frekuensi Stop Tinggi",
      detail: `${metrics.stop_count} kali stop terdeteksi. Evaluasi akar downtime.`,
      timestamp: latest.timestamp,
    });
  }

  if (metrics.low_load_duration > 60) {
    alarms.push({
      level: "info",
      title: "Beban Produksi Rendah",
      detail: `Low load terakumulasi ${formatDuration(metrics.low_load_duration)}.`,
      timestamp: latest.timestamp,
    });
  }

  if (alarms.length === 0) {
    alarms.push({
      level: "info",
      title: "Operasi Stabil",
      detail: "Tidak ada alarm kritis pada periode ini.",
      timestamp: latest.timestamp,
    });
  }

  return alarms;
}

export function deriveMonitoringData(
  rawPoints: RawCtPoint[],
  config?: Partial<ThresholdConfig>,
): { points: EnrichedPoint[]; metrics: MonitoringMetrics } {
  const thresholdConfig = normalizeThresholdConfig(config);
  if (!rawPoints.length) {
    const metrics: MonitoringMetrics = {
      avg_current: 0,
      max_current: 0,
      min_current: 0,
      unbalance_pct: 0,
      runtime: 0,
      downtime: 0,
      standby_time: 0,
      stop_count: 0,
      microstop_count: 0,
      overload_duration: 0,
      low_load_duration: 0,
      utilization: 0,
      machineStatus: "OFF",
      runningCondition: "Low Load",
      timelineBlocks: [],
      hourly_load_profile: [],
      start_stop_events: [],
      alarms: [
        {
          level: "info",
          title: "Data Tidak Tersedia",
          detail: "Tidak ada data pada rentang waktu yang dipilih.",
          timestamp: new Date().toISOString(),
        },
      ],
      intervalMinutes: 1,
    };
    return { points: [], metrics };
  }
  const intervalMinutes = getIntervalMinutes(rawPoints);
  const basePoints = rawPoints.map((point) => {
    const avgCurrent = (point.current_r + point.current_s + point.current_t) / 3;
    const maxCurrent = Math.max(point.current_r, point.current_s, point.current_t);
    const minCurrent = Math.min(point.current_r, point.current_s, point.current_t);
    const unbalancePct = calculateUnbalancePct(point.current_r, point.current_s, point.current_t);
    return {
      ...point,
      avgCurrent,
      maxCurrent,
      minCurrent,
      unbalancePct,
      status: classifyStatus(avgCurrent, thresholdConfig),
    };
  });

  const points: EnrichedPoint[] = basePoints.map((point, index) => ({
    ...point,
    timelineStatus: toTimelineStatus(point, basePoints[index - 1], basePoints[index + 1]),
  }));

  const totalMinutes = points.length * intervalMinutes;
  const runtime = points.filter((point) => isRunning(point.status)).length * intervalMinutes;
  const standbyTime = points.filter((point) => point.status === "STANDBY").length * intervalMinutes;
  const downtime = points.filter((point) => point.timelineStatus === "OFF" || point.timelineStatus === "STOP").length * intervalMinutes;
  const overloadDuration = points.filter((point) => point.status === "OVERLOAD").length * intervalMinutes;
  const lowLoadDuration =
    points.filter((point) => isRunning(point.status) && point.avgCurrent < thresholdConfig.lowLoadMax).length * intervalMinutes;

  let stopCount = 0;
  for (let i = 1; i < points.length; i += 1) {
    if (isRunning(points[i - 1].status) && !isRunning(points[i].status)) stopCount += 1;
  }

  const startStopEvents = buildStartStopEvents(points, intervalMinutes);
  const microstopCount = startStopEvents.filter((event) => event.durationMinutes <= 20).length;
  const lastRunningPoint = [...points].reverse().find((point) => isRunning(point.status)) ?? points[points.length - 1];

  const metricsBase: Omit<MonitoringMetrics, "alarms"> = {
    avg_current: points.reduce((sum, point) => sum + point.avgCurrent, 0) / points.length,
    max_current: Math.max(...points.map((point) => point.maxCurrent)),
    min_current: Math.min(...points.map((point) => point.minCurrent)),
    unbalance_pct: points.reduce((sum, point) => sum + point.unbalancePct, 0) / points.length,
    runtime,
    downtime,
    standby_time: standbyTime,
    stop_count: stopCount,
    microstop_count: microstopCount,
    overload_duration: overloadDuration,
    low_load_duration: lowLoadDuration,
    utilization: (runtime / totalMinutes) * 100,
    machineStatus: getMachineStatus(points),
    runningCondition: getRunningCondition(lastRunningPoint, thresholdConfig),
    timelineBlocks: buildTimelineBlocks(points, intervalMinutes),
    hourly_load_profile: buildHourlyProfile(points, intervalMinutes),
    start_stop_events: startStopEvents,
    intervalMinutes,
  };

  const metrics: MonitoringMetrics = {
    ...metricsBase,
    alarms: buildAlarms(points, metricsBase, thresholdConfig),
  };

  return { points, metrics };
}

export function deriveDataQuality(rawPoints: RawCtPoint[]): DataQualityMetrics {
  if (rawPoints.length < 2) {
    return {
      expectedSamples: rawPoints.length,
      actualSamples: rawPoints.length,
      missingSamples: 0,
      completenessPct: rawPoints.length ? 100 : 0,
      intervalMinutes: 1,
      gapCount: 0,
      largestGapMinutes: 0,
      freshnessMinutes: 0,
    };
  }

  const sorted = [...rawPoints].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    diffs.push(Math.max(1, Math.round((new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()) / 60000)));
  }
  const sortedDiffs = [...diffs].sort((a, b) => a - b);
  const medianDiff = sortedDiffs[Math.floor(sortedDiffs.length / 2)] || 1;

  const startMs = new Date(sorted[0].timestamp).getTime();
  const endMs = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const totalRangeMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
  const expectedSamples = Math.max(1, Math.floor(totalRangeMinutes / medianDiff) + 1);
  const actualSamples = sorted.length;
  const missingSamples = Math.max(0, expectedSamples - actualSamples);
  const completenessPct = Math.max(0, Math.min(100, (actualSamples / expectedSamples) * 100));

  let gapCount = 0;
  let largestGap = 0;
  diffs.forEach((value) => {
    if (value > medianDiff * 1.5) {
      gapCount += 1;
      largestGap = Math.max(largestGap, value);
    }
  });

  const freshnessMinutes = Math.max(0, Math.round((Date.now() - endMs) / 60000));
  return {
    expectedSamples,
    actualSamples,
    missingSamples,
    completenessPct,
    intervalMinutes: medianDiff,
    gapCount,
    largestGapMinutes: largestGap,
    freshnessMinutes,
  };
}
