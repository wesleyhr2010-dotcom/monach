"use client";

import { StatusBadge, STATUS_CONFIG, type MaletaStatus } from "./StatusBadge";
import { TransitionLink } from "@/components/app/transitions/TransitionLink";

type MaletaListItem = {
  id: string;
  numero: number;
  status: string;
  data_limite: Date | null;
  totalValor: number;
};

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

function getDateLabel(status: string, dataLimite: Date | null): string {
  if (!dataLimite) return "";
  if (status === "concluida") return `Pagada: ${formatDate(dataLimite)}`;
  if (status === "aguardando_revisao") return `Devuelta: ${formatDate(dataLimite)}`;
  return `Vence: ${formatDate(dataLimite)}`;
}

function formatDate(d: Date): string {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

interface MaletaListItemCardProps {
  maleta: MaletaListItem;
}

export function MaletaListItemCard({ maleta }: MaletaListItemCardProps) {
  const statusKey = maleta.status as MaletaStatus;
  const isActive = statusKey === "ativa" || statusKey === "atrasada";
  const borderColor = isActive ? "#35605A" : "transparent";
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.ativa;

  const valueColor = statusKey === "concluida"
    ? "#1A1A1A"
    : statusConfig.text;

  return (
    <TransitionLink href={`/app/maleta/${maleta.id}`} pattern="hero" className="block">
      <div
        className="flex flex-col rounded-2xl gap-3 bg-[#EBEBEB] p-4 border-2 border-solid"
        style={{
          borderColor,
          viewTransitionName: `maleta-${maleta.id}`,
        } as React.CSSProperties}
      >
        <div className="flex justify-between items-center">
          <span
            className="text-[#1A1A1A] text-lg leading-[22px]"
            style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
          >
            Consignación #{maleta.numero}
          </span>
          <StatusBadge status={maleta.status} />
        </div>
        <div className="flex justify-between items-center">
          <span
            className="text-[13px] leading-4"
            style={{ fontFamily: "var(--font-raleway)", color: "#777777" }}
          >
            {getDateLabel(maleta.status, maleta.data_limite)}
          </span>
          <span
            className="font-semibold text-[13px] leading-4"
            style={{ fontFamily: "var(--font-raleway)", color: valueColor }}
          >
            {formatCurrency(maleta.totalValor)}
          </span>
        </div>
      </div>
    </TransitionLink>
  );
}

interface MaletaListProps {
  maletas: MaletaListItem[];
}

export function MaletaList({ maletas }: MaletaListProps) {
  if (maletas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div
          className="w-16 h-16 rounded-full bg-[#EBEBEB] flex items-center justify-center mb-4"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B4ABA2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <p
          className="text-[14px] text-[#777777] text-center"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          No tenés consignaciones todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {maletas.map((m) => (
        <MaletaListItemCard key={m.id} maleta={m} />
      ))}
    </div>
  );
}

export type { MaletaListItem };