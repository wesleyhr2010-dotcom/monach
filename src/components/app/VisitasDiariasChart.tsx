'use client';

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";

interface VisitasDiariasChartProps {
  data: Array<{ dia: string; visitas: number }>;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-card-bg rounded-lg shadow-lg border border-app-border px-3 py-2">
        <p className="text-sm font-medium text-app-text">
          {label}: {payload[0].value} visitas
        </p>
      </div>
    );
  }
  return null;
}

export function VisitasDiariasChart({ data }: VisitasDiariasChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="Sin visitas"
        description="No hay datos de visitas para este período."
      />
    );
  }

  return (
    <div style={{ height: 240, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#35605a" />
              <stop offset="100%" stopColor="#a8d5c2" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" vertical={false} />
          <XAxis
            dataKey="dia"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 12, fontFamily: "var(--font-raleway)" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(53,96,90,0.06)" }} />
          <Bar
            dataKey="visitas"
            fill="url(#greenGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
