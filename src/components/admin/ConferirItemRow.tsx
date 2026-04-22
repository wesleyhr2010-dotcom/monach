"use client";

export type ItemSituacao = "ok" | "perda" | "parcial";

export function getItemSituacao(recebido: number, esperado: number): ItemSituacao {
  if (recebido >= esperado) return "ok";
  if (recebido === 0) return "perda";
  return "parcial";
}

export function getItemRowBg(situacao: ItemSituacao): string {
  switch (situacao) {
    case "ok":
      return "#121A12";
    case "perda":
      return "#1A1010";
    case "parcial":
      return "#1A1A10";
    default:
      return "transparent";
  }
}

interface SituacaoBadgeProps {
  situacao: ItemSituacao;
}

export function SituacaoBadge({ situacao }: SituacaoBadgeProps) {
  if (situacao === "ok") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          backgroundColor: "rgba(74,222,128,0.1)",
          borderRadius: 6,
          padding: "3px 8px",
        }}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1.5 4.5l2 2 4-4" />
        </svg>
        <span
          style={{
            color: "#4ADE80",
            fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          OK
        </span>
      </div>
    );
  }

  if (situacao === "perda") {
    return (
      <div
        style={{
          backgroundColor: "rgba(224,92,92,0.1)",
          borderRadius: 6,
          padding: "3px 8px",
        }}
      >
        <span
          style={{
            color: "#E05C5C",
            fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          Perda
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "rgba(250,204,21,0.1)",
        borderRadius: 6,
        padding: "3px 8px",
      }}
    >
      <span
        style={{
          color: "#FACC15",
          fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        Parcial
      </span>
    </div>
  );
}

interface QuantidadeStepperProps {
  value: number;
  max: number;
  situacao: ItemSituacao;
  onChange: (v: number) => void;
}

export function QuantidadeStepper({ value, max, situacao, onChange }: QuantidadeStepperProps) {
  const valueColor =
    situacao === "ok" ? "#4ADE80" : situacao === "perda" ? "#E05C5C" : "#FACC15";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#1E1E1E",
        border: "1px solid #2A2A2A",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Decrement */}
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: "1px solid #2A2A2A",
          background: "transparent",
          cursor: "pointer",
          flexShrink: 0,
          border: "none",
          borderRight: "1px solid #2A2A2A",
        }}
        disabled={value <= 0}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={value <= 0 ? "#333" : "#666666"} strokeWidth="2" strokeLinecap="round">
          <path d="M2 5h6" />
        </svg>
      </button>

      {/* Value */}
      <div
        style={{
          width: 40,
          height: 32,
          backgroundColor: "#252525",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: valueColor,
            fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {value}
        </span>
      </div>

      {/* Increment */}
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          cursor: "pointer",
          flexShrink: 0,
          border: "none",
          borderLeft: "1px solid #2A2A2A",
        }}
        disabled={value >= max}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={value >= max ? "#333" : "#666666"} strokeWidth="2" strokeLinecap="round">
          <path d="M5 2v6M2 5h6" />
        </svg>
      </button>
    </div>
  );
}

interface ConferirItemRowProps {
  nome: string;
  variante?: string;
  esperado: number;
  recebido: number;
  onChangeRecebido: (v: number) => void;
  isLast?: boolean;
}

export function ConferirItemRow({
  nome,
  variante,
  esperado,
  recebido,
  onChangeRecebido,
  isLast,
}: ConferirItemRowProps) {
  const situacao = getItemSituacao(recebido, esperado);
  const rowBg = getItemRowBg(situacao);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 60,
        paddingInline: 22,
        backgroundColor: rowBg,
        borderBottom: isLast ? "none" : "1px solid #1E1E1E",
        flexShrink: 0,
      }}
    >
      {/* Product name */}
      <div
        style={{
          flex: "2 1 0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "#CCCCCC",
            fontSize: 13,
            fontFamily: "Raleway,system-ui,sans-serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {nome}
        </div>
        <div style={{ color: "#444444", fontSize: 11, fontFamily: "Raleway,system-ui,sans-serif" }}>
          Devolver {esperado} un.{variante ? ` · ${variante}` : ""}
        </div>
      </div>

      {/* Esperado */}
      <div style={{ width: 120, flexShrink: 0, textAlign: "center" }}>
        <span style={{ color: "#666666", fontSize: 14, fontFamily: "Raleway,system-ui,sans-serif" }}>
          {esperado} un.
        </span>
      </div>

      {/* Stepper */}
      <div style={{ width: 160, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <QuantidadeStepper
          value={recebido}
          max={esperado}
          situacao={situacao}
          onChange={onChangeRecebido}
        />
      </div>

      {/* Badge */}
      <div style={{ width: 100, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <SituacaoBadge situacao={situacao} />
      </div>
    </div>
  );
}
