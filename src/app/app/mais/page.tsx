import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { MenuHeader } from "@/components/app/MenuHeader";
import { MenuSectionCard } from "@/components/app/MenuSectionCard";
import { MenuRow } from "@/components/app/MenuRow";
import { LogoutButton } from "@/components/app/LogoutButton";
import {
  UserCog,
  Bell,
  FileText,
  BarChart3,
  Trophy,
  Share2,
  MessageCircle,
  BookOpen,
} from "lucide-react";

const ICON_PROPS = { size: 16, strokeWidth: 1.5 } as const;

export default async function MaisPage() {
  const user = await requireAuth(["REVENDEDORA"]);
  const resellerId = user.profileId!;

  const [reseller, pendingDocs] = await Promise.all([
    prisma.reseller.findUnique({
      where: { id: resellerId },
      select: { slug: true },
    }),
    prisma.resellerDocumento.count({
      where: { reseller_id: resellerId, status: "pendente" },
    }),
  ]);

  if (!reseller) {
    redirect("/app/login");
  }

  return (
    <div className="flex flex-col min-h-full bg-app-bg">
      <MenuHeader title="MÁS OPCIONES" backHref="/app" />

      <div className="flex-1 px-5 pb-8 flex flex-col gap-5">
        {/* Mi Cuenta */}
        <MenuSectionCard label="Mi Cuenta">
          <MenuRow icon={<UserCog {...ICON_PROPS} />} label="Editar Perfil" href="/app/perfil" />
          <MenuRow
            icon={<Bell {...ICON_PROPS} />}
            label="Notificaciones"
            href="/app/perfil/notificaciones"
          />
          <MenuRow
            icon={<FileText {...ICON_PROPS} />}
            label="Mis Documentos"
            href="/app/perfil/documentos"
            dot={pendingDocs > 0}
          />
        </MenuSectionCard>

        {/* Actividad */}
        <MenuSectionCard label="Actividad">
          <MenuRow
            icon={<BarChart3 {...ICON_PROPS} />}
            label="Mi Desempeño"
            href="/app/desempeno"
          />
          <MenuRow
            icon={<Trophy {...ICON_PROPS} />}
            label="Programa de Puntos"
            href="/app/progreso"
          />
          <MenuRow
            icon={<Share2 {...ICON_PROPS} />}
            label="Mi Vitrina Pública"
            href={`/vitrina/${reseller.slug}`}
            external
          />
        </MenuSectionCard>

        {/* Soporte */}
        <MenuSectionCard label="Soporte">
          <MenuRow
            icon={<MessageCircle {...ICON_PROPS} />}
            label="Soporte WhatsApp"
            href="/app/perfil/soporte"
            variant="accent-green"
          />
          <MenuRow
            icon={<BookOpen {...ICON_PROPS} />}
            label="¿Cómo funciona?"
            href="/app/bienvenida?modo=review"
          />
        </MenuSectionCard>

        <LogoutButton />
      </div>
    </div>
  );
}
