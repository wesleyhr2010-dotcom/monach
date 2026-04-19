"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { LogoMonarca } from "@/components/LogoMonarca";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FormField } from "@/components/ui/FormField";

type FormState = "idle" | "loading" | "success";

export default function RecuperarContrasenaPage() {
    const [email, setEmail] = useState("");
    const [state, setState] = useState<FormState>("idle");
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("El correo es obligatorio.");
            return;
        }

        setState("loading");

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/app/nueva-contrasena`,
        });

        if (supabaseError && supabaseError.message.toLowerCase().includes("rate")) {
            setState("idle");
            setError("Demasiados intentos. Esperá 15 minutos antes de intentar nuevamente.");
            return;
        }

        setState("success");
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
                            ¡Correo enviado!
                        </h2>

                        <p className="text-[13px] text-[#555555] leading-relaxed mb-1">
                            Revisá tu bandeja de entrada. Enviamos el enlace a:
                        </p>
                        <p className="text-[14px] font-semibold text-[#1A1A1A] mb-5">
                            {email.trim()}
                        </p>

                        <p className="text-[12px] text-[#999999] leading-relaxed mb-7">
                            Si no lo ves, revisá la carpeta de Spam o Correo no deseado.
                        </p>

                        <Link
                            href="/app/login"
                            className="w-full flex justify-center items-center py-4 rounded-full border border-[#35605A] text-[#35605A] font-semibold text-sm hover:bg-[#35605A]/5 transition-colors"
                        >
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[#F5F2EF] font-['Raleway',sans-serif] antialiased text-[#777777]">
            <div className="w-full max-w-[448px] mx-auto px-6 pt-[52px]">
                <Link
                    href="/app/login"
                    className="flex items-center gap-[6px] text-[#777777] text-[14px] font-medium self-start"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Volver
                </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-5 w-full max-w-[448px] mx-auto px-6 pb-[40px]">

                <LogoMonarca className="mb-12" />

                <div className="flex flex-col gap-2">
                    <h2 className="font-['Playfair_Display',serif] font-semibold text-[20px] text-[#1A1A1A] leading-7 tracking-[-0.3px]">
                        Recuperar contraseña
                    </h2>
                    <p className="text-[13px] leading-5">
                        Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <FormField
                        id="email"
                        label="Correo electrónico"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        disabled={state === "loading"}
                    />

                    <PrimaryButton
                        label="Enviar enlace de recuperación"
                        loadingLabel="Enviando..."
                        loading={state === "loading"}
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
