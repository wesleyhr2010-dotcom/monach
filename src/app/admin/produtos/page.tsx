import Link from "next/link";
import { getProducts } from "../actions-products";
import { getCategories } from "../actions-categories";
import { ProductTable } from "./ProductTable";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

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

    // Build pagination params
    const paginationParams = new URLSearchParams();
    if (search) paginationParams.set("search", search);
    if (category) paginationParams.set("category", category);
    const baseParams = paginationParams.toString() ? `&${paginationParams.toString()}` : "";

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
                <Link href="/admin/produtos/novo">
                    <Button>
                        <Plus className="mr-2 w-4 h-4" />
                        Nuevo Producto
                    </Button>
                </Link>
            </header>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchBar defaultValue={search} />
                        <CategoryFilter categories={categoryNames} current={category} />
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {total} producto{total !== 1 ? "s" : ""}
                    </span>
                </div>

                <ProductTable products={products} />

                {totalPages > 1 && (
                    <div className="flex items-center justify-between py-4">
                        <div className="text-sm text-muted-foreground">
                            Página {page} de {totalPages}
                        </div>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/admin/produtos?page=${page - 1}${baseParams}`}
                                >
                                    <Button variant="outline" size="sm">
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                    </Button>
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/admin/produtos?page=${page + 1}${baseParams}`}
                                >
                                    <Button variant="outline" size="sm">
                                        Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
