"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRICE_RANGES = [
    { label: "Todos los precios", min: undefined, max: undefined },
    { label: "Hasta ₲ 100.000",  min: undefined, max: 100000 },
    { label: "₲ 100.000 – 200.000", min: 100000, max: 200000 },
    { label: "₲ 200.000 – 300.000", min: 200000, max: 300000 },
    { label: "Más de ₲ 300.000", min: 300000, max: undefined },
] as const;

interface Props {
    categories: string[];
    total: number;
}

function Dropdown({
    label,
    active,
    children,
}: {
    label: string;
    active: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-full transition-colors ${
                    active
                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                        : "bg-white text-[#1a1a1a] border-gray-300 hover:border-[#1a1a1a]"
                }`}
            >
                {label}
                <svg
                    className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function CatalogFiltersBar({ categories, total }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get("category") || "all";
    const currentSearch   = searchParams.get("search")   || "";
    const currentMin      = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const currentMax      = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

    function buildUrl(overrides: Record<string, string | undefined>) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        for (const [k, v] of Object.entries(overrides)) {
            if (v == null || v === "") params.delete(k);
            else params.set(k, v);
        }
        return `/catalogo?${params.toString()}`;
    }

    function setCategory(cat: string) {
        router.push(buildUrl({ category: cat === "all" ? undefined : cat }));
    }

    function setPrice(min?: number, max?: number) {
        router.push(buildUrl({
            minPrice: min != null ? String(min) : undefined,
            maxPrice: max != null ? String(max) : undefined,
        }));
    }

    function clearFilter(key: string | string[]) {
        const keys = Array.isArray(key) ? key : [key];
        const obj = Object.fromEntries(keys.map((k) => [k, undefined]));
        router.push(buildUrl(obj));
    }

    const activePriceLabel = PRICE_RANGES.find(
        (r) => r.min === currentMin && r.max === currentMax && (r.min != null || r.max != null)
    )?.label;

    const hasFilters = currentCategory !== "all" || currentMin != null || currentMax != null || currentSearch;

    return (
        <div className="flex flex-col gap-4">
            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Category dropdown */}
                <Dropdown
                    label="Categoría"
                    active={currentCategory !== "all"}
                >
                    <button
                        onClick={() => setCategory("all")}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            currentCategory === "all" ? "font-medium" : ""
                        }`}
                    >
                        Todas las categorías
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                currentCategory === cat ? "font-medium text-[#35605a]" : ""
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </Dropdown>

                {/* Price dropdown */}
                <Dropdown
                    label="Precio"
                    active={currentMin != null || currentMax != null}
                >
                    {PRICE_RANGES.map((range) => {
                        const isActive = range.min === currentMin && range.max === currentMax;
                        return (
                            <button
                                key={range.label}
                                onClick={() => setPrice(range.min, range.max)}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                    isActive ? "font-medium text-[#35605a]" : ""
                                }`}
                            >
                                {range.label}
                            </button>
                        );
                    })}
                </Dropdown>

                {/* Result count */}
                <span className="ml-auto text-sm text-gray-400">
                    {total} producto{total !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                    {currentSearch && (
                        <span className="flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1 rounded-full">
                            &ldquo;{currentSearch}&rdquo;
                            <button onClick={() => clearFilter("search")} className="hover:opacity-60">✕</button>
                        </span>
                    )}
                    {currentCategory !== "all" && (
                        <span className="flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1 rounded-full">
                            {currentCategory}
                            <button onClick={() => clearFilter("category")} className="hover:opacity-60">✕</button>
                        </span>
                    )}
                    {activePriceLabel && (
                        <span className="flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1 rounded-full">
                            {activePriceLabel}
                            <button onClick={() => clearFilter(["minPrice", "maxPrice"])} className="hover:opacity-60">✕</button>
                        </span>
                    )}
                    <button
                        onClick={() => router.push(currentSearch ? `/catalogo?search=${encodeURIComponent(currentSearch)}` : "/catalogo")}
                        className="text-xs text-gray-400 underline hover:text-gray-600 ml-1"
                    >
                        Limpiar todo
                    </button>
                </div>
            )}
        </div>
    );
}
