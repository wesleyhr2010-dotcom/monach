import { prisma } from "@/lib/prisma";
import { CartProvider } from "@/components/vitrina/CartProvider";
import CartShell from "@/components/vitrina/CartShell";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reseller = await prisma.reseller.findFirst({
    where: { slug, is_active: true },
    select: { id: true, slug: true, whatsapp: true, name: true },
  });

  return (
    <CartProvider resellerSlug={slug}>
      <div className="bg-white min-h-screen flex flex-col">
        {children}
      </div>
      <CartShell
        resellerWhatsapp={reseller?.whatsapp || ""}
        resellerName={reseller?.name || ""}
        resellerId={reseller?.id || ""}
      />
    </CartProvider>
  );
}
