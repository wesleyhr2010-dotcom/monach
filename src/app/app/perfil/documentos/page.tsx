import { redirect } from "next/navigation";
import { getPerfilCompleto } from "../actions";

export default async function DocumentosPage() {
    const result = await getPerfilCompleto();
    if (!result.success) {
        redirect("/app/login");
    }

    return (
        <div className="min-h-full bg-app-bg flex items-center justify-center p-6 app-nav-clearance">
            <div className="text-center">
                <h1 className="text-lg font-bold text-app-text mb-2">Documentos y Contratos</h1>
                <p className="text-sm text-app-text-secondary">Próximamente podrás enviar y consultar tus documentos.</p>
            </div>
        </div>
    );
}
