import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

interface DocsCardProps {
    count: number;
    nomes: string[];
    href?: string;
}

export function DocsCard({ count, nomes, href = "/admin/revendedoras" }: DocsCardProps) {
    if (count === 0) return null;

    const preview = nomes.slice(0, 2).join(" · ") + (nomes.length > 2 ? ` · +${nomes.length - 2}` : "");

    return (
        <div style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-surface-hover)",
            borderRadius: 12,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "var(--admin-beige)1A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <FileText size={16} color="var(--admin-beige)" strokeWidth={1.5} />
                </div>
                <div>
                    <div style={{ color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 13, lineHeight: "16px" }}>
                        Documentos para Análise
                    </div>
                    <div style={{ color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
                        {preview}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ background: "var(--admin-beige)1F", borderRadius: 20, padding: "3px 10px" }}>
                    <span style={{ color: "var(--admin-beige)", fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 12 }}>
                        {count} pendente{count !== 1 ? "s" : ""}
                    </span>
                </div>
                <Link href={href} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 36,
                    paddingInline: 14,
                    background: "var(--admin-accent)",
                    borderRadius: 8,
                    textDecoration: "none",
                }}>
                    <span style={{ color: "#fff", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 12 }}>
                        Revisar
                    </span>
                    <ArrowRight size={12} color="#fff" strokeWidth={1.5} />
                </Link>
            </div>
        </div>
    );
}
