"use client";

import { useState } from "react";
import { getCatalogProducts } from "@/app/actions";
import ProductCard from "./ProductCard";
import CategoryBanner from "./CategoryBanner";
import type { Product } from "@/lib/types";

const CATEGORIES: { label: string; dbName: string }[] = [
    { label: "Aro",     dbName: "Aros" },
    { label: "Pulsera", dbName: "Pulseras" },
    { label: "Collar",  dbName: "Collares" },
    { label: "Anillo",  dbName: "Anillos" },
];

const ARO_BANNERS = [
    { title: "Aros", subtitle: "Pequeños", image: "/images/categoria__wrapper-aros-pequenos.jpg" },
    { title: "Aros", subtitle: "Medianos", image: "/images/categoria__wrapper-aros-medios.jpg" },
    { title: "Aros", subtitle: "Grandes",  image: "/images/categoria__wrapper-aros-grandes.jpg" },
];

interface CollarBanners {
    conDije: string;
    sinDije: string;
}

interface Props {
    initialProducts: Product[];
    collarBanners: CollarBanners;
}

function card(p: Product) {
    return (
        <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={`₲ ${p.price?.toLocaleString("es-PY") ?? "0"}`}
            image={p.images?.[0] || "/placeholder.svg"}
        />
    );
}

function AroGrid({ products }: { products: Product[] }) {
    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {products.slice(0, 4).map(card)}
            </div>
            {/* tablet: banner ocupa largura toda (col-span-2), produtos ficam abaixo em 2 col */}
            {/* desktop: 3 colunas com proporção 2fr_1fr_1fr */}
            <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-5">
                <div className="col-span-2 lg:col-span-1">
                    <CategoryBanner {...ARO_BANNERS[0]} />
                </div>
                {products.slice(4, 6).map(card)}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_2fr] gap-5">
                {products.slice(6, 8).map(card)}
                <div className="col-span-2 lg:col-span-1">
                    <CategoryBanner {...ARO_BANNERS[1]} />
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-5">
                <div className="col-span-2 lg:col-span-1">
                    <CategoryBanner {...ARO_BANNERS[2]} />
                </div>
                {products.slice(8, 10).map(card)}
            </div>
        </div>
    );
}

function CollarGrid({ products, banners }: { products: Product[]; banners: CollarBanners }) {
    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {products.slice(0, 4).map(card)}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-5">
                <div className="col-span-2 lg:col-span-1">
                    <CategoryBanner title="Collar" subtitle="Con Dije" image={banners.conDije} />
                </div>
                {products.slice(4, 6).map(card)}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_2fr] gap-5">
                {products.slice(6, 8).map(card)}
                <div className="col-span-2 lg:col-span-1">
                    <CategoryBanner title="Collar" subtitle="Sin Dije" image={banners.sinDije} />
                </div>
            </div>
        </div>
    );
}

function SimpleGrid({ products }: { products: Product[] }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map(card)}
        </div>
    );
}

export default function HomeCategorySection({ initialProducts, collarBanners }: Props) {
    const [activeDbName, setActiveDbName] = useState(CATEGORIES[0].dbName);
    const [products, setProducts] = useState(initialProducts);
    const [loading, setLoading] = useState(false);

    async function handleCategoryChange(dbName: string) {
        if (dbName === activeDbName) return;
        setActiveDbName(dbName);
        setLoading(true);
        try {
            const limit = dbName === "Aros" ? 10 : dbName === "Collares" ? 8 : 12;
            const { products: newProducts } = await getCatalogProducts(1, dbName, limit);
            setProducts(newProducts);
        } finally {
            setLoading(false);
        }
    }

    function renderGrid() {
        if (products.length === 0) {
            return (
                <p className="text-dark/40 text-sm py-8 text-center">
                    No hay productos en esta categoría.
                </p>
            );
        }
        if (activeDbName === "Aros") return <AroGrid products={products} />;
        if (activeDbName === "Collares") return <CollarGrid products={products} banners={collarBanners} />;
        return <SimpleGrid products={products} />;
    }

    return (
        <section className="bg-white w-full">
            <div className="container-monarca pt-5">
                <div className="flex items-center gap-5 overflow-x-auto pb-1">
                    {CATEGORIES.map(({ label, dbName }) => (
                        <button
                            key={dbName}
                            onClick={() => handleCategoryChange(dbName)}
                            className={`font-tt-ramillas text-lg md:text-xl uppercase whitespace-nowrap transition-all duration-200 cursor-pointer py-3 ${
                                activeDbName === dbName
                                    ? "text-dark font-medium"
                                    : "text-dark/50 hover:text-dark"
                            }`}
                        >
                            <span className={activeDbName === dbName ? "border-b-2 border-black pb-0.5" : ""}>
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div
                className={`container-monarca py-5 transition-opacity duration-200 ${
                    loading ? "opacity-40 pointer-events-none" : "opacity-100"
                }`}
            >
                {renderGrid()}
            </div>
        </section>
    );
}
