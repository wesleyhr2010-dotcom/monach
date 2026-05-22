"use client";

import { useState } from "react";

const categories = ["Aro", "Pulsera", "Collar", "Anillo"];

export default function CategoryTabs() {
    const [active, setActive] = useState(0);

    return (
        <section className="bg-white w-full">
            <div className="container-monarca">
                <div className="flex items-center gap-5 overflow-x-auto pb-1">
                    {categories.map((cat, i) => (
                        <button
                            key={cat}
                            onClick={() => setActive(i)}
                            className={`font-tt-ramillas text-lg md:text-xl uppercase whitespace-nowrap transition-all duration-200 cursor-pointer py-3 ${
                                active === i ? "text-dark font-medium" : "text-dark/50 hover:text-dark"
                            }`}
                        >
                            <span className={active === i ? "border-b-2 border-black pb-0.5" : ""}>
                                {cat}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
