"use client";

import Link from "next/link";
import {
  Package,
  AlertTriangle,
  CircleAlert,
  CheckCircle2,
  Gift,
  Star,
  XCircle,
  ChevronRight,
} from "lucide-react";
import type { NotificacaoItem } from "@/app/app/notificaciones/actions";

const ICON_MAP: Record<string, React.ReactNode> = {
  nova_maleta: <Package size={20} strokeWidth={1.5} />,
  prazo_proximo: <AlertTriangle size={20} strokeWidth={1.5} />,
  maleta_atrasada: <CircleAlert size={20} strokeWidth={1.5} />,
  acerto_confirmado: <CheckCircle2 size={20} strokeWidth={1.5} />,
  brinde_entregue: <Gift size={20} strokeWidth={1.5} />,
  pontos_ganhos: <Star size={20} strokeWidth={1.5} />,
  documento_reprovado: <XCircle size={20} strokeWidth={1.5} />,
  documento_aprovado: <CheckCircle2 size={20} strokeWidth={1.5} />,
};

const ICON_BG: Record<string, string> = {
  nova_maleta: "#E8F2FD",
  prazo_proximo: "#FFF4E5",
  maleta_atrasada: "#FFF5F5",
  acerto_confirmado: "#E2F2E9",
  brinde_entregue: "#F3E8FD",
  pontos_ganhos: "#FFFBE6",
  documento_reprovado: "#FFF5F5",
  documento_aprovado: "#E2F2E9",
};

const ICON_COLOR: Record<string, string> = {
  nova_maleta: "#1E40AF",
  prazo_proximo: "#B26A00",
  maleta_atrasada: "#D32F2F",
  acerto_confirmado: "#1F7A4A",
  brinde_entregue: "#7C3AED",
  pontos_ganhos: "#D97706",
  documento_reprovado: "#D32F2F",
  documento_aprovado: "#1F7A4A",
};

function formatHora(date: Date) {
  return new Date(date).toLocaleTimeString("es-PY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface NotificacionItemProps {
  item: NotificacaoItem;
  onMarcarLida?: (id: string) => void;
}

export function NotificacionItem({ item, onMarcarLida }: NotificacionItemProps) {
  const icon = ICON_MAP[item.tipo] ?? <Package size={20} strokeWidth={1.5} />;
  const bg = ICON_BG[item.tipo] ?? "#F5F2EF";
  const color = ICON_COLOR[item.tipo] ?? "#1A1A1A";

  const ctaUrl = typeof item.dados?.cta_url === "string" ? item.dados.cta_url : undefined;

  const content = (
    <div
      className={`flex items-start gap-3 rounded-2xl bg-white p-4 border ${
        item.lida ? "border-[#EBEBEB] opacity-80" : "border-[#EBEBEB]"
      }`}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-xl w-10 h-10 mt-0.5"
        style={{ backgroundColor: bg, color }}
      >
        {icon}
      </div>
      <div className="flex flex-col grow min-w-0 gap-1">
        <span
          className="text-[#1A1A1A] font-semibold text-sm leading-[18px]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {item.titulo}
        </span>
        <span
          className="text-[#777777] text-[13px] leading-[150%]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {item.mensagem}
        </span>
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-[#B4ABA2] text-xs leading-4"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            {formatHora(item.created_at)}
          </span>
          {ctaUrl && (
            <span
              className="flex items-center gap-0.5 text-xs font-semibold"
              style={{ fontFamily: "var(--font-raleway)", color: "#35605A" }}
            >
              Ver más <ChevronRight size={12} strokeWidth={2} />
            </span>
          )}
        </div>
      </div>
      {!item.lida && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarcarLida?.(item.id);
          }}
          className="shrink-0 mt-1 w-2 h-2 rounded-full bg-app-primary"
          aria-label="Marcar como leída"
          title="Marcar como leída"
        />
      )}
    </div>
  );

  if (ctaUrl) {
    return (
      <Link href={ctaUrl} className="block" onClick={() => onMarcarLida?.(item.id)}>
        {content}
      </Link>
    );
  }

  return content;
}
