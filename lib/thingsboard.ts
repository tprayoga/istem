import { RawCtPoint } from "@/types/monitoring";

export type ThingsBoardRequest = {
  baseUrl: string;
  accessToken: string;
  username?: string;
  password?: string;
  deviceId: string;
  entityType?: "DEVICE" | "ASSET";
  startTs: number;
  endTs: number;
  limit?: number;
  agg?: "NONE" | "AVG" | "MIN" | "MAX" | "SUM" | "COUNT";
  interval?: number;
  keys?: string;
};

export type ThingsBoardTimeseries = Record<
  string,
  Array<{
    ts: number | string;
    value: number | string;
  }>
>;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

type ParseOptions = {
  alignWindowMs?: number;
};

export function parseThingsBoardTelemetry(
  payload: ThingsBoardTimeseries,
  keyMap = {
    r: "current_r",
    s: "current_s",
    t: "current_t",
  },
  options: ParseOptions = {},
): RawCtPoint[] {
  const alignWindowMs = options.alignWindowMs ?? 60000;
  const merged = new Map<number, Partial<RawCtPoint>>();
  const sums = new Map<number, { r: number; s: number; t: number; rCount: number; sCount: number; tCount: number }>();

  const bucketTs = (ts: number) => Math.floor(ts / alignWindowMs) * alignWindowMs;
  const register = (key: string, field: "current_r" | "current_s" | "current_t") => {
    const rows = payload[key] ?? [];
    rows.forEach((item) => {
      const ts = Number(item.ts);
      if (!Number.isFinite(ts)) return;
      const bucket = bucketTs(ts);
      const existing = sums.get(bucket) ?? { r: 0, s: 0, t: 0, rCount: 0, sCount: 0, tCount: 0 };
      const numeric = toNumber(item.value);
      if (field === "current_r") {
        existing.r += numeric;
        existing.rCount += 1;
      }
      if (field === "current_s") {
        existing.s += numeric;
        existing.sCount += 1;
      }
      if (field === "current_t") {
        existing.t += numeric;
        existing.tCount += 1;
      }
      sums.set(bucket, existing);
    });
  };

  register(keyMap.r, "current_r");
  register(keyMap.s, "current_s");
  register(keyMap.t, "current_t");

  [...sums.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([ts, item]) => {
      merged.set(ts, {
        timestamp: new Date(ts).toISOString(),
        current_r: item.rCount ? item.r / item.rCount : undefined,
        current_s: item.sCount ? item.s / item.sCount : undefined,
        current_t: item.tCount ? item.t / item.tCount : undefined,
      });
    });

  // Forward-fill missing phase values to avoid false "OFF" spikes when one key arrives slightly later.
  let lastR = 0;
  let lastS = 0;
  let lastT = 0;

  return [...merged.entries()].sort((a, b) => a[0] - b[0]).map(([ts, row]) => {
    const currentR = row.current_r ?? lastR;
    const currentS = row.current_s ?? lastS;
    const currentT = row.current_t ?? lastT;
    lastR = currentR;
    lastS = currentS;
    lastT = currentT;
    return {
      timestamp: new Date(ts).toISOString(),
      current_r: Number(currentR.toFixed(3)),
      current_s: Number(currentS.toFixed(3)),
      current_t: Number(currentT.toFixed(3)),
    };
  });
}
