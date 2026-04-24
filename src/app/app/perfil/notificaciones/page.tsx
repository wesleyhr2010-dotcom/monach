import { redirect } from "next/navigation";
import { getPreferenciasNotificaciones } from "../actions";
import PreferenciasNotificacionesForm from "@/components/app/PreferenciasNotificacionesForm";

export default async function NotificacionesPage() {
    let prefs;
    try {
        prefs = await getPreferenciasNotificaciones();
    } catch {
        redirect("/app/login");
    }

    return (
        <div className="flex flex-col min-h-full bg-[#F5F2EF]">
            <PreferenciasNotificacionesForm initialPrefs={prefs} />
        </div>
    );
}
