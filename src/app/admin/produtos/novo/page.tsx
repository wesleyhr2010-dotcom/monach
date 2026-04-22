import Link from "next/link";

export const dynamic = "force-dynamic";
import { ProductForm } from "../ProductForm";
import { getCategories } from "../../actions-categories";

export const metadata = {
    title: "Nuevo Producto — Monarca Admin",
};

export default async function NovoProductPage() {
    const categories = await getCategories();

    return (
        <>
            <header className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link href="/admin/produtos" className="admin-btn admin-btn-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </Link>
                    <h1>Nuevo Producto</h1>
                </div>
            </header>
            <ProductForm allCategories={categories} />
        </>
    );
}
