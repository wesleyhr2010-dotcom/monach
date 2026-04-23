interface Tier {
  pct: number;
  min_sales_value: number;
}

interface CommissionInfo {
  tierAtual: { pct: number; min_sales_value: number } | null;
  proximoTier: { pct: number; min_sales_value: number } | null;
  faltaParaProximo: number;
}

interface CommissionTiersProps {
  tiers: Tier[];
  commissionInfo: CommissionInfo;
}

export function CommissionTiers({ tiers, commissionInfo }: CommissionTiersProps) {
  const sorted = [...tiers].sort((a, b) => a.min_sales_value - b.min_sales_value);
  const activeIdx = commissionInfo.tierAtual
    ? sorted.findIndex((t) => t.pct === commissionInfo.tierAtual!.pct)
    : -1;

  return (
    <div className="flex flex-col items-center mt-6">
      <span
        className="text-[13px] leading-4 text-[#1A1A1A] mb-2"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
      >
        Nivel de Comisión Mensual
      </span>

      <div className="flex gap-[6px] mb-3">
        {sorted.map((tier, idx) => {
          const isReached = idx <= activeIdx;
          const isCurrent = idx === activeIdx;
          return (
            <div
              key={tier.pct}
              className="rounded-full px-3 py-[6px]"
              style={{
                backgroundColor: isReached ? "#35605A" : "#D9D6D2",
                border: isCurrent ? "2px solid #1A1A1A" : "2px solid transparent",
              }}
            >
              <span
                className="text-[11px] leading-[14px]"
                style={{
                  fontFamily: "var(--font-raleway)",
                  fontWeight: 500,
                  color: isReached ? "#FFFFFF" : "#777777",
                }}
              >
                {tier.pct}%
              </span>
            </div>
          );
        })}
      </div>

      {commissionInfo.proximoTier ? (
        <span
          className="text-[12px] leading-4 text-[#777777]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Faltan G$ {commissionInfo.faltaParaProximo.toLocaleString("es-PY")} para el {commissionInfo.proximoTier.pct}%
        </span>
      ) : (
        <span
          className="text-[12px] leading-4 text-[#35605A]"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
        >
          ¡Estás en el nivel máximo! 🎉
        </span>
      )}
    </div>
  );
}
