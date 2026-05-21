export const revalidate = 60;

import Header from "@/components/Header";
import ContactHero from "@/components/ContactHero";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function ContactoPage() {
    return (
        <>
            <Header variant="dark" />
            <main>
                <ContactHero />
                <FAQ />
            </main>
            <Footer />
        </>
    );
}
