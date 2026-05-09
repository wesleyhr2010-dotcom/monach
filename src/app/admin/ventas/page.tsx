import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { VentasKpiCards } from "./VentasKpiCards";
import { VentasTable } from "./VentasTable";
import { VentasDateRangeSelect } from "./VentasDateRangeSelect";
import { VentasSearchInput } from "./VentasSearchInput";
import { VentasCsvDownload } from "./VentasCsvDownload";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import {
  listVentas,
  getKPIsVentas,
  type ListVentasParams,
} from "@/app/admin/actions-ventas";
import { getRangeFromParams } from "@/app/admin/actions-analytics";

export const dynamic = "force-dynamic";

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "3m", days: 90 },
  { label: "12m", days: 365 },
];

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; search?: string; page?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const periodParam = params.period || "7";
  const periodDays = parseInt(periodParam, 10);
  const search = params.search || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const sort = (params.sort || "created_at") as "created_at" | "total" | "cliente";
  const dir = (params.dir || "desc") as "asc" | "desc";
  const fromStr = params.from;
  const toStr = params.to;
  const hasCustomRange = !!fromStr && !!toStr;

  let from: Date, to: Date;
  if (hasCustomRange) {
    const r = await getRangeFromParams(undefined, fromStr, toStr);
    from = r.from; to = r.to;
  } else {
    if (!PERIOD_OPTIONS.some((o) => o.days === periodDays)) {
      redirect("/admin/ventas?period=7");
    }
    const r = await getRangeFromParams(periodDays);
    from = r.from; to = r.to;
  }

  const listParams: ListVentasParams = { from, to, search, page, pageSize: 20, sort, dir };
  const [listResult, kpisResult] = await Promise.all([
    listVentas(listParams),
    getKPIsVentas({ from, to, search }),
  ]);

  if (!listResult.success || !kpisResult.success) {
    return (
      <div className="admin-page-body">
        <AdminEmptyState icon={Receipt} title="Error al cargar ventas" description={!listResult.success ? listResult.error : "Intentá de nuevo."} />
      </div>
    );
  }

  const { items, totalCount } = listResult.data;
  const totalPages = Math.ceil(totalCount / 20);
  const kpis = kpisResult.data;

  function buildPageLink(p: number) {
    const sp = new URLSearchParams();
    if (hasCustomRange) { sp.set("from", fromStr!); sp.set("to", toStr!); }
    else { sp.set("period", String(periodDays)); }
    if (search) sp.set("search", search);
    sp.set("sort", sort); sp.set("dir", dir); sp.set("page", String(p));
    return `/admin/ventas?${sp.toString()}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AdminPageHeader
        title="Histórico de Ventas"
        description="Consultá todas las ventas registradas en la tienda."
        breadcrumb="Ventas"
      />

      <div className="admin-page-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <VentasDateRangeSelect value={hasCustomRange ? { from, to } : undefined} />
          <div style={{ display: "flex", gap: 6 }}>
            {PERIOD_OPTIONS.map((opt) => (
              <a
                key={opt.days}
                href={`/admin/ventas?period=${opt.days}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={!hasCustomRange && periodDays === opt.days
                  ? { backgroundColor: "var(--admin-accent)", color: "var(--admin-text)" }
                  : { backgroundColor: "var(--admin-surface)", color: "var(--admin-text-muted)", border: "1px solid var(--admin-border)" }
                }
              >
                {opt.label}
              </a>
            ))}
          </div>
          <VentasSearchInput />
          <VentasCsvDownload params={listParams} filename={`ventas-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv`} />
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <VentasKpiCards kpis={kpis} />
        </div>

        {/* Table */}
        {items.length === 0 ? (
          <AdminEmptyState
            icon={Receipt}
            title="No hay ventas en el período"
            description="Probá con otro rango de fechas o agregá una venta desde el PDV."
          />
        ) : (
          <>
            <VentasTable items={items} sort={sort} dir={dir} />
            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <a
                href={page > 1 ? buildPageLink(page - 1) : "#"}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{ backgroundColor: "var(--admin-surface)", color: page > 1 ? "var(--admin-text)" : "var(--admin-text-muted)", border: "1px solid var(--admin-border)", pointerEvents: page > 1 ? "auto" : "none" }}
              >
                <ChevronLeft size={14} /> Anterior
              </a>
              <span style={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                Página {page} de {totalPages} ({totalCount} ventas)
              </span>
              <a
                href={page < totalPages ? buildPageLink(page + 1) : "#"}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{ backgroundColor: "var(--admin-surface)", color: page < totalPages ? "var(--admin-text)" : "var(--admin-text-muted)", border: "1px solid var(--admin-border)", pointerEvents: page < totalPages ? "auto" : "none" }}
              >
                Siguiente <ChevronRight size={14} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
