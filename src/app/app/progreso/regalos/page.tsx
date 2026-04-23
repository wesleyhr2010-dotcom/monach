"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { getBrindesAtivos, canjearRegalo } from "../actions";
import { Star, Gift } from "lucide-react";

type BrindesData = Awaited<ReturnType<typeof getBrindesAtivos>>;
type BrindeAtivo = BrindesData["brindes"][number];

export default function RegalosPage() {
    const [data, setData] = useState<BrindesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalBrinde, setModalBrinde] = useState<BrindeAtivo | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        getBrindesAtivos()
            .then((d) => { setData(d); setLoading(false); })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Error al cargar regalos.");
                setLoading(false);
            });
    }, []);

    function handleCanjear() {
        if (!modalBrinde) return;
        startTransition(async () => {
            try {
                await canjearRegalo(modalBrinde.id);
                setModalBrinde(null);
                const fresh = await getBrindesAtivos();
                setData(fresh);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Error al canjear.");
            }
        });
    }

    if (error && !data) {
        return (
            <div className="flex flex-col px-5 py-6 bg-[#F5F2EF] min-h-[100dvh] items-center justify-center">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    if (loading || !data) {
        return (
            <div className="flex flex-col px-5 py-6 bg-[#F5F2EF] min-h-[100dvh] items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "#EBEBEB", borderTopColor: "#35605A" }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col px-5 py-6 bg-[#F5F2EF] min-h-[100dvh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/app/progreso" className="text-[#777777] text-sm flex items-center gap-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Volver
                </Link>
                <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#35605A]" />
                    <span className="text-[13px] text-[#1A1A1A] font-semibold" style={{ fontFamily: "var(--font-raleway)" }}>
                        {data.saldo.toLocaleString("es-PY")} pts
                    </span>
                </div>
            </div>

            <h1
                className="text-[20px] text-[#1A1A1A] leading-7 tracking-[-0.3px] mb-4"
                style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
            >
                Canjear Regalos
            </h1>

            {data.brindes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Gift className="w-12 h-12 text-[#D9D6D2] mb-3" />
                    <p className="text-[13px] text-[#777777] text-center" style={{ fontFamily: "var(--font-raleway)" }}>
                        No hay regalos disponibles por el momento.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {data.brindes.map((brinde) => (
                        <div
                            key={brinde.id}
                            className="bg-[#EBEBEB] rounded-2xl p-4 flex gap-3"
                        >
                            <img
                                src={brinde.imagem_url}
                                alt={brinde.nome}
                                className="w-20 h-20 object-cover rounded-xl bg-[#D9D6D2] flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <h3
                                    className="text-[15px] text-[#1A1A1A] font-semibold leading-5 mb-1"
                                    style={{ fontFamily: "var(--font-raleway)" }}
                                >
                                    {brinde.nome}
                                </h3>
                                <p
                                    className="text-[12px] text-[#777777] mb-2 line-clamp-2"
                                    style={{ fontFamily: "var(--font-raleway)" }}
                                >
                                    {brinde.descricao}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[14px] text-[#35605A] font-semibold"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        ⭐ {brinde.custo_pontos.toLocaleString("es-PY")} pts
                                    </span>
                                    {brinde.disponivel ? (
                                        <button
                                            onClick={() => setModalBrinde(brinde)}
                                            className="px-4 py-2 bg-[#35605A] text-white text-[13px] font-semibold rounded-xl"
                                            style={{ fontFamily: "var(--font-raleway)" }}
                                        >
                                            Canjear
                                        </button>
                                    ) : (
                                        <span
                                            className="text-[12px] text-[#777777] font-medium"
                                            style={{ fontFamily: "var(--font-raleway)" }}
                                        >
                                            {data.saldo < brinde.custo_pontos ? "Puntos insuficientes" : "Sin stock"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de confirmação */}
            {modalBrinde && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-5"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={() => setModalBrinde(null)}
                >
                    <div
                        className="bg-[#F5F2EF] rounded-2xl p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            className="text-[18px] text-[#1A1A1A] font-semibold mb-4 text-center"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            Confirmar Canje
                        </h2>

                        <div className="flex flex-col items-center mb-4">
                            <img
                                src={modalBrinde.imagem_url}
                                alt={modalBrinde.nome}
                                className="w-24 h-24 object-cover rounded-xl mb-3"
                            />
                            <p className="text-[15px] text-[#1A1A1A] font-medium" style={{ fontFamily: "var(--font-raleway)" }}>
                                {modalBrinde.nome}
                            </p>
                            <p className="text-[14px] text-[#35605A] font-semibold" style={{ fontFamily: "var(--font-raleway)" }}>
                                ⭐ -{modalBrinde.custo_pontos.toLocaleString("es-PY")} pts
                            </p>
                            <p className="text-[12px] text-[#777777] mt-1" style={{ fontFamily: "var(--font-raleway)" }}>
                                Saldo tras el canje: {(data.saldo - modalBrinde.custo_pontos).toLocaleString("es-PY")} pts
                            </p>
                        </div>

                        <p
                            className="text-[12px] text-[#777777] text-center mb-5"
                            style={{ fontFamily: "var(--font-raleway)" }}
                        >
                            El regalo será entregado por tu consultora en la próxima visita.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalBrinde(null)}
                                className="flex-1 py-3 rounded-xl border border-[#D9D6D2] text-[#1A1A1A] text-[14px] font-medium"
                                style={{ fontFamily: "var(--font-raleway)" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCanjear}
                                disabled={isPending}
                                className="flex-1 py-3 rounded-xl bg-[#35605A] text-white text-[14px] font-semibold disabled:opacity-70"
                                style={{ fontFamily: "var(--font-raleway)" }}
                            >
                                {isPending ? "Procesando..." : "Confirmar Canje"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
