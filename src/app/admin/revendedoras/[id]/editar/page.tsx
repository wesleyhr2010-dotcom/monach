export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPerfilRevendedora, getColaboradoras } from "../../../actions-equipe";
import { RevendedoraEditForm } from "./RevendedoraEditForm";

export const metadata = { title: "Editar Revendedora — Monarca Admin" };

export default async function EditarRevendedoraPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [perfil, colaboradoras] = await Promise.all([
        getPerfilRevendedora(id),
        getColaboradoras(),
    ]);

    if (!perfil) notFound();

    return <RevendedoraEditForm perfil={perfil} colaboradoras={colaboradoras} />;
}
