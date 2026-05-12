export const dynamic = "force-dynamic";
import { ProductForm } from "../ProductForm";
import { getCategories } from "../../actions-categories";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export const metadata = {
    title: "Nuevo Producto — Monarca Admin",
};

export default async function NovoProductPage() {
    const categories = await getCategories();

    return (
        <>
            <AdminTopHeader
                breadcrumb="Productos"
                backHref="/admin/produtos"
                title="Nuevo Producto"
            />
            <ProductForm allCategories={categories} />
        </>
    );
}
