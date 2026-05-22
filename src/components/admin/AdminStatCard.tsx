"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "default" | "success" | "danger" | "warning" | "info";
  onClick?: () => void;
  className?: string;
};

const colorMap = {
  default: "",
  success: "text-[var(--admin-success)]",
  danger: "text-[var(--admin-danger)]",
  warning: "text-[var(--admin-warning)]",
  info: "text-[var(--admin-info-light)]",
};

export function AdminStatCard({ label, value, icon, color = "default", onClick, className }: AdminStatCardProps) {
  return (
    <div
      className={cn("admin-stat-card", onClick && "cursor-pointer hover:border-[var(--admin-accent)55] transition-colors", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="admin-stat-label">{label}</div>
      <div className={cn("admin-stat-value", colorMap[color])}>
        {icon}
        {value}
      </div>
    </div>
  );
}
