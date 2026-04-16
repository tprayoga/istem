import { ReactNode } from "react";

type DashboardHeaderProps = {
  lastUpdate: string;
  actions?: ReactNode;
};

export function DashboardHeader({ lastUpdate, actions }: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Operational Production Monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">Monitoring aktivitas mesin berbasis arus 3 phase</p>
      </div>
      <div className="flex items-start gap-3">
        {actions}
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-right shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Last Update</p>
          <p className="font-heading text-xl font-semibold text-slate-900">{lastUpdate}</p>
        </div>
      </div>
    </header>
  );
}
