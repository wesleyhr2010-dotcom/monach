"use client";

import { useState } from "react";

type FAQItem = { q: string; a: string };

const defaultItems: FAQItem[] = [
    {
        q: "¿De qué material están hechas las semijoyas?",
        a: "Las semijoyas de Monarca están hechas de una base de metal no noble llamada latón, y luego son bañadas en oro 18k o rodio blanco.",
    },
    {
        q: "¿Las joyas tienen garantía?",
        a: "Sí. Ofrecemos garantía de 1 año en toda la línea adulto y 6 meses de garantía en la línea infantil.",
    },
    {
        q: "¿Hacen envíos a mi ciudad?",
        a: "Hacemos envíos a cualquier rincón del Paraguay. No hacemos envíos internacionales.",
    },
    {
        q: "Sufro de alergia. ¿Puedo usar las semijoyas?",
        a: "Nuestras joyas poseen una capa de barniz antialérgico que garantizan más durabilidad y más seguridad para tu piel. La gran mayoría de nuestras clientes que tienen alergia, relatan no tener problemas con las joyas de Monarca.",
    },
    {
        q: "¿Venden al por mayor?",
        a: "Sí. A partir de 10 unidades accedés al precio especial de reventa.",
    },
];

export default function FAQ({ items = defaultItems }: { items?: FAQItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-16 md:py-20 bg-white">
            <div className="container-monarca">
                <div className="flex justify-center mb-12">
                    <div className="text-center">
                        <h2 className="font-tt-ramillas text-2xl md:text-3xl uppercase tracking-wide leading-tight text-dark max-w-2xl mx-auto">
                            Aclará tus dudas y descubrí el secreto de nuestra sofisticación
                        </h2>
                    </div>
                </div>

                <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto">
                    {items.map((item, i) => (
                        <div key={i}>
                            {/* Question pill */}
                            <div className="rounded-full border border-black">
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full flex items-center justify-between py-3 px-5 md:px-6 cursor-pointer"
                                    aria-expanded={openIndex === i}
                                >
                                    <span className="font-inter text-sm md:text-base text-dark text-left pr-4">
                                        {item.q}
                                    </span>
                                    <div
                                        className={`w-[50px] h-[50px] md:w-[74px] md:h-[74px] rounded-full bg-black flex items-center justify-center shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-45" : ""}`}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </div>
                                </button>
                            </div>

                            {/* Answer — fora do pill */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-48 pt-4 pb-2" : "max-h-0"}`}
                            >
                                <p className="text-base text-dark/70 leading-7 px-5 md:px-6">{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
