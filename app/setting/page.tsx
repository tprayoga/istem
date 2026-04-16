"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ThingsBoardIntegrationPanel } from "@/components/dashboard/ThingsBoardIntegrationPanel";
import {
  getDefaultDataSource,
  loadPersistedDataSource,
  loadThingsBoardConfig,
  PersistedDataSource,
  savePersistedDataSource,
  saveThingsBoardConfig,
  ThingsBoardConfig,
} from "@/lib/data-source";
import { formatDateTime } from "@/lib/monitoring";
import rawData from "@/data/mock/ct-clamp-day.json";
import { RawCtPoint } from "@/types/monitoring";
import { useEffect, useState } from "react";

export default function SettingPage() {
  const [sourceState, setSourceState] = useState<PersistedDataSource>(() => getDefaultDataSource());
  const [tbConfig, setTbConfig] = useState<ThingsBoardConfig>(() => loadThingsBoardConfig());

  useEffect(() => {
    const persisted = loadPersistedDataSource();
    if (!persisted) return;
    const timer = setTimeout(() => {
      setSourceState(persisted);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveThingsBoardConfig(tbConfig);
  }, [tbConfig]);

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[1900px] px-4 py-5 md:px-6">
        <DashboardHeader
          lastUpdate={formatDateTime(sourceState.lastSyncAt)}
          actions={<span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Setting</span>}
        />

        <ThingsBoardIntegrationPanel
          config={tbConfig}
          onConfigChange={setTbConfig}
          sourceLabel={sourceState.sourceType === "mock" ? "Mock JSON" : "ThingsBoard"}
          loadedCount={sourceState.points.length}
          lastSync={formatDateTime(sourceState.lastSyncAt)}
          onDataLoaded={(pointsFromThingsBoard: RawCtPoint[]) => {
            const next: PersistedDataSource = {
              sourceType: "thingsboard",
              points: pointsFromThingsBoard,
              lastSyncAt: new Date().toISOString(),
            };
            savePersistedDataSource(next);
            setSourceState(next);
          }}
          onUseMock={() => {
            const next: PersistedDataSource = {
              sourceType: "mock",
              points: rawData as RawCtPoint[],
              lastSyncAt: new Date().toISOString(),
            };
            savePersistedDataSource(next);
            setSourceState(next);
          }}
        />
      </div>
    </main>
  );
}
