import Link from "next/link";
import { getExtratoPontos } from "../actions";
import { Star, ArrowUp, ArrowDown } from "lucide-react";

export const metadata = {
    title: "Extracto de Puntos — Monarca",
};

export default async function ExtractoPage() {
    const { extrato, saldo, hasMore } = await getExtratoPontos(0);

    return (
        <div className="flex flex-col px-5 py-6 bg-app-bg min-h-full app-nav-clearance">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/app/progreso" className="text-app-text-secondary text-sm flex items-center gap-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Volver
                </Link>
            </div>

            {/* Saldo */}
            <div className="bg-app-surface rounded-2xl p-6 text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-app-primary" />
                    <span className="text-[13px] text-app-text-secondary" style={{ fontFamily: "var(--font-raleway)" }}>
                        Saldo Actual
                    </span>
                </div>
                <span
                    className="text-[32px] text-app-text font-bold"
                    style={{ fontFamily: "var(--font-playfair)" }}
                >
                    {saldo.toLocaleString("es-PY")} pts
                </span>
                <Link
                    href="/app/progreso/regalos"
                    className="mt-3 inline-block text-app-primary text-[13px] font-semibold"
                    style={{ fontFamily: "var(--font-raleway)" }}
                >
                    Canjear Regalos →
                </Link>
            </div>

            {/* Historial */}
            <h2
                className="text-[16px] text-app-text font-semibold mb-3"
                style={{ fontFamily: "var(--font-raleway)" }}
            >
                Historial
            </h2>

            {extrato.length === 0 ? (
                <p className="text-[13px] text-app-text-secondary text-center py-8" style={{ fontFamily: "var(--font-raleway)" }}>
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
                    className="mt-4 text-app-primary text-[13px] font-medium text-center py-3"
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
        <div className="bg-app-surface rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isGanho ? "bg-app-primary/10" : "bg-red-50"
                    }`}
                >
                    {isGanho ? (
                        <ArrowUp className="w-4 h-4 text-app-primary" />
                    ) : (
                        <ArrowDown className="w-4 h-4 text-app-danger" />
                    )}
                </div>
                <div>
                    <p
                        className="text-[14px] text-app-text font-medium leading-5"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        {item.descricao || "Movimiento"}
                    </p>
                    <p
                        className="text-[12px] text-app-text-secondary"
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
                className={`text-[14px] font-semibold ${isGanho ? "text-app-primary" : "text-app-danger"}`}
                style={{ fontFamily: "var(--font-raleway)" }}
            >
                {isGanho ? "+" : ""}{item.pontos} pts
            </span>
        </div>
    );
}
