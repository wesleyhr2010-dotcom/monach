import Link from "next/link";
import { getCurrentUser } from "@/lib/user";
import { getMinhasMaletas } from "../actions-revendedora";
import { MaletaList, type MaletaListItem } from "@/components/app/MaletaList";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

export default async function MaletaPage() {
  const user = await getCurrentUser();
  if (!user?.profileId || user.role !== "REVENDEDORA") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-app-text-secondary" style={{ fontFamily: "var(--font-raleway)" }}>
          No autorizado.
        </p>
      </div>
    );
  }

  const result = await getMinhasMaletas(user.profileId);

  if (!result.success) {
    return (
      <div className="flex flex-col min-h-full bg-app-bg">
        <div className="flex flex-col pt-6 pb-4 bg-app-bg px-5">
          <div className="flex justify-between items-center">
            <Link href="/app" className="shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <span
              className="tracking-[0.5px] uppercase text-app-text font-bold text-sm leading-[18px] flex-1 ml-4 m-0"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              MIS CONSIGNACIONES
            </span>
          </div>
        </div>
        <ErrorState
          title="Error al cargar"
          description={result.error}
          onRetry={() => typeof window !== "undefined" && window.location.reload()}
        />
      </div>
    );
  }

  const rawMaletas = result.data;

  if (rawMaletas.length === 0) {
    return (
      <div className="flex flex-col min-h-full bg-app-bg">
        <div className="flex flex-col pt-6 pb-4 bg-app-bg px-5">
          <div className="flex justify-between items-center">
            <Link href="/app" className="shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <span
              className="tracking-[0.5px] uppercase text-app-text font-bold text-sm leading-[18px] flex-1 ml-4 m-0"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              MIS CONSIGNACIONES
            </span>
          </div>
        </div>
        <EmptyState
          title="No tenés maletas"
          description="Tus consignaciones aparecerán aquí."
        />
      </div>
    );
  }

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
    <div className="flex flex-col min-h-full bg-app-bg">
      {/* Header */}
      <div className="flex flex-col pt-6 pb-4 bg-app-bg px-5">
        <div className="flex justify-between items-center">
          <Link href="/app" className="shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <span
            className="tracking-[0.5px] uppercase text-app-text font-bold text-sm leading-[18px] flex-1 ml-4 m-0"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            MIS CONSIGNACIONES
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col pb-2 app-nav-clearance gap-3 px-5">
        <MaletaList maletas={maletas} />
      </div>
    </div>
  );
}
