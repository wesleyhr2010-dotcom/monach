"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarBrinde } from "../actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function NuevoBrindePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imagemUrl, setImagemUrl] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            nome: formData.get("nome") as string,
            descricao: (formData.get("descricao") as string) || "",
            imagem_url: imagemUrl,
            custo_pontos: Number(formData.get("custo_pontos")),
            estoque: Number(formData.get("estoque")),
            ativo: formData.get("ativo") === "on",
        };

        try {
            await criarBrinde(data);
            router.push("/admin/brindes");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al crear brinde.");
            setLoading(false);
        }
    }

    return (
        <div className="admin-content">
            <AdminPageHeader
                title="Nuevo Brinde"
                backHref="/admin/brindes"
            />

            {error && (
                <div className="admin-alert" style={{ background: "#3a1f1f", color: "#e74c3c", padding: 12, borderRadius: 8, marginBottom: 20 }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 18 }}>
                <FormField label="Nombre" name="nome" type="text" required />
                <FormField label="Descripción" name="descricao" type="textarea" />

                {/* Imagem */}
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#ccc", marginBottom: 6 }}>
                        Imagen URL
                    </label>
                    <input
                        type="url"
                        value={imagemUrl}
                        onChange={(e) => setImagemUrl(e.target.value)}
                        placeholder="https://..."
                        required
                        style={inputStyle}
                    />
                    {imagemUrl && (
                        <img
                            src={imagemUrl}
                            alt="Preview"
                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginTop: 8, background: "#2a2a2a" }}
                        />
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <FormField label="Costo en puntos" name="custo_pontos" type="number" min={1} required />
                    <FormField label="Stock (-1 = ilimitado)" name="estoque" type="number" min={-1} required />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#ccc", cursor: "pointer" }}>
                    <input type="checkbox" name="ativo" defaultChecked style={{ width: 18, height: 18 }} />
                    Activo (visible para revendedoras)
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "14px 24px",
                        background: "#35605A",
                        color: "#fff",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 600,
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1,
                        marginTop: 8,
                    }}
                >
                    {loading ? "Guardando..." : "Crear Brinde"}
                </button>
            </form>
        </div>
    );
}

function FormField({ label, name, type, required, min }: { label: string; name: string; type: string; required?: boolean; min?: number }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#ccc", marginBottom: 6 }}>
                {label}
            </label>
            {type === "textarea" ? (
                <textarea name={name} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            ) : (
                <input name={name} type={type} required={required} min={min} style={inputStyle} />
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    outline: "none",
};
