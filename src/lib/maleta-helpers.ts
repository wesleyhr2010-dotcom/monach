export const maletaStatusConfig = {
  ativa: { label: "Activa", variant: "success" as const, icon: "briefcase" },
  atrasada: { label: "Atrasada", variant: "destructive" as const, icon: "alert-triangle" },
  aguardando_revisao: { label: "Ag. Conferencia", variant: "warning" as const, icon: "clock" },
  concluida: { label: "Concluida", variant: "default" as const, icon: "check-circle" },
} as const;

export type MaletaStatus = keyof typeof maletaStatusConfig;

export function fmtCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return `₲ ${val.toLocaleString("es-PY")}`;
}

export function daysRemaining(dataLimite: string): number {
  return Math.ceil((new Date(dataLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrasada`;
  if (days === 0) return "Hoy";
  return `${days}d rest.`;
}

export function daysColorClass(days: number): string {
  if (days < 0) return "text-red-400";
  if (days <= 3) return "text-amber-400";
  return "text-emerald-400";
}