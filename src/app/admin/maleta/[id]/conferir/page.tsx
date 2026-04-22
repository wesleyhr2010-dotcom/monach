"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMaletaById,
  conferirEFecharMaleta,
} from "@/app/admin/actions-maletas";
import type { MaletaDetail } from "@/app/admin/actions-maletas";
import { fmtCurrency } from "@/lib/maleta-helpers";
import { ConferirRevendedoraDeclarou } from "@/components/admin/ConferirRevendedoraDeclarou";
import { ConferirComprovante } from "@/components/admin/ConferirComprovante";
import { ConferirItemRow } from "@/components/admin/ConferirItemRow";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConferirPageProps {
  params: Promise<{ id: string }>;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ConferirLoading() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#444",
        fontFamily: "Raleway,system-ui,sans-serif",
        fontSize: 14,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid #35605A",
            borderTop: "2px solid transparent",
            margin: "0 auto 12px",
            animation: "spin 0.8s linear infinite",
          }}
        />
        Cargando conferencia...
      </div>
    </div>
  );
}

// ─── Error / guard states ─────────────────────────────────────────────────────

function ConferirGuard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 360,
          color: "#888",
          fontFamily: "Raleway,system-ui,sans-serif",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface ConferirHeaderProps {
  maletaNumero: number;
  resellerName: string;
  resellerWhatsapp?: string | null;
  maleta_id: string;
}

