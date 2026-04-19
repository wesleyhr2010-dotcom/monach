import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { getProductBySlug, getRelatedProducts } from "@/app/actions";

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Producto no encontrado | Monarca Semijoyas" };
    return {
        title: `${product.name} | Monarca Semijoyas`,
        description: product.short_description || product.description?.substring(0, 160) || "",
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;

    const [product, relatedProducts] = await Promise.all([
        getProductBySlug(slug),
        getRelatedProducts(4)
    ]);

    if (!product) {
        notFound();
    }

    const mainImage = product.images?.[0] || "/placeholder.svg";

    return (
        <div className="bg-white min-h-screen flex flex-col font-montserrat">
            <Header variant="dark" />
            <AnalyticsTracker tipoEvento="produto" pageUrl={`/produto/${slug}`} />

            <main className="flex-1 mt-[120px]" data-scroll-to="mainContainer">
                {/* Product Detail Section */}
                <div className="max-w-[1440px] mx-auto w-full flex flex-col md:flex-row items-start justify-center gap-8 md:gap-12 lg:gap-20 px-6 md:px-12 lg:px-20 py-10">

                    {/* Image Column */}
                    <div className="w-full md:w-1/2 flex justify-center">
                        <div className="relative w-full aspect-[4/5] max-w-[630px] bg-gray-50 overflow-hidden">
                            <Image
                                src={mainImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="w-full md:w-1/2 flex flex-col items-start gap-8 max-w-[550px] py-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-[20px] md:text-[24px] text-darkslategray-200 leading-snug">
                                {product.name}
                            </h1>
                            <p className="text-[20px] md:text-[24px] text-darkslategray-200 leading-relaxed font-semibold">
                                ₲ {product.price?.toLocaleString("es-PY") || "0"}
                            </p>
                        </div>

                        {/* Add to Cart Button */}
                        <AddToCartButton
                            productId={product.id}
                            name={product.name}
                            price={product.price || 0}
                            image={mainImage}
                            sku={product.sku}
                        />

                        {/* Description */}
                        <div className="flex flex-col gap-4 w-full">
                            <h2 className="text-[15.8px] font-inter uppercase text-darkslategray-200 tracking-wide border-b border-gray-200 pb-2">
                                Descripción
                            </h2>
                            {product.short_description || product.description ? (
                                <p className="text-[16px] text-black leading-[27.2px] whitespace-pre-wrap">
                                    {product.short_description || product.description}
                                </p>
                            ) : (
                                <p className="text-[16px] text-gray-500 italic">
                                    Sin descripción disponible.
                                </p>
                            )}

                            {/* SKU Details */}
                            {product.sku && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <span className="text-[16px] text-black font-semibold">SKU:</span>
                                    <span className="text-[16px] text-gray-600">{product.sku}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Shipping Banner - Static representation matching design */}
                <div className="w-full bg-black py-4 px-6 mt-12 mb-16">
                    <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                        <span className="text-white text-[12px] md:text-[14px]">
                            Hacemos envíos a cualquier rincón del país! 🚚
                        </span>
                    </div>
                </div>

                {/* Related Products Grid */}
                {relatedProducts.length > 0 && (
                    <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pb-20">
                        <div className="flex flex-col items-center mb-10 text-center">
                            <span className="text-[12px] uppercase text-gray-500 tracking-[0.2em] mb-2">MÁS</span>
                            <h3 className="text-[28px] md:text-[34px] font-light text-darkslategray-200">
                                PRODUCTOS PARA EXPLORAR
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {relatedProducts.map((rp) => (
                                <ProductCard
                                    key={rp.id}
                                    id={rp.id}
                                    name={rp.name}
                                    price={`₲ ${rp.price?.toLocaleString("es-PY") || "0"}`}
                                    image={rp.images?.[0] || "/placeholder.svg"}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <div data-scroll-to="footerContainer">
                <Footer />
            </div>
        </div>
    );
}
