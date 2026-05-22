import Image from "next/image";
import Link from "next/link";

const fotos = [
    { src: "/images/nosotros/tienda-1.jpg", alt: "Fachada exterior de Monarca Semijoyas" },
    { src: "/images/nosotros/tienda-2.jpg", alt: "Interior de la tienda Monarca" },
    { src: "/images/nosotros/tienda-3.jpg", alt: "Sala de exhibición Monarca Semijoyas" },
    { src: "/images/nosotros/tienda-4.jpg", alt: "Logo Monarca Semijoyas en tienda" },
];

export default function NosotrosTienda() {
    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container-monarca">
                <p className="text-xs tracking-[0.2em] uppercase text-dark/50 mb-3">
                    Tienda
                </p>
                <h2 className="font-tt-ramillas text-2xl md:text-3xl uppercase font-bold text-dark leading-tight mb-6">
                    Pensado para vos
                </h2>
                <div className="max-w-3xl flex flex-col gap-5 text-sm md:text-base leading-7 text-dark/80 mb-6">
                    <p>
                        Monarca Semijoyas, ubicada en la ciudad de Santa Rita, Alto Paraná, abrió sus puertas en
                        marzo de 2021, en medio de una pandemia y con un propósito claro: ayudar a las mujeres a
                        elevar su autoestima a través de semijoyas que reflejen su fuerza y estilo.
                    </p>
                    <p>
                        En nuestra tienda física, no solo encontrarás semijoyas sino también carteras, billeteras y
                        lentes de sol, seleccionados cuidadosamente para complementar tu look. Nos dedicamos a
                        ofrecerte una experiencia única, para que cada visita a nuestro espacio te sorprenda y te
                        haga sentir especial.
                    </p>
                </div>

                <Link
                    href="/contacto"
                    className="inline-block text-sm text-dark underline underline-offset-4 hover:opacity-60 transition-opacity mb-10"
                >
                    Visítanos y descubrí aún más
                </Link>

                {/* Grid de fotos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {fotos.map((foto) => (
                        <div key={foto.src} className="relative aspect-square bg-gray-100 overflow-hidden">
                            <Image
                                src={foto.src}
                                alt={foto.alt}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