function ConferirHeader({
  maletaNumero,
  resellerName,
  resellerWhatsapp,
  maleta_id,
}: ConferirHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1A1A1A",
        height: 60,
        paddingInline: 32,
        flexShrink: 0,
      }}
    >
      {/* Left: breadcrumb + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={`/admin/maleta/${maleta_id}`}>
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#171717",
              border: "1px solid #2A2A2A",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2L4 6l4 4" />
            </svg>
          </div>
        </Link>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div
            style={{
              color: "#444444",
              fontFamily: "Raleway,system-ui,sans-serif",
              fontSize: 10,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Admin / Maletas / #{maletaNumero} / Conferir
          </div>
          <div
            style={{
              color: "#EDEDED",
              fontFamily: '"Playfair Display",system-ui,sans-serif',
              fontSize: 20,
            }}
          >
            Conferir Maleta #{maletaNumero} — {resellerName}
          </div>
        </div>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* AG. CONFERÊNCIA badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(250,204,21,0.12)",
            border: "1px solid rgba(250,204,21,0.25)",
            borderRadius: 8,
            padding: "6px 14px",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#FACC15",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "#FACC15",
              fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            AG. CONFERÊNCIA
          </span>
        </div>

        {/* WhatsApp button */}
        {resellerWhatsapp && (
          <a
            href={`https://wa.me/${resellerWhatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                backgroundColor: "#0F3D1C",
                border: "1px solid #1A5A2A",
                borderRadius: 8,
                height: 36,
                paddingInline: 14,
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1a6 6 0 016 6 6 6 0 01-6 6 5.96 5.96 0 01-3.1-.87L1 13l.87-2.9A5.96 5.96 0 011 7a6 6 0 016-6z" />
              </svg>
              <span
                style={{
                  color: "#4ADE80",
                  fontFamily: '"RalewayRoman-SemiBold","Raleway",system-ui,sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Contatar {resellerName.split(" ")[0]}
              </span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Items table ──────────────────────────────────────────────────────────────

interface ConferirItemsTableProps {
  itens: MaletaDetail["itens"];
  recebidos: Record<string, number>;
  onChangeRecebido: (id: string, v: number) => void;
}

function ConferirItemsTable({ itens, recebidos, onChangeRecebido }: ConferirItemsTableProps) {
  // Only non-sold items (with expected returns)
  const itensParaDevolver = itens.filter(
    (i) => i.quantidade_enviada - i.quantidade_vendida > 0
  );

  return (
    <div
      style={{
        backgroundColor: "#171717",
        border: "1px solid #222222",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      {/* Table header info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          borderBottom: "1px solid #1E1E1E",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              color: "#CCCCCC",
              fontFamily: '"RalewayRoman-SemiBold","Raleway",system-ui,sans-serif',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Confirmar Itens Recebidos
          </div>
          <div style={{ color: "#555555", fontSize: 11, fontFamily: "Raleway,system-ui,sans-serif", marginTop: 2 }}>
            Ajuste as quantidades realmente recebidas de volta
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#1E1E1E",
            borderRadius: 8,
            padding: "5px 12px",
          }}
        >
          <span style={{ color: "#555555", fontSize: 11, fontFamily: "Raleway,system-ui,sans-serif" }}>
            {itensParaDevolver.length} {itensParaDevolver.length === 1 ? "item" : "itens"} para devolver
          </span>
        </div>
      </div>

      {/* Column labels */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 36,
          paddingInline: 22,
          backgroundColor: "#141414",
          borderBottom: "1px solid #1E1E1E",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: "2 1 0" }}>
          <ColLabel>Produto</ColLabel>
        </div>
        <div style={{ width: 120, flexShrink: 0, textAlign: "center" }}>
          <ColLabel>Esperado</ColLabel>
        </div>
        <div style={{ width: 160, flexShrink: 0, textAlign: "center" }}>
          <ColLabel>Qtd Recebida</ColLabel>
        </div>
        <div style={{ width: 100, flexShrink: 0, textAlign: "center" }}>
          <ColLabel>Situação</ColLabel>
        </div>
      </div>

      {/* Item rows */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {itensParaDevolver.map((item, idx) => {
          const esperado = item.quantidade_enviada - item.quantidade_vendida;
          const recebido = recebidos[item.id] ?? esperado;
          const isLast = idx === itensParaDevolver.length - 1;

          return (
            <ConferirItemRow
              key={item.id}
              nome={item.product_variant.product.name}
              variante={item.product_variant.attribute_value || undefined}
              esperado={esperado}
              recebido={recebido}
              onChangeRecebido={(v) => onChangeRecebido(item.id, v)}
              isLast={isLast}
            />
          );
        })}

        {itensParaDevolver.length === 0 && (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "#444",
              fontSize: 13,
              fontFamily: "Raleway,system-ui,sans-serif",
            }}
          >
            Todos os itens foram vendidos — nenhum retorno esperado.
          </div>
        )}
      </div>
    </div>
  );
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        color: "#444444",
        fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase" as const,
      }}
    >
      {children}
    </span>
  );
}

// ─── Bottom action bar ────────────────────────────────────────────────────────

interface ConferirBottomBarProps {
  onConfirmar: () => void;
  confirmando: boolean;
  error?: string;
  successMsg?: string;
}

function ConferirBottomBar({
  onConfirmar,
  confirmando,
  error,
  successMsg,
}: ConferirBottomBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #1A1A1A",
        padding: "0 32px",
        height: 60,
        flexShrink: 0,
        backgroundColor: "#0A0A0A",
      }}
    >
      {/* Warning / feedback */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {successMsg ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 7l3.5 3.5L12 3" />
            </svg>
            <span style={{ color: "#4ADE80", fontSize: 12, fontFamily: "Raleway,system-ui,sans-serif" }}>
              {successMsg}
            </span>
          </>
        ) : error ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#E05C5C" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1L13.5 12H0.5L7 1z" /><path d="M7 5v3M7 10h.01" />
            </svg>
            <span style={{ color: "#E05C5C", fontSize: 12, fontFamily: "Raleway,system-ui,sans-serif" }}>
              {error}
            </span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FACC15" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1L13.5 12H0.5L7 1z" /><path d="M7 5v3M7 10h.01" />
            </svg>
            <span style={{ color: "#666666", fontSize: 12, fontFamily: "Raleway,system-ui,sans-serif" }}>
              Após confirmar, o estoque será restaurado e a maleta será encerrada permanentemente.
            </span>
          </>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onConfirmar}
        disabled={confirmando}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          backgroundColor: confirmando ? "#29494A" : "#35605A",
          borderRadius: 9,
          height: 38,
          paddingInline: 18,
          border: "none",
          cursor: confirmando ? "not-allowed" : "pointer",
          opacity: confirmando ? 0.7 : 1,
          transition: "background 0.2s",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 7l3.5 3.5L11 3" />
        </svg>
        <span
          style={{
            color: "#FFFFFF",
            fontFamily: '"RalewayRoman-SemiBold","Raleway",system-ui,sans-serif',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {confirmando ? "Confirmando..." : "Confirmar Recebimento"}
        </span>
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConferirMaletaPage({ params }: ConferirPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [maleta, setMaleta] = useState<MaletaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [recebidos, setRecebidos] = useState<Record<string, number>>({});
  const [confirmando, setConfirmando] = useState(false);

  // Load data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getMaletaById(id);
        if (cancelled) return;
        setMaleta(data);
        if (data) {
          const initial: Record<string, number> = {};
          for (const item of data.itens) {
            initial[item.id] = item.quantidade_enviada - item.quantidade_vendida;
          }
          setRecebidos(initial);
        }
      } catch {
        if (!cancelled) setError("Error al cargar la consignación.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleConfirmar() {
    if (!maleta) return;
    setConfirmando(true);
    setError("");

    const itens_conferidos = maleta.itens.map((item) => ({
      item_id: item.id,
      quantidade_recebida: recebidos[item.id] ?? 0,
    }));

    const result = await conferirEFecharMaleta({
      maleta_id: id,
      itens_conferidos,
      nota_acerto: undefined,
    });

    if (result.success) {
      setSuccessMsg("Consignación cerrada exitosamente.");
      setTimeout(() => router.push("/admin/maleta"), 2000);
    } else {
      setError(result.error || "Error al cerrar la consignación.");
    }
    setConfirmando(false);
  }

  // ── Guard states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <ConferirLoading />
      </div>
    );
  }

  if (!maleta) {
    return (
      <ConferirGuard>
        <p style={{ fontSize: 16, marginBottom: 12 }}>Consignación no encontrada.</p>
        <Link href="/admin/maleta">
          <button
            style={{
              background: "#1E1E1E",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#CCCCCC",
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Raleway,system-ui,sans-serif",
            }}
          >
            ← Volver
          </button>
        </Link>
      </ConferirGuard>
    );
  }

  if (maleta.status !== "aguardando_revisao") {
    return (
      <ConferirGuard>
        <p style={{ fontSize: 16, marginBottom: 12 }}>Esta consignación ya fue procesada.</p>
        <Link href={`/admin/maleta/${id}`}>
          <button
            style={{
              background: "#1E1E1E",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#CCCCCC",
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Raleway,system-ui,sans-serif",
            }}
          >
            Ver Consignación
          </button>
        </Link>
      </ConferirGuard>
    );
  }

  // ── Computed values ────────────────────────────────────────────────────────

  const totalEnviado = maleta.itens.reduce(
    (s, i) => s + (i.preco_fixado ?? 0) * i.quantidade_enviada,
    0
  );
  const totalVendido = maleta.itens.reduce(
    (s, i) => s + (i.preco_fixado ?? 0) * i.quantidade_vendida,
    0
  );
  const totalRetorno = totalEnviado - totalVendido;
  const qtdVendido = maleta.itens.reduce((s, i) => s + i.quantidade_vendida, 0);
  const qtdRetorno = maleta.itens.reduce(
    (s, i) => s + (i.quantidade_enviada - i.quantidade_vendida),
    0
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Top header */}
      <ConferirHeader
        maletaNumero={maleta.numero}
        resellerName={maleta.reseller.name}
        resellerWhatsapp={maleta.reseller.whatsapp}
        maleta_id={id}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 20,
          padding: "24px 32px",
          overflow: "hidden",
        }}
      >
        {/* Left column: summary + comprovante */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflowY: "auto",
          }}
        >
          <ConferirRevendedoraDeclarou
            totalVendido={totalVendido}
            totalRetorno={totalRetorno}
            totalEnviado={totalEnviado}
            qtdVendido={qtdVendido}
            qtdRetorno={qtdRetorno}
            fmtCurrency={fmtCurrency}
          />
          <ConferirComprovante
            url={maleta.comprovante_devolucao_url}
          />
        </div>

        {/* Right column: items table */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <ConferirItemsTable
            itens={maleta.itens}
            recebidos={recebidos}
            onChangeRecebido={(itemId, v) =>
              setRecebidos((prev) => ({ ...prev, [itemId]: v }))
            }
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <ConferirBottomBar
        onConfirmar={handleConfirmar}
        confirmando={confirmando}
        error={error}
        successMsg={successMsg}
      />

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}