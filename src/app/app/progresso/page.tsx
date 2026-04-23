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
        <div className="flex flex-col px-5 py-6 bg-[#F5F2EF] min-h-[100dvh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1
                    className="text-[20px] text-[#1A1A1A] leading-7 tracking-[-0.3px]"
                    style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
                >
                    Cómo Ganar Puntos
                </h1>
                <div
                    className="flex items-center gap-1.5 bg-[#EBEBEB] rounded-full px-3 py-1.5"
                >
                    <Star className="w-4 h-4 text-[#35605A]" />
                    <span
                        className="text-[13px] text-[#1A1A1A] font-semibold"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        {totalPuntos.toLocaleString("es-PY")} pts
                    </span>
                </div>
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
                            className={`bg-[#EBEBEB] rounded-2xl p-4 flex items-start gap-3 transition-opacity ${
                                isCompleted ? "opacity-60" : ""
                            }`}
                        >
                            {/* Icon */}
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isCompleted ? "bg-[#D9D6D2]" : "bg-[#35605A]/10"
                                }`}
                            >
                                <Icon
                                    className={`w-5 h-5 ${
                                        isCompleted ? "text-[#777777]" : "text-[#35605A]"
                                    }`}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span
                                        className="text-[14px] text-[#1A1A1A] font-medium leading-5"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        {regra.nome}
                                    </span>
                                    <span
                                        className={`text-[13px] font-semibold flex-shrink-0 ${
                                            isCompleted ? "text-[#777777]" : "text-[#35605A]"
                                        }`}
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        +{regra.pontos} pts
                                    </span>
                                </div>

                                <p
                                    className="text-[12px] text-[#777777] leading-4 mb-1.5"
                                    style={{ fontFamily: "var(--font-raleway)" }}
                                >
                                    {regra.descricao}
                                </p>

                                {/* Estado visual */}
                                {isInProgress && regra.limite_diario != null && (
                                    <div className="flex flex-col gap-1">
                                        <div className="w-full h-2 bg-[#D9D6D2] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#35605A] rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (regra.progreso_hoy / regra.limite_diario) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-[11px] text-[#777777]"
                                            style={{ fontFamily: "var(--font-raleway)" }}
                                        >
                                            {regra.progreso_hoy}/{regra.limite_diario} hoy
                                        </span>
                                    </div>
                                )}

                                {regra.estado === "completado_hoy" && (
                                    <span
                                        className="text-[12px] text-[#777777] font-medium"
                                        style={{ fontFamily: "var(--font-raleway)" }}
                                    >
                                        Límite alcanzado
                                    </span>
                                )}

                                {regra.estado === "completado_siempre" && (
                                    <span
                                        className="text-[12px] text-[#35605A] font-medium flex items-center gap-1"
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
                                        className="text-[12px] text-[#917961] font-medium"
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
