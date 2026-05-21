import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ProductDisplay from "@/components/shared/ProductDisplay";
import { getProductBySlug, getRelatedProductsByCategory } from "@/app/actions";

export const revalidate = 60; // ISR — página pública, cachear por 60s

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado | Monarca Semijoyas" };
  return {
    title: `${product.name} | Monarca Semijoyas`,
    description:
      product.short_description || product.description?.substring(0, 160) || "",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProductsByCategory(
    product.id,
    product.categories,
    4
  );

  return (
    <div className="bg-white min-h-screen flex flex-col font-montserrat">
      <Header variant="dark" />
      <AnalyticsTracker
        tipoEvento="produto"
        pageUrl={`/produto/${slug}`}
      />

      <main className="flex-1 mt-[120px]" data-scroll-to="mainContainer">
        <ProductDisplay
          product={{
            id: product.id,
            name: product.name,
            price: product.price ?? null,
            description: product.description,
            short_description: product.short_description,
            images: product.images as string[],
            sku: product.sku,
          }}
          actionButton={
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={product.price || 0}
              image={(product.images as string[])?.[0] || "/placeholder.svg"}
              sku={product.sku}
            />
          }
          relatedProducts={relatedProducts.map((rp) => ({
            id: rp.id,
            name: rp.name,
            price: rp.price ?? null,
            images: rp.images as string[],
          }))}
        />
      </main>

      <div data-scroll-to="footerContainer">
        <Footer />
      </div>
    </div>
  );
}
