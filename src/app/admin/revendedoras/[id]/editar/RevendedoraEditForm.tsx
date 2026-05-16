"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarRevendedoraAdmin } from "../../../actions-equipe";
import type { RevendedoraPerfil, ColaboradoraItem } from "@/lib/types";

interface Props {
    perfil: RevendedoraPerfil;
    colaboradoras: ColaboradoraItem[];
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    color: "var(--admin-text)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--admin-text-dim)",
    marginBottom: 5,
    textTransform: "uppercase" as const,
};

function Field({
    label,
    name,
    defaultValue = "",
    type = "text",
    required,
    placeholder,
}: {
    label: string;
    name: string;
    defaultValue?: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <input
                name={name}
                type={type}
                defaultValue={defaultValue}
                required={required}
                placeholder={placeholder}
                style={inputStyle}
            />
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 style={{
            color: "var(--admin-text-muted)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: "1px solid var(--admin-border)",
        }}>
            {children}
        </h3>
    );
}

export function RevendedoraEditForm({ perfil, colaboradoras }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isActive, setIsActive] = useState(perfil.is_active);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        const data = {
            name:               (fd.get("name")               as string) || "",
            email:              (fd.get("email")              as string) || "",
            whatsapp:           (fd.get("whatsapp")           as string) || "",
            cedula:             (fd.get("cedula")             as string) || "",
            instagram:          (fd.get("instagram")          as string) || "",
            edad:               (fd.get("edad")               as string) || "",
            estado_civil:       (fd.get("estado_civil")       as string) || "",
            hijos:              (fd.get("hijos")              as string) || "",
            empresa:            (fd.get("empresa")            as string) || "",
            informconf:         (fd.get("informconf")         as string) || "",
            endereco_cep:       (fd.get("endereco_cep")       as string) || "",
            endereco_logradouro:(fd.get("endereco_logradouro")as string) || "",
            endereco_numero:    (fd.get("endereco_numero")    as string) || "",
            endereco_complemento:(fd.get("endereco_complemento")as string) || "",
            endereco_cidade:    (fd.get("endereco_cidade")    as string) || "",
            endereco_estado:    (fd.get("endereco_estado")    as string) || "",
            taxa_comissao:      parseFloat((fd.get("taxa_comissao") as string) || "0"),
            is_active:          isActive,
            colaboradora_id:    (fd.get("colaboradora_id") as string) || null,
        };

        startTransition(async () => {
            const result = await atualizarRevendedoraAdmin(perfil.id, data);
            if (result.success) {
                toast.success("Revendedora actualizada");
                router.push(`/admin/revendedoras/${perfil.id}`);
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        });
    }

    return (
        <>
            {/* Header */}
            <header style={{
                padding: "28px 36px 20px",
                borderBottom: "1px solid var(--admin-surface-hover)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Link href="/admin/revendedoras" style={{ color: "var(--admin-text-dim)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none" }}>
                        ADMIN
                    </Link>
                    <span style={{ color: "var(--admin-border)", fontSize: 11 }}>/</span>
                    <Link href="/admin/revendedoras" style={{ color: "var(--admin-text-dim)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none" }}>
                        REVENDEDORAS
                    </Link>
                    <span style={{ color: "var(--admin-border)", fontSize: 11 }}>/</span>
                    <Link href={`/admin/revendedoras/${perfil.id}`} style={{ color: "var(--admin-text-dim)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none" }}>
                        {perfil.name.toUpperCase()}
                    </Link>
                    <span style={{ color: "var(--admin-border)", fontSize: 11 }}>/</span>
                    <span style={{ color: "var(--admin-text-dim)", fontSize: 11, letterSpacing: "0.12em" }}>EDITAR</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h1 style={{
                        color: "var(--admin-text)",
                        fontSize: 20,
                        fontFamily: "'Playfair Display', system-ui, serif",
                        margin: 0,
                    }}>
                        Editar Revendedora
                    </h1>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Link
                            href={`/admin/revendedoras/${perfil.id}`}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 6,
                                background: "var(--admin-surface-hover)",
                                border: "1px solid var(--admin-border)",
                                color: "var(--admin-text-muted)",
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: "none",
                            }}
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            form="reseller-edit-form"
                            disabled={isPending}
                            style={{
                                padding: "8px 20px",
                                borderRadius: 6,
                                background: "var(--admin-accent)",
                                border: "none",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: isPending ? "not-allowed" : "pointer",
                                opacity: isPending ? 0.7 : 1,
                            }}
                        >
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ padding: "28px 36px", maxWidth: 860 }}>
                <form id="reseller-edit-form" onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                        {/* ── Identificación ─────────────────────────────── */}
                        <div style={{
                            padding: "22px 24px",
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 10,
                        }}>
                            <SectionTitle>Identificación</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                                <Field label="Nombre *" name="name" defaultValue={perfil.name} required />
                                <Field label="Cédula" name="cedula" defaultValue={perfil.cedula} />
                                <Field label="Email" name="email" type="email" defaultValue={perfil.email} placeholder="correo@ejemplo.com" />
                                <Field label="WhatsApp *" name="whatsapp" defaultValue={perfil.whatsapp} required placeholder="+595..." />
                            </div>
                        </div>

                        {/* ── Dirección ──────────────────────────────────── */}
                        <div style={{
                            padding: "22px 24px",
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 10,
                        }}>
                            <SectionTitle>Dirección</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                                <Field label="Ciudad" name="endereco_cidade" defaultValue={perfil.endereco_cidade} />
                                <Field label="Departamento / Estado" name="endereco_estado" defaultValue={perfil.endereco_estado} />
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <Field label="Dirección" name="endereco_logradouro" defaultValue={perfil.endereco_logradouro} />
                                </div>
                                <Field label="Número" name="endereco_numero" defaultValue={perfil.endereco_numero} />
                                <Field label="Complemento" name="endereco_complemento" defaultValue={perfil.endereco_complemento} />
                                <Field label="Código Postal" name="endereco_cep" defaultValue={perfil.endereco_cep} />
                            </div>
                        </div>

                        {/* ── Datos de Candidatura ───────────────────────── */}
                        <div style={{
                            padding: "22px 24px",
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 10,
                        }}>
                            <SectionTitle>Datos de Candidatura</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 20px" }}>
                                <Field label="Instagram" name="instagram" defaultValue={perfil.instagram} placeholder="@usuario" />
                                <Field label="Edad" name="edad" defaultValue={perfil.edad} placeholder="ej: 28 años" />
                                <Field label="Estado Civil" name="estado_civil" defaultValue={perfil.estado_civil} />
                                <Field label="Hijos" name="hijos" defaultValue={perfil.hijos} />
                                <Field label="Empresa" name="empresa" defaultValue={perfil.empresa} />
                            </div>
                            <div style={{ marginTop: 14 }}>
                                <label style={labelStyle}>Informconf</label>
                                <textarea
                                    name="informconf"
                                    defaultValue={perfil.informconf}
                                    rows={2}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                    placeholder="Observaciones Informconf..."
                                />
                            </div>
                        </div>

                        {/* ── Cuenta ─────────────────────────────────────── */}
                        <div style={{
                            padding: "22px 24px",
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 10,
                        }}>
                            <SectionTitle>Cuenta</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 20px" }}>
                                {/* Taxa de comissão */}
                                <div>
                                    <label style={labelStyle}>Tasa de comisión (%)</label>
                                    <input
                                        name="taxa_comissao"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={100}
                                        defaultValue={String(perfil.taxa_comissao)}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Colaboradora */}
                                <div>
                                    <label style={labelStyle}>Consultora</label>
                                    <select
                                        name="colaboradora_id"
                                        defaultValue={perfil.colaboradora?.id ?? ""}
                                        style={{ ...inputStyle, cursor: "pointer" }}
                                    >
                                        <option value="">Sin consultora</option>
                                        {colaboradoras.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* is_active toggle */}
                                <div>
                                    <label style={labelStyle}>Estado de la cuenta</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive((v) => !v)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "10px 16px",
                                            borderRadius: 8,
                                            border: `1px solid ${isActive ? "var(--admin-accent-hover)" : "#3A1515"}`,
                                            background: isActive ? "#1A2A20" : "#2A1515",
                                            color: isActive ? "var(--admin-success)" : "var(--admin-danger)",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            width: "100%",
                                        }}
                                    >
                                        <span style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: isActive ? "var(--admin-success)" : "var(--admin-danger)",
                                            flexShrink: 0,
                                        }} />
                                        {isActive ? "Activa" : "Desactivada"}
                                    </button>
                                    <p style={{ fontSize: 11, color: "var(--admin-text-dim)", marginTop: 5 }}>
                                        {isActive
                                            ? "La revendedora puede iniciar sesión."
                                            : "La revendedora no puede iniciar sesión."}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </>
    );
}
