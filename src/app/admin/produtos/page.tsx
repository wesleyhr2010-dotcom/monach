import Link from "next/link";

export const dynamic = "force-dynamic";
import { getProducts } from "../actions-products";
import { getCategories } from "../actions-categories";
import { ProductTable } from "./ProductTable";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { Plus, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";

export const metadata = {
    title: "Productos — Monarca Admin",
};

export default async function ProdutosPage(props: {
    searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}) {
    const searchParams = await props.searchParams;
    const page = parseInt(searchParams.page || "1", 10);
    const search = searchParams.search || "";
    const category = searchParams.category || "";

    const [{ products, total, pageSize }, categories] = await Promise.all([
        getProducts(page, search, 20, category),
        getCategories(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const categoryNames = categories.map((c) => c.name);

    const paginationParams = new URLSearchParams();
    if (search) paginationParams.set("search", search);
    if (category) paginationParams.set("category", category);
    const baseParams = paginationParams.toString() ? `&${paginationParams.toString()}` : "";

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <AdminTopHeader
                breadcrumb="Admin / Productos"
                title="Productos"
                action={
                    <Link
                        href="/admin/produtos/novo"
                        className="admin-btn admin-btn-primary"
                        style={{ textDecoration: "none" }}
                    >
                        <Plus size={15} /> Nuevo Producto
                    </Link>
                }
            />

            <div className="admin-page-body">

                {/* Barra de filtros */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <SearchBar defaultValue={search} />
                        <CategoryFilter categories={categoryNames} current={category} />
                    </div>
                    <span style={{
                        fontSize: 13, color: "var(--admin-text-muted)",
                        fontFamily: "Raleway, sans-serif", whiteSpace: "nowrap",
                    }}>
                        {total} producto{total !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Tabla o estado vacío */}
                {products.length === 0 ? (
                    <div style={{
                        background: "var(--admin-surface)",
                        border: "1px solid var(--admin-surface-hover)",
                        borderRadius: 12,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "60px 24px",
                        gap: 12,
                    }}>
                        <PackageOpen size={36} style={{ color: "var(--admin-text-dim)" }} />
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--admin-text)", fontWeight: 600 }}>
                            No hay productos
                        </span>
                        <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, color: "var(--admin-text-muted)" }}>
                            Agregá tu primer producto desde el botón Nuevo.
                        </span>
                        <Link
                            href="/admin/produtos/novo"
                            className="admin-btn admin-btn-primary"
                            style={{ textDecoration: "none", marginTop: 8 }}
                        >
                            <Plus size={15} /> Nuevo Producto
                        </Link>
                    </div>
                ) : (
                    <ProductTable products={products} />
                )}

                {/* Paginação */}
                {totalPages > 1 && (
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 12,
                        borderTop: "1px solid var(--admin-border)",
                    }}>
                        <span style={{ fontSize: 13, color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif" }}>
                            Página {page} de {totalPages}
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                            {page > 1 && (
                                <Link
                                    href={`/admin/produtos?page=${page - 1}${baseParams}`}
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    style={{ textDecoration: "none" }}
                                >
                                    <ChevronLeft size={13} /> Anterior
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/admin/produtos?page=${page + 1}${baseParams}`}
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    style={{ textDecoration: "none" }}
                                >
                                    Siguiente <ChevronRight size={13} />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
