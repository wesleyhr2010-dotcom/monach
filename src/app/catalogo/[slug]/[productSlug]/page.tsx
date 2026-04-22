import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { getProductBySlug, getResellerBySlug } from "@/app/actions";
import AddToCartButton from "@/components/AddToCartButton";
import CatalogClient from "../CatalogClient";
import AnalyticsTracker from "@/components/AnalyticsTracker";

interface CatalogProductPageProps {
    params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: CatalogProductPageProps) {
    const { productSlug } = await params;
    const product = await getProductBySlug(productSlug);
    if (!product) return { title: "Producto no encontrado" };

    return {
        title: `${product.name} — Monarca Semijoyas`,
        description: product.description || `Semijoya ${product.name}`,
    };
}

export default async function CatalogProductPage({ params }: CatalogProductPageProps) {
    const { slug, productSlug } = await params;

    const [reseller, product] = await Promise.all([
        getResellerBySlug(slug),
        getProductBySlug(productSlug),
    ]);

    if (!reseller || !product) notFound();

    const mainImage = product.images?.[0] || "/placeholder.svg";
    const extraImages = product.images?.slice(1) || [];

    return (
        <div className="bg-white min-h-screen flex flex-col font-montserrat">
            {/* Reseller context */}
            <CatalogClient
                resellerSlug={reseller.slug}
                resellerWhatsapp={reseller.whatsapp}
                resellerName={reseller.name}
            />
            <AnalyticsTracker
                tipoEvento="produto"
                pageUrl={`/catalogo/${slug}/${productSlug}`}
                resellerId={reseller.id}
            />

            <main className="flex-1 mt-[120px] px-6 md:px-12 pb-20">
                {/* Breadcrumb */}
                <div className="max-w-[1200px] mx-auto mb-6">
                    <nav className="flex items-center gap-2 text-[12px] text-gray-400">
                        <Link href={`/catalogo/${slug}`} className="hover:text-[#35605a] transition-colors">
                            Catálogo de {reseller.name}
                        </Link>
                        <span>/</span>
                        <span className="text-darkslategray-200 truncate">{product.name}</span>
                    </nav>
                </div>

                <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    {/* Image Column */}
                    <div className="flex flex-col gap-3">
                        <div className="relative aspect-square bg-gray-50 overflow-hidden">
                            <Image
                                src={mainImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                priority
                            />
                        </div>
                        {extraImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {extraImages.slice(0, 4).map((img, i) => (
                                    <div key={i} className="relative aspect-square bg-gray-50 overflow-hidden">
                                        <Image
                                            src={img}
                                            alt={`${product.name} ${i + 2}`}
                                            fill
                                            className="object-cover"
                                            sizes="120px"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Column */}
                    <div className="flex flex-col gap-5">
                        <div>
                            <p className="text-[12px] text-[#35605a] uppercase tracking-[0.1em] mb-2">
                                Catálogo de {reseller.name}
                            </p>
                            <h1 className="text-[24px] md:text-[30px] font-light text-darkslategray-200 leading-tight">
                                {product.name}
                            </h1>
                        </div>

                        <p className="text-[22px] font-semibold text-darkslategray-200">
                            ₲ {product.price?.toLocaleString("es-PY") || "0"}
                        </p>

                        <AddToCartButton
                            productId={product.id}
                            name={product.name}
                            price={product.price || 0}
                            image={mainImage}
                            sku={product.sku}
                        />

                        {product.description && (
                            <div className="mt-4 pt-6 border-t border-gray-100">
                                <h3 className="text-[13px] uppercase tracking-[0.08em] text-gray-400 mb-3">
                                    Descripción
                                </h3>
                                <div
                                    className="text-[14px] text-gray-600 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            </div>
                        )}

                        {product.sku && (
                            <p className="text-[12px] text-gray-300 mt-4">
                                SKU: {product.sku}
                            </p>
                        )}

                        <Link
                            href={`/catalogo/${slug}`}
                            className="inline-flex items-center gap-2 text-[13px] text-[#35605a] mt-4 hover:underline transition-colors"
                        >
                            ← Volver al catálogo
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-6 text-center text-[12px] text-gray-400">
                Powered by <Link href="/" className="text-[#35605a] hover:underline">Monarca Semijoyas</Link>
            </footer>
        </div>
    );
}
