import { notFound } from "next/navigation";
import { getProductById } from "../../actions-products";
import { getCategories } from "../../actions-categories";
import { ProductForm } from "../ProductForm";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export const metadata = {
    title: "Editar Producto — Monarca Admin",
};

export default async function EditProductPage(props: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await props.params;
    const [product, categories] = await Promise.all([
        getProductById(id),
        getCategories(),
    ]);

    if (!product) notFound();

    return (
        <>
            <AdminTopHeader
                breadcrumb="Productos"
                backHref="/admin/produtos"
                title={product.name}
                action={
                    <span className={`admin-badge ${product.product_type === "variable" ? "admin-badge-variable" : "admin-badge-simple"}`}>
                        {product.product_type === "variable" ? "Variable" : "Sencillo"}
                    </span>
                }
            />
            <ProductForm product={product} allCategories={categories} />
        </>
    );
}
