import { redirect } from "next/navigation";
import { getPerfilCompleto } from "../actions";

export default async function NotificacionesPage() {
    let perfil;
    try {
        perfil = await getPerfilCompleto();
    } catch {
        redirect("/app/login");
    }

    return (
        <div className="min-h-screen bg-[#F5F2EF] flex items-center justify-center p-6">
            <div className="text-center">
                <h1 className="text-lg font-bold text-[#1A1A1A] mb-2">Notificaciones</h1>
                <p className="text-sm text-[#6b7280]">Próximamente podrás configurar tus preferencias de notificación.</p>
            </div>
        </div>
    );
}
