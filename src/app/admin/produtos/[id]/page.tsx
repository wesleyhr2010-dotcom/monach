import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "../../actions-products";
import { getCategories } from "../../actions-categories";
import { ProductForm } from "../ProductForm";

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

    if (!product) {
        return (
            <div className="admin-content" style={{ textAlign: "center", padding: "40px" }}>
                <h2>Producto no encontrado</h2>
            </div>
        );
    }

    const categoryNames = categories.map((c) => c.name);

    return (
        <>
            <header className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link href="/admin/produtos" className="admin-btn admin-btn-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </Link>
                    <h1>{product.name}</h1>
                </div>
                <span
                    className={`admin-badge ${product.product_type === "variable" ? "admin-badge-variable" : "admin-badge-simple"}`}
                >
                    {product.product_type}
                </span>
            </header>
            <ProductForm product={product} allCategories={categories} />
        </>
    );
}
