"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type AdminEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function AdminEmptyState({ icon: Icon, title, description, action, className }: AdminEmptyStateProps) {
  return (
    <div className={cn("admin-empty", className)}>
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--admin-text-muted)" }} />}
      <p className="text-lg font-medium mb-1" style={{ color: "var(--admin-text)" }}>{title}</p>
      {description && <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}