import { CommissionTiers } from "./CommissionTiers";

type MaletaStatus = "ativa" | "atrasada" | "aguardando_revisao" | "concluida";

const STATUS_CONFIG: Record<MaletaStatus, { label: string; bg: string }> = {
  ativa: { label: "En proceso", bg: "#35605A" },
  atrasada: { label: "Atrasada", bg: "#C0392B" },
  aguardando_revisao: { label: "En revisión", bg: "#917961" },
  concluida: { label: "Concluida", bg: "#777777" },
};

interface MaletaCardProps {
  maleta: {
    status: string;
    data_limite: Date | null;
  } | null;
  totalVendido: number;
}

function getDaysLeft(dataLimite: Date | null): string {
  if (!dataLimite) return "Vence em breve";
  const diff = new Date(dataLimite).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Atrasada";
  if (days === 0) return "Vence hoje";
  return `Faltan ${days} día${days !== 1 ? "s" : ""}`;
}

export function MaletaCard({ maleta, totalVendido }: MaletaCardProps) {
  if (!maleta) {
    return (
      <div className="bg-[#EBEBEB] rounded-2xl px-5 py-5">
        <p
          className="text-[13px] text-[#777777] text-center py-4"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Ninguna maleta activa por el momento.
        </p>
      </div>
    );
  }

  const statusKey = maleta.status as MaletaStatus;
  const { label, bg } = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.ativa;
  const daysLeft = getDaysLeft(maleta.data_limite);

  return (
    <div className="bg-[#EBEBEB] rounded-2xl px-5 py-5">
      {/* Title row */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[18px] leading-[22px] text-[#1A1A1A]"
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
        >
          Consignación Actual
        </span>
        <div className="rounded-full px-[14px] py-[6px]" style={{ backgroundColor: bg }}>
          <span
            className="text-white text-[12px] leading-4"
            style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Days left */}
      <span
        className="text-[13px] leading-4 text-[#777777]"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {daysLeft}
      </span>

      {/* Commission tiers */}
      <CommissionTiers totalVendido={totalVendido} />
    </div>
  );
}
