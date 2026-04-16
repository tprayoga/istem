import rawData from "@/data/mock/ct-clamp-day.json";
import { RawCtPoint } from "@/types/monitoring";

export type PersistedDataSource = {
  sourceType: "mock" | "thingsboard";
  points: RawCtPoint[];
  lastSyncAt: string;
};

export type ThingsBoardConfig = {
  baseUrl: string;
  deviceId: string;
  keys: string;
  accessToken?: string;
  username?: string;
  password?: string;
  autoRefreshEnabled: boolean;
  autoRefreshSec: number;
};

const STORAGE_KEY = "istem_monitoring_data_source";
const SETTINGS_KEY = "istem_thingsboard_settings";
const MAX_POINTS_TO_STORE = 10000;

function sanitizePoints(points: RawCtPoint[]): RawCtPoint[] {
  return points
    .filter((point) => point && typeof point.timestamp === "string")
    .map((point) => ({
      timestamp: point.timestamp,
      current_r: Number.isFinite(point.current_r) ? point.current_r : 0,
      current_s: Number.isFinite(point.current_s) ? point.current_s : 0,
      current_t: Number.isFinite(point.current_t) ? point.current_t : 0,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getDefaultDataSource(): PersistedDataSource {
  return {
    sourceType: "mock",
    points: rawData as RawCtPoint[],
    lastSyncAt: new Date().toISOString(),
  };
}

export function loadPersistedDataSource(): PersistedDataSource | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDataSource;
    if (!Array.isArray(parsed.points)) return null;
    const safePoints = sanitizePoints(parsed.points);
    if (!safePoints.length) return null;
    return {
      sourceType: parsed.sourceType === "thingsboard" ? "thingsboard" : "mock",
      points: safePoints,
      lastSyncAt: parsed.lastSyncAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function savePersistedDataSource(payload: PersistedDataSource): void {
  if (typeof window === "undefined") return;
  try {
    const sanitized = sanitizePoints(payload.points).slice(-MAX_POINTS_TO_STORE);
    const safePayload: PersistedDataSource = {
      sourceType: payload.sourceType,
      points: sanitized,
      lastSyncAt: payload.lastSyncAt,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safePayload));
  } catch {
    // Ignore storage errors (quota/private mode) and keep app running with in-memory state.
  }
}

export function getDefaultThingsBoardConfig(): ThingsBoardConfig {
  return {
    baseUrl: "https://dragonwatch.indoteksaft.co.id",
    deviceId: "d5f26410-1862-11f1-aba0-855f22b851d8",
    keys: "R,S,T",
    accessToken: "",
    username: "tenant@indoteksaft.co.id",
    password: "tenant",
    autoRefreshEnabled: true,
    autoRefreshSec: 3,
  };
}

export function loadThingsBoardConfig(): ThingsBoardConfig {
  if (typeof window === "undefined") return getDefaultThingsBoardConfig();
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultThingsBoardConfig();
    const parsed = JSON.parse(raw) as Partial<ThingsBoardConfig>;
    const defaults = getDefaultThingsBoardConfig();
    const merged = {
      ...defaults,
      ...parsed,
      autoRefreshSec: Number.isFinite(parsed.autoRefreshSec) ? Math.max(1, Number(parsed.autoRefreshSec)) : defaults.autoRefreshSec,
      autoRefreshEnabled: parsed.autoRefreshEnabled ?? defaults.autoRefreshEnabled,
    };
    if ((merged.keys ?? "").trim().toLowerCase() === "current_r,current_s,current_t") {
      merged.keys = "R,S,T";
    }
    return merged;
  } catch {
    return getDefaultThingsBoardConfig();
  }
}

export function saveThingsBoardConfig(config: ThingsBoardConfig): void {
  if (typeof window === "undefined") return;
  try {
    const safeConfig: ThingsBoardConfig = {
      ...config,
      autoRefreshSec: Math.max(1, config.autoRefreshSec),
    };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(safeConfig));
  } catch {
    // ignore
  }
}

export function mergeRawPoints(existing: RawCtPoint[], incoming: RawCtPoint[], maxPoints = MAX_POINTS_TO_STORE): RawCtPoint[] {
  const map = new Map<string, RawCtPoint>();
  sanitizePoints(existing).forEach((point) => map.set(point.timestamp, point));
  sanitizePoints(incoming).forEach((point) => map.set(point.timestamp, point));
  return [...map.values()]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-maxPoints);
}
