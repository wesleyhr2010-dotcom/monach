"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { atualizarBrinde } from "./actions";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { BrindeImageUploader } from "@/components/admin/BrindeImageUploader";

interface BrindeFormProps {
    brinde: {
        id: string;
        nome: string;
        descricao: string;
        imagem_url: string;
        custo_pontos: number;
        estoque: number;
        ativo: boolean;
    };
}

export function BrindeForm({ brinde }: BrindeFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imagemUrl, setImagemUrl] = useState(brinde.imagem_url);

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
            await atualizarBrinde(brinde.id, data);
            router.push("/admin/brindes");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al actualizar brinde.");
            setLoading(false);
        }
    }

    return (
        <>
            <AdminTopHeader breadcrumb="Brindes" backHref="/admin/brindes" title="Editar Brinde" />
            <div style={{ padding: "28px 32px" }}>
            {error && (
                <div style={{ background: "var(--admin-danger-15)", color: "var(--admin-danger)", padding: 12, borderRadius: 8, marginBottom: 20 }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 18 }}>
                <FormField label="Nombre" name="nome" type="text" defaultValue={brinde.nome} required />
                <FormField label="Descripción" name="descricao" type="textarea" defaultValue={brinde.descricao} />

                <BrindeImageUploader value={imagemUrl} onChange={setImagemUrl} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <FormField label="Costo en puntos" name="custo_pontos" type="number" min={1} defaultValue={String(brinde.custo_pontos)} required />
                    <FormField label="Stock (-1 = ilimitado)" name="estoque" type="number" min={-1} defaultValue={String(brinde.estoque)} required />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--admin-text-muted)", cursor: "pointer" }}>
                    <input type="checkbox" name="ativo" defaultChecked={brinde.ativo} style={{ width: 18, height: 18 }} />
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
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
            </form>
            </div>
        </>
    );
}

function FormField({ label, name, type, required, min, defaultValue }: { label: string; name: string; type: string; required?: boolean; min?: number; defaultValue?: string }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--admin-text-muted)", marginBottom: 6 }}>
                {label}
            </label>
            {type === "textarea" ? (
                <textarea name={name} rows={3} defaultValue={defaultValue} style={{ ...inputStyle, resize: "vertical" }} />
            ) : (
                <input name={name} type={type} required={required} min={min} defaultValue={defaultValue} style={inputStyle} />
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    color: "var(--admin-text)",
    fontSize: 14,
    outline: "none",
};
