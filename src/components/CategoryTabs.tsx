"use client";

import { useState } from "react";

const categories = ["Aro", "Pulsera", "Collar", "Anillo"];

export default function CategoryTabs() {
    const [active, setActive] = useState(0);

    return (
        <div className="container-monarca">
            <div className="flex items-center gap-5 overflow-x-auto pb-1">
                {categories.map((cat, i) => (
                    <button
                        key={cat}
                        onClick={() => setActive(i)}
                        className={`font-inter text-lg md:text-xl uppercase leading-9 whitespace-nowrap transition-all duration-200 cursor-pointer pb-1 ${active === i
                                ? "text-dark border-b-2 border-black font-medium"
                                : "text-dark/50 hover:text-dark"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
