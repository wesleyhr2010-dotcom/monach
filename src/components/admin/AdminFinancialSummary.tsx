"use client";

import { cn } from "@/lib/utils";

type AdminFinancialSummaryProps = {
  items: { label: string; value: string; accent?: "default" | "success" | "info" | "purple" }[];
  className?: string;
};

const accentMap = {
  default: "",
  success: "text-emerald-400",
  info: "text-blue-400",
  purple: "text-purple-400",
};

export function AdminFinancialSummary({ items, className }: AdminFinancialSummaryProps) {
  return (
    <div className={cn("admin-card", className)}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
        Resumen Financiero
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: "var(--admin-bg)" }}>
            <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{item.label}</p>
            <p className={cn("text-lg font-bold mt-1", accentMap[item.accent ?? "default"])}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}