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
          className="text-xs font-semibold text-app-accent-brown"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Nuevo
        </span>
      );
    } else if (trend.pct > 0) {
      trendEl = (
        <span
          className="text-xs font-semibold text-app-accent-green"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          ↑ +{trend.pct}%
        </span>
      );
    } else if (trend.pct < 0) {
      trendEl = (
        <span
          className="text-xs font-semibold text-app-danger"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          ↓ {trend.pct}%
        </span>
      );
    } else {
      trendEl = (
        <span
          className="text-xs font-semibold text-app-text-secondary"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          —
        </span>
      );
    }
  }

  return (
    <div className="bg-app-card-bg rounded-xl border border-app-border p-4 flex flex-col gap-2">
      <span
        className="text-[11px] font-medium text-app-text-secondary uppercase tracking-wider"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-semibold text-app-text"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {value}
      </span>
      {trendEl && <div className="flex items-center gap-1">{trendEl}</div>}
    </div>
  );
}
