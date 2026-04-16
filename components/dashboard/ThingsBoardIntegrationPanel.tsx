"use client";

import { ThingsBoardConfig } from "@/lib/data-source";
import { fetchThingsBoardPoints } from "@/lib/thingsboard-client";
import { RawCtPoint } from "@/types/monitoring";
import { Database, PlugZap, RefreshCw, Unplug } from "lucide-react";
import { ChangeEvent, useState } from "react";

type ThingsBoardIntegrationPanelProps = {
  config: ThingsBoardConfig;
  onConfigChange: (next: ThingsBoardConfig) => void;
  onDataLoaded: (points: RawCtPoint[]) => void;
  onUseMock: () => void;
  sourceLabel: "Mock JSON" | "ThingsBoard";
  loadedCount: number;
  lastSync: string;
};

export function ThingsBoardIntegrationPanel({
  config,
  onConfigChange,
  onDataLoaded,
  onUseMock,
  sourceLabel,
  loadedCount,
  lastSync,
}: ThingsBoardIntegrationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Belum terhubung");

  const setConfig = (patch: Partial<ThingsBoardConfig>) => onConfigChange({ ...config, ...patch });

  const onNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const sec = Math.max(1, Number(event.target.value || 3));
    setConfig({ autoRefreshSec: Number.isFinite(sec) ? sec : 3 });
  };

  const loadThingsBoard = async () => {
    try {
      setLoading(true);
      setStatusText("Mengambil data dari ThingsBoard...");
      const result = await fetchThingsBoardPoints(config);
      onDataLoaded(result.points);
      setStatusText(result.message);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl font-semibold text-slate-900">Setting</h3>
          <p className="text-xs text-slate-500">Pengaturan koneksi data telemetry CT clamp dari backend ThingsBoard.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Source: {sourceLabel}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Records: {loadedCount}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Sync: {lastSync}</span>
        </div>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="text-xs text-slate-600">
          ThingsBoard URL
          <input
            value={config.baseUrl}
            onChange={(event) => setConfig({ baseUrl: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="http://localhost:8080"
          />
        </label>
        <label className="text-xs text-slate-600">
          Device ID
          <input
            value={config.deviceId}
            onChange={(event) => setConfig({ deviceId: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="UUID device"
          />
        </label>
        <label className="text-xs text-slate-600">
          JWT Token (Opsional)
          <input
            type="password"
            value={config.accessToken ?? ""}
            onChange={(event) => setConfig({ accessToken: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="JWT token user"
          />
        </label>
        <label className="text-xs text-slate-600">
          Username (Opsional)
          <input
            value={config.username ?? ""}
            onChange={(event) => setConfig({ username: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="tenant@thingsboard.org"
          />
        </label>
        <label className="text-xs text-slate-600">
          Password (Opsional)
          <input
            type="password"
            value={config.password ?? ""}
            onChange={(event) => setConfig({ password: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="password"
          />
        </label>
        <label className="text-xs text-slate-600">
          Telemetry Keys
          <input
            value={config.keys}
            onChange={(event) => setConfig({ keys: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="current_r,current_s,current_t"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={config.autoRefreshEnabled}
            onChange={(event) => setConfig({ autoRefreshEnabled: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Realtime Refresh Dashboard
        </label>
        <label className="text-xs text-slate-600">
          Interval (detik)
          <input
            type="number"
            min={1}
            value={config.autoRefreshSec}
            onChange={onNumberChange}
            className="ml-2 w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={loadThingsBoard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          Load from ThingsBoard
        </button>
        <button
          type="button"
          onClick={onUseMock}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Unplug className="h-4 w-4" />
          Gunakan Mock Data
        </button>
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <Database className="h-3.5 w-3.5" />
          {statusText} (default range: 24 jam terakhir, auth: JWT atau username/password)
        </span>
      </div>
    </section>
  );
}
