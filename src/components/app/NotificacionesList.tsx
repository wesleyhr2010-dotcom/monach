"use client";

import { useOptimistic, useTransition } from "react";
import { AppPageHeader } from "@/components/app/AppPageShell";
import { NotificacionItem } from "@/components/app/NotificacionItem";
import { marcarComoLida } from "@/app/app/notificaciones/actions";
import type { NotificacaoGrupo } from "@/app/app/notificaciones/actions";
import { Bell } from "lucide-react";

interface NotificacionesListProps {
  grupo: NotificacaoGrupo;
}

type NotificacionOptimistic = NotificacaoGrupo["hoy"][number] & {
  otimistaLida?: boolean;
};

function toOptimistic(grupo: NotificacaoGrupo) {
  const all: NotificacionOptimistic[] = [
    ...grupo.hoy,
    ...grupo.ayer,
    ...grupo.anteriores,
  ];
  return all;
}

export function NotificacionesList({ grupo }: NotificacionesListProps) {
  const [, startTransition] = useTransition();
  const [optimisticNotifs, addOptimistic] = useOptimistic(
    toOptimistic(grupo),
    (state, id: string) =>
      state.map((n) => (n.id === id ? { ...n, lida: true, otimistaLida: true } : n))
  );

  const handleMarcarLida = (id: string) => {
    startTransition(async () => {
      addOptimistic(id);
      await marcarComoLida(id);
    });
  };

  const hoy = optimisticNotifs.filter((n) => {
    const diff = diffEmDias(new Date(), new Date(n.created_at));
    return diff === 0;
  });
  const ayer = optimisticNotifs.filter((n) => {
    const diff = diffEmDias(new Date(), new Date(n.created_at));
    return diff === 1;
  });
  const anteriores = optimisticNotifs.filter((n) => {
    const diff = diffEmDias(new Date(), new Date(n.created_at));
    return diff > 1;
  });

  const total = hoy.length + ayer.length + anteriores.length;

  return (
    <div className="flex flex-col min-h-full bg-app-bg">
      <AppPageHeader title="Notificaciones" backHref="/app" />

      <div className="flex-1 px-5 pb-8 flex flex-col gap-6">
        {total === 0 && <NotificacionEmptyState />}

        {hoy.length > 0 && (
          <GrupoSection label="Hoy">
            {hoy.map((item) => (
              <NotificacionItem
                key={item.id}
                item={item}
                onMarcarLida={handleMarcarLida}
              />
            ))}
          </GrupoSection>
        )}

        {ayer.length > 0 && (
          <GrupoSection label="Ayer">
            {ayer.map((item) => (
              <NotificacionItem
                key={item.id}
                item={item}
                onMarcarLida={handleMarcarLida}
              />
            ))}
          </GrupoSection>
        )}

        {anteriores.length > 0 && (
          <GrupoSection label="Anteriores">
            {anteriores.map((item) => (
              <NotificacionItem
                key={item.id}
                item={item}
                onMarcarLida={handleMarcarLida}
              />
            ))}
          </GrupoSection>
        )}
      </div>
    </div>
  );
}

function GrupoSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span
        className="text-[#1A1A1A] text-xs font-bold uppercase tracking-[0.5px] leading-4"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function NotificacionEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBEBEB]">
        <Bell size={28} strokeWidth={1.5} className="text-[#B4ABA2]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-[#1A1A1A] font-semibold text-sm leading-[18px]"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Sin notificaciones
        </span>
        <span
          className="text-[#777777] text-[13px] leading-[150%] text-center px-8"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Cuando tengas novedades sobre tus consignaciones, puntos o regalos, aparecerán aquí.
        </span>
      </div>
    </div>
  );
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffEmDias(a: Date, b: Date) {
  const ms = stripTime(a).getTime() - stripTime(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
