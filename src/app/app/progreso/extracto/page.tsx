import Link from "next/link";
import { getExtratoPontos } from "../actions";
import { Star, ArrowUp, ArrowDown } from "lucide-react";

export const metadata = {
    title: "Extracto de Puntos — Monarca",
};

export default async function ExtractoPage() {
    const { extrato, saldo, hasMore } = await getExtratoPontos(0);

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
            </div>

            {/* Saldo */}
            <div className="bg-[#EBEBEB] rounded-2xl p-6 text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-[#35605A]" />
                    <span className="text-[13px] text-[#777777]" style={{ fontFamily: "var(--font-raleway)" }}>
                        Saldo Actual
                    </span>
                </div>
                <span
                    className="text-[32px] text-[#1A1A1A] font-bold"
                    style={{ fontFamily: "var(--font-playfair)" }}
                >
                    {saldo.toLocaleString("es-PY")} pts
                </span>
                <Link
                    href="/app/progreso/regalos"
                    className="mt-3 inline-block text-[#35605A] text-[13px] font-semibold"
                    style={{ fontFamily: "var(--font-raleway)" }}
                >
                    Canjear Regalos →
                </Link>
            </div>

            {/* Historial */}
            <h2
                className="text-[16px] text-[#1A1A1A] font-semibold mb-3"
                style={{ fontFamily: "var(--font-raleway)" }}
            >
                Historial
            </h2>

            {extrato.length === 0 ? (
                <p className="text-[13px] text-[#777777] text-center py-8" style={{ fontFamily: "var(--font-raleway)" }}>
                    Aún no tienes movimientos de puntos.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {extrato.map((item) => (
                        <ExtratoItem key={item.id} item={item} />
                    ))}
                </div>
            )}

            {hasMore && (
                <button
                    className="mt-4 text-[#35605A] text-[13px] font-medium text-center py-3"
                    style={{ fontFamily: "var(--font-raleway)" }}
                >
                    Cargar más...
                </button>
            )}
        </div>
    );
}

function ExtratoItem({ item }: { item: { id: string; descricao: string; pontos: number; created_at: Date } }) {
    const isGanho = item.pontos > 0;

    return (
        <div className="bg-[#EBEBEB] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isGanho ? "bg-[#35605A]/10" : "bg-red-50"
                    }`}
                >
                    {isGanho ? (
                        <ArrowUp className="w-4 h-4 text-[#35605A]" />
                    ) : (
                        <ArrowDown className="w-4 h-4 text-[#C0392B]" />
                    )}
                </div>
                <div>
                    <p
                        className="text-[14px] text-[#1A1A1A] font-medium leading-5"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        {item.descricao || "Movimiento"}
                    </p>
                    <p
                        className="text-[12px] text-[#777777]"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        {new Date(item.created_at).toLocaleDateString("es-PY", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            </div>
            <span
                className={`text-[14px] font-semibold ${isGanho ? "text-[#35605A]" : "text-[#C0392B]"}`}
                style={{ fontFamily: "var(--font-raleway)" }}
            >
                {isGanho ? "+" : ""}{item.pontos} pts
            </span>
        </div>
    );
}
