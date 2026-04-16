import { ThingsBoardConfig } from "@/lib/data-source";
import { parseThingsBoardTelemetry, ThingsBoardRequest, ThingsBoardTimeseries } from "@/lib/thingsboard";
import { RawCtPoint } from "@/types/monitoring";

export async function fetchThingsBoardPoints(config: ThingsBoardConfig): Promise<{
  points: RawCtPoint[];
  message: string;
}> {
  return fetchThingsBoardPointsWithRange(config, 24 * 60);
}

export async function fetchThingsBoardPointsWithRange(
  config: ThingsBoardConfig,
  rangeMinutes: number,
): Promise<{
  points: RawCtPoint[];
  message: string;
}> {
  const keyList = config.keys
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!config.baseUrl.trim() || !config.deviceId.trim()) {
    throw new Error("Isi URL dan Device ID terlebih dulu.");
  }
  if (!config.accessToken?.trim() && (!config.username?.trim() || !config.password?.trim())) {
    throw new Error("Isi JWT token, atau isi Username dan Password.");
  }
  if (keyList.length < 3) {
    throw new Error("Telemetry Keys minimal 3 key, contoh: current_r,current_s,current_t");
  }

  const endTs = Date.now();
  const safeRangeMinutes = Math.max(1, rangeMinutes);
  const startTs = endTs - safeRangeMinutes * 60 * 1000;
  const payload: ThingsBoardRequest = {
    baseUrl: config.baseUrl.trim(),
    accessToken: config.accessToken?.trim() ?? "",
    username: config.username?.trim() || undefined,
    password: config.password?.trim() || undefined,
    deviceId: config.deviceId.trim(),
    startTs,
    endTs,
    keys: keyList.join(","),
    agg: "AVG",
    interval: 60000,
    limit: 5000,
  };

  const response = await fetch("/api/thingsboard/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? ` - ${data.detail}` : "";
    throw new Error(`${data?.error ?? "Gagal mengambil data."}${detail}`);
  }

  const points = parseThingsBoardTelemetry(data as ThingsBoardTimeseries, {
    r: keyList[0] || "current_r",
    s: keyList[1] || "current_s",
    t: keyList[2] || "current_t",
  });
  if (!points.length) {
    throw new Error("Data kosong untuk rentang waktu ini.");
  }

  return {
    points,
    message: `Terhubung. ${points.length} data berhasil dimuat (${safeRangeMinutes} menit terakhir).`,
  };
}
