"use client";

interface ConferirRevendedoraDeclarouProps {
  totalVendido: number;
  totalRetorno: number;
  totalEnviado: number;
  qtdVendido: number;
  qtdRetorno: number;
  fmtCurrency: (v: number) => string;
}

export function ConferirRevendedoraDeclarou({
  totalVendido,
  totalRetorno,
  totalEnviado,
  qtdVendido,
  qtdRetorno,
  fmtCurrency,
}: ConferirRevendedoraDeclarouProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--admin-surface)",
        border: "1px solid var(--admin-surface-hover)",
        borderRadius: 12,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header label */}
      <div
        style={{
          color: "var(--admin-text-dim)",
          fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Revendedora Declarou
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Vendidos */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--admin-success-15)",
            border: "1px solid var(--admin-border)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: "rgba(74,222,128,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6.5l3 3L11 3" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  color: "var(--admin-success)",
                  fontFamily: '"RalewayRoman-SemiBold","Raleway",system-ui,sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Vendidos
              </div>
              <div style={{ color: "rgba(74,222,128,0.53)", fontSize: 11, fontFamily: "Raleway,system-ui,sans-serif" }}>
                {qtdVendido} {qtdVendido === 1 ? "item" : "itens"}
              </div>
            </div>
          </div>
          <div
            style={{
              color: "var(--admin-success)",
              fontFamily: '"Playfair Display",system-ui,sans-serif',
              fontSize: 16,
            }}
          >
            {fmtCurrency(totalVendido)}
          </div>
        </div>

        {/* Retorno */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(79, 109, 212, 0.15)",
            border: "1px solid var(--admin-border)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: "rgba(102,119,221,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#6677DD" strokeWidth="1.5" strokeLinecap="round">
                <path d="M11 5H4L6.5 2M4 5l2.5 3M11 8H4" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  color: "var(--admin-info)",
                  fontFamily: '"RalewayRoman-SemiBold","Raleway",system-ui,sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Retorno
              </div>
              <div style={{ color: "rgba(102,119,221,0.53)", fontSize: 11, fontFamily: "Raleway,system-ui,sans-serif" }}>
                {qtdRetorno} {qtdRetorno === 1 ? "item" : "itens"}
              </div>
            </div>
          </div>
          <div
            style={{
              color: "var(--admin-info)",
              fontFamily: '"Playfair Display",system-ui,sans-serif',
              fontSize: 16,
            }}
          >
            {fmtCurrency(totalRetorno)}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "var(--admin-surface-hover)" }} />

      {/* Total enviado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "var(--admin-text-muted)", fontSize: 12, fontFamily: "Raleway,system-ui,sans-serif" }}>
          Total enviado originalmente
        </div>
        <div
          style={{
            color: "var(--admin-text-muted)",
            fontFamily: '"Playfair Display",system-ui,sans-serif',
            fontSize: 14,
          }}
        >
          {fmtCurrency(totalEnviado)}
        </div>
      </div>

      {/* Warning */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          backgroundColor: "var(--admin-warning-15)",
          border: "1px solid var(--admin-border)",
          borderRadius: 8,
          padding: "10px 13px",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          stroke="var(--admin-warning)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: 1 }}
        >
          <path d="M6.5 1L12.5 11.5H0.5L6.5 1z" />
          <path d="M6.5 5v3M6.5 10h.01" />
        </svg>
        <div style={{ color: "var(--admin-warning)", fontSize: 11, fontFamily: "Raleway,system-ui,sans-serif", lineHeight: 1.5 }}>
          Confirme as quantidades reais recebidas. Os valores finais serão calculados após a conferência.
        </div>
      </div>
    </div>
  );
}
