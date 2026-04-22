import { requireAuth } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RegistrarVentaClient from "./RegistrarVentaClient";

export const dynamic = "force-dynamic";

export default async function RegistrarVentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth(["REVENDEDORA"]);
  if (!user?.profileId) notFound();

  const maleta = await prisma.maleta.findFirst({
    where: { id, reseller_id: user.profileId },
    include: {
      itens: {
        include: {
          product_variant: {
            include: {
              product: {
                select: { id: true, name: true, images: true, price: true },
              },
            },
          },
        },
      },
    },
  });

  if (!maleta) notFound();

  const itens = maleta.itens
    .filter((item) => item.quantidade_vendida < item.quantidade_enviada)
    .map((item) => ({
      id: item.id,
      productName: item.product_variant?.product?.name ?? "Producto",
      sku: item.product_variant?.sku ?? item.id.slice(-6),
      precoFixado: Number(item.preco_fixado ?? 0),
      quantidadeEnviada: item.quantidade_enviada,
      quantidadeVendida: item.quantidade_vendida,
      quantidadeDisponivel: item.quantidade_enviada - item.quantidade_vendida,
      imageUrl: item.product_variant?.product?.images?.[0] ?? null,
    }));

  return (
    <RegistrarVentaClient
      maletaId={maleta.id}
      itens={itens}
    />
  );
}