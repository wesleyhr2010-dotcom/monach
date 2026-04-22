import { redirect } from "next/navigation";
import { getPerfilCompleto } from "../actions";

const WHATSAPP_SOPORTE_GENERAL = process.env.WHATSAPP_SOPORTE_GENERAL || "+595981000000";

export default async function SoportePage() {
    let perfil;
    try {
        perfil = await getPerfilCompleto();
    } catch {
        redirect("/app/login");
    }

    const whatsapp = perfil.colaboradora?.whatsapp ?? WHATSAPP_SOPORTE_GENERAL;
    const mensaje = encodeURIComponent(`Hola, soy ${perfil.name} y necesito ayuda con el portal.`);

    redirect(`https://wa.me/${whatsapp}?text=${mensaje}`);
}
