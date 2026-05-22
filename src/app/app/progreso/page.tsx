import Link from "next/link";
import { getRegrasProgresso } from "./actions";
import { Star, ShoppingBag, Trophy, Clock, Share2, Briefcase, UserCheck, Sparkles } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    "shopping-bag": ShoppingBag,
    trophy: Trophy,
    clock: Clock,
    "share-2": Share2,
    briefcase: Briefcase,
    "user-check": UserCheck,
    sparkles: Sparkles,
    star: Star,
};

function getIcon(name: string) {
    return ICON_MAP[name] ?? Star;
}

export default async function ProgressoPage() {
    const { regras, totalPuntos } = await getRegrasProgresso();

    return (
        <div className="flex flex-col px-5 py-6 bg-app-bg min-h-full app-nav-clearance">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1
                    className="text-[20px] text-app-text leading-7 tracking-[-0.3px]"
                    style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
                >
                    Cómo Ganar Puntos
                </h1>
                <div
                    className="flex items-center gap-1.5 bg-app-surface rounded-full px-3 py-1.5"
                >
                    <Star className="w-4 h-4 text-app-primary" />
                    <span
                        className="text-[13px] text-app-text font-semibold"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        {totalPuntos.toLocaleString("es-PY")} pts
                    </span>
                </div>
            </div>

            {/* Atalhos */}
            <div className="flex gap-2 mb-5">
                <Link
                    href="/app/progreso/extracto"
                    className="flex-1 bg-app-surface rounded-xl py-2.5 px-4 text-center text-[13px] font-semibold text-app-text-secondary"
                    style={{ fontFamily: "var(--font-raleway)" }}
                >
                    Extracto →
                </Link>
                <Link
                    href="/app/progreso/regalos"
                    className="flex-1 bg-app-primary rounded-xl py-2.5 px-4 text-center text-[13px] font-semibold text-white"
                    style={{ fontFamily: "var(--font-raleway)" }}
                >
                    Canjear Regalos →
                </Link>
            </div>

            {/* Lista de regras */}
            <div className="flex flex-col gap-3">
                {regras.map((regra) => {
                    const Icon = getIcon(regra.icone);
                    const isCompleted =
                        regra.estado === "completado_hoy" || regra.estado === "completado_siempre";
                    const isInProgress = regra.estado === "en_progreso";

                    return (
                        <div
                            key={regra.id}
                            className={`bg-app-surface rounded-2xl p-4 flex items-start gap-3 transition-opacity ${
                                isCompleted ? "opacity-60" : ""
                            }`}
                        >
                            {/* Icon */}
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isCompleted ? "bg-app-border-strong" : "bg-app-primary/10"
                                }`}
                            >
                                <Icon
                                    className={`w-5 h-5 ${
                                        isCompleted ? "text-app-text-secondary" : "text-app-primary"
                                    }`}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span
                                        className="text-[14px] text-app-text font-medium leading-5"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        {regra.nome}
                                    </span>
                                    <span
                                        className={`text-[13px] font-semibold flex-shrink-0 ${
                                            isCompleted ? "text-app-text-secondary" : "text-app-primary"
                                        }`}
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        +{regra.pontos} pts
                                    </span>
                                </div>

                                <p
                                    className="text-[12px] text-app-text-secondary leading-4 mb-1.5"
                                    style={{ fontFamily: "var(--font-raleway)" }}
                                >
                                    {regra.descricao}
                                </p>

                                {/* Estado visual */}
                                {isInProgress && regra.limite_diario != null && (
                                    <div className="flex flex-col gap-1">
                                        <div className="w-full h-2 bg-app-border-strong rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-app-primary rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (regra.progreso_hoy / regra.limite_diario) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-[11px] text-app-text-secondary"
                                            style={{ fontFamily: "var(--font-raleway)" }}
                                        >
                                            {regra.progreso_hoy}/{regra.limite_diario} hoy
                                        </span>
                                    </div>
                                )}

                                {regra.estado === "completado_hoy" && (
                                    <span
                                        className="text-[12px] text-app-text-secondary font-medium"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        Límite alcanzado
                                    </span>
                                )}

                                {regra.estado === "completado_siempre" && (
                                    <span
                                        className="text-[12px] text-app-primary font-medium flex items-center gap-1"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Completado
                                    </span>
                                )}

                                {regra.estado === "disponible" && regra.acao !== "compartilhou_catalogo" && (
                                    <span
                                        className="text-[12px] text-app-accent-brown font-medium"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        Ir →
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
