"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Props {
    initialValue?: string;
}

export default function CatalogSearch({ initialValue = "" }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(initialValue);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (value.trim()) {
            params.set("search", value.trim());
        } else {
            params.delete("search");
        }
        router.push(`/catalogo?${params.toString()}`);
    }

    function clear() {
        setValue("");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("search");
        params.set("page", "1");
        router.push(`/catalogo?${params.toString()}`);
    }

    return (
        <form onSubmit={submit} className="w-full max-w-xl mx-auto">
            <div className="relative flex items-center">
                {/* Search icon */}
                <svg
                    className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-11 pr-24 py-3 text-sm border border-gray-200 rounded-full outline-none focus:border-[#35605a] transition-colors bg-white"
                />

                {/* Clear button */}
                {value && (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-[88px] text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label="Limpiar búsqueda"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <button
                    type="submit"
                    className="absolute right-1.5 bg-[#35605a] text-white text-sm px-5 py-2 rounded-full hover:bg-[#2a4d48] transition-colors"
                >
                    Buscar
                </button>
            </div>
        </form>
    );
}
