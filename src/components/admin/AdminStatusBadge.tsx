"use client";

import { cn } from "@/lib/utils";
import { maletaStatusConfig, type MaletaStatus } from "@/lib/maleta-helpers";

const statusStyles: Record<string, { dot: string; bg: string; text: string; rowBg?: string }> = {
  ativa:           { dot: "bg-[#4ADE80]", bg: "bg-[#4ADE801A]", text: "text-[#4ADE80]" },
  atrasada:        { dot: "bg-[#E05C5C]", bg: "bg-[#E05C5C26]", text: "text-[#E05C5C]", rowBg: "var(--admin-surface-row-atrasada)" },
  aguardando_revisao: { dot: "bg-[#FACC15]", bg: "bg-[#FACC151A]", text: "text-[#FACC15]", rowBg: "var(--admin-surface-row-aguardando)" },
  concluida:       { dot: "bg-[#555555]", bg: "bg-[#64646426]", text: "text-[#777777]" },
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
        style.bg,
        style.text,
        "font-['RalewayRoman-Bold','Raleway',system-ui,sans-serif] font-bold text-[11px]",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 shrink-0 rounded-full", style.dot)} />
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