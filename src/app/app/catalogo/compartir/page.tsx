"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCatalogoRevendedora, registrarPuntosCompartirCatalogo } from "../actions-revendedora";
import { ArrowLeft, Check, Share2, X, ImageOff } from "lucide-react";

export const dynamic = "force-dynamic";

interface CatalogoItem {
    id: string;
    maleta_item_id: string;
    preco_fixado: number;
    producto: {
        id: string;
        name: string;
        sku: string;
        images: string[];
        category: string;
    };
    variante: {
        id: string;
        attribute_name: string;
        attribute_value: string;
    };
}

const MAX_IMAGENS = 10;

export default function CompartirFotosPage() {
    const router = useRouter();
    const [itens, setItens] = useState<CatalogoItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCatalogo() {
            setLoading(true);
            const data = await getCatalogoRevendedora();
            setItens(data.itens);
            setLoading(false);
        }
        fetchCatalogo();
    }, []);

    function toggleSelection(id: string) {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((i) => i !== id);
            }
            if (prev.length >= MAX_IMAGENS) {
                setError(`Máximo ${MAX_IMAGENS} imágenes`);
                setTimeout(() => setError(null), 2000);
                return prev;
            }
            return [...prev, id];
        });
    }

    async function handleCompartir() {
        if (selectedIds.length === 0) return;
        setSharing(true);
        setError(null);

        const selectedItems = itens.filter((i) => selectedIds.includes(i.id));

        try {
            // 1. Download images
            const imageFiles: File[] = [];
            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                setProgress(`Descargando ${i + 1}/${selectedItems.length}...`);

                const imageUrl = item.producto.images[0];
                if (!imageUrl) continue;

                try {
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error("Failed to fetch");
                    const blob = await response.blob();
                    const fileName = `${item.producto.sku || item.id}.webp`;
                    const file = new File([blob], fileName, { type: blob.type || "image/webp" });
                    imageFiles.push(file);
                } catch {
                    console.warn(`Failed to download image for ${item.id}`);
                }
            }

            setProgress(null);

            // 2. Share
            const text = `¡Joyas hermosas de Monarca! 💎\nVe más en nuestro catálogo.`;

            if (
                navigator.canShare &&
                navigator.canShare({ files: imageFiles }) &&
                imageFiles.length > 0
            ) {
                await navigator.share({ files: imageFiles, text });
            } else {
                // Fallback: WhatsApp with text links
                const urls = selectedItems
                    .map((i) => i.producto.name)
                    .join("\n• ");
                const waText = encodeURIComponent(`Joyas Monarca 💎\n\n${urls}`);
                window.open(`https://wa.me/?text=${waText}`, "_blank");
            }

            // 3. Award points
            await registrarPuntosCompartirCatalogo();

            // Reset
            setSelectedIds([]);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro ao compartir";
            setError(msg);
        } finally {
            setSharing(false);
            setProgress(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#F5F2EF]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35605A]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F5F2EF]">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#F5F2EF] px-4 pt-4 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => router.back()} className="p-1 -ml-1">
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
                    </button>
                    <h1
                        className="text-base font-semibold tracking-wide"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        SELECCIONA FOTOS PARA COMPARTIR
                    </h1>
                </div>
                <p className="text-xs text-[#6B6B6B] ml-8" style={{ fontFamily: "var(--font-raleway)" }}>
                    {selectedIds.length} de {MAX_IMAGENS} selecionadas
                </p>
            </div>

            {/* Error toast */}
            {error && (
                <div className="mx-4 mb-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-xs">
                    {error}
                </div>
            )}

            {/* Progress */}
            {progress && (
                <div className="mx-4 mb-2 px-4 py-2 rounded-lg bg-[#35605A]/10 text-[#35605A] text-xs text-center">
                    {progress}
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-32">
                {itens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ImageOff className="w-12 h-12 text-[#B4ABA2] mb-4" />
                        <p className="text-[#6B6B6B] text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                            Nenhum item disponível na sua consignação
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {itens.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggleSelection(item.id)}
                                    className="relative aspect-square rounded-xl overflow-hidden"
                                    style={{
                                        border: isSelected ? "3px solid #35605A" : "3px solid transparent",
                                    }}
                                >
                                    {item.producto.images[0] ? (
                                        <img
                                            src={item.producto.images[0]}
                                            alt={item.producto.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full bg-[#E8E2D6]">
                                            <ImageOff className="w-6 h-6 text-[#B4ABA2]" />
                                        </div>
                                    )}

                                    {/* Checkmark overlay */}
                                    {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#35605A] flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom action bar */}
            {selectedIds.length > 0 && (
                <div className="sticky bottom-[calc(59px+env(safe-area-inset-bottom)+8px)] left-0 right-0 px-4 z-40">
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <span
                                className="text-sm font-semibold text-[#1A1A1A]"
                                style={{ fontFamily: "var(--font-raleway)" }}
                            >
                                {selectedIds.length} IMÁGENES SELECCIONADAS
                            </span>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-[#6B6B6B] underline"
                                style={{ fontFamily: "var(--font-raleway)" }}
                            >
                                Cancelar
                            </button>
                        </div>
                        <button
                            onClick={handleCompartir}
                            disabled={sharing}
                            className="w-full py-3.5 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2"
                            style={{
                                background: sharing ? "#B4ABA2" : "#35605A",
                                fontFamily: "var(--font-raleway)",
                            }}
                        >
                            <Share2 className="w-4 h-4" />
                            {sharing ? "Procesando..." : "📲 Compartir"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
