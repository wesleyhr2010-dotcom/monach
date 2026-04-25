"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPerfilRevendedora } from "../../actions-equipe";
import type { RevendedoraPerfil } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    MessageCircle,
    UserCog,
    Ban,
    FileText,
    ArrowRight,
    Check,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const avatarColors = [
    "#35605A", "#7C3A2D", "#2D5A7C", "#5A2D7C", "#7C5A2D", "#2D7C5A", "#3A2D7C", "#7C2D5A",
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatGsCompact(value: number): string {
    if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return `G$ ${value}`;
}

function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-PY", {
        day: "2-digit", month: "short",
    });
}

// ─── Components ──────────────────────────────────────────────────────────────

function MaletaStatusBadge({ status }: { status: string }) {
    const configs: Record<string, { bg: string; color: string; label: string }> = {
        ativa: { bg: "#1C3A35", color: "#4ADE80", label: "ATIVA" },
        atrasada: { bg: "#3A1C1C", color: "#E05555", label: "ATRASADA" },
        aguardando_revisao: { bg: "#3A3A1C", color: "#FACC15", label: "AG. REVISÃO" },
        concluida: { bg: "#1A2A20", color: "#52B788", label: "CONCLUÍDA" },
    };
    const cfg = configs[status] || configs.ativa;
    return (
        <span style={{
            display: "inline-block", padding: "2px 9px", borderRadius: "10px",
            fontSize: "10px", fontWeight: 600, lineHeight: "12px",
            background: cfg.bg, color: cfg.color,
        }}>
            {cfg.label}
        </span>
    );
}

