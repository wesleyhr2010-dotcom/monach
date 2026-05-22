export const revalidate = 60;

import Header from "@/components/Header";
import NosotrosHero from "@/components/NosotrosHero";
import NosotrosValores from "@/components/NosotrosValores";
import NosotrosTienda from "@/components/NosotrosTienda";
import Footer from "@/components/Footer";

export default function NosotrosPage() {
    return (
        <>
            <Header variant="dark" />
            <main>
                <NosotrosHero />
                <NosotrosValores />
                <NosotrosTienda />
            </main>
            <Footer />
        </>
    );
}
