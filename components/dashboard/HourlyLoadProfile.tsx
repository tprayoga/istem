"use client";

import { HourlyLoadItem } from "@/types/monitoring";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionCard } from "./SectionCard";

type HourlyLoadProfileProps = {
  data: HourlyLoadItem[];
};

export function HourlyLoadProfile({ data }: HourlyLoadProfileProps) {
  return (
    <SectionCard title="Hourly Load Profile" subtitle="Rata-rata beban arus per jam">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} width={35} />
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
              formatter={(value, key) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                return key === "avgCurrent" ? `${numericValue.toFixed(2)} A` : `${numericValue} m`;
              }}
            />
            <Bar dataKey="avgCurrent" name="avgCurrent" fill="#10b981" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
