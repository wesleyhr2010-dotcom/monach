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
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
    const [optedIn, setOptedIn] = useState<boolean>(false);
    const [isToggling, setIsToggling] = useState(false);
    const [pushError, setPushError] = useState<string | null>(null);

    type OneSignalLike = {
        Notifications?: {
            requestPermission?: () => Promise<boolean>;
            permission?: boolean;
        };
        User?: {
            PushSubscription?: {
                optedIn?: boolean | Promise<boolean>;
                optIn?: () => Promise<void>;
                optOut?: () => Promise<void>;
            };
        };
    };

    const refreshPushState = useCallback(async () => {
        try {
            if (typeof Notification === "undefined") {
                setPermission("unsupported");
                return;
            }
            setPermission(Notification.permission);
            const OneSignal = (window as unknown as { OneSignal?: OneSignalLike }).OneSignal;
            const sub = OneSignal?.User?.PushSubscription;
            if (sub && "optedIn" in sub) {
                const v = await Promise.resolve(sub.optedIn);
                setOptedIn(Boolean(v));
            } else {
                setOptedIn(false);
            }
        } catch {
            // mantém último estado conhecido
        }
    }, []);

    useEffect(() => {
        refreshPushState();
    }, [refreshPushState]);

    const withTimeout = <T,>(p: Promise<T> | undefined, ms: number, label: string): Promise<T | "timeout"> => {
        if (!p) return Promise.resolve("timeout");
        return Promise.race<T | "timeout">([
            p,
            new Promise<"timeout">((resolve) => setTimeout(() => {
                console.warn(`[push] ${label} timed out after ${ms}ms`);
                resolve("timeout");
            }, ms)),
        ]);
    };

    const handleEnablePush = async () => {
        // No iOS PWA a prompt nativa só aparece dentro do mesmo "user gesture" do click.
        // Por isso disparamos Notification.requestPermission() ANTES de qualquer await,
        // setState ou navegação por wrapper do OneSignal — caso contrário o iOS perde o gesto.
        setPushError(null);
        const initialPermission = typeof Notification !== "undefined" ? Notification.permission : "denied";

        let permissionPromise: Promise<NotificationPermission> | null = null;
        if (initialPermission === "default" && typeof Notification !== "undefined" && Notification.requestPermission) {
            try {
                permissionPromise = Notification.requestPermission();
            } catch (err) {
                console.error("[push] Notification.requestPermission threw:", err);
            }
        }

        setIsToggling(true);
        try {
            const OneSignal = (window as unknown as { OneSignal?: OneSignalLike }).OneSignal;
            if (!OneSignal?.User?.PushSubscription) {
                setPushError("Instalá la app (Compartir → Añadir a pantalla de inicio) para activar los avisos push.");
                return;
            }

            if (permissionPromise) {
                const result = await withTimeout(permissionPromise, 30_000, "requestPermission");
                if (result === "timeout") {
                    setPushError("La ventana de permisos no respondió. Cerrá la app y volvé a abrirla.");
                    return;
                }
            }

            const afterPromptPermission = typeof Notification !== "undefined" ? Notification.permission : initialPermission;
            if (afterPromptPermission === "granted" && OneSignal.User.PushSubscription.optIn) {
                await withTimeout(OneSignal.User.PushSubscription.optIn(), 15_000, "optIn");
            }

            await refreshPushState();

            if (afterPromptPermission === "denied") {
                setPushError("Tu teléfono bloqueó los avisos. Ve a Ajustes → Notificaciones → Monarca y actívalas. Si no aparece la app, eliminá la PWA y reinstalala desde Compartir.");
            } else if (afterPromptPermission === "default") {
                setPushError("iOS no mostró la ventana de permisos. Eliminá la PWA de la pantalla de inicio y volvé a instalarla — así iOS resetea el estado de avisos.");
            }
        } catch (err) {
            console.error("[push] handleEnablePush error:", err);
            setPushError(err instanceof Error ? err.message : "No se pudo activar el push.");
        } finally {
            setIsToggling(false);
        }
    };

    const handleDisablePush = async () => {
        setPushError(null);
        setIsToggling(true);
        try {
            const OneSignal = (window as unknown as { OneSignal?: OneSignalLike }).OneSignal;
            if (OneSignal?.User?.PushSubscription?.optOut) {
                await withTimeout(OneSignal.User.PushSubscription.optOut(), 15_000, "optOut");
            }
            await refreshPushState();
        } catch (err) {
            console.error("[push] handleDisablePush error:", err);
            setPushError(err instanceof Error ? err.message : "No se pudo desactivar el push.");
        } finally {
            setIsToggling(false);
        }
    };

    const pushUiState: "unsupported" | "default" | "denied" | "granted-off" | "granted-on" =
        permission === "unsupported"
            ? "unsupported"
            : permission === "denied"
                ? "denied"
                : permission === "default"
                    ? "default"
                    : optedIn
                        ? "granted-on"
                        : "granted-off";

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
                <div className="flex flex-col gap-3 px-4 py-3.5 bg-white rounded-xl">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[#917961] shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[#1A1A1A]">Estado del push</p>
                            <p className="text-xs text-[#6b7280] mt-0.5">
                                {pushUiState === "granted-on" && "Notificaciones activas en este dispositivo."}
                                {pushUiState === "granted-off" && "Permiso concedido, pero los avisos están pausados."}
                                {pushUiState === "default" && "Aún no decidiste sobre los avisos en este dispositivo."}
                                {pushUiState === "denied" && "Tu teléfono bloqueó los avisos para esta app."}
                                {pushUiState === "unsupported" && "Solo disponible en la app instalada (PWA). Toca Compartir → Añadir a pantalla de inicio."}
                            </p>
                        </div>
                        <span
                            className="inline-flex items-center gap-1 text-xs font-medium shrink-0"
                            style={{ color: pushUiState === "granted-on" ? "#2E5A4C" : "#6b7280" }}
                        >
                            {pushUiState === "granted-on" && (
                                <>
                                    <Check className="w-3.5 h-3.5" /> Activo
                                </>
                            )}
                            {(pushUiState === "granted-off" || pushUiState === "default") && "Inactivo"}
                            {pushUiState === "denied" && "Bloqueado"}
                            {pushUiState === "unsupported" && "N/A"}
                        </span>
                    </div>

                    {(pushUiState === "default" || pushUiState === "granted-off") && (
                        <button
                            type="button"
                            onClick={handleEnablePush}
                            disabled={isToggling}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E5A4C] px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
                        >
                            {isToggling ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Activando...
                                </>
                            ) : (
                                "Activar notificaciones"
                            )}
                        </button>
                    )}

                    {pushUiState === "granted-on" && (
                        <button
                            type="button"
                            onClick={handleDisablePush}
                            disabled={isToggling}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors disabled:opacity-60"
                        >
                            {isToggling ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                "Desactivar en este dispositivo"
                            )}
                        </button>
                    )}

                    {pushUiState === "denied" && (
                        <div className="rounded-lg bg-[#F5F2EF] px-3 py-2.5 text-xs text-[#1A1A1A] leading-relaxed">
                            Para reactivarlos, abrí <strong>Ajustes</strong> del teléfono → <strong>Notificaciones</strong> → <strong>Monarca</strong> y permití los avisos. Si no aparece la app en la lista, eliminá la PWA de la pantalla de inicio y volvé a instalarla desde Compartir.
                        </div>
                    )}

                    {pushError && (
                        <div className="rounded-lg bg-[#FDECEC] px-3 py-2 text-xs text-[#9A2A2A]">
                            {pushError}
                        </div>
                    )}
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
