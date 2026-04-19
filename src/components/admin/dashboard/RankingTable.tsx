const AVATAR_GRADIENTS = [
    "linear-gradient(135deg, #1a3a35 0%, #35605A 100%)",
    "linear-gradient(135deg, #3a2a1a 0%, #917961 100%)",
    "linear-gradient(135deg, #1a1a2a 0%, #4a4a7a 100%)",
    "linear-gradient(135deg, #2a1a1a 0%, #7a3a3a 100%)",
    "linear-gradient(135deg, #1a2a1a 0%, #3a6a3a 100%)",
];

function formatCurrency(value: number): string {
    if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(0)}K`;
    return `G$ ${value.toLocaleString("pt-BR")}`;
}

interface RankingItem {
    id: string;
    nome: string;
    initials: string;
    faturamento: number;
    percentMeta: number;
    totalRevendedoras?: number;
}

interface RankingTableProps {
    title: string;
    items: RankingItem[];
}

export function RankingTable({ title, items }: RankingTableProps) {
    return (
        <div style={{
            background: "#171717",
            border: "1px solid #222222",
            borderRadius: 12,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: "1 1 0",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#CCCCCC", fontFamily: "Raleway, sans-serif", fontWeight: 600, fontSize: 13 }}>
                    {title}
                </span>
                <div style={{
                    background: "#1E1E1E",
                    border: "1px solid #2A2A2A",
                    borderRadius: 6,
                    padding: "3px 9px",
                }}>
                    <span style={{ color: "#555", fontFamily: "Raleway, sans-serif", fontSize: 10 }}>Este mês</span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {items.length === 0 && (
                    <div style={{ color: "#555", fontFamily: "Raleway, sans-serif", fontSize: 13, padding: "8px 0" }}>
                        Sem dados para este período.
                    </div>
                )}
                {items.map((item, i) => (
                    <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <span style={{ color: "#fff", fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 9 }}>
                                        {item.initials}
                                    </span>
                                </div>
                                <span style={{ color: "#BBBBBB", fontFamily: "Raleway, sans-serif", fontSize: 12 }}>
                                    {item.nome}
                                    {item.totalRevendedoras !== undefined && (
                                        <span style={{ color: "#444", marginLeft: 6, fontSize: 11 }}>
                                            {item.totalRevendedoras} revend.
                                        </span>
                                    )}
                                </span>
                            </div>
                            <span style={{ color: "#EDEDED", fontFamily: "'Playfair Display', serif", fontSize: 12 }}>
                                {formatCurrency(item.faturamento)}
                            </span>
                        </div>
                        <div style={{ background: "#1E1E1E", borderRadius: 3, height: 5, overflow: "hidden" }}>
                            <div style={{
                                height: "100%",
                                width: `${item.percentMeta}%`,
                                background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                                borderRadius: 3,
                                transition: "width 0.3s ease",
                            }} />
                        </div>
                        <div style={{ color: "#444", fontFamily: "Raleway, sans-serif", fontSize: 10, textAlign: "right" }}>
                            {item.percentMeta}% da meta
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
