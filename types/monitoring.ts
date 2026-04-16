export type RawCtPoint = {
  timestamp: string;
  current_r: number;
  current_s: number;
  current_t: number;
};

export type SampleStatus = "OFF" | "STANDBY" | "PRODUKSI" | "HIGH_LOAD" | "OVERLOAD";
export type TimelineStatus = "OFF" | "STANDBY" | "PRODUKSI" | "STOP";
export type MachineStatus = "OFF" | "STANDBY" | "PRODUKSI" | "STOP ABNORMAL" | "OVERLOAD";
export type RunningCondition = "Normal Load" | "Low Load" | "High Load" | "Unbalanced";
export type AlarmLevel = "alarm" | "warning" | "info";

export type EnrichedPoint = RawCtPoint & {
  avgCurrent: number;
  maxCurrent: number;
  minCurrent: number;
  unbalancePct: number;
  status: SampleStatus;
  timelineStatus: TimelineStatus;
};

export type TimelineBlock = {
  status: TimelineStatus;
  start: string;
  end: string;
  minutes: number;
};

export type HourlyLoadItem = {
  hour: string;
  avgCurrent: number;
  runtimeMinutes: number;
};

export type StartStopEvent = {
  startTime: string;
  stopTime: string;
  durationMinutes: number;
  description: string;
};

export type AlarmItem = {
  level: AlarmLevel;
  title: string;
  detail: string;
  timestamp: string;
};

export type ThresholdConfig = {
  offMax: number;
  standbyMax: number;
  productionMax: number;
  highLoadMax: number;
  unbalanceMaxPct: number;
  lowLoadMax: number;
};

export type DataQualityMetrics = {
  expectedSamples: number;
  actualSamples: number;
  missingSamples: number;
  completenessPct: number;
  intervalMinutes: number;
  gapCount: number;
  largestGapMinutes: number;
  freshnessMinutes: number;
};

export type MonitoringMetrics = {
  avg_current: number;
  max_current: number;
  min_current: number;
  unbalance_pct: number;
  runtime: number;
  downtime: number;
  standby_time: number;
  stop_count: number;
  microstop_count: number;
  overload_duration: number;
  low_load_duration: number;
  utilization: number;
  machineStatus: MachineStatus;
  runningCondition: RunningCondition;
  timelineBlocks: TimelineBlock[];
  hourly_load_profile: HourlyLoadItem[];
  start_stop_events: StartStopEvent[];
  alarms: AlarmItem[];
  intervalMinutes: number;
};
