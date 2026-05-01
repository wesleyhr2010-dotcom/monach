import Header from "@/components/Header";

export const revalidate = 60; // ISR — página pública, cachear por 60s
import HeroBanner from "@/components/HeroBanner";
import ValueProps from "@/components/ValueProps";
import CategoryTabs from "@/components/CategoryTabs";
import ProductGrid from "@/components/ProductGrid";
import ResellerCTA from "@/components/ResellerCTA";
import HistoryCTA from "@/components/HistoryCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export default function Home() {
  return (
    <>
      <Header />
      <AnalyticsTracker tipoEvento="catalogo_geral" pageUrl="/" />
      <main>
        <HeroBanner />
        <ValueProps />
        <CategoryTabs />
        <ProductGrid />
        <ResellerCTA />
        <HistoryCTA />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
