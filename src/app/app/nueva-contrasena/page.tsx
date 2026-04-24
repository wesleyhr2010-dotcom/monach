"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { LogoMonarca } from "@/components/LogoMonarca";
import { PasswordField } from "@/components/ui/PasswordField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type FormState = "idle" | "loading" | "success";
type VerifyState = "verifying" | "verified" | "error";

export default function NuevaContrasenaPage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [state, setState] = useState<FormState>("idle");
    const [verifyState, setVerifyState] = useState<VerifyState>("verifying");
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // PKCE flow: trocar code da URL por sessão
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
                if (error) {
                    console.error("[NuevaContrasena] exchangeCodeForSession error:", error.message);
                    setVerifyState("error");
                    setError(`El enlace puede haber vencido. (${error.message})`);
                } else if (data.session) {
                    console.log("[NuevaContrasena] Session established via PKCE");
                    setVerifyState("verified");
                } else {
                    setVerifyState("error");
                    setError("El enlace puede haber vencido. Solicitá uno nuevo.");
                }
            });
        } else {
            supabase.auth.getSession().then(({ data }) => {
                if (!data.session) {
                    setVerifyState("error");
                    setError("El enlace puede haber vencido. Solicitá uno nuevo.");
                } else {
                    setVerifyState("verified");
                }
            });
        }
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setState("loading");

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            console.error("[NuevaContrasena] updateUser error:", updateError.message);
            setState("idle");
            setError(`Error: ${updateError.message}`);
            return;
        }

        setState("success");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = "/app";
        }, 2000);
    }

    if (state === "success") {
        return (
            <div className="flex flex-col min-h-[100dvh] bg-[#F5F2EF] font-['Raleway',sans-serif] antialiased">
                <div className="flex flex-col justify-center flex-1 py-10 px-6 max-w-md mx-auto w-full">
                    <LogoMonarca className="mb-10" />

                    <div className="bg-[#EBEBEB] rounded-3xl p-8 flex flex-col items-center text-center">
                        <div className="size-14 rounded-full bg-[#35605A] flex items-center justify-center mb-5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h2 className="font-['Playfair_Display',serif] font-bold text-xl text-[#1A1A1A] tracking-tight mb-3">
                            ¡Contraseña actualizada!
                        </h2>

                        <p className="text-[13px] text-[#555555] leading-relaxed mb-7">
                            Tu contraseña fue cambiada exitosamente. Te redirigimos al portal...
                        </p>

                        <Link
                            href="/app"
                            className="w-full flex justify-center items-center py-4 rounded-full border border-[#35605A] text-[#35605A] font-semibold text-sm hover:bg-[#35605A]/5 transition-colors"
                        >
                            Ir al inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[#F5F2EF] font-['Raleway',sans-serif] antialiased text-[#777777]">
            <div className="flex-1 flex flex-col justify-center gap-5 w-full max-w-[448px] mx-auto px-6 pb-[40px] pt-[52px]">

                <LogoMonarca className="mb-12" />

                <div className="flex flex-col gap-2">
                    <h2 className="font-['Playfair_Display',serif] font-semibold text-[20px] text-[#1A1A1A] leading-7 tracking-[-0.3px]">
                        Crear nueva contraseña
                    </h2>
                    <p className="text-[13px] leading-5">
                        Definí una nueva contraseña para tu cuenta.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    {verifyState === "verifying" && (
                        <p className="text-[13px] text-[#6A9A8A] text-center">
                            Verificando enlace...
                        </p>
                    )}

                    <PasswordField
                        id="password"
                        label="Nueva contraseña"
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        disabled={state === "loading" || verifyState !== "verified"}
                    />

                    <PasswordField
                        id="confirm"
                        label="Confirmar contraseña"
                        placeholder="Repetí la contraseña"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                        disabled={state === "loading" || verifyState !== "verified"}
                    />

                    <PrimaryButton
                        label="Guardar nueva contraseña"
                        loadingLabel="Guardando..."
                        loading={state === "loading"}
                        disabled={state === "loading" || verifyState !== "verified"}
                    />
                </form>

                <div className="flex justify-center">
                    <Link href="/app/login" className="text-[#917961] text-[13px] hover:underline">
                        ← Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
