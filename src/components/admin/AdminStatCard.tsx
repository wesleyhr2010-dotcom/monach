"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "default" | "success" | "danger" | "warning" | "info";
  onClick?: () => void;
  className?: string;
};

const colorMap = {
  default: "",
  success: "text-[#4ADE80]",
  danger: "text-[#E05C5C]",
  warning: "text-[#FACC15]",
  info: "text-[#60A5FA]",
};

export function AdminStatCard({ label, value, icon: Icon, color = "default", onClick, className }: AdminStatCardProps) {
  return (
    <div
      className={cn("admin-stat-card", onClick && "cursor-pointer hover:border-[#35605A55] transition-colors", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="admin-stat-label">{label}</div>
      <div className={cn("admin-stat-value", colorMap[color])}>
        {Icon && <Icon className="w-5 h-5 inline mr-2 -mt-1" />}
        {value}
      </div>
    </div>
  );
}