"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: Array<{ dia: string; visitas: number }>;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "8px", padding: "8px 12px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--admin-text)", margin: 0 }}>
          {label}: {payload[0].value} visitas
        </p>
      </div>
    );
  }
  return null;
}

export function AnalyticsVisitasChart({ data }: Props) {
  if (data.length === 0 || data.every((d) => d.visitas === 0)) {
    return (
      <div style={{ textAlign: "center", color: "var(--admin-text-muted)", padding: "40px 0" }}>
        Sin datos de vitrina en el período
      </div>
    );
  }

  return (
    <div style={{ height: 240, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="vitrinaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#35605a" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
          <XAxis
            dataKey="dia"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(53,96,90,0.1)" }} />
          <Bar
            dataKey="visitas"
            fill="url(#vitrinaGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
