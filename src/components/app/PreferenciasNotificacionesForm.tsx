"use client";

import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Package,
    AlertTriangle,
    XCircle,
    CheckCircle,
    Gift,
    Star,
    Bell,
    ChevronLeft,
    Check,
    Loader2,
} from "lucide-react";
import { actualizarPreferenciasNotificaciones } from "@/app/app/perfil/actions";

export type PreferenciasNotificaciones = {
    nova_maleta: boolean;
    prazo_proximo: boolean;
    maleta_atrasada: boolean;
    acerto_confirmado: boolean;
    brinde_entregue: boolean;
    pontos_ganhos: boolean;
};

const NOTIFICACIONES_CONFIG: {
    key: keyof PreferenciasNotificaciones;
    icon: React.ReactNode;
    label: string;
    description: string;
}[] = [
    {
        key: "nova_maleta",
        icon: <Package className="w-5 h-5" />,
        label: "Nueva Consignación",
        description: "Cuando recibas una nueva consignación",
    },
    {
        key: "prazo_proximo",
        icon: <AlertTriangle className="w-5 h-5" />,
        label: "Plazo Próximo",
        description: "2 días antes del vencimiento",
    },
    {
        key: "maleta_atrasada",
        icon: <XCircle className="w-5 h-5" />,
        label: "Consignación Atrasada",
        description: "Cuando la consignación esté vencida",
    },
    {
        key: "acerto_confirmado",
        icon: <CheckCircle className="w-5 h-5" />,
        label: "Acerto Confirmado",
        description: "Cuando la consultora confirme el acerto",
    },
    {
        key: "brinde_entregue",
        icon: <Gift className="w-5 h-5" />,
        label: "Entrega de Regalo",
        description: "Cuando tu regalo sea entregado",
    },
    {
        key: "pontos_ganhos",
        icon: <Star className="w-5 h-5" />,
        label: "Puntos Ganados",
        description: "Cada vez que ganes puntos",
    },
];

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5A4C]"
            style={{ backgroundColor: checked ? "#2E5A4C" : "#E8E2D6" }}
        >
            <span
                className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                style={{
                    transform: checked ? "translateX(22px)" : "translateX(4px)",
                }}
            />
        </button>
    );
}

export default function PreferenciasNotificacionesForm({
    initialPrefs,
}: {
    initialPrefs: PreferenciasNotificaciones;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [prefs, setPrefs] = useState<PreferenciasNotificaciones>(initialPrefs);
    const [optimisticPrefs, setOptimisticPrefs] = useOptimistic(prefs);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [pushStatus, setPushStatus] = useState<"active" | "inactive" | "unsupported">("unsupported");

    // Detectar status do OneSignal
    useEffect(() => {
        const checkPush = async () => {
            try {
                const OneSignal = (window as unknown as Record<string, unknown>).OneSignal;
                if (!OneSignal) {
                    setPushStatus("unsupported");
                    return;
                }
                const optedIn = await (OneSignal as { User?: { PushSubscription?: { optedIn?: boolean } } }).User?.PushSubscription?.optedIn;
                setPushStatus(optedIn ? "active" : "inactive");
            } catch {
                setPushStatus("unsupported");
            }
        };
        checkPush();
    }, []);

    const saveToServer = useCallback(
        async (next: PreferenciasNotificaciones) => {
            setSaveStatus("saving");
            try {
                await actualizarPreferenciasNotificaciones(next);
                setSaveStatus("saved");
                // Reset para idle após 2s
                setTimeout(() => setSaveStatus("idle"), 2000);
            } catch {
                setSaveStatus("idle");
            }
        },
        []
    );

    // Auto-save com debounce de 500ms
    useEffect(() => {
        const timer = setTimeout(() => {
            // Só salva se houver diferença do initial (ou sempre, é idempotente)
            startTransition(() => {
                saveToServer(prefs);
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [prefs, saveToServer]);

    const handleToggle = (key: keyof PreferenciasNotificaciones) => {
        const next = { ...optimisticPrefs, [key]: !optimisticPrefs[key] };
        setOptimisticPrefs(next);
        setPrefs(next);
    };

    return (
        <div className="flex flex-col min-h-full bg-[#F5F2EF]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-4 bg-[#F5F2EF]">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-[#E8E2D6] transition-colors"
                    aria-label="Volver"
                >
                    <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
                </button>
                <h1 className="text-base font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-raleway), Raleway, sans-serif" }}>
                    Notificaciones Push
                </h1>
            </div>

            {/* Descrição */}
            <p className="px-5 pb-4 text-sm text-[#6b7280]">
                Controla qué notificaciones recibirás en tu teléfono.
            </p>

            {/* Lista de preferências */}
            <div className="px-4 pb-4 space-y-2">
                {NOTIFICACIONES_CONFIG.map((config) => {
                    const isOn = optimisticPrefs[config.key];
                    return (
                        <div
                            key={config.key}
                            className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl"
                        >
                            <span className="text-[#917961] shrink-0">{config.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1A1A1A]">{config.label}</p>
                                <p className="text-xs text-[#6b7280] mt-0.5">{config.description}</p>
                            </div>
                            <ToggleSwitch
                                checked={isOn}
                                onChange={() => handleToggle(config.key)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Status do push */}
            <div className="px-4 pb-4">
                <div className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl">
                    <Bell className="w-5 h-5 text-[#917961] shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">Estado del push</p>
                        <p className="text-xs text-[#6b7280] mt-0.5">
                            {pushStatus === "active" && "Notificaciones activas en este dispositivo"}
                            {pushStatus === "inactive" && "Notificaciones desactivadas. Actívalas en ajustes."}
                            {pushStatus === "unsupported" && "Solo disponible en la app instalada (PWA)."}
                        </p>
                    </div>
                    <span
                        className="inline-flex items-center gap-1 text-xs font-medium shrink-0"
                        style={{ color: pushStatus === "active" ? "#2E5A4C" : "#6b7280" }}
                    >
                        {pushStatus === "active" && (
                            <>
                                <Check className="w-3.5 h-3.5" /> Activo
                            </>
                        )}
                        {pushStatus === "inactive" && "Inactivo"}
                        {pushStatus === "unsupported" && "N/A"}
                    </span>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status de salvamento */}
            <div className="px-5 pb-6 text-center">
                {saveStatus === "saving" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#6b7280]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                    </span>
                )}
                {saveStatus === "saved" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#2E5A4C]">
                        <Check className="w-3.5 h-3.5" />
                        Guardado
                    </span>
                )}
                {saveStatus === "idle" && isPending && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#6b7280]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                    </span>
                )}
            </div>
        </div>
    );
}
