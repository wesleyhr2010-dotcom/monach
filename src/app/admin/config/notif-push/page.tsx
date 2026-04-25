import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getNotificacaoTemplates, getNotificacaoLogs } from "./actions";
import NotifPushClient from "./NotifPushClient";

export const dynamic = "force-dynamic";

export default async function NotifPushPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/admin");
  }

  const [templates, logs] = await Promise.all([
    getNotificacaoTemplates(),
    getNotificacaoLogs(),
  ]);

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY
  );

  return (
    <NotifPushClient
      templates={templates}
      logs={logs}
      isConfigured={isConfigured}
      appId={process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}
    />
  );
}
