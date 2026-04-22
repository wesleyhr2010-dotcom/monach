type MaletaStatus = "ativa" | "atrasada" | "aguardando_revisao" | "concluida";

const STATUS_CONFIG: Record<MaletaStatus, { label: string; bg: string; text: string }> = {
  ativa: { label: "En proceso", bg: "#E2F2E9", text: "#1F7A4A" },
  atrasada: { label: "Atrasada", bg: "#FDE8E8", text: "#9B1C1C" },
  aguardando_revisao: { label: "En revisión", bg: "#FFF4E5", text: "#B26A00" },
  concluida: { label: "Finalizada", bg: "#D9D6D2", text: "#777777" },
};

interface StatusBadgeProps {
  status: string;
  detail?: string;
}

export function StatusBadge({ status, detail }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as MaletaStatus] ?? STATUS_CONFIG.ativa;
  const label = detail ? `${config.label}${detail ? " — " + detail : ""}` : config.label;

  return (
    <div
      className="rounded-[100px] py-1 px-2 inline-flex"
      style={{ backgroundColor: config.bg }}
    >
      <span
        className="uppercase font-bold text-[11px] leading-[14px]"
        style={{ fontFamily: "var(--font-raleway)", color: config.text }}
      >
        {label}
      </span>
    </div>
  );
}

export function getItemStatusLabel(item: { quantidade_vendida: number; quantidade_enviada: number }): {
  label: string;
  bg: string;
  text: string;
} {
  if (item.quantidade_vendida === 0) return { label: "Disponible", bg: "#E2F2E9", text: "#1F7A4A" };
  if (item.quantidade_vendida >= item.quantidade_enviada) return { label: "Vendido", bg: "#D9D6D2", text: "#777777" };
  return { label: "Parcial", bg: "#FFF4E5", text: "#B26A00" };
}

export { STATUS_CONFIG };
export type { MaletaStatus };