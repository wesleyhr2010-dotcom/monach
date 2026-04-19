export const COMMISSION_TIERS = [
  { percent: "20%", threshold: 0 },
  { percent: "25%", threshold: 400_000 },
  { percent: "30%", threshold: 800_000 },
  { percent: "35%", threshold: 1_200_000 },
  { percent: "40%", threshold: 1_600_000 },
];

export function getActiveTierIndex(totalVendido: number): number {
  let active = 0;
  for (let i = 0; i < COMMISSION_TIERS.length; i++) {
    if (totalVendido >= COMMISSION_TIERS[i].threshold) active = i;
  }
  return active;
}

export function getNextTierInfo(
  totalVendido: number
): { percent: string; remaining: number } | null {
  const idx = getActiveTierIndex(totalVendido);
  if (idx >= COMMISSION_TIERS.length - 1) return null;
  const next = COMMISSION_TIERS[idx + 1];
  return { percent: next.percent, remaining: next.threshold - totalVendido };
}

interface CommissionTiersProps {
  totalVendido: number;
}

export function CommissionTiers({ totalVendido }: CommissionTiersProps) {
  const activeIdx = getActiveTierIndex(totalVendido);
  const next = getNextTierInfo(totalVendido);

  return (
    <div className="flex flex-col items-center mt-6">
      <span
        className="text-[13px] leading-4 text-[#1A1A1A] mb-2"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
      >
        Nivel de Comisión Mensual
      </span>

      <div className="flex gap-[6px] mb-3">
        {COMMISSION_TIERS.map((tier, idx) => {
          const isActive = idx <= activeIdx;
          return (
            <div
              key={tier.percent}
              className="rounded-full px-3 py-[6px]"
              style={{ backgroundColor: isActive ? "#35605A" : "#D9D6D2" }}
            >
              <span
                className="text-[11px] leading-[14px]"
                style={{
                  fontFamily: "var(--font-raleway)",
                  fontWeight: 500,
                  color: isActive ? "#FFFFFF" : "#777777",
                }}
              >
                {tier.percent}
              </span>
            </div>
          );
        })}
      </div>

      {next && (
        <span
          className="text-[12px] leading-4 text-[#777777]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Faltan G$ {next.remaining.toLocaleString("es-PY")} para el {next.percent}
        </span>
      )}
    </div>
  );
}
