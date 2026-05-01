import { notFound } from "next/navigation";

export const revalidate = 60; // ISR — página pública, cachear por 60s
import Image from "next/image";
import Link from "next/link";
import { getResellerBySlug, getResellerCatalogProducts } from "@/app/actions";
import type { Product } from "@/lib/types";
import CatalogClient from "./CatalogClient";
import AnalyticsTracker from "@/components/AnalyticsTracker";

interface CatalogoPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CatalogoPageProps) {
    const { slug } = await params;
    const reseller = await getResellerBySlug(slug);
    if (!reseller) return { title: "Catálogo no encontrado" };

    return {
        title: `Catálogo de ${reseller.name} — Monarca Semijoyas`,
        description: reseller.bio || `Descubre las joyas seleccionadas por ${reseller.name}`,
    };
}

export default async function CatalogoPage({ params }: CatalogoPageProps) {
    const { slug } = await params;
    const reseller = await getResellerBySlug(slug);
    if (!reseller) notFound();

    const products = await getResellerCatalogProducts(reseller.id);

    return (
        <div className="bg-white min-h-screen flex flex-col font-montserrat">
            {/* Hero */}
            <header className="bg-[#35605a] text-white py-12 px-6 md:px-12">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-6">
                    {reseller.avatar_url ? (
                        <Image
                            src={reseller.avatar_url}
                            alt={reseller.name}
                            width={80}
                            height={80}
                            className="rounded-full object-cover w-20 h-20 border-2 border-white/30"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center text-3xl">
                            🦋
                        </div>
                    )}
                    <div className="text-center md:text-left">
                        <p className="text-[12px] uppercase tracking-[0.15em] opacity-70 mb-1">
                            Catálogo de
                        </p>
                        <h1 className="text-[28px] md:text-[36px] font-light tracking-[0.02em]">
                            {reseller.name}
                        </h1>
                        {reseller.bio && (
                            <p className="text-[14px] opacity-80 mt-2 max-w-[500px]">
                                {reseller.bio}
                            </p>
                        )}
                    </div>
                    <div className="md:ml-auto">
                        <Link
                            href="/"
                            className="text-[12px] uppercase tracking-[0.1em] opacity-60 hover:opacity-100 transition-opacity"
                        >
                            Monarca Semijoyas
                        </Link>
                    </div>
                </div>
            </header>

            {/* Products Grid */}
            <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 md:px-12 py-10">
                {products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">Este catálogo aún no tiene productos</p>
                    </div>
                ) : (
                    <>
                        <p className="text-[13px] text-gray-400 mb-6">
                            {products.length} {products.length === 1 ? "producto" : "productos"}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                            {products.map((product: Product) => {
                                const mainImage = product.images?.[0] || "/placeholder.svg";
                                return (
                                    <Link
                                        key={product.id}
                                        href={`/catalogo/${slug}/${product.id}`}
                                        className="group cursor-pointer flex flex-col"
                                    >
                                        <article>
                                            <div className="relative overflow-hidden bg-gray-100 aspect-[260/340]">
                                                <Image
                                                    src={mainImage}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    sizes="(max-width: 768px) 50vw, 260px"
                                                />
                                            </div>
                                            <div className="mt-1">
                                                <h4 className="text-sm leading-5 text-darkslategray-200 truncate">
                                                    {product.name}
                                                </h4>
                                                <p className="text-sm font-medium leading-6 text-darkslategray-200">
                                                    ₲ {product.price?.toLocaleString("es-PY") || "0"}
                                                </p>
                                            </div>
                                        </article>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            {/* Reseller-aware cart initializer */}
            <CatalogClient
                resellerSlug={reseller.slug}
                resellerWhatsapp={reseller.whatsapp}
                resellerName={reseller.name}
            />
            <AnalyticsTracker
                tipoEvento="catalogo_revendedora"
                pageUrl={`/catalogo/${slug}`}
                resellerId={reseller.id}
            />

            {/* Footer */}
            <footer className="border-t border-gray-100 py-6 text-center text-[12px] text-gray-400">
                Powered by <Link href="/" className="text-[#35605a] hover:underline">Monarca Semijoyas</Link>
            </footer>
        </div>
    );
}
