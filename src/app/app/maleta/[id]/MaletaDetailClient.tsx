"use client";

import { MaletaItemRow, type MaletaItem } from "@/components/app/MaletaItemRow";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ActionButton } from "@/components/app/ActionButton";
import { SummaryCard, BottomAction } from "@/components/app/AppPageShell";
import { TransitionLink } from "@/components/app/transitions/TransitionLink";

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

function formatDate(d: Date): string {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

type MaletaDetail = {
  id: string;
  numero: number;
  status: string;
  data_limite: Date | null;
  totalValor: number;
  totalVendido: number;
  totalVendidos: number;
  totalEnviados: number;
  totalADevolver: number;
  isOverdue: boolean;
  statusDetail?: string;
  itens: MaletaItem[];
};

interface MaletaDetailClientProps {
  maleta: MaletaDetail;
}

export default function MaletaDetailClient({ maleta }: MaletaDetailClientProps) {
  const canReturn = maleta.status === "ativa" || maleta.status === "atrasada";

  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF] relative">
      {/* Header — view-transition-name deve coincidir com o card na lista (shared element) */}
      <div
        className="flex items-center pt-6 pb-4 gap-4 bg-[#F5F2EF] px-5 sticky top-0 z-10"
        style={{ viewTransitionName: `maleta-${maleta.id}` } as React.CSSProperties}
      >
        <TransitionLink href="/app/maleta" pattern="pop" className="shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </TransitionLink>
        <div className="flex flex-col grow min-w-0">
          <span
            className="tracking-[0.5px] uppercase text-[#1A1A1A] font-bold text-sm leading-[18px] m-0 truncate"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            Detalles de Consig. #{maleta.numero}
          </span>
          {maleta.data_limite && (
            <span
              className="mt-0.5 text-[#777777] font-medium text-xs leading-4"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              Vencimiento: {formatDate(new Date(maleta.data_limite))}
            </span>
          )}
        </div>
        <StatusBadge status={maleta.status} detail={maleta.statusDetail} />
      </div>

      {/* Scrollable content */}
      <div className="flex flex-col pb-[200px] px-5 gap-5">
        {/* Total Vendido summary card */}
        <SummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          label="Total Vendido"
          value={formatCurrency(maleta.totalVendido)}
        />

        {/* Registrar Venta button — abre como modal sheet */}
        {canReturn && (
          <TransitionLink
            href={`/app/maleta/${maleta.id}/registrar-venta`}
            pattern="modal"
            className="block"
          >
            <div className="flex items-center justify-center rounded-[100px] py-4 px-5 gap-2 bg-[#35605A] shadow-[0_4px_12px_rgba(53,96,90,0.2)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span
                className="text-white font-bold text-sm tracking-[0.5px] uppercase"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Registrar Venta
              </span>
            </div>
          </TransitionLink>
        )}

        {/* Artículos header */}
        <div className="flex justify-between items-center">
          <span
            className="text-[#1A1A1A] text-lg leading-[22px]"
            style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
          >
            Artículos ({maleta.itens.length})
          </span>
        </div>

        {/* Items list */}
        <div className="flex flex-col gap-3">
          {maleta.itens.map((item) => (
            <MaletaItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Bottom: Devolver button — abre como modal sheet */}
      {canReturn && (
        <BottomAction>
          <TransitionLink
            href={`/app/maleta/${maleta.id}/devolver`}
            pattern="modal"
            className="w-full"
          >
            <ActionButton
              variant="outline"
              label="Devolver Consignación"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                  <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                  <path d="M12 3v6" />
                </svg>
              }
            />
          </TransitionLink>
        </BottomAction>
      )}
    </div>
  );
}
