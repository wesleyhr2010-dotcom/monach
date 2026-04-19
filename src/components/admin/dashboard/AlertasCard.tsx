import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AlertaMaleta } from "@/app/admin/actions-dashboard";

const statusConfig = {
    atrasada: {
        bg: "#1E1212",
        border: "#2E1A1A",
        badgeBg: "#E05C5C26",
        badgeColor: "#E05C5C",
        label: (dias?: number) => `ATRASADA${dias ? ` — ${dias} dia${dias > 1 ? "s" : ""}` : ""}`,
    },
    acerto_pendente: {
        bg: "#1A1A12",
        border: "#2A2A1A",
        badgeBg: "#FACC151A",
        badgeColor: "#FACC15",
        label: () => "ACERTO PENDENTE",
    },
    vence_amanha: {
        bg: "#141A14",
        border: "#1E2A1E",
        badgeBg: "#4ADE8014",
        badgeColor: "#4ADE80",
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
            background: "#171717",
            border: "1px solid #222222",
            borderRadius: 12,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: "1.2 1 0",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#CCCCCC", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 13 }}>
                    Maletas com Atenção
                </span>
                <Link href="/admin/maleta" style={{ color: "#35605A", fontFamily: "Raleway, sans-serif", fontSize: 12, textDecoration: "none" }}>
                    Ver todas →
                </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.length === 0 && (
                    <div style={{ color: "#555", fontFamily: "Raleway, sans-serif", fontSize: 13, padding: "12px 0" }}>
                        Nenhuma maleta requer atenção.
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
                                color: "#555",
                                fontFamily: "Raleway, sans-serif",
                                fontWeight: 700,
                                fontSize: 12,
                            }}>
                                {item.numero}
                            </span>
                            <span style={{
                                flex: "1 1 0",
                                color: "#BBBBBB",
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
                                background: "#222222",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                textDecoration: "none",
                            }}>
                                <ArrowRight size={12} color="#666666" strokeWidth={1.5} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
