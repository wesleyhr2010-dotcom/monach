'use client';

import { type TimeRange } from "@/lib/date-range";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mes" },
  { value: "30dias", label: "Últimos 30 días" },
  { value: "anio", label: "Este Año" },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="appearance-none bg-app-card-bg border border-app-border rounded-lg px-3 py-2 pr-8 text-sm font-medium text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
      >
        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
