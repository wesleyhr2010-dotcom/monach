"use client";

import { useState } from "react";
import { loginApp } from "@/lib/actions/auth";
import { LogoMonarca } from "@/components/LogoMonarca";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FormField } from "@/components/ui/FormField";
import { PasswordField } from "@/components/ui/PasswordField";

export default function AppLoginPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        const result = await loginApp(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
        // If no error, the login action will redirect
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[#F5F2EF] font-['Raleway',sans-serif] antialiased text-[#777777]">
            <div className="flex flex-col justify-center flex-1 py-10 px-6 max-w-md mx-auto w-full">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-12">
                    <LogoMonarca className="mb-4" />
                    <p className="text-[#777777] text-sm text-center">
                        Portal de revendedora
                    </p>
                </div>

                {/* Form */}
                <form action={handleSubmit} className="flex flex-col gap-5">
                    {/* Error Box */}
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl text-center">
                            {error}
                        </div>
                    )}

                    <FormField
                        id="email"
                        label="Correo electrónico"
                        type="email"
                        autoComplete="email"
                        placeholder="Ingresa tu acceso"
                        required
                    />

                    <PasswordField
                        id="password"
                        label="Contraseña"
                        autoComplete="current-password"
                        placeholder="Tu contraseña"
                        required
                    />

                    {/* Forgot Password */}
                    <div className="flex justify-end -mt-2">
                        <a href="/app/login/recuperar-contrasena" className="text-[#917961] text-[13px] hover:underline">
                            Olvidé mi contraseña
                        </a>
                    </div>

                    <PrimaryButton
                        label="Ingresar"
                        loadingLabel="Ingresando..."
                        loading={loading}
                    />
                </form>

                {/* Footer Link */}
                <div className="flex justify-center mt-12 text-center text-balance">
                    <a href="#" className="text-[#777777] text-[13px] hover:underline">
                        ¿Problemas? Habla con tu consultora por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}
