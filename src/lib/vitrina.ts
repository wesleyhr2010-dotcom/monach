import { prisma } from "@/lib/prisma";

export interface VitrinaItem {
  id: string;
  variantId: string;
  name: string;
  price: number | null;
  image: string;
  productId: string;
}

export interface VitrinaData {
  reseller: {
    id: string;
    name: string;
    avatar_url: string;
    bio: string;
    whatsapp: string;
  };
  items: VitrinaItem[];
}

export async function getVitrinaData(slug: string): Promise<VitrinaData | null> {
  const reseller = await prisma.reseller.findFirst({
    where: { slug, is_active: true },
    select: { id: true, name: true, avatar_url: true, bio: true, whatsapp: true },
  });

  if (!reseller) return null;

  const maleta = await prisma.maleta.findFirst({
    where: { reseller_id: reseller.id, status: "ativa" },
    include: {
      itens: {
        where: {
          quantidade_vendida: { lt: prisma.maletaItem.fields.quantidade_enviada },
        },
        include: {
          product_variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  const items: VitrinaItem[] =
    maleta?.itens.map((item) => ({
      id: item.id,
      variantId: item.product_variant_id,
      name: item.product_variant.product.name,
      price: item.product_variant.price ? Number(item.product_variant.price) : null,
      image:
        item.product_variant.image_url ||
        item.product_variant.product.images[0] ||
        "/placeholder.svg",
      productId: item.product_variant.product_id,
    })) ?? [];

  return { reseller, items };
}
