import { notFound } from "next/navigation";
import { getBrindeById } from "../../actions";
import { BrindeForm } from "../../BrindeForm";

export const metadata = {
    title: "Editar Brinde — Monarca Admin",
};

export default async function EditarBrindePage({ params }: { params: Promise<{ id: string }> } | { params: { id: string } }) {
    const { id } = await params;
    const brinde = await getBrindeById(id);

    if (!brinde) {
        notFound();
    }

    return <BrindeForm brinde={brinde} />;
}
