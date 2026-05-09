type RankingItem = {
  id: string;
  name: string;
  avatar_url: string | null;
  visitas: number;
  visitantesUnicos: number;
  cliquesWhatsApp: number;
  ctrCheckout: number;
  ctrContato: number;
};

type Props = {
  items: RankingItem[];
};

export function AnalyticsVitrinaRanking({ items }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--admin-text-muted)" }}>
        Sin revendedoras con datos de vitrina en el período
      </div>
    );
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th style={{ width: 40 }}>#</th>
          <th>Revendedora</th>
          <th style={{ textAlign: "right" }}>Visitas</th>
          <th style={{ textAlign: "right" }}>Únicos</th>
          <th style={{ textAlign: "right" }}>Cliques</th>
          <th style={{ textAlign: "right" }}>CTR</th>
        </tr>
      </thead>
      <tbody>
        {items.map((r, i) => (
          <tr key={r.id}>
            <td style={{ fontWeight: 600, color: i < 3 ? "#C9A84C" : "var(--admin-text-muted)" }}>
              {i + 1}
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#35605a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  overflow: "hidden",
                  flexShrink: 0,
                }}>
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    r.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</span>
              </div>
            </td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{r.visitas}</td>
            <td style={{ textAlign: "right" }}>{r.visitantesUnicos}</td>
            <td style={{ textAlign: "right" }}>{r.cliquesWhatsApp}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{r.ctrContato}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
