import { notFound } from "next/navigation";
import { getVitrinaProductDetail } from "@/lib/vitrina";
import ProductDetailView from "@/components/vitrina/ProductDetailView";

export const revalidate = 300;

interface ProductDetailPageProps {
  params: Promise<{ slug: string; produtoId: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug, produtoId } = await params;
  const data = await getVitrinaProductDetail(slug, produtoId);

  if (!data) {
    return { title: "Producto no encontrado" };
  }

  const { variant, reseller } = data;

  return {
    title: `${variant.product.name} | ${reseller.name}`,
    description: (variant.product.description || "").slice(0, 160),
    robots: "noindex",
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug, produtoId } = await params;
  const data = await getVitrinaProductDetail(slug, produtoId);

  if (!data) {
    notFound();
  }

  const { variant, reseller } = data;

  // Convert Decimal to plain number before passing to Client Component
  const plainVariant = {
    ...variant,
    price: variant.price ? Number(variant.price) : null,
    product: {
      ...variant.product,
      images: variant.product.images as string[],
    },
  };

  return (
    <ProductDetailView
      variant={plainVariant}
      resellerSlug={slug}
      resellerWhatsapp={reseller.whatsapp}
      resellerName={reseller.name}
      resellerId={reseller.id}
    />
  );
}