function DocStatusBadge({ status }: { status: string }) {
    const isAprovado = status === "aprovado";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "3px",
            padding: "2px 9px", borderRadius: "10px",
            fontSize: "10px", fontWeight: 600, lineHeight: "12px",
            background: isAprovado ? "#1A2A20" : "#2A1F0A",
            color: isAprovado ? "#52B788" : "#D4A017",
            border: isAprovado ? "none" : "1px solid #3A2A0A",
        }}>
            {isAprovado ? "APROVADO" : "PENDENTE"} {isAprovado && <Check className="w-3 h-3" />}
        </span>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RevendedoraPerfilPage() {
    const params = useParams();
    const id = (params?.id as string) || "";
    const [perfil, setPerfil] = useState<RevendedoraPerfil | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        async function fetchPerfil() {
            setLoading(true);
            const data = await getPerfilRevendedora(id);
            setPerfil(data);
            setLoading(false);
        }
        fetchPerfil();
    }, [id]);

    if (loading) {
        return (
            <div className="admin-content">
                <div className="text-center py-20 text-muted-foreground">Cargando perfil...</div>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="admin-content">
                <div className="text-center py-20 text-muted-foreground">Revendedora no encontrada</div>
            </div>
        );
    }

    const avatarColor = getAvatarColor(perfil.name);
    const colabColor = perfil.colaboradora ? getAvatarColor(perfil.colaboradora.name) : "#555";
    const faturamentoTotal = perfil.maletas.reduce((s, m) => s + (m.valor_total_vendido || 0), 0);
    const faturamentoMes = perfil.maletas
        .filter((m) => {
            const d = new Date(m.data_envio);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, m) => s + (m.valor_total_vendido || 0), 0);

    // Documentos por tipo
    const docCI = perfil.documentos.find((d) => d.tipo === "ci");
    const docContrato = perfil.documentos.find((d) => d.tipo === "contrato");
    const docManual = perfil.documentos.find((d) => d.tipo === "manual");

    return (
        <>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <header style={{
                padding: "28px 36px 20px", borderBottom: "1px solid #222222",
            }}>
                {/* Breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <Link href="/admin/revendedoras" style={{ color: "#444444", fontSize: "11px", letterSpacing: "0.12em", textDecoration: "none" }}>
                        ADMIN
                    </Link>
                    <span style={{ color: "#333333", fontSize: "11px" }}>/</span>
                    <Link href="/admin/revendedoras" style={{ color: "#444444", fontSize: "11px", letterSpacing: "0.12em", textDecoration: "none" }}>
                        REVENDEDORAS
                    </Link>
                    <span style={{ color: "#333333", fontSize: "11px" }}>/</span>
                    <span style={{ color: "#666666", fontSize: "11px", letterSpacing: "0.12em" }}>{perfil.name.toUpperCase()}</span>
                </div>

                {/* Title + Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h1 style={{
                        color: "#E8E8E8", fontSize: "20px", lineHeight: "24px",
                        fontFamily: "'Playfair Display', system-ui, serif", margin: 0,
                    }}>
                        Perfil da Revendedora
                    </h1>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {/* WhatsApp */}
                        <a
                            href={`https://wa.me/${perfil.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                padding: "7px 14px", borderRadius: "6px",
                                background: "#1A2A20", border: "1px solid #2D6A4F",
                                color: "#52B788", fontSize: "12px", fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                        {/* Alterar Consultora */}
                        <button style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "7px 14px", borderRadius: "6px",
                            background: "#1E1E1E", border: "1px solid #2A2A2A",
                            color: "#888888", fontSize: "12px", fontWeight: 500,
                            cursor: "pointer",
                        }}>
                            <UserCog className="w-3.5 h-3.5" /> Alterar Consultora
                        </button>
                        {/* Desativar */}
                        <button style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "7px 14px", borderRadius: "6px",
                            background: "#1E1E1E", border: "1px solid #3A1515",
                            color: "#E05555", fontSize: "12px", fontWeight: 500,
                            cursor: "pointer",
                        }}>
                            <Ban className="w-3.5 h-3.5" /> Desativar Conta
                        </button>
                    </div>
                </div>
            </header>

            <div className="admin-content" style={{ padding: "24px 36px" }}>
                {/* ── Identity Card ────────────────────────────────────────── */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "24px",
                    padding: "24px", background: "#171717",
                    border: "1px solid #2A2A2A", borderRadius: "10px",
                }}>
                    {/* Avatar */}
                    <div style={{
                        width: "64px", height: "64px", borderRadius: "50%",
                        background: "#2A3A30", border: "2px solid #2D6A4F",
                        color: "#52B788", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "22px", fontWeight: 700, flexShrink: 0,
                        overflow: "hidden",
                    }}>
                        {perfil.avatar_url ? (
                            <img src={perfil.avatar_url} alt={perfil.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            getInitials(perfil.name)
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ color: "#E8E8E8", fontSize: "17px", fontWeight: 700 }}>{perfil.name}</span>
                            {perfil.nivel && (
                                <span style={{
                                    padding: "3px 10px", borderRadius: "20px",
                                    background: "#2D6A4F", color: "#D8F3DC",
                                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                                }}>
                                    {perfil.nivel.nome.toUpperCase()}
                                </span>
                            )}
                            {perfil.documentos.some((d) => d.status === "pendente" || d.status === "em_analise") && (
                                <span style={{
                                    padding: "3px 10px", borderRadius: "20px",
                                    background: "#252525", color: "#888888",
                                    border: "1px solid #333333",
                                    fontSize: "10px", fontWeight: 500,
                                }}>
                                    CI PENDENTE
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#555555", fontSize: "12px" }}>
                            <span>{perfil.email || "—"}</span>
                            <span style={{ color: "#333333" }}>·</span>
                            <span>CI: {perfil.cedula || "—"}</span>
                            <span style={{ color: "#333333" }}>·</span>
                            <span>{perfil.whatsapp}</span>
                            <span style={{ color: "#333333" }}>·</span>
                            <span>{[perfil.endereco_cidade, perfil.endereco_estado].filter(Boolean).join(" / ") || "—"}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: "flex", flexShrink: 0, paddingLeft: "24px",
                        borderLeft: "1px solid #252525",
                    }}>
                        {/* Pontos */}
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                            paddingInline: "20px", borderRight: "1px solid #252525",
                        }}>
                            <span style={{ color: "#E8E8E8", fontSize: "18px", fontWeight: 700 }}>
                                {perfil.pontos_total.toLocaleString("es-PY")}
                            </span>
                            <span style={{ color: "#555555", fontSize: "10px", letterSpacing: "0.08em" }}>PONTOS</span>
                        </div>
                        {/* Comissão */}
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                            paddingInline: "20px", borderRight: "1px solid #252525",
                        }}>
                            <span style={{ color: "#52B788", fontSize: "18px", fontWeight: 700 }}>
                                {perfil.taxa_comissao}%
                            </span>
                            <span style={{ color: "#555555", fontSize: "10px", letterSpacing: "0.08em" }}>COMISSÃO</span>
                        </div>
                        {/* Consultora */}
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                            paddingInline: "20px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{
                                    width: "22px", height: "22px", borderRadius: "50%",
                                    background: "#2A3A30", color: "#52B788",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "8px", fontWeight: 700, flexShrink: 0,
                                }}>
                                    {perfil.colaboradora ? getInitials(perfil.colaboradora.name).slice(0, 2) : "—"}
                                </div>
                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 600 }}>
                                    {perfil.colaboradora ? `M. ${perfil.colaboradora.name.split(" ").pop()}` : "—"}
                                </span>
                            </div>
                            <span style={{ color: "#555555", fontSize: "10px", letterSpacing: "0.08em" }}>CONSULTORA</span>
                        </div>
                    </div>
                </div>

                {/* ── Grid ─────────────────────────────────────────────────── */}
                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                    {/* ── Left Column ────────────────────────────────────── */}
                    <div style={{ flex: "1.1 1 0%", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Dados de Candidatura */}
                        <div style={{
                            padding: "20px 24px", background: "#171717",
                            border: "1px solid #2A2A2A", borderRadius: "10px",
                        }}>
                            <h3 style={{
                                color: "#555555", fontSize: "11px", fontWeight: 600,
                                letterSpacing: "0.12em", lineHeight: "14px", marginBottom: "16px",
                            }}>
                                DADOS DE CANDIDATURA
                            </h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 0" }}>
                                {[
                                    { label: "CÉDULA", value: perfil.cedula || "—" },
                                    { label: "INSTAGRAM", value: perfil.instagram ? `@${perfil.instagram}` : "—" },
                                    { label: "EDAD", value: perfil.edad ? `${perfil.edad} años` : "—" },
                                    { label: "ESTADO CIVIL", value: perfil.estado_civil || "—" },
                                    { label: "HIJOS", value: perfil.hijos || "—" },
                                    { label: "EMPRESA", value: perfil.empresa || "—" },
                                ].map((item) => (
                                    <div key={item.label} style={{ flex: "0 0 33.33%", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>{item.label}</span>
                                        <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>{item.value}</span>
                                    </div>
                                ))}
                                <div style={{ flex: "0 0 100%", display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>INFORMCONF</span>
                                    <span style={{ color: "#52B788", fontSize: "13px", fontWeight: 500 }}>
                                        {perfil.informconf || "Sin deudas registradas al momento de la solicitud"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Maletas */}
                        <div style={{
                            padding: "20px 24px", background: "#161616",
                            border: "1px solid #2A2A2A", borderRadius: "10px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                <h3 style={{
                                    color: "#555555", fontSize: "11px", fontWeight: 600,
                                    letterSpacing: "0.12em", lineHeight: "14px",
                                }}>
                                    MALETAS
                                </h3>
                                <Link href={`/admin/maleta?reseller=${perfil.id}`} style={{ color: "#2D6A4F", fontSize: "11px", fontWeight: 500, textDecoration: "none" }}>
                                    Ver todas →
                                </Link>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {perfil.maletas.length === 0 ? (
                                    <p style={{ color: "#555555", fontSize: "13px" }}>Nenhuma maleta</p>
                                ) : (
                                    perfil.maletas.slice(0, 5).map((m) => (
                                        <div key={m.id} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "10px 12px", background: "#161616", borderRadius: "7px",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ color: "#888888", fontSize: "12px", fontWeight: 600 }}>
                                                    #{m.numero}
                                                </span>
                                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                                    Maleta #{m.numero}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ color: "#555555", fontSize: "11px" }}>
                                                    {m.status === "ativa" || m.status === "atrasada"
                                                        ? `Vence ${formatDateShort(m.data_limite)}`
                                                        : `Finalizada ${formatDateShort(m.data_envio)}`
                                                    }
                                                </span>
                                                <MaletaStatusBadge status={m.status} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column ───────────────────────────────────── */}
                    <div style={{ width: "340px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Documentos */}
                        <div style={{
                            padding: "20px 24px", background: "#171717",
                            border: "1px solid #2A2A2A", borderRadius: "10px",
                        }}>
                            <h3 style={{
                                color: "#555555", fontSize: "11px", fontWeight: 600,
                                letterSpacing: "0.12em", lineHeight: "14px", marginBottom: "14px",
                            }}>
                                DOCUMENTOS
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[
                                    { label: "Identidad CI / DNI", doc: docCI },
                                    { label: "Manual de Conducta", doc: docManual },
                                    { label: "Contrato de Consignação", doc: docContrato },
                                ].map((item) => (
                                    <div key={item.label} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "10px 12px", background: "#161616", borderRadius: "7px",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <FileText className="w-3.5 h-3.5" style={{ color: "#555555", flexShrink: 0 }} />
                                            <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>{item.label}</span>
                                        </div>
                                        <DocStatusBadge status={item.doc?.status || "pendente"} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dados Bancários */}
                        <div style={{
                            padding: "20px 24px", background: "#171717",
                            border: "1px solid #2A2A2A", borderRadius: "10px",
                        }}>
                            <h3 style={{
                                color: "#555555", fontSize: "11px", fontWeight: 600,
                                letterSpacing: "0.12em", lineHeight: "14px", marginBottom: "14px",
                            }}>
                                DADOS BANCÁRIOS
                            </h3>
                            {perfil.dados_bancarios ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>TIPO</span>
                                        <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                            {perfil.dados_bancarios.tipo === "alias" ? "Bancard — Alias" : "Cuenta Bancaria"}
                                        </span>
                                    </div>
                                    {perfil.dados_bancarios.tipo === "alias" ? (
                                        <>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>ALIAS</span>
                                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                                    {perfil.dados_bancarios.alias_valor || "—"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>TITULAR</span>
                                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                                    {perfil.dados_bancarios.alias_titular || "—"}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>BANCO</span>
                                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                                    {perfil.dados_bancarios.banco || "—"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>CUENTA</span>
                                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                                    {perfil.dados_bancarios.cuenta || "—"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <span style={{ color: "#444444", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em" }}>TITULAR</span>
                                                <span style={{ color: "#BBBBBB", fontSize: "13px", fontWeight: 500 }}>
                                                    {perfil.dados_bancarios.titular || "—"}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p style={{ color: "#555555", fontSize: "13px" }}>Nenhum dado bancário cadastrado</p>
                            )}
                        </div>

                        {/* Faturamento */}
                        <div style={{
                            padding: "20px 24px", background: "#171717",
                            border: "1px solid #2A2A2A", borderRadius: "10px",
                        }}>
                            <h3 style={{
                                color: "#555555", fontSize: "11px", fontWeight: 600,
                                letterSpacing: "0.12em", lineHeight: "14px", marginBottom: "14px",
                            }}>
                                FATURAMENTO
                            </h3>
                            <div style={{ display: "flex" }}>
                                <div style={{
                                    flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "4px",
                                    paddingRight: "16px", borderRight: "1px solid #252525",
                                }}>
                                    <span style={{ color: "#E8E8E8", fontSize: "17px", fontWeight: 700 }}>
                                        {formatGsCompact(faturamentoTotal)}
                                    </span>
                                    <span style={{ color: "#555555", fontSize: "10px", letterSpacing: "0.08em" }}>TOTAL ACUMULADO</span>
                                </div>
                                <div style={{
                                    flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "4px",
                                    paddingLeft: "16px",
                                }}>
                                    <span style={{ color: "#52B788", fontSize: "17px", fontWeight: 700 }}>
                                        {formatGsCompact(faturamentoMes)}
                                    </span>
                                    <span style={{ color: "#555555", fontSize: "10px", letterSpacing: "0.08em" }}>ESTE MÊS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
