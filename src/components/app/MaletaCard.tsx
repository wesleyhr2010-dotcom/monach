import { CommissionTiers } from "./CommissionTiers";

type MaletaStatus = "ativa" | "atrasada" | "aguardando_revisao" | "concluida";

const STATUS_CONFIG: Record<MaletaStatus, { label: string; bg: string }> = {
  ativa: { label: "En proceso", bg: "#35605A" },
  atrasada: { label: "Atrasada", bg: "#C0392B" },
  aguardando_revisao: { label: "En revisión", bg: "#917961" },
  concluida: { label: "Concluida", bg: "#777777" },
};

interface Tier {
  pct: number;
  min_sales_value: number;
}

interface CommissionInfo {
  tierAtual: { pct: number; min_sales_value: number } | null;
  proximoTier: { pct: number; min_sales_value: number } | null;
  faltaParaProximo: number;
}

interface MaletaCardProps {
  maleta: {
    status: string;
    data_limite: Date | null;
  } | null;
  tiers: Tier[];
  commissionInfo: CommissionInfo;
}

function getDaysLeft(dataLimite: Date | null): { text: string; urgente: boolean } {
  if (!dataLimite) return { text: "Vence em breve", urgente: false };
  const diff = new Date(dataLimite).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: "Atrasada", urgente: true };
  if (days === 0) return { text: "Vence hoy", urgente: true };
  if (days <= 3) return { text: `Faltan ${days} día${days !== 1 ? "s" : ""}`, urgente: true };
  return { text: `Faltan ${days} día${days !== 1 ? "s" : ""}`, urgente: false };
}

export function MaletaCard({ maleta, tiers, commissionInfo }: MaletaCardProps) {
  if (!maleta) {
    return (
      <div className="bg-[#EBEBEB] rounded-2xl px-5 py-5">
        <p
          className="text-[13px] text-[#777777] text-center py-4"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Ninguna consignación activa por el momento.
        </p>
        <button
          className="w-full mt-2 rounded-xl py-3 text-white text-[14px] font-medium"
          style={{ backgroundColor: "#35605A", fontFamily: "var(--font-raleway)" }}
        >
          Solicitar consignación
        </button>
      </div>
    );
  }

  const statusKey = maleta.status as MaletaStatus;
  const { label, bg } = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.ativa;
  const { text: daysLeft, urgente } = getDaysLeft(maleta.data_limite);

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
        className="text-[13px] leading-4"
        style={{
          fontFamily: "var(--font-raleway)",
          color: urgente ? "#C0392B" : "#777777",
          fontWeight: urgente ? 600 : 400,
        }}
      >
        {daysLeft}
      </span>

      {/* Commission tiers */}
      <CommissionTiers tiers={tiers} commissionInfo={commissionInfo} />
    </div>
  );
}
