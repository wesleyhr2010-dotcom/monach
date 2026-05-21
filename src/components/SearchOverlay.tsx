"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { getCatalogProducts } from "@/app/actions";
import { formatGs } from "@/lib/format";
import type { Product } from "@/lib/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

function useDebounce(value: string, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function SearchOverlay({ isOpen, onClose }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debouncedQuery = useDebounce(query);

    // Focus input when overlay opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        } else {
            setQuery("");
            setResults([]);
            setSearched(false);
        }
    }, [isOpen]);

    // Search on debounced query change
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        getCatalogProducts(1, "all", 4, debouncedQuery)
            .then(({ products }) => setResults(products))
            .finally(() => setLoading(false));
    }, [debouncedQuery]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const hasResults = results.length > 0;
    const noResults = searched && !loading && !hasResults;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="search-overlay"
                    className="fixed inset-0 z-[60] bg-white overflow-y-auto"
                    initial={{ y: "-100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-8 text-[#1a1a1a] text-xl hover:opacity-50 transition-opacity z-10"
                        aria-label="Cerrar búsqueda"
                    >
                        ✕
                    </button>

                    <div className="max-w-[900px] mx-auto px-6 pt-16 pb-20">
                        {/* Search input */}
                        <div className="relative mb-10">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder=""
                                className="w-full border border-[#1a1a1a] rounded-full px-10 py-5 text-3xl text-center font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 tracking-wide"
                            />
                            {loading && (
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] animate-spin" />
                            )}
                        </div>

                        {/* No results */}
                        {noResults && (
                            <div className="text-center mt-16">
                                <p className="text-[#1a1a1a]/40 text-xs uppercase tracking-[4px] mb-4">
                                    OPS
                                </p>
                                <p className="text-[#1a1a1a] text-xl md:text-2xl font-light uppercase tracking-wide">
                                    La búsqueda no ha devuelto ningún resultado.
                                </p>
                            </div>
                        )}

                        {/* Results grid */}
                        {hasResults && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                    {results.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/produto/${p.id}`}
                                            onClick={onClose}
                                            className="group flex flex-col"
                                        >
                                            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                                <Image
                                                    src={p.images?.[0] || "/placeholder.svg"}
                                                    alt={p.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs uppercase tracking-wide text-[#1a1a1a] truncate">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-[#1a1a1a]/60 mt-0.5">
                                                {formatGs(p.price)}
                                            </p>
                                        </Link>
                                    ))}
                                </div>

                                {/* Explorar link */}
                                <div className="flex justify-center">
                                    <Link
                                        href={`/catalogo?search=${encodeURIComponent(query)}`}
                                        onClick={onClose}
                                        className="text-sm text-[#1a1a1a] underline underline-offset-4 hover:opacity-50 transition-opacity uppercase tracking-widest"
                                    >
                                        Explorar
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
