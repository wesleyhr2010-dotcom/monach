import { requireAuth } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DevolverClient from "./DevolverClient";

export const dynamic = "force-dynamic";

export default async function DevolverPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Si ya está en aguardando_revisao o concluida, mostrar estado somente-leitura
  const isReadOnly = maleta.status === "aguardando_revisao" || maleta.status === "concluida";

  const itens = maleta.itens.map((item) => ({
    id: item.id,
    productName: item.product_variant?.product?.name ?? "Producto",
    sku: item.product_variant?.sku ?? item.id.slice(-6),
    precoFixado: Number(item.preco_fixado ?? 0),
    quantidadeEnviada: item.quantidade_enviada,
    quantidadeVendida: item.quantidade_vendida,
    imageUrl: item.product_variant?.product?.images?.[0] ?? null,
  }));

  const totalEnviados = itens.reduce((s, i) => s + i.quantidadeEnviada, 0);
  const totalVendidos = itens.reduce((s, i) => s + i.quantidadeVendida, 0);
  const totalADevolver = totalEnviados - totalVendidos;
  const totalVendidoValor = itens.reduce(
    (s, i) => s + i.precoFixado * i.quantidadeVendida,
    0
  );

  const now = new Date();
  const diasRestantes = maleta.data_limite
    ? Math.ceil((new Date(maleta.data_limite).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = diasRestantes !== null && diasRestantes < 0;

  const reseller = await prisma.reseller.findUnique({
    where: { id: user.profileId },
    select: { taxa_comissao: true },
  });
  const comissaoPct = Number(reseller?.taxa_comissao || 0);
  const comissaoValor = totalVendidoValor * (comissaoPct / 100);

  return (
    <DevolverClient
      maleta={{
        id: maleta.id,
        numero: maleta.numero,
        status: maleta.status,
        data_limite: maleta.data_limite,
        comprovante_devolucao_url: maleta.comprovante_devolucao_url,
      }}
      itens={itens}
      totais={{
        totalEnviados,
        totalVendidos,
        totalADevolver,
        totalVendidoValor,
        comissaoPct,
        comissaoValor,
      }}
      isOverdue={isOverdue}
      diasRestantes={diasRestantes}
      isReadOnly={isReadOnly}
    />
  );
}
