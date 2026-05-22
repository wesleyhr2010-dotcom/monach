import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "¡Solicitud enviada! | Monarca Semijoyas",
  robots: { index: false },
};

export default function RevendedoraObrigadoPage() {
  return (
    <>
      <Header variant="dark" />
      <main className="min-h-[70vh] flex items-center bg-white">
        <section className="w-full py-20 bg-white">
          <div className="container-monarca">
            <div className="max-w-lg">
              {/* Check icon */}
              <div className="w-12 h-12 rounded-full border border-dark/20 flex items-center justify-center mb-8">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <p className="text-xs tracking-[0.2em] uppercase text-dark/50 mb-3">
                Solicitud recibida
              </p>
              <h1 className="font-tt-ramillas text-3xl md:text-4xl uppercase font-bold text-dark leading-tight mb-6">
                ¡Gracias por
                <br />
                tu inscripción!
              </h1>
              <p className="text-sm md:text-base leading-7 text-dark/70 mb-8">
                Recibimos tu solicitud para unirte a Monarca Semijoyas. Revisaremos tu
                candidatura en los próximos días hábiles y nos pondremos en contacto por
                WhatsApp.
              </p>

              <div className="border border-dark/10 p-6 mb-8">
                <p className="text-xs tracking-[0.15em] uppercase text-dark/50 mb-3">
                  ¿Tenés dudas?
                </p>
                <a
                  href="https://wa.me/595986336858"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex flex-col items-start text-left"
                >
                  <span className="font-medium text-sm text-dark leading-7">
                    Contactar por WhatsApp
                  </span>
                  <span className="w-full h-px bg-dark/30 group-hover:bg-gold transition-colors duration-300" />
                </a>
              </div>

              <Link
                href="/"
                className="group inline-flex flex-col items-start text-left"
              >
                <span className="text-sm text-dark/60 leading-7">
                  Volver al inicio
                </span>
                <span className="w-full h-px bg-dark/20 group-hover:bg-dark transition-colors duration-300" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
