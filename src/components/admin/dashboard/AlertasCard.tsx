import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AlertaMaleta } from "@/app/admin/actions-dashboard";

const statusConfig = {
    atrasada: {
        bg: "#1E1212",
        border: "#2E1A1A",
        badgeBg: "var(--admin-danger)26",
        badgeColor: "var(--admin-danger)",
        label: (dias?: number) => `ATRASADA${dias ? ` — ${dias} dia${dias > 1 ? "s" : ""}` : ""}`,
    },
    acerto_pendente: {
        bg: "#1A1A12",
        border: "#2A2A1A",
        badgeBg: "var(--admin-warning)1A",
        badgeColor: "var(--admin-warning)",
        label: () => "AJUSTE PENDIENTE",
    },
    vence_amanha: {
        bg: "#141A14",
        border: "#1E2A1E",
        badgeBg: "var(--admin-success)14",
        badgeColor: "var(--admin-success)",
        label: () => "Vence amanhã",
    },
};

interface AlertasCardProps {
    items: AlertaMaleta[];
    basePath?: string;
}

export function AlertasCard({ items, basePath = "/admin/maleta" }: AlertasCardProps) {
    return (
        <div style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-surface-hover)",
            borderRadius: 12,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: "1.2 1 0",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 13 }}>
                    Maletas con Atención
                </span>
                <Link href="/admin/maleta" style={{ color: "var(--admin-accent)", fontFamily: "Raleway, sans-serif", fontSize: 12, textDecoration: "none" }}>
                    Ver todas →
                </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.length === 0 && (
                    <div style={{ color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontSize: 13, padding: "12px 0" }}>
                        Ninguna maleta requiere atención.
                    </div>
                )}
                {items.map((item) => {
                    const cfg = statusConfig[item.tipo];
                    return (
                        <div key={item.id} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: 9,
                            padding: "13px 16px",
                        }}>
                            <span style={{
                                width: 32,
                                flexShrink: 0,
                                color: "var(--admin-text-muted)",
                                fontFamily: "Raleway, sans-serif",
                                fontWeight: 700,
                                fontSize: 12,
                            }}>
                                {item.numero}
                            </span>
                            <span style={{
                                flex: "1 1 0",
                                color: "var(--admin-text-muted)",
                                fontFamily: "Raleway, sans-serif",
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {item.nomeReseller}
                            </span>
                            <div style={{ background: cfg.badgeBg, borderRadius: 6, padding: "3px 9px", flexShrink: 0 }}>
                                <span style={{ color: cfg.badgeColor, fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 11 }}>
                                    {cfg.label(item.diasAtraso)}
                                </span>
                            </div>
                            <Link href={`${basePath}/${item.id}`} style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                background: "var(--admin-surface-hover)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                textDecoration: "none",
                            }}>
                                <ArrowRight size={12} color="var(--admin-text-dim)" strokeWidth={1.5} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
