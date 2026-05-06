import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getVitrinaData } from "@/lib/vitrina";
import VitrinaHeader from "@/components/vitrina/VitrinaHeader";
import ProductGrid from "@/components/vitrina/ProductGrid";
import EmptyState from "@/components/vitrina/EmptyState";
import VitrinaAnalyticsTracker from "@/components/vitrina/VitrinaAnalyticsTracker";

export const revalidate = 300;

interface VitrinaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VitrinaPageProps) {
  const { slug } = await params;
  const data = await getVitrinaData(slug);

  if (!data) {
    return { title: "Vitrina no encontrada" };
  }

  const { reseller } = data;

  return {
    title: `${reseller.name} | Joyería Monarca`,
    description: `Descubrí las hermosas joyas de ${reseller.name}`,
    openGraph: {
      title: `${reseller.name} | Joyería Monarca`,
      description: `Joyas exclusivas por ${reseller.name}`,
      images: [reseller.avatar_url || "/og-default.jpg"],
      type: "website",
    },
    robots: "noindex",
  };
}

export default async function VitrinaPage({ params }: VitrinaPageProps) {
  const { slug } = await params;
  const data = await getVitrinaData(slug);

  if (!data) {
    notFound();
  }

  const { reseller, items } = data;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <VitrinaHeader
        name={reseller.name}
        avatar_url={reseller.avatar_url}
        bio={reseller.bio}
        whatsapp={reseller.whatsapp}
      />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 md:px-12 py-10">
        {items.length === 0 ? (
          <EmptyState whatsapp={reseller.whatsapp} />
        ) : (
          <ProductGrid items={items} slug={slug} />
        )}
      </main>

      <VitrinaAnalyticsTracker
        resellerId={reseller.id}
        tipoEvento="catalogo_revendedora"
      />

      <footer className="border-t border-gray-100 py-6 text-center text-[12px] text-gray-400">
        Powered by{" "}
        <Link href="/" className="text-[#35605a] hover:underline">
          Monarca Semijoyas
        </Link>
      </footer>
    </div>
  );
}
