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
            background: "#171717",
            border: "1px solid #222222",
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
                    background: "#B4ABA21A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <FileText size={16} color="#B4ABA2" strokeWidth={1.5} />
                </div>
                <div>
                    <div style={{ color: "#CCCCCC", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 13, lineHeight: "16px" }}>
                        Documentos para Análise
                    </div>
                    <div style={{ color: "#555", fontFamily: "Raleway, sans-serif", fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
                        {preview}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ background: "#B4ABA21F", borderRadius: 20, padding: "3px 10px" }}>
                    <span style={{ color: "#B4ABA2", fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 12 }}>
                        {count} pendente{count !== 1 ? "s" : ""}
                    </span>
                </div>
                <Link href={href} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 36,
                    paddingInline: 14,
                    background: "#35605A",
                    borderRadius: 8,
                    textDecoration: "none",
                }}>
                    <span style={{ color: "#fff", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 12 }}>
                        Revisar
                    </span>
                    <ArrowRight size={12} color="#ffffff" strokeWidth={1.5} />
                </Link>
            </div>
        </div>
    );
}
