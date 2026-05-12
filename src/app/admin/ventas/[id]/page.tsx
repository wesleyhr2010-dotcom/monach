import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CancelarVentaModal } from "../CancelarVentaModal";
import { getVentaById } from "@/app/admin/actions-ventas";
import { ArrowLeft, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function VentaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getVentaById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const venta = result.data;
  const isCancelled = !!venta.cancelled_at;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AdminPageHeader
        title={`Venta #${venta.id.slice(0, 8).toUpperCase()}`}
        description={formatDate(venta.created_at)}
        breadcrumb="Ventas"
        backHref="/admin/ventas"
        action={!isCancelled ? (
          <CancelarVentaModal
            ventaId={venta.id}
            ventaResumen={{
              cliente: venta.cliente?.nombre ?? "Consumidor Final",
              total: formatCurrency(venta.total_pyg),
              cantidad: venta.itens.reduce((sum, i) => sum + i.cantidad, 0),
            }}
            onCancel={() => { window.location.reload(); }}
          />
        ) : (
          <StatusBadge status="Cancelada" variant="danger" />
        )}
      />

      <div className="admin-page-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div style={{ background: "var(--admin-surface)", borderRadius: "var(--admin-radius)", padding: 16, border: "1px solid var(--admin-border)" }}>
            <span style={{ fontSize: 11, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Cliente</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600, color: "var(--admin-text)" }}>
              {venta.cliente?.nombre ?? <span style={{ fontStyle: "italic" }}>Consumidor Final</span>}
            </p>
            {venta.cliente?.ruc && <p style={{ margin: 0, fontSize: 13, color: "var(--admin-text-muted)" }}>RUC: {venta.cliente.ruc}</p>}
          </div>
          <div style={{ background: "var(--admin-surface)", borderRadius: "var(--admin-radius)", padding: 16, border: "1px solid var(--admin-border)" }}>
            <span style={{ fontSize: 11, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600, color: "var(--admin-text)", fontSize: 18 }}>
              {formatCurrency(venta.total_pyg)}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--admin-text-muted)" }}>
              {venta.total.toFixed(2)} {venta.moneda}
            </p>
          </div>
          <div style={{ background: "var(--admin-surface)", borderRadius: "var(--admin-radius)", padding: 16, border: "1px solid var(--admin-border)" }}>
            <span style={{ fontSize: 11, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Cotización</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600, color: "var(--admin-text)" }}>
              {(venta.cotizacion_snapshot as Record<string, unknown>)?.brl_to_py ? `BRL: ${Number((venta.cotizacion_snapshot as Record<string, unknown>).brl_to_py).toFixed(2)}` : "—"}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--admin-text-muted)" }}>
              {(venta.cotizacion_snapshot as Record<string, unknown>)?.usd_to_py ? `USD: ${Number((venta.cotizacion_snapshot as Record<string, unknown>).usd_to_py).toFixed(2)}` : "—"}
            </p>
          </div>
          <div style={{ background: "var(--admin-surface)", borderRadius: "var(--admin-radius)", padding: 16, border: "1px solid var(--admin-border)" }}>
            <span style={{ fontSize: 11, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Registrada por</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600, color: "var(--admin-text)" }}>{venta.creador_nombre}</p>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ background: "var(--admin-surface)", borderRadius: "var(--admin-radius)", border: "1px solid var(--admin-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--admin-border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Receipt size={15} color="var(--admin-accent)" strokeWidth={1.5} />
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--admin-text)" }}>Artículos</span>
            <span style={{ fontSize: 12, color: "var(--admin-text-muted)", marginLeft: "auto" }}>
              {venta.itens.reduce((sum, i) => sum + i.cantidad, 0)} unidades
            </span>
          </div>
          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th style={{ textAlign: "right" }}>Cant.</th>
                <th style={{ textAlign: "right" }}>Precio Unit.</th>
                <th style={{ textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.itens.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.producto_nombre}</td>
                  <td>{item.variante_valor}</td>
                  <td style={{ textAlign: "right" }}>{item.cantidad}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(item.precio_unitario)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer link */}
        <Link href="/admin/ventas" style={{ color: "var(--admin-accent)", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} strokeWidth={2} /> Volver al histórico
        </Link>
      </div>
    </div>
  );
}
