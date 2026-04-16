import { formatDuration, formatTime } from "@/lib/monitoring";
import { StartStopEvent } from "@/types/monitoring";
import { SectionCard } from "./SectionCard";

type StartStopEventsTableProps = {
  events: StartStopEvent[];
};

export function StartStopEventsTable({ events }: StartStopEventsTableProps) {
  return (
    <SectionCard title="Start / Stop Events" subtitle="Riwayat kejadian stop produksi dan durasi recovery">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2">Start Time</th>
              <th className="px-2 py-2">Stop Time</th>
              <th className="px-2 py-2">Duration</th>
              <th className="px-2 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={`${event.startTime}-${event.stopTime}`} className="border-b border-slate-100 text-slate-700">
                <td className="px-2 py-2 font-medium">{formatTime(event.startTime)}</td>
                <td className="px-2 py-2">{formatTime(event.stopTime)}</td>
                <td className="px-2 py-2">{formatDuration(event.durationMinutes)}</td>
                <td className="px-2 py-2">{event.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
