"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCatalogoRevendedora, registrarPuntosCompartirLinkVitrina, getSlugRevendedora } from "../actions-revendedora";
import { useTransitionRouter } from "@/components/app/transitions/useTransitionRouter";
import { formatGs } from "@/lib/format";
import { Search, Share2, Link2, ArrowLeft, ImageOff } from "lucide-react";
import {
    downloadImageAsFile,
    shareImages,
    fallbackWhatsAppIndividual,
} from "@/lib/share-images";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";

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
    const transitionRouter = useTransitionRouter();
    const [itens, setItens] = useState<CatalogoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
    const [categorias, setCategorias] = useState<string[]>(["Todos"]);
    const [vitrinaSlug, setVitrinaSlug] = useState<string | null>(null);
    const [shareMsg, setShareMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCatalogo() {
            setLoading(true);
            setError(null);
            const result = await getCatalogoRevendedora();
            if (!result.success) {
                setError(result.error);
                setItens([]);
            } else {
                setItens(result.data.itens);
                const cats = [...new Set(result.data.itens.map((i: { producto: { category: string } }) => i.producto.category).filter(Boolean))];
                setCategorias(["Todos", ...cats]);
                const slugResult = await getSlugRevendedora();
                if (slugResult.success) {
                    setVitrinaSlug(slugResult.data.slug);
                }
            }
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

        if (imageUrl) {
            const fileName = `${item.producto.sku || item.id}.webp`;
            const file = await downloadImageAsFile(imageUrl, fileName);
            if (file) {
                const result = await shareImages([file], text);
                if (result.shared || result.cancelled) return;
            }
        }

        fallbackWhatsAppIndividual(item, undefined, formatGs);
    }

    async function handleShareVitrina() {
        if (!vitrinaSlug) return;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const vitrinaUrl = `${siteUrl}/vitrina/${vitrinaSlug}`;
        const shareText = "Visita mi vitrina de joyas Monarca 💎";

        if (typeof navigator.share === "function" && navigator.canShare?.({ url: vitrinaUrl })) {
            try {
                await navigator.share({ title: "Mi Vitrina Monarca", text: shareText, url: vitrinaUrl });
                await registrarPuntosCompartirLinkVitrina();
                setShareMsg("¡Puntos ganados!");
                setTimeout(() => setShareMsg(null), 3000);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                // share failed for other reason — fall back to clipboard
                await navigator.clipboard.writeText(vitrinaUrl);
                await registrarPuntosCompartirLinkVitrina();
                setShareMsg("¡Link copiado!");
                setTimeout(() => setShareMsg(null), 3000);
            }
        } else {
            await navigator.clipboard.writeText(vitrinaUrl);
            await registrarPuntosCompartirLinkVitrina();
            setShareMsg("¡Link copiado!");
            setTimeout(() => setShareMsg(null), 3000);
        }
    }

    return (
        <div className="flex flex-col h-full bg-app-bg">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-app-bg px-4 pt-4 pb-2">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => router.back()} className="p-1 -ml-1">
                        <ArrowLeft className="w-5 h-5 text-app-text" />
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
                    <input
                        type="text"
                        placeholder="Buscar en consignación..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-app-card-bg border-none text-sm"
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
                    <div className="flex flex-col gap-3 py-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                ) : error ? (
                    <ErrorState
                        title="Error al cargar"
                        description={error}
                        onRetry={() => window.location.reload()}
                    />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        title={search || categoriaAtiva !== "Todos" ? "Ningún producto encontrado" : "Catálogo vacío"}
                        description={search || categoriaAtiva !== "Todos"
                            ? "Probá con otros términos de búsqueda."
                            : "Tu maleta activa no tiene productos disponibles."
                        }
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className="bg-app-card-bg rounded-2xl overflow-hidden shadow-sm"
                            >
                                {/* Image */}
                                <div className="aspect-square bg-app-border relative">
                                    {item.producto.images[0] ? (
                                        <img
                                            src={item.producto.images[0]}
                                            alt={item.producto.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full">
                                            <ImageOff className="w-8 h-8 text-app-muted" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p
                                        className="text-lg font-bold text-app-text"
                                        style={{ fontFamily: "var(--font-playfair)" }}
                                    >
                                        {formatGs(item.preco_fixado)}
                                    </p>
                                    <p
                                        className="text-xs text-app-text-secondary mt-0.5 line-clamp-1"
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
                    <div className="flex flex-col gap-2">
                        {vitrinaSlug && (
                            <button
                                onClick={handleShareVitrina}
                                className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
                                style={{
                                    background: "var(--app-accent, #35605A)",
                                    color: "#fff",
                                    fontFamily: "var(--font-raleway)",
                                }}
                            >
                                <Link2 className="w-4 h-4" />
                                Compartir mi vitrina
                            </button>
                        )}
                        <button
                            onClick={() => transitionRouter.pushSheet("/app/catalogo/compartir")}
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
                    {shareMsg && (
                        <p
                            className="text-center text-xs font-medium text-app-accent mt-1"
                            style={{ fontFamily: "var(--font-raleway)" }}
                        >
                            {shareMsg}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
