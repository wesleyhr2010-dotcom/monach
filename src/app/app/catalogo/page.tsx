"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCatalogoRevendedora } from "../actions-revendedora";
import { formatGs } from "@/lib/format";
import { Search, Share2, ArrowLeft, ImageOff } from "lucide-react";
import {
    downloadImageAsFile,
    shareImages,
    fallbackWhatsAppIndividual,
} from "@/lib/share-images";

export const dynamic = "force-dynamic";

interface CatalogoItem {
    id: string;
    maleta_item_id: string;
    preco_fixado: number;
    disponivel: number;
    producto: {
        id: string;
        name: string;
        sku: string;
        slug: string;
        images: string[];
        category: string;
    };
    variante: {
        id: string;
        attribute_name: string;
        attribute_value: string;
    };
}

export default function CatalogoPage() {
    const router = useRouter();
    const [itens, setItens] = useState<CatalogoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
    const [categorias, setCategorias] = useState<string[]>(["Todos"]);

    useEffect(() => {
        async function fetchCatalogo() {
            setLoading(true);
            const data = await getCatalogoRevendedora();
            setItens(data.itens);
            const cats = [...new Set(data.itens.map((i: { producto: { category: string } }) => i.producto.category).filter(Boolean))];
            setCategorias(["Todos", ...cats]);
            setLoading(false);
        }
        fetchCatalogo();
    }, []);

    const filtered = itens.filter((item) => {
        const matchesSearch =
            item.producto.name.toLowerCase().includes(search.toLowerCase()) ||
            item.variante.attribute_value.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoriaAtiva === "Todos" || item.producto.category === categoriaAtiva;
        return matchesSearch && matchesCategory;
    });

    async function handleShareIndividual(item: CatalogoItem) {
        const imageUrl = item.producto.images[0];
        const text = `¡Mira estas joyas de Monarca! 💎\n${item.producto.name} — ${formatGs(item.preco_fixado)}\n${item.variante.attribute_value}`;

        // Tentar compartilhar com imagem real
        if (imageUrl) {
            const fileName = `${item.producto.sku || item.id}.webp`;
            const file = await downloadImageAsFile(imageUrl, fileName);
            if (file) {
                const result = await shareImages([file], text);
                if (result.shared || result.cancelled) return;
                // Se não conseguiu share (canShare=false), cair no fallback
            }
        }

        // Fallback: WhatsApp com link do produto
        fallbackWhatsAppIndividual(item, undefined, formatGs);
    }

    return (
        <div className="flex flex-col h-full bg-[#F5F2EF]">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#F5F2EF] px-4 pt-4 pb-2">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => router.back()} className="p-1 -ml-1">
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
                    </button>
                    <h1
                        className="text-lg font-semibold tracking-wide uppercase"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        Catálogo
                    </h1>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B4ABA2]" />
                    <input
                        type="text"
                        placeholder="Buscar en consignación..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-none text-sm"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    />
                </div>

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categorias.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaAtiva(cat)}
                            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                            style={{
                                fontFamily: "var(--font-raleway)",
                                background: categoriaAtiva === cat ? "#35605A" : "#E8E2D6",
                                color: categoriaAtiva === cat ? "#fff" : "#6B6B6B",
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35605A]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ImageOff className="w-12 h-12 text-[#B4ABA2] mb-4" />
                        <p className="text-[#6B6B6B] text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                            {search || categoriaAtiva !== "Todos"
                                ? "Nenhum producto encontrado"
                                : "Nenhum item disponível na sua consignação"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm"
                            >
                                {/* Image */}
                                <div className="aspect-square bg-[#E8E2D6] relative">
                                    {item.producto.images[0] ? (
                                        <img
                                            src={item.producto.images[0]}
                                            alt={item.producto.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full">
                                            <ImageOff className="w-8 h-8 text-[#B4ABA2]" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p
                                        className="text-lg font-bold text-[#1A1A1A]"
                                        style={{ fontFamily: "var(--font-playfair)" }}
                                    >
                                        {formatGs(item.preco_fixado)}
                                    </p>
                                    <p
                                        className="text-xs text-[#6B6B6B] mt-0.5 line-clamp-1"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        {item.producto.name}
                                        {item.variante.attribute_value
                                            ? ` — ${item.variante.attribute_value}`
                                            : ""}
                                    </p>

                                    {/* Share button */}
                                    <button
                                        onClick={() => handleShareIndividual(item)}
                                        className="mt-2 w-full py-2 rounded-full text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                                        style={{
                                            background: "#35605A",
                                            fontFamily: "var(--font-raleway)",
                                        }}
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                        Compartir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky bottom action */}
            {itens.length > 0 && (
                <div className="sticky bottom-[calc(59px+env(safe-area-inset-bottom)+8px)] left-0 right-0 px-4 z-40">
                    <button
                        onClick={() => router.push("/app/catalogo/compartir")}
                        className="w-full py-3.5 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg"
                        style={{
                            background: "#1A1A1A",
                            fontFamily: "var(--font-raleway)",
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                        Seleccionar varias fotos
                    </button>
                </div>
            )}
        </div>
    );
}
