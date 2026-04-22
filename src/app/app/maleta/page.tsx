import Link from "next/link";
import { requireAuth } from "@/lib/user";
import { getMinhasMaletas } from "../actions-revendedora";
import { MaletaList, type MaletaListItem } from "@/components/app/MaletaList";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

export default async function MaletaPage() {
  const user = await requireAuth(["REVENDEDORA"]);
  if (!user?.profileId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#777777]" style={{ fontFamily: "var(--font-raleway)" }}>
          No autorizado.
        </p>
      </div>
    );
  }

  const rawMaletas = await getMinhasMaletas(user.profileId);

  const maletas: MaletaListItem[] = rawMaletas.map((m) => {
    const totalValor = m.itens.reduce(
      (sum, item) => sum + Number(item.preco_fixado) * item.quantidade_enviada,
      0
    );

    return {
      id: m.id,
      numero: m.numero,
      status: m.status,
      data_limite: m.data_limite,
      totalValor,
    };
  });

  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Header */}
      <div className="flex flex-col pt-6 pb-4 bg-[#F5F2EF] px-5">
        <div className="flex justify-between items-center">
          <Link href="/app" className="shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <span
            className="tracking-[0.5px] uppercase text-[#1A1A1A] font-bold text-sm leading-[18px] flex-1 ml-4 m-0"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            MIS CONSIGNACIONES
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col pb-[140px] gap-3 px-5">
        <MaletaList maletas={maletas} />
      </div>
    </div>
  );
}