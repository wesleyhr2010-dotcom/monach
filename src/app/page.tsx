import Header from "@/components/Header";

export const revalidate = 60; // ISR — página pública, cachear por 60s
import HeroBanner from "@/components/HeroBanner";
import ValueProps from "@/components/ValueProps";
import HomeCategorySection from "@/components/HomeCategorySection";
import ResellerCTA from "@/components/ResellerCTA";
import HistoryCTA from "@/components/HistoryCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { getCatalogProducts } from "@/app/actions";

export default async function Home() {
  const { products: initialProducts } = await getCatalogProducts(1, "Aros", 10);

  const collarBanners = {
    conDije: "/images/categoria__collar_com_dije.jpg",
    sinDije: "/images/categoria__collar_sin_dije.jpg",
  };

  return (
    <>
      <Header />
      <AnalyticsTracker tipoEvento="catalogo_geral" pageUrl="/" />
      <main>
        <HeroBanner />
        <ValueProps />
        <HomeCategorySection initialProducts={initialProducts} collarBanners={collarBanners} />
        <ResellerCTA />
        <HistoryCTA />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
