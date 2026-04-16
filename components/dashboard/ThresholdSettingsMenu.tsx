"use client";

import { ThresholdConfig } from "@/types/monitoring";
import { Settings2 } from "lucide-react";
import { useState } from "react";

type ThresholdSettingsMenuProps = {
  value: ThresholdConfig;
  onChange: (next: ThresholdConfig) => void;
  onReset: () => void;
};

type ThresholdField = {
  key: keyof ThresholdConfig;
  label: string;
  step: string;
  suffix: string;
};

const fields: ThresholdField[] = [
  { key: "offMax", label: "OFF < ", step: "0.1", suffix: "A" },
  { key: "standbyMax", label: "STANDBY < ", step: "0.1", suffix: "A" },
  { key: "productionMax", label: "PRODUKSI < ", step: "0.1", suffix: "A" },
  { key: "highLoadMax", label: "HIGH LOAD < ", step: "0.1", suffix: "A" },
  { key: "lowLoadMax", label: "Low Load < ", step: "0.1", suffix: "A" },
  { key: "unbalanceMaxPct", label: "Unbalance > ", step: "0.5", suffix: "%" },
];

export function ThresholdSettingsMenu({ value, onChange, onReset }: ThresholdSettingsMenuProps) {
  const [open, setOpen] = useState(false);

  const updateField = (key: keyof ThresholdConfig, rawValue: string) => {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return;
    onChange({ ...value, [key]: parsed });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <Settings2 className="h-4 w-4" />
        Threshold Setting
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3">
            <p className="font-heading text-lg font-semibold text-slate-900">Threshold Setting</p>
            <p className="text-xs text-slate-500">Perubahan langsung mempengaruhi klasifikasi status.</p>
          </div>

          <div className="space-y-2">
            {fields.map((field) => (
              <label key={field.key} className="grid grid-cols-[1fr_110px_26px] items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">{field.label}</span>
                <input
                  type="number"
                  value={value[field.key]}
                  step={field.step}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                />
                <span>{field.suffix}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Default
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
