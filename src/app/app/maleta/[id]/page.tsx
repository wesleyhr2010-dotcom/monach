import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MaletaDetailClient from "./MaletaDetailClient";

export const dynamic = "force-dynamic";

export default async function MaletaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.profileId || user.role !== "REVENDEDORA") notFound();

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

  const itens = maleta.itens.map((item) => ({
    id: item.id,
    productName: item.product_variant?.product?.name ?? "Producto",
    sku: item.product_variant?.sku ?? item.id.slice(-6),
    precoFixado: Number(item.preco_fixado ?? 0),
    quantidadeEnviada: item.quantidade_enviada,
    quantidadeVendida: item.quantidade_vendida,
    imageUrl: item.product_variant?.product?.images?.[0] ?? null,
  }));

  const totalValor = itens.reduce((s: number, i) => s + i.precoFixado * i.quantidadeEnviada, 0);
  const totalVendido = itens.reduce((s: number, i) => s + i.precoFixado * i.quantidadeVendida, 0);
  const totalVendidos = itens.reduce((s: number, i) => s + i.quantidadeVendida, 0);
  const totalEnviados = itens.reduce((s: number, i) => s + i.quantidadeEnviada, 0);
  const totalADevolver = totalEnviados - totalVendidos;
  const now = new Date();
  const diasRestantes = maleta.data_limite
    ? Math.ceil((new Date(maleta.data_limite).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = diasRestantes !== null && diasRestantes < 0;

  const statusDetail = isOverdue && maleta.status === "ativa"
    ? `${Math.abs(diasRestantes!)} día${Math.abs(diasRestantes!) !== 1 ? "s" : ""}`
    : undefined;

  const maletaData = {
    id: maleta.id,
    numero: maleta.numero,
    status: maleta.status,
    data_limite: maleta.data_limite,
    totalValor,
    totalVendido,
    totalVendidos,
    totalEnviados,
    totalADevolver,
    isOverdue,
    statusDetail,
    itens,
  };

  return <MaletaDetailClient maleta={maletaData} />;
}