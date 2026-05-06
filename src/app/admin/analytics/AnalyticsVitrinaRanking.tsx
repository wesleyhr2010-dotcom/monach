"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: "40px" }}>#</TableHead>
          <TableHead>Revendedora</TableHead>
          <TableHead style={{ textAlign: "right" }}>Visitas</TableHead>
          <TableHead style={{ textAlign: "right" }}>Únicos</TableHead>
          <TableHead style={{ textAlign: "right" }}>Cliques</TableHead>
          <TableHead style={{ textAlign: "right" }}>CTR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r, i) => (
          <TableRow key={r.id}>
            <TableCell style={{ fontWeight: 600, color: i < 3 ? "#C9A84C" : "var(--admin-text-muted)" }}>
              {i + 1}
            </TableCell>
            <TableCell>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#35605a",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    r.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ fontWeight: 500, fontSize: "14px" }}>{r.name}</span>
              </div>
            </TableCell>
            <TableCell style={{ textAlign: "right", fontWeight: 600 }}>{r.visitas}</TableCell>
            <TableCell style={{ textAlign: "right" }}>{r.visitantesUnicos}</TableCell>
            <TableCell style={{ textAlign: "right" }}>{r.cliquesWhatsApp}</TableCell>
            <TableCell style={{ textAlign: "right", fontWeight: 600 }}>{r.ctrContato}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
