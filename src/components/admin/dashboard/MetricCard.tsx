import type { ReactNode } from "react";
import { ChevronUp, Dot } from "lucide-react";

interface SubValue {
    type: "up" | "down" | "neutral";
    text: string;
}

interface MetricCardProps {
    label: string;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    value: string;
    subValue?: SubValue;
    variant?: "default" | "danger";
    valueColor?: string;
}

function TrendBadge({ type, text }: SubValue) {
    if (type === "up") {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#0F2E1E", borderRadius: 4, padding: "2px 6px" }}>
                <ChevronUp size={10} color="#4ADE80" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                <span style={{ color: "#4ADE80", fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 11, lineHeight: "14px" }}>{text}</span>
            </div>
        );
    }
    if (type === "down") {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#2A1A1A", borderRadius: 4, padding: "2px 6px" }}>
                <Dot size={12} color="#E05C5C" strokeWidth={3} style={{ flexShrink: 0, margin: "-1px" }} />
                <span style={{ color: "#E05C5C", fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 11, lineHeight: "14px" }}>{text}</span>
            </div>
        );
    }
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#1E1E1E", borderRadius: 4, padding: "2px 6px" }}>
            <span style={{ color: "#888", fontFamily: "Raleway, sans-serif", fontSize: 11, lineHeight: "14px" }}>{text}</span>
        </div>
    );
}

export function MetricCard({
    label,
    icon,
    iconBg,
    iconColor: _iconColor,
    value,
    subValue,
    variant = "default",
    valueColor,
}: MetricCardProps) {
    const isDanger = variant === "danger";

    return (
        <div style={{
            background: isDanger ? "#1A0F0F" : "#171717",
            border: `1px solid ${isDanger ? "#2E1A1A" : "#222222"}`,
            borderRadius: 12,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                    color: isDanger ? "#663333" : "#555555",
                    fontFamily: "Raleway, sans-serif",
                    fontSize: 12,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                }}>
                    {label}
                </span>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    {icon}
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{
                    color: valueColor ?? "#EDEDED",
                    fontFamily: "'Playfair Display', serif",
                    fontSize: isDanger ? 40 : 26,
                    lineHeight: 1,
                    fontWeight: 600,
                }}>
                    {value}
                </span>
                {subValue && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <TrendBadge {...subValue} />
                        {subValue.type !== "down" && (
                            <span style={{ color: "#444", fontFamily: "Raleway, sans-serif", fontSize: 11, lineHeight: "14px" }}>
                                vs. mês anterior
                            </span>
                        )}
                    </div>
                )}
                {isDanger && (
                    <div style={{ color: "#663333", fontFamily: "Raleway, sans-serif", fontSize: 12, lineHeight: "16px", marginTop: 4 }}>
                        itens aguardando
                    </div>
                )}
            </div>
        </div>
    );
}
