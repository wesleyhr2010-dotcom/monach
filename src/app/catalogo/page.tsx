import { Suspense } from "react";

export const revalidate = 60;
import Link from "next/link";
import { getCatalogProducts, getCategoryHierarchy } from "@/app/actions";
import ProductCard from "@/components/ProductCard";
import CatalogClient from "./CatalogClient";
import CatalogSearch from "./CatalogSearch";
import CatalogFiltersBar from "./CatalogFiltersBar";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export const metadata = {
    title: "Catálogo — Monarca Semijoyas",
};

function buildPageUrl(base: Record<string, string | undefined>, extra: Record<string, string>) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...base, ...extra })) {
        if (v) p.set(k, v);
    }
    return `/catalogo?${p.toString()}`;
}

export default async function CatalogoGeneralPage({
    searchParams,
}: {
    searchParams: Promise<{
        category?: string;
        page?: string;
        search?: string;
        minPrice?: string;
        maxPrice?: string;
    }>;
}) {
    const params = await searchParams;
    const currentCategory = params.category || "all";
    const currentPage     = parseInt(params.page || "1", 10);
    const currentSearch   = params.search || "";
    const currentMin      = params.minPrice ? Number(params.minPrice) : undefined;
    const currentMax      = params.maxPrice ? Number(params.maxPrice) : undefined;

    const [{ products, total, pageSize }, hierarchy] = await Promise.all([
        getCatalogProducts(currentPage, currentCategory, 24, currentSearch, currentMin, currentMax),
        getCategoryHierarchy(),
    ]);

    // Flatten hierarchy: main categories only for the dropdown
    const mainCategories = hierarchy.map((n) => n.name);

    const totalPages = Math.ceil(total / pageSize);

    // Shared params for pagination links
    const sharedParams = {
        ...(currentCategory !== "all" && { category: currentCategory }),
        ...(currentSearch && { search: currentSearch }),
        ...(currentMin != null && { minPrice: String(currentMin) }),
        ...(currentMax != null && { maxPrice: String(currentMax) }),
    };

    return (
        <div className="bg-white min-h-screen flex flex-col font-montserrat">
            <CatalogClient />
            <AnalyticsTracker tipoEvento="catalogo_geral" pageUrl="/catalogo" />

            <main className="flex-1 mt-[100px] max-w-[1200px] mx-auto w-full px-6 md:px-12 py-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-[28px] md:text-[36px] font-light tracking-[0.02em] text-darkslategray-200">
                        Catálogo Monarca
                    </h1>
                    <p className="text-[14px] text-gray-400 mt-2">
                        Encuentra la joya perfecta para ti
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Suspense>
                        <CatalogSearch initialValue={currentSearch} />
                    </Suspense>
                </div>

                {/* Filters bar */}
                <div className="mb-8">
                    <Suspense>
                        <CatalogFiltersBar categories={mainCategories} total={total} />
                    </Suspense>
                </div>

                {/* Products grid */}
                {products.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-gray-300 text-4xl mb-4">○</p>
                        <p className="text-gray-400">No se encontraron productos.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
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
                            <div className="flex items-center justify-center gap-3 mt-14">
                                {currentPage > 1 && (
                                    <Link
                                        href={buildPageUrl(sharedParams, { page: String(currentPage - 1) })}
                                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full text-gray-500 hover:border-[#35605a] hover:text-[#35605a] transition-colors"
                                    >
                                        ←
                                    </Link>
                                )}
                                <span className="text-sm text-gray-400">
                                    {currentPage} / {totalPages}
                                </span>
                                {currentPage < totalPages && (
                                    <Link
                                        href={buildPageUrl(sharedParams, { page: String(currentPage + 1) })}
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
