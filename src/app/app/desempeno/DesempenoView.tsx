'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { type TimeRange } from "@/lib/date-range";
import { TimeRangeSelector } from "@/components/app/TimeRangeSelector";
import { MetricCardTrend } from "@/components/app/MetricCardTrend";
import { VisitasDiariasChart } from "@/components/app/VisitasDiariasChart";
import { ProductosPopularesList } from "@/components/app/ProductosPopularesList";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Metrics {
  accesos: number;
  visitantes_unicos: number;
  cliques_whatsapp: number;
  pecas_vendidas: number;
}

interface Variacao {
  accesos_pct: number | null;
  visitantes_pct: number | null;
  cliques_pct: number | null;
  pecas_pct: number | null;
}

interface GraficoPoint {
  dia: string;
  visitas: number;
}

interface ProductoPop {
  id: string;
  nome: string;
  imagem_url: string | null;
  visitas: number;
}

interface DesempenhoData {
  actual: Metrics;
  anterior: Metrics;
  variacao: Variacao;
  grafico: GraficoPoint[];
  productos: ProductoPop[];
}

interface DesempenhoViewProps {
  initialData: DesempenhoData | null;
  initialError: string | null;
  initialRango: TimeRange;
  resellerId: string;
}

export function DesempenoView({
  initialData,
  initialError,
  initialRango,
}: DesempenhoViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentRango = (searchParams.get("rango") as TimeRange) || initialRango;

  const handleRangoChange = useCallback(
    (rango: TimeRange) => {
      startTransition(() => {
        router.push(`/app/desempeno?rango=${rango}`);
      });
    },
    [router]
  );

  const isLoading = isPending;
  const hasError = initialError !== null;
  const data = initialData;

  const isEmpty =
    data &&
    data.actual.accesos === 0 &&
    data.actual.visitantes_unicos === 0 &&
    data.actual.cliques_whatsapp === 0 &&
    data.actual.pecas_vendidas === 0 &&
    data.grafico.length === 0;

  if (hasError) {
    return (
      <div className="flex flex-col min-h-full bg-[#F5F2EF]">
        <div className="px-5 py-4 flex items-center gap-2">
          <Link href="/app" className="p-1 -ml-1">
            <ChevronLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <h1
            className="text-lg font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Mi Desempeño
          </h1>
        </div>
        <ErrorState
          title="Error al cargar"
          description={initialError ?? "No se pudieron cargar las métricas."}
          onRetry={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/app" className="p-1 -ml-1">
            <ChevronLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <h1
            className="text-lg font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Mi Desempeño
          </h1>
        </div>
        <TimeRangeSelector value={currentRango} onChange={handleRangoChange} />
      </div>

      {isLoading && (
        <div className="px-5 pb-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!isLoading && isEmpty && (
        <div className="px-5 pb-8 flex-1 flex items-center justify-center">
          <EmptyState
            title="Sin datos aún"
            description="Tu vitrina aún no tiene visitas. ¡Comparte tu catálogo para empezar a ver métricas!"
          />
        </div>
      )}

      {!isLoading && data && !isEmpty && (
        <div className="px-5 pb-8 flex flex-col gap-5">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCardTrend
              label="Accesos al Catálogo"
              value={data.actual.accesos.toLocaleString("es-PY")}
              trend={
                data.variacao.accesos_pct !== undefined
                  ? { pct: data.variacao.accesos_pct, label: "" }
                  : null
              }
            />
            <MetricCardTrend
              label="Visitantes Únicos"
              value={data.actual.visitantes_unicos.toLocaleString("es-PY")}
              trend={
                data.variacao.visitantes_pct !== undefined
                  ? { pct: data.variacao.visitantes_pct, label: "" }
                  : null
              }
            />
            <MetricCardTrend
              label="Clics en WhatsApp"
              value={data.actual.cliques_whatsapp.toLocaleString("es-PY")}
              trend={
                data.variacao.cliques_pct !== undefined
                  ? { pct: data.variacao.cliques_pct, label: "" }
                  : null
              }
            />
            <MetricCardTrend
              label="Piezas Vendidas"
              value={data.actual.pecas_vendidas.toLocaleString("es-PY")}
              trend={
                data.variacao.pecas_pct !== undefined
                  ? { pct: data.variacao.pecas_pct, label: "" }
                  : null
              }
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-[#E5E0DB] p-4">
            <h2
              className="text-sm font-semibold text-[#1A1A1A] mb-3"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              Visitas Diarias
            </h2>
            <VisitasDiariasChart data={data.grafico} />
          </div>

          {/* Products */}
          <div>
            <h2
              className="text-sm font-semibold text-[#1A1A1A] mb-3"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              Productos Más Populares
            </h2>
            <ProductosPopularesList productos={data.productos} />
          </div>
        </div>
      )}
    </div>
  );
}
