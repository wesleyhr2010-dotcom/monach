"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { VentaListItem } from "@/app/admin/actions-ventas";

type Props = {
  items: VentaListItem[];
  sort: "created_at" | "total" | "cliente";
  dir: "asc" | "desc";
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Asuncion",
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

function StatusBadge({ status, variant }: { status: string; variant: "success" | "danger" }) {
  const colors = variant === "success"
    ? { bg: "var(--admin-success-10)", text: "var(--admin-success)", dot: "var(--admin-success)" }
    : { bg: "var(--admin-danger-15)", text: "var(--admin-danger)", dot: "var(--admin-danger)" };
  return (
    <span
      className="inline-flex items-center rounded-md py-1 px-2.5 gap-1.5 font-['RalewayRoman-Bold','Raleway',system-ui,sans-serif] font-bold text-[11px]"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span className="w-1.5 h-1.5 shrink-0 rounded-full" style={{ backgroundColor: colors.dot }} />
      {status}
    </span>
  );
}

function SortIcon({ column, sort, dir }: { column: "created_at" | "total" | "cliente"; sort: string; dir: string }) {
  if (sort !== column) return <span style={{ color: "var(--admin-text-muted)", fontSize: 10 }}>↕</span>;
  return <span style={{ color: "var(--admin-accent)", fontSize: 10 }}>{dir === "desc" ? "↓" : "↑"}</span>;
}

export function VentasTable({ items, sort, dir }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleSort(column: "created_at" | "total" | "cliente") {
    const params = new URLSearchParams(searchParams?.toString() || "");
    const newDir = sort === column && dir === "desc" ? "asc" : "desc";
    params.set("sort", column);
    params.set("dir", newDir);
    router.push(`/admin/ventas?${params.toString()}`);
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th style={{ cursor: "pointer" }} onClick={() => toggleSort("created_at")}>
            Fecha <SortIcon column="created_at" sort={sort} dir={dir} />
          </th>
          <th style={{ cursor: "pointer" }} onClick={() => toggleSort("cliente")}>
            Cliente <SortIcon column="cliente" sort={sort} dir={dir} />
          </th>
          <th style={{ textAlign: "right" }}>Items</th>
          <th style={{ textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("total")}>
            Total <SortIcon column="total" sort={sort} dir={dir} />
          </th>
          <th>Moneda</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {items.map((venta) => (
          <tr
            key={venta.id}
            style={venta.cancelled_at ? { opacity: 0.6 } : undefined}
          >
            <td>
              <Link href={`/admin/ventas/${venta.id}`} style={{ color: "var(--admin-accent)", fontWeight: 500 }}>
                {formatDate(venta.created_at)}
              </Link>
            </td>
            <td>
              {venta.cliente_nombre ?? (
                <span style={{ color: "var(--admin-text-muted)", fontStyle: "italic" }}>Consumidor Final</span>
              )}
              {venta.cliente_ruc && <span style={{ color: "var(--admin-text-muted)", fontSize: 12, display: "block" }}>RUC: {venta.cliente_ruc}</span>}
            </td>
            <td style={{ textAlign: "right" }}>{venta.cantidad_itens}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(venta.total_pyg)}</td>
            <td>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
                {venta.moneda}
              </span>
            </td>
            <td>
              {venta.cancelled_at ? (
                <StatusBadge status="Cancelada" variant="danger" />
              ) : (
                <StatusBadge status="Confirmada" variant="success" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
