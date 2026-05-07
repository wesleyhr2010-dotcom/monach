"use client";

import { cn } from "@/lib/utils";
import { maletaStatusConfig, type MaletaStatus } from "@/lib/maleta-helpers";

const statusStyles: Record<string, { dotColor: string; bgColor: string; textColor: string; rowBg?: string }> = {
  ativa:           { dotColor: "var(--admin-success)", bgColor: "var(--admin-success-10)", textColor: "var(--admin-success)" },
  atrasada:        { dotColor: "var(--admin-danger)", bgColor: "var(--admin-danger-15)", textColor: "var(--admin-danger)", rowBg: "var(--admin-surface-row-atrasada)" },
  aguardando_revisao: { dotColor: "var(--admin-warning)", bgColor: "var(--admin-warning-10)", textColor: "var(--admin-warning)", rowBg: "var(--admin-surface-row-aguardando)" },
  concluida:       { dotColor: "var(--admin-text-muted)", bgColor: "var(--admin-muted-15)", textColor: "var(--admin-text-muted)" },
};

type AdminStatusBadgeProps = {
  status: MaletaStatus;
  className?: string;
};

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const config = maletaStatusConfig[status];
  const style = statusStyles[status] || statusStyles.ativa;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md py-1 px-2.5 gap-1.5",
        "font-['RalewayRoman-Bold','Raleway',system-ui,sans-serif] font-bold text-[11px]",
        className
      )}
      style={{ backgroundColor: style.bgColor, color: style.textColor }}
    >
      <span className="w-1.5 h-1.5 shrink-0 rounded-full" style={{ backgroundColor: style.dotColor }} />
      {config.label}
    </span>
  );
}

export function getStatusRowStyle(status: MaletaStatus): React.CSSProperties | undefined {
  const style = statusStyles[status];
  if (style?.rowBg) {
    return { background: style.rowBg };
  }
  return undefined;
}
