'use client';

interface Trend {
  pct: number | null;
  label: string;
}

interface MetricCardTrendProps {
  label: string;
  value: string | number;
  trend?: Trend | null;
}

export function MetricCardTrend({ label, value, trend }: MetricCardTrendProps) {
  let trendEl: React.ReactNode = null;

  if (trend) {
    if (trend.pct === null) {
      trendEl = (
        <span
          className="text-xs font-semibold text-[#917961]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Nuevo
        </span>
      );
    } else if (trend.pct > 0) {
      trendEl = (
        <span
          className="text-xs font-semibold text-[#4ADE80]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          ↑ +{trend.pct}%
        </span>
      );
    } else if (trend.pct < 0) {
      trendEl = (
        <span
          className="text-xs font-semibold text-[#E05C5C]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          ↓ {trend.pct}%
        </span>
      );
    } else {
      trendEl = (
        <span
          className="text-xs font-semibold text-[#888]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          —
        </span>
      );
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E0DB] p-4 flex flex-col gap-2">
      <span
        className="text-[11px] font-medium text-[#888] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-semibold text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {value}
      </span>
      {trendEl && <div className="flex items-center gap-1">{trendEl}</div>}
    </div>
  );
}
