"use client";

import { useState } from "react";
import Image from "next/image";

const questions = [
    "¿De qué material están hechas las semijoyas?",
    "¿Las joyas tienen garantía?",
    "¿Puedo usar en mi collar?",
    "¿Sufro de alergia ¿Puedo usar las semijoyas?",
    "¿Venden al por mayor?",
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-16 md:py-20 bg-white">
            <div className="container-monarca">
                {/* Logo / Title Image */}
                <div className="flex justify-center mb-12">
                    <div className="text-center">
                        <h2 className="font-inter text-2xl md:text-3xl uppercase tracking-wide leading-tight text-dark max-w-2xl mx-auto">
                            Aclará tus dudas y descubrí el secreto de nuestra sofisticación
                        </h2>
                    </div>
                </div>

                {/* Accordion */}
                <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto">
                    {questions.map((q, i) => (
                        <div key={i} className="rounded-full border border-black overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between py-3 px-5 md:px-6 cursor-pointer"
                                aria-expanded={openIndex === i}
                            >
                                <span className="font-inter text-sm md:text-base text-dark text-left pr-4">
                                    {q}
                                </span>
                                <div
                                    className={`w-[50px] h-[50px] md:w-[74px] md:h-[74px] rounded-full bg-black flex items-center justify-center shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-45" : ""
                                        }`}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2"
                                    >
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                            </button>

                            {/* Answer panel */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-40 pb-5 px-5 md:px-6" : "max-h-0"
                                    }`}
                            >
                                <p className="text-sm text-dark/70 leading-6">
                                    Información detallada sobre esta pregunta estará disponible próximamente.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
