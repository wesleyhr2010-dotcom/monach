import { getNotificacoes } from "@/app/app/notificaciones/actions";
import { NotificacionesList } from "@/components/app/NotificacionesList";

export default async function NotificacionesPage() {
  const grupo = await getNotificacoes();
  return <NotificacionesList grupo={grupo} />;
}
