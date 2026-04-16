"use client";

import { CalendarClock } from "lucide-react";

type TimeFilterPanelProps = {
  startValue: string;
  endValue: string;
  onChangeStart: (value: string) => void;
  onChangeEnd: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onPresetHours: (hours: number) => void;
  filteredCount: number;
  totalCount: number;
  hasPendingChanges: boolean;
};

export function TimeFilterPanel({
  startValue,
  endValue,
  onChangeStart,
  onChangeEnd,
  onApply,
  onReset,
  onPresetHours,
  filteredCount,
  totalCount,
  hasPendingChanges,
}: TimeFilterPanelProps) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-700" />
          <h3 className="font-heading text-lg font-semibold text-slate-900">Filter Waktu</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Data: {filteredCount}/{totalCount}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <label className="text-xs text-slate-600">
          Start Time
          <input
            type="datetime-local"
            value={startValue}
            onChange={(event) => onChangeStart(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>
        <label className="text-xs text-slate-600">
          End Time
          <input
            type="datetime-local"
            value={endValue}
            onChange={(event) => onChangeEnd(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onApply}
            className={`h-[42px] rounded-lg px-3 text-sm font-medium text-white ${
              hasPendingChanges ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-400"
            }`}
            disabled={!hasPendingChanges}
          >
            Terapkan
          </button>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 6, 12, 24].map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => onPresetHours(hours)}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Last {hours}h
          </button>
        ))}
      </div>
    </section>
  );
}
