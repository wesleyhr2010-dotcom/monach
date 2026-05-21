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
import { getCatalogProducts, getCategoryBannerImage } from "@/app/actions";

export default async function Home() {
  const [
    { products: initialProducts },
    collarConDijeImg,
    collarSinDijeImg,
  ] = await Promise.all([
    getCatalogProducts(1, "Aros", 10),
    getCategoryBannerImage("Con dije"),
    getCategoryBannerImage("Sin dije"),
  ]);

  const collarBanners = {
    conDije: collarConDijeImg,
    sinDije: collarSinDijeImg,
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
