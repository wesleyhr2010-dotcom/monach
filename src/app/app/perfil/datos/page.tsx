"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera, Save, ImageIcon } from "lucide-react";
import { getPerfilCompleto, actualizarPerfilRevendedora } from "../actions";

export default function EditarDatosPage() {
    const router = useRouter();
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [form, setForm] = useState({
        name: "",
        whatsapp: "",
        avatar_url: "",
        endereco_cep: "",
        endereco_logradouro: "",
        endereco_numero: "",
        endereco_complemento: "",
        endereco_cidade: "",
        endereco_estado: "",
    });

    useEffect(() => {
        getPerfilCompleto()
            .then((p) => {
                setForm({
                    name: p.name,
                    whatsapp: p.whatsapp,
                    avatar_url: p.avatar_url || "",
                    endereco_cep: p.endereco_cep || "",
                    endereco_logradouro: p.endereco_logradouro || "",
                    endereco_numero: p.endereco_numero || "",
                    endereco_complemento: p.endereco_complemento || "",
                    endereco_cidade: p.endereco_cidade || "",
                    endereco_estado: p.endereco_estado || "",
                });
                setAvatarPreview(p.avatar_url || "");
                setLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Error al cargar perfil.");
                setLoading(false);
            });
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
        if (!avatarFile) return form.avatar_url || undefined;

        const fd = new FormData();
        fd.append("file", avatarFile);
        // Usar timestamp para evitar conflito de cache e nome estável
        const timestamp = Date.now();
        const safeName = form.name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30) || "user";
        fd.append("key", `resellers/${safeName}_${timestamp}/avatar.webp`);

        const res = await fetch("/api/upload-r2", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok || !data.url) {
            throw new Error(data.error || "Error al subir la foto. Intente nuevamente.");
        }

        return data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const avatarUrl = await uploadAvatar();
            await actualizarPerfilRevendedora({
                ...form,
                avatar_url: avatarUrl,
            });
            setSuccess(true);
            setTimeout(() => router.push("/app/perfil"), 1200);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F2EF] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: "#EBEBEB", borderTopColor: "#35605A" }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F2EF]">
            <div className="bg-white px-4 py-4 flex items-center gap-3 border-b border-[#E8E2D6] sticky top-0 z-10">
                <button onClick={() => router.push("/app/perfil")} className="p-1 -ml-1">
                    <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
                </button>
                <h1 className="text-base font-bold text-[#1A1A1A]">Editar Mis Datos</h1>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 max-w-lg mx-auto">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-700 text-sm rounded-xl p-3">¡Perfil actualizado!</div>
                )}

                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 rounded-full bg-[#F5F0E8] flex items-center justify-center overflow-hidden border-2 border-dashed border-[#D1C7B7]">
                        {avatarPreview ? (
                            <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                        ) : (
                            <Camera className="w-8 h-8 text-[#917961]" />
                        )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F0E8] text-[#35605A] text-xs font-medium active:scale-95 transition-transform"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            Cámara
                        </button>
                        <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F0E8] text-[#35605A] text-xs font-medium active:scale-95 transition-transform"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Galería
                        </button>
                    </div>

                    {/* Inputs invisíveis */}
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

                    <span className="text-xs text-[#6b7280] mt-2">Foto de perfil</span>
                </div>

                <Field label="Nombre completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} required />
                <Field label="Correo" value="" disabled placeholder="Para acceso y seguridad (solo lectura)" />

                <div className="pt-2">
                    <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Dirección</p>
                    <div className="space-y-3">
                        <Field label="CEP / Código postal" value={form.endereco_cep} onChange={(v) => setForm({ ...form, endereco_cep: v })} />
                        <Field label="Calle / Logradouro" value={form.endereco_logradouro} onChange={(v) => setForm({ ...form, endereco_logradouro: v })} />
                        <Field label="Número" value={form.endereco_numero} onChange={(v) => setForm({ ...form, endereco_numero: v })} />
                        <Field label="Complemento" value={form.endereco_complemento} onChange={(v) => setForm({ ...form, endereco_complemento: v })} />
                        <Field label="Ciudad" value={form.endereco_cidade} onChange={(v) => setForm({ ...form, endereco_cidade: v })} />
                        <Field label="Estado / Departamento" value={form.endereco_estado} onChange={(v) => setForm({ ...form, endereco_estado: v })} />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#2E5A4C] text-white font-medium py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Guardando..." : "Guardar cambios"}
                </button>
            </form>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    required,
    disabled,
    placeholder,
}: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="text-sm font-medium text-[#4b5563] mb-1.5 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                disabled={disabled}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 rounded-xl border border-[#E8E2D6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5A4C]/20 disabled:bg-[#F5F0E8] disabled:text-[#6b7280]"
            />
        </div>
    );
}
