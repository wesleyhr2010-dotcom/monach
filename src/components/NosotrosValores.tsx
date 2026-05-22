import Image from "next/image";

const valores = [
    {
        titulo: "Calidad",
        descripcion: "Ofrecemos accesorios de alta calidad que garantizan durabilidad y belleza en cada pieza de joyería.",
    },
    {
        titulo: "Durabilidad",
        descripcion: "Nuestras semijoyas están hechas para durar, para que puedas disfrutarlas en diversas ocasiones, en la vida cotidiana o en momentos especiales.",
    },
    {
        titulo: "Empoderamiento femenino",
        descripcion: "Creemos en el poder de la mujer moderna, y queremos que nuestras piezas te hagan sentir segura y valorada en cada etapa de tu vida.",
    },
    {
        titulo: "Autenticidad",
        descripcion: "Somos auténticos, con accesorios que expresan tu individualidad, enfocando una comunicación transparente y sincera con nuestros clientes.",
    },
    {
        titulo: "Equilibrio",
        descripcion: "Nuestras piezas te ayudan a encontrar el equilibrio entre la vida personal y profesional, siempre con mucho estilo y funcionalidad.",
    },
];

export default function NosotrosValores() {
    return (
        <section className="bg-white">
            <div className="container-monarca">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-0 md:gap-16 items-center">
                    {/* Foto da fundadora */}
                    <div className="relative h-[420px] md:h-[720px] bg-gray-100">
                        <Image
                            src="/images/nosotros/fundadora.jpg"
                            alt="Jooh Fonini — Fundadora de Monarca Semijoyas"
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 768px) 100vw, 40vw"
                        />
                    </div>

                    {/* Texto de valores */}
                    <div className="py-12 md:py-0">
                        <p className="text-xs tracking-[0.2em] uppercase text-dark/50 mb-3">
                            Valores
                        </p>
                        <h2 className="font-tt-ramillas text-2xl md:text-3xl uppercase font-bold text-dark leading-tight mb-5">
                            Que nos inspiran
                        </h2>
                        <p className="text-sm md:text-base leading-7 text-dark/70 mb-6">
                            En Monarca Semijoyas, cada detalle está diseñado para reflejar nuestros principios
                            fundamentales. Estos son los valores que nos mueven:
                        </p>
                        <ul className="flex flex-col gap-3">
                            {valores.map((v) => (
                                <li key={v.titulo} className="text-sm md:text-base leading-7 text-dark/80">
                                    <strong className="font-semibold text-dark">{v.titulo}:</strong>{" "}
                                    {v.descripcion}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
