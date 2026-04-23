"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Package, TrendingUp, Star, Bell, Camera, User, Phone, Landmark } from "lucide-react";
import { awardPrimeiroAcesso, completeOnboarding, getOnboardingStatus } from "./actions";

const slides = [
    {
        icon: <Package className="w-12 h-12 text-[#2E5A4C]" />,
        title: "Tu consultora te envía una consignación",
        description: "Recibes una maleta con joyas para vender. Tienes un plazo para vender y devolver.",
    },
    {
        icon: <TrendingUp className="w-12 h-12 text-[#2E5A4C]" />,
        title: "Registra tus ventas y gana comisión",
        description: "Cuanto más vendas, mayor es tu porcentaje de comisión.",
    },
    {
        icon: <Star className="w-12 h-12 text-[#2E5A4C]" />,
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
                        className={`w-2 h-2 rounded-full transition-colors ${i === slideIdx ? "bg-[#2E5A4C]" : "bg-[#E8E2D6]"}`}
                    />
                ))}
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <div className="bg-[#F5F0E8] rounded-2xl p-6 text-center transition-all">
                    <div className="flex justify-center mb-4">{slides[slideIdx].icon}</div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">{slides[slideIdx].title}</h3>
                    <p className="text-sm text-[#6b7280]">{slides[slideIdx].description}</p>
                </div>
            </div>
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => {
                        if (slideIdx === 0) onBack();
                        else setSlideIdx(slideIdx - 1);
                    }}
                    className="text-[#6b7280] text-sm font-medium flex items-center gap-1"
                >
                    <ChevronLeft className="w-4 h-4" /> {slideIdx === 0 ? "Anterior" : "Atrás"}
                </button>
                <button
                    onClick={() => {
                        if (slideIdx === slides.length - 1) onFinish();
                        else setSlideIdx(slideIdx + 1);
                    }}
                    className="text-[#2E5A4C] text-sm font-medium flex items-center gap-1"
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
    const [profile, setProfile] = useState({ whatsapp: "", avatar_url: "" });
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
    const [pontosPerfil, setPontosPerfil] = useState(0);

    useEffect(() => {
        getOnboardingStatus()
            .then((status) => {
                setName(status.name);
                // Se já tem maletas ou onboarding completo, redirecionar
                if (status.hasMaletas || status.onboarding_completo) {
                    router.replace("/app");
                    return;
                }
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
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Error");
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
        formData.append("path", `resellers/${name.replace(/\s+/g, "_")}/avatar.webp`);
        const res = await fetch("/api/upload-r2", { method: "POST", body: formData });
        const data = await res.json();
        return data.url || undefined;
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
                          avatar_url: avatarUrl,
                      }
            );

            setPontosPerfil(result.pontosPerfil);

            if (skipPush || notifPermission === "granted") {
                // Ir direto para tela final
                setStep(5);
            } else {
                setStep(4); // Tela final de conclusão
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
        setStep(5);
    };

    const goToDashboard = () => {
        router.push("/app");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "#EBEBEB", borderTopColor: "#35605A" }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-sm text-[#35605A] font-medium hover:underline">
                        Intentar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Progress dots */}
            {step > 0 && step < 5 && (
                <div className="flex justify-center gap-2 pt-6 pb-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-colors ${step >= s ? "bg-[#2E5A4C]" : "bg-[#E8E2D6]"}`}
                        />
                    ))}
                </div>
            )}

            {/* Step 0/1: Welcome */}
            {(step === 0 || step === 1) && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="mb-6">
                        <div className="text-5xl mb-4">🎉</div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                            ¡Bienvenida, {name.split(" ")[0]}!
                        </h1>
                        <p className="text-[#6b7280] text-sm">
                            Eres parte del equipo Monarca Semijoyas.
                        </p>
                    </div>

                    <div className="bg-[#F5F0E8] rounded-2xl p-5 w-full max-w-sm mb-8">
                        <div className="flex items-center gap-3 justify-center">
                            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                            <span className="text-lg font-bold text-[#1A1A1A]">+{pontosGanados} puntos</span>
                        </div>
                        <p className="text-sm text-[#6b7280] mt-1">Por tu primer ingreso</p>
                    </div>

                    <div className="text-left w-full max-w-sm mb-8 space-y-2 text-sm text-[#4b5563]">
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
                        className="w-full max-w-sm bg-[#2E5A4C] text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
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

            {/* Step 3: Profile */}
            {step === 3 && (
                <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
                    <h2 className="text-xl font-bold text-center mb-1">Completa tu perfil</h2>
                    <p className="text-center text-sm text-[#6b7280] mb-6">+100 pts si completas todos los datos</p>

                    <div className="space-y-4 max-w-sm mx-auto w-full">
                        {/* Avatar */}
                        <div className="flex flex-col items-center">
                            <label className="relative w-24 h-24 rounded-full bg-[#F5F0E8] flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[#D1C7B7]">
                                {avatarPreview || profile.avatar_url ? (
                                    <Image
                                        src={avatarPreview || profile.avatar_url}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Camera className="w-8 h-8 text-[#917961]" />
                                )}
                                <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarChange} />
                            </label>
                            <span className="text-xs text-[#6b7280] mt-2">Foto de perfil</span>
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <label className="text-sm font-medium text-[#4b5563] flex items-center gap-1 mb-1.5">
                                <Phone className="w-4 h-4" /> WhatsApp
                            </label>
                            <input
                                type="tel"
                                value={profile.whatsapp}
                                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                                placeholder="+595 981 000 000"
                                className="w-full px-4 py-3 rounded-xl border border-[#E8E2D6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5A4C]/20"
                            />
                        </div>

                        {/* Dados bancarios hint */}
                        <div className="bg-[#F5F0E8] rounded-xl p-3 flex items-start gap-2">
                            <Landmark className="w-4 h-4 text-[#917961] mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-[#6b7280]">
                                Podrás agregar tus datos bancarios más tarde desde <strong>Perfil &gt; Datos Bancarios</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 max-w-sm mx-auto w-full space-y-3">
                        <button
                            onClick={() => handleComplete(false)}
                            disabled={saving}
                            className="w-full bg-[#2E5A4C] text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : "Guardar y continuar →"}
                        </button>
                        <button
                            onClick={() => handleComplete(true)}
                            disabled={saving}
                            className="w-full text-[#6b7280] text-sm font-medium py-2"
                        >
                            Completar más tarde
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Push Notifications */}
            {step === 4 && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-16 h-16 bg-[#F5F0E8] rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-[#2E5A4C]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Activa las notificaciones</h2>
                    <p className="text-sm text-[#6b7280] mb-6 max-w-xs">
                        Recibe alertas cuando:
                    </p>
                    <ul className="text-left text-sm text-[#4b5563] space-y-2 mb-8 max-w-xs w-full">
                        <li className="flex items-center gap-2">• Tu nueva consignación llegue</li>
                        <li className="flex items-center gap-2">• Tu plazo esté próximo a vencer</li>
                        <li className="flex items-center gap-2">• Confirmen tu devolución</li>
                        <li className="flex items-center gap-2">• Ganes puntos y regalos</li>
                    </ul>

                    <div className="w-full max-w-sm space-y-3">
                        <button
                            onClick={requestPushPermission}
                            className="w-full bg-[#2E5A4C] text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                        >
                            Activar notificaciones
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            className="w-full text-[#6b7280] text-sm font-medium py-2"
                        >
                            Ahora no — activar después
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Final */}
            {step === 5 && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">¡Todo listo!</h2>

                    <div className="bg-[#F5F0E8] rounded-2xl p-5 w-full max-w-sm mb-8 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4b5563]">⭐ Primer acceso</span>
                            <span className="font-semibold text-[#1A1A1A]">+{pontosGanados} pts</span>
                        </div>
                        {pontosPerfil > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#4b5563]">⭐ Perfil completo</span>
                                <span className="font-semibold text-[#1A1A1A]">+{pontosPerfil} pts</span>
                            </div>
                        )}
                        <div className="border-t border-[#E8E2D6] pt-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-[#1A1A1A]">Tu saldo actual:</span>
                            <span className="font-bold text-[#2E5A4C]">{pontosGanados + pontosPerfil} puntos</span>
                        </div>
                    </div>

                    <button
                        onClick={goToDashboard}
                        className="w-full max-w-sm bg-[#2E5A4C] text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                    >
                        Ir al Dashboard →
                    </button>
                </div>
            )}
        </div>
    );
}
