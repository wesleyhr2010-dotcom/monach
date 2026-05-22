import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevendedoraForm from "@/components/RevendedoraForm";

export const metadata: Metadata = {
  title: "Sé Revendedora | Monarca Semijoyas",
  description:
    "Únete a la red de revendedoras de Monarca Semijoyas. Vendé joyas de alta calidad en consignación y ganá comisiones trabajando a tu ritmo.",
  openGraph: {
    title: "Únete a Monarca Semijoyas como Revendedora",
    description:
      "Formulario de inscripción para revendedoras. Consignación, comisiones y apoyo personalizado.",
  },
};

const benefits = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Comisión desde el primer mes",
    text: "Empezás a ganar desde tu primera consignación, con porcentajes que crecen con tu desempeño.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Apoyo de tu consultora personal",
    text: "Cada revendedora tiene una consultora asignada que te acompaña, capacita y resuelve tus dudas.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: "Catálogo exclusivo en consignación",
    text: "Recibís las joyas, las vendés a tu ritmo y devolvés el resto. Sin inversión inicial.",
  },
];

export default function RevendedoraPage() {
  return (
    <>
      <Header variant="dark" />
      <main>
        {/* Hero */}
        <section className="pt-32 md:pt-36 pb-16 md:pb-20 bg-white">
          <div className="container-monarca">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.2em] uppercase text-dark/50 mb-3">
                Consignación Monarca
              </p>
              <h1 className="font-tt-ramillas text-3xl md:text-5xl uppercase font-bold text-dark leading-tight mb-6">
                Sé una Revendedora
                <br />
                <span className="text-gold">Autorizada</span>
              </h1>
              <p className="text-sm md:text-base leading-7 text-dark/70 mb-10 max-w-xl">
                Sumate a la red de revendedoras de Monarca Semijoyas. Trabajás con joyas de
                alta calidad en consignación — vendés, ganás comisión y devolvés lo que no
                vendiste. Sin riesgo, con todo el respaldo de tu consultora.
              </p>

              <div className="flex flex-col gap-6">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-4">
                    <span className="shrink-0 mt-0.5 text-dark/60">{b.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-dark">{b.title}</p>
                      <p className="text-sm text-dark/60 leading-relaxed mt-0.5">{b.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-dark/10" />

        {/* Form */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container-monarca">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.2em] uppercase text-dark/50 mb-3">
                Formulario de inscripción
              </p>
              <h2 className="font-tt-ramillas text-2xl md:text-3xl uppercase font-bold text-dark mb-2">
                Completá tus datos
              </h2>
              <p className="text-sm text-dark/60 leading-relaxed mb-10">
                Revisamos cada solicitud y nos ponemos en contacto por WhatsApp en los próximos
                días hábiles.
              </p>

              <RevendedoraForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
