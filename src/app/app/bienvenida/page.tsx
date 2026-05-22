"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Package, TrendingUp, Star, Bell, Camera, Phone, Landmark, ImageIcon, FileText, CheckCircle2 } from "lucide-react";
import { awardPrimeiroAcesso, completeOnboarding, getOnboardingStatus, aceitarContrato } from "./actions";
import { getContratoAtivo } from "@/app/admin/actions-config";

const slides = [
    {
        icon: <Package className="w-12 h-12 text-app-primary" />,
        title: "Tu consultora te envía una consignación",
        description: "Recibes una maleta con joyas para vender. Tienes un plazo para vender y devolver.",
    },
    {
        icon: <TrendingUp className="w-12 h-12 text-app-primary" />,
        title: "Registra tus ventas y gana comisión",
        description: "Cuanto más vendas, mayor es tu porcentaje de comisión.",
    },
    {
        icon: <Star className="w-12 h-12 text-app-primary" />,
        title: "Acumula puntos y canjea regalos",
        description: "Ganas puntos por cada venta, por devolver a tiempo y más.",
    },
];

function HowItWorksSlides({ onFinish, onBack }: { onFinish: () => void; onBack: () => void }) {
    const [slideIdx, setSlideIdx] = useState(0);

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex justify-center gap-2 mb-6">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${i === slideIdx ? "bg-app-primary" : "bg-app-border"}`}
                    />
                ))}
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <div className="bg-app-surface-warm rounded-2xl p-6 text-center transition-all">
                    <div className="flex justify-center mb-4">{slides[slideIdx].icon}</div>
                    <h3 className="font-semibold text-app-text mb-2">{slides[slideIdx].title}</h3>
                    <p className="text-sm text-app-text-secondary">{slides[slideIdx].description}</p>
                </div>
            </div>
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => {
                        if (slideIdx === 0) onBack();
                        else setSlideIdx(slideIdx - 1);
                    }}
                    className="text-app-text-secondary text-sm font-medium flex items-center gap-1"
                >
                    <ChevronLeft className="w-4 h-4" /> {slideIdx === 0 ? "Anterior" : "Atrás"}
                </button>
                <button
                    onClick={() => {
                        if (slideIdx === slides.length - 1) onFinish();
                        else setSlideIdx(slideIdx + 1);
                    }}
                    className="text-app-primary text-sm font-medium flex items-center gap-1"
                >
                    {slideIdx === slides.length - 1 ? "Siguiente" : "Siguiente"} <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function BienvenidaPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [pontosGanados, setPontosGanados] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [profile, setProfile] = useState({ id: "", whatsapp: "", avatar_url: "" });
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
    const [pontosPerfil, setPontosPerfil] = useState(0);
    const [contrato, setContrato] = useState<{ nome: string; url: string; obrigatorio: boolean } | null>(null);
    const [contratoAceito, setContratoAceito] = useState(false);

    useEffect(() => {
        getOnboardingStatus()
            .then((result) => {
                if (!result.success) {
                    setError(result.error || "Error");
                    setLoading(false);
                    return;
                }
                const status = result.data;
                setName(status.name);
                setProfile({
                    id: status.id,
                    whatsapp: status.whatsapp || "",
                    avatar_url: status.avatar_url || "",
                });
                // Se já tem maletas ou onboarding completo, redirecionar
                if (status.hasMaletas || status.onboarding_completo) {
                    router.replace("/app");
                    return;
                }
                // Fetch active contract
                getContratoAtivo()
                    .then((result) => {
                        if (result.success && result.data) {
                            setContrato(result.data);
                        }
                    })
                    .catch(() => {});
                // Award primeiro acesso
                awardPrimeiroAcesso()
                    .then((result) => {
                        if (result.awarded) {
                            setPontosGanados(result.pontos);
                        } else {
                            setPontosGanados(result.pontos);
                        }
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
            })
            .catch(() => {
                setError("Error de conexión. Por favor, intenta de nuevo.");
                setLoading(false);
            });
    }, [router]);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotifPermission(Notification.permission);
        }
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async (): Promise<string | undefined> => {
        if (!avatarFile) return profile.avatar_url || undefined;
        const formData = new FormData();
        formData.append("file", avatarFile);
        const timestamp = Date.now();
        formData.append("key", `resellers/${profile.id}/${timestamp}_avatar.webp`);
        const res = await fetch("/api/upload-r2", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || !data.url) {
            throw new Error(data.error || "Error al subir la foto.");
        }
        return data.url;
    };

    const handleAceitarContrato = async () => {
        setSaving(true);
        try {
            await aceitarContrato();
            setContratoAceito(true);
            setStep(4);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async (skipProfile = false, skipPush = false) => {
        setSaving(true);
        try {
            let avatarUrl: string | undefined = profile.avatar_url;
            if (!skipProfile && avatarFile) {
                avatarUrl = await uploadAvatar();
            }

            const result = await completeOnboarding(
                skipProfile
                    ? undefined
                    : {
                          whatsapp: profile.whatsapp || undefined,
                          avatar_url: avatarUrl || undefined,
                      }
            );

            setPontosPerfil(result.pontosPerfil);

            if (skipPush || notifPermission === "granted") {
                // Ir direto para tela final
                setStep(6);
            } else {
                setStep(5); // Tela de notificaciones
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const requestPushPermission = async () => {
        if ("Notification" in window) {
            const perm = await Notification.requestPermission();
            setNotifPermission(perm);
        }
        setStep(6);
    };

    const goToDashboard = () => {
        router.push("/app");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-app-card-bg flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] animate-spin border-app-surface border-t-app-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-app-card-bg flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-red-500 text-sm font-medium mb-3">
                        Ocurrió un error al cargar tu perfil.
                    </p>
                    <button onClick={() => window.location.reload()} className="text-sm text-app-primary font-medium hover:underline">
                        Intentar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-card-bg flex flex-col">
            {/* Progress dots */}
            {step > 1 && step < 6 && (
                <div className="flex justify-center gap-2 pt-6 pb-2">
                    {[2, 3, 4, 5].map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-colors ${step >= s ? "bg-app-primary" : "bg-app-border"}`}
                        />
                    ))}
                </div>
            )}

            {/* Step 0/1: Welcome */}
            {(step === 0 || step === 1) && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="mb-6">
                        <div className="text-5xl mb-4">🎉</div>
                        <h1 className="text-2xl font-bold text-app-text mb-2">
                            ¡Bienvenida, {name.split(" ")[0]}!
                        </h1>
                        <p className="text-app-text-secondary text-sm">
                            Eres parte del equipo Monarca Semijoyas.
                        </p>
                    </div>

                    <div className="bg-app-surface-warm rounded-2xl p-5 w-full max-w-sm mb-8">
                        <div className="flex items-center gap-3 justify-center">
                            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                            <span className="text-lg font-bold text-app-text">+{pontosGanados} puntos</span>
                        </div>
                        <p className="text-sm text-app-text-secondary mt-1">Por tu primer ingreso</p>
                    </div>

                    <div className="text-left w-full max-w-sm mb-8 space-y-2 text-sm text-app-text-dim">
                        <p>Desde aquí podrás:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Ver tu consignación de joyas</li>
                            <li>Registrar tus ventas</li>
                            <li>Ganar puntos y canjearlos por regalos</li>
                            <li>Compartir el catálogo con tus clientes</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full max-w-sm bg-app-primary text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                    >
                        Comenzar tour →
                    </button>
                </div>
            )}

            {/* Step 2: How it works */}
            {step === 2 && (
                <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
                    <h2 className="text-xl font-bold text-center mb-6">¿Cómo funciona Monarca?</h2>
                    <HowItWorksSlides onFinish={() => setStep(3)} onBack={() => setStep(1)} />
                </div>
            )}

            {/* Step 3: Contract */}
            {step === 3 && contrato && (
                <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
                    <h2 className="text-xl font-bold text-center mb-2">Contrato</h2>
                    <p className="text-center text-sm text-app-text-secondary mb-6">
                        Antes de continuar, revisá el contrato de revendedora.
                    </p>

                    <div className="bg-app-surface-warm rounded-2xl p-5 max-w-sm mx-auto w-full mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-6 h-6 text-app-primary" />
                            <span className="font-medium text-app-text">{contrato.nome}</span>
                        </div>
                        <a
                            href={contrato.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-app-primary font-medium underline"
                        >
                            Ver contrato PDF →
                        </a>
                    </div>

                    <div className="max-w-sm mx-auto w-full">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={contratoAceito}
                                onChange={(e) => setContratoAceito(e.target.checked)}
                                className="mt-1"
                            />
                            <span className="text-sm text-app-text-dim">
                                He leído y acepto los términos del contrato
                            </span>
                        </label>
                    </div>

                    <div className="mt-auto pt-6 max-w-sm mx-auto w-full space-y-3">
                        <button
                            onClick={handleAceitarContrato}
                            disabled={saving || (contrato.obrigatorio && !contratoAceito)}
                            className="w-full bg-app-primary text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {saving ? "Guardando..." : "Aceptar y continuar →"}
                        </button>
                        {!contrato.obrigatorio && (
                            <button
                                onClick={() => setStep(4)}
                                className="w-full text-app-text-secondary text-sm font-medium py-2"
                            >
                                Completar más tarde
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3 (skip): If no contract, jump to profile */}
            {step === 3 && !contrato && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-16 h-16 bg-app-surface-warm rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-app-primary" />
                    </div>
                    <p className="text-sm text-app-text-secondary mb-6">No hay contrato activo en este momento.</p>
                    <button
                        onClick={() => setStep(4)}
                        className="w-full max-w-sm bg-app-primary text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                    >
                        Continuar →
                    </button>
                </div>
            )}

            {/* Step 4: Profile */}
            {step === 4 && (
                <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
                    <h2 className="text-xl font-bold text-center mb-1">Completa tu perfil</h2>
                    <p className="text-center text-sm text-app-text-secondary mb-6">+100 pts si completas todos los datos</p>

                    <div className="space-y-4 max-w-sm mx-auto w-full">
                        {/* Avatar */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full bg-app-surface-warm flex items-center justify-center overflow-hidden border-2 border-dashed border-app-border">
                                {avatarPreview || profile.avatar_url ? (
                                    <Image
                                        src={avatarPreview || profile.avatar_url}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Camera className="w-8 h-8 text-app-accent-brown" />
                                )}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-surface-warm text-app-primary text-xs font-medium active:scale-95 transition-transform"
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    Cámara
                                </button>
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-surface-warm text-app-primary text-xs font-medium active:scale-95 transition-transform"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Galería
                                </button>
                            </div>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <span className="text-xs text-app-text-secondary mt-2">Foto de perfil</span>
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <label className="text-sm font-medium text-app-text-dim flex items-center gap-1 mb-1.5">
                                <Phone className="w-4 h-4" /> WhatsApp
                            </label>
                            <input
                                type="tel"
                                value={profile.whatsapp}
                                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                                placeholder="+595 981 000 000"
                                className="w-full px-4 py-3 rounded-xl border border-app-border bg-app-card-bg text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/20"
                            />
                        </div>

                        {/* Dados bancarios hint */}
                        <div className="bg-app-surface-warm rounded-xl p-3 flex items-start gap-2">
                            <Landmark className="w-4 h-4 text-app-accent-brown mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-app-text-secondary">
                                Podrás agregar tus datos bancarios más tarde desde <strong>Perfil &gt; Datos Bancarios</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 max-w-sm mx-auto w-full space-y-3">
                        <button
                            onClick={() => handleComplete(false)}
                            disabled={saving}
                            className="w-full bg-app-primary text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : "Guardar y continuar →"}
                        </button>
                        <button
                            onClick={() => handleComplete(true)}
                            disabled={saving}
                            className="w-full text-app-text-secondary text-sm font-medium py-2"
                        >
                            Completar más tarde
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Push Notifications */}
            {step === 5 && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-16 h-16 bg-app-surface-warm rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-app-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-app-text mb-2">Activa las notificaciones</h2>
                    <p className="text-sm text-app-text-secondary mb-6 max-w-xs">
                        Recibe alertas cuando:
                    </p>
                    <ul className="text-left text-sm text-app-text-dim space-y-2 mb-8 max-w-xs w-full">
                        <li className="flex items-center gap-2">• Tu nueva consignación llegue</li>
                        <li className="flex items-center gap-2">• Tu plazo esté próximo a vencer</li>
                        <li className="flex items-center gap-2">• Confirmen tu devolución</li>
                        <li className="flex items-center gap-2">• Ganes puntos y regalos</li>
                    </ul>

                    <div className="w-full max-w-sm space-y-3">
                        <button
                            onClick={requestPushPermission}
                            className="w-full bg-app-primary text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                        >
                            Activar notificaciones
                        </button>
                        <button
                            onClick={() => setStep(6)}
                            className="w-full text-app-text-secondary text-sm font-medium py-2"
                        >
                            Ahora no — activar después
                        </button>
                    </div>
                </div>
            )}

            {/* Step 6: Final */}
            {step === 6 && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-app-text mb-6">¡Todo listo!</h2>

                    <div className="bg-app-surface-warm rounded-2xl p-5 w-full max-w-sm mb-8 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-app-text-dim">⭐ Primer acceso</span>
                            <span className="font-semibold text-app-text">+{pontosGanados} pts</span>
                        </div>
                        {pontosPerfil > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-app-text-dim">⭐ Perfil completo</span>
                                <span className="font-semibold text-app-text">+{pontosPerfil} pts</span>
                            </div>
                        )}
                        <div className="border-t border-app-border pt-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-app-text">Tu saldo actual:</span>
                            <span className="font-bold text-app-primary">{pontosGanados + pontosPerfil} puntos</span>
                        </div>
                    </div>

                    <button
                        onClick={goToDashboard}
                        className="w-full max-w-sm bg-app-primary text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                    >
                        Ir al Dashboard →
                    </button>
                </div>
            )}
        </div>
    );
}
