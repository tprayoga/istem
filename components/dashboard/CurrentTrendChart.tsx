"use client";

import { EnrichedPoint } from "@/types/monitoring";
import { formatTime } from "@/lib/monitoring";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "./SectionCard";

type CurrentTrendChartProps = {
  points: EnrichedPoint[];
};

export function CurrentTrendChart({ points }: CurrentTrendChartProps) {
  const chartData = points.map((point) => ({
    time: formatTime(point.timestamp),
    r: Number(point.current_r.toFixed(2)),
    s: Number(point.current_s.toFixed(2)),
    t: Number(point.current_t.toFixed(2)),
    avg: Number(point.avgCurrent.toFixed(2)),
  }));

  return (
    <SectionCard title="Current Trend 3 Phase" subtitle="Trend arus fase R, S, T dan rata-rata beban operasi">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" minTickGap={24} tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} width={35} />
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
              formatter={(value) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                return [`${numericValue.toFixed(2)} A`, ""];
              }}
            />
            <Line type="monotone" dataKey="r" name="R" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="s" name="S" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="t" name="T" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="avg"
              name="Avg"
              stroke="#1e293b"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
