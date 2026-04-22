import { Suspense } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { getCatalogProducts, getAllCategories } from "@/app/actions";
import ProductCard from "@/components/ProductCard";
import CatalogClient from "./CatalogClient";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export const metadata = {
    title: "Catálogo — Monarca Semijoyas",
};

export default async function CatalogoGeneralPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; page?: string }>;
}) {
    const params = await searchParams;
    const currentCategory = params.category || "all";
    const currentPage = parseInt(params.page || "1", 10);

    const [{ products, total, pageSize }, categories] = await Promise.all([
        getCatalogProducts(currentPage, currentCategory),
        getAllCategories(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="bg-white min-h-screen flex flex-col font-montserrat">
            <CatalogClient />
            <AnalyticsTracker tipoEvento="catalogo_geral" pageUrl="/catalogo" />

            <main className="flex-1 mt-[100px] max-w-[1200px] mx-auto w-full px-6 md:px-12 py-10">
                <div className="text-center mb-10">
                    <h1 className="text-[28px] md:text-[36px] font-light tracking-[0.02em] text-darkslategray-200">
                        Catálogo Monarca
                    </h1>
                    <p className="text-[14px] text-gray-500 mt-2">
                        Encuentra la joya perfecta para ti
                    </p>
                </div>

                {/* Categories Filter */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                    <Link
                        href="/catalogo"
                        className={`px-4 py-2 text-[13px] rounded-full border transition-colors ${currentCategory === "all"
                            ? "bg-[#35605a] text-white border-[#35605a]"
                            : "bg-transparent text-gray-600 border-gray-200 hover:border-[#35605a]"
                            }`}
                    >
                        Todos
                    </Link>
                    {categories.map((cat) => (
                        <Link
                            key={cat}
                            href={`/catalogo?category=${encodeURIComponent(cat)}`}
                            className={`px-4 py-2 text-[13px] rounded-full border transition-colors ${currentCategory === cat
                                ? "bg-[#35605a] text-white border-[#35605a]"
                                : "bg-transparent text-gray-600 border-gray-200 hover:border-[#35605a]"
                                }`}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">No se encontraron productos en esta categoría.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={`₲ ${(product.price || 0).toLocaleString("es-PY")}`}
                                    image={product.images?.[0] || "/placeholder.svg"}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                {currentPage > 1 && (
                                    <Link
                                        href={`/catalogo?category=${encodeURIComponent(currentCategory)}&page=${currentPage - 1}`}
                                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-500 hover:border-[#35605a] hover:text-[#35605a] transition-colors"
                                    >
                                        ←
                                    </Link>
                                )}

                                <span className="text-[14px] text-gray-500 px-4">
                                    Página {currentPage} de {totalPages}
                                </span>

                                {currentPage < totalPages && (
                                    <Link
                                        href={`/catalogo?category=${encodeURIComponent(currentCategory)}&page=${currentPage + 1}`}
                                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-500 hover:border-[#35605a] hover:text-[#35605a] transition-colors"
                                    >
                                        →
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
