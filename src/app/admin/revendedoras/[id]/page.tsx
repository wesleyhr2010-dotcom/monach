"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPerfilRevendedora } from "../../actions-equipe";
import type { RevendedoraPerfil } from "@/lib/types";
import { formatGs, formatGsCompact, formatPct, formatDate, formatPhone } from "@/lib/format";
import { maskAlias, maskCuenta, maskCI } from "@/lib/data-protection/mask-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    MessageCircle,
    Phone,
    MapPin,
    Instagram,
    Briefcase,
    FileText,
    CreditCard,
    TrendingUp,
    Package,
    Award,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ativa: { label: "ATIVA", color: "#4ade80", bg: "rgba(74, 222, 128, 0.12)", icon: <CheckCircle2 className="w-3 h-3" /> },
    atrasada: { label: "ATRASADA", color: "#facc15", bg: "rgba(250, 204, 21, 0.12)", icon: <AlertTriangle className="w-3 h-3" /> },
    aguardando_revisao: { label: "AG. REVISÃO", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.12)", icon: <Clock className="w-3 h-3" /> },
    concluida: { label: "CONCLUÍDA", color: "#888888", bg: "rgba(136, 136, 136, 0.12)", icon: <CheckCircle2 className="w-3 h-3" /> },
};

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
                <div className="text-center py-20 text-muted-foreground">Carregando perfil...</div>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="admin-content">
                <div className="text-center py-20 text-muted-foreground">Revendedora não encontrada</div>
            </div>
        );
    }

    const avatarIniciais = perfil.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    const faturamentoTotal = perfil.maletas.reduce((s, m) => s + (m.valor_total_vendido || 0), 0);
    const faturamentoMes = perfil.maletas
        .filter((m) => {
            const d = new Date(m.data_envio);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, m) => s + (m.valor_total_vendido || 0), 0);

    return (
        <>
            {/* Header */}
            <header className="admin-header">
                <div>
                    <div style={{ fontSize: "11px", color: "var(--admin-text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        <Link href="/admin/revendedoras" style={{ color: "inherit", textDecoration: "none" }}>
                            ADMIN / REVENDEDORAS
                        </Link>{" "}
                        / {perfil.name.toUpperCase()}
                    </div>
                    <h1>Perfil da Revendedora</h1>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`https://wa.me/${perfil.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                        </a>
                    </Button>
                    <Button variant="outline" size="sm">
                        Alterar Consultora
                    </Button>
                    <Button variant="destructive" size="sm">
                        {perfil.is_active ? "Desativar Conta" : "Reativar Conta"}
                    </Button>
                </div>
            </header>

            <div className="admin-content">
                {/* Identity Card */}
                <Card>
                    <CardContent style={{ padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: "50%",
                                background: "linear-gradient(135deg, #35605a, #2a4d48)",
                                color: "white", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "22px", fontWeight: 700,
                                overflow: "hidden", flexShrink: 0,
                            }}>
                                {perfil.avatar_url ? (
                                    <img src={perfil.avatar_url} alt={perfil.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    avatarIniciais
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 240 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                                    <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>{perfil.name}</h2>
                                    {perfil.nivel && (
                                        <Badge style={{ background: perfil.nivel.cor + "20", color: perfil.nivel.cor, border: "none" }}>
                                            {perfil.nivel.nome.toUpperCase()}
                                        </Badge>
                                    )}
                                    <span className="admin-badge" style={{
                                        background: perfil.is_active ? "rgba(74, 222, 128, 0.12)" : "rgba(136, 136, 136, 0.12)",
                                        color: perfil.is_active ? "#4ade80" : "#888",
                                    }}>
                                        {perfil.is_active ? "ATIVA" : "INATIVA"}
                                    </span>
                                    {perfil.perfil_completo && (
                                        <span className="admin-badge" style={{ background: "rgba(96, 165, 250, 0.12)", color: "#60a5fa" }}>
                                            PERFIL COMPLETO
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", color: "var(--admin-text-muted)", fontSize: "13px" }}>
                                    <span>{perfil.email || "—"}</span>
                                    <span>CI: {perfil.cedula || "—"}</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Phone className="w-3 h-3" /> {formatPhone(perfil.whatsapp)}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <MapPin className="w-3 h-3" />
                                        {[perfil.endereco_cidade, perfil.endereco_estado].filter(Boolean).join(" / ") || "—"}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                                        {perfil.pontos_total.toLocaleString("es-PY")}
                                    </div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>Pontos</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#4ade80" }}>
                                        {formatPct(perfil.taxa_comissao)}
                                    </div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>Comissão</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                                        {perfil.colaboradora?.name || "—"}
                                    </div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>Consultora</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
                    {/* Dados de Candidatura */}
                    <Card>
                        <CardContent style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "16px" }}>
                                Dados de Candidatura
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Cédula</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.cedula || "—"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Instagram</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.instagram ? `@${perfil.instagram}` : "—"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Edad</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.edad ? `${perfil.edad} años` : "—"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Estado Civil</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.estado_civil || "—"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Hijos</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.hijos || "—"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Empresa</div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.empresa || "—"}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: "12px" }}>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Informconf</div>
                                <div style={{ fontSize: "13px", color: perfil.informconf ? "var(--admin-text)" : "var(--admin-text-muted)" }}>
                                    {perfil.informconf || "Sin deudas registradas al momento de la solicitud"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documentos */}
                    <Card>
                        <CardContent style={{ padding: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>
                                    Documentos
                                </h3>
                                <Link href={`/admin/revendedoras/${perfil.id}/documentos`} style={{ fontSize: "12px", color: "var(--admin-accent)", textDecoration: "none" }}>
                                    Gestionar →
                                </Link>
                            </div>
                            {perfil.documentos.length === 0 ? (
                                <p style={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>Nenhum documento enviado</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {perfil.documentos.map((doc) => (
                                        <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span style={{ fontSize: "14px" }}>
                                                    {doc.tipo === "ci" ? "Identidad CI / DNI" : doc.tipo === "contrato" ? "Contrato de Consignación" : doc.tipo}
                                                </span>
                                            </div>
                                            <span className="admin-badge" style={{
                                                background: doc.status === "aprovado" ? "rgba(74, 222, 128, 0.12)" : doc.status === "pendente" ? "rgba(250, 204, 21, 0.12)" : "rgba(136, 136, 136, 0.12)",
                                                color: doc.status === "aprovado" ? "#4ade80" : doc.status === "pendente" ? "#facc15" : "#888",
                                            }}>
                                                {doc.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Maletas */}
                    <Card>
                        <CardContent style={{ padding: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>
                                    Maletas
                                </h3>
                                <Link href={`/admin/maleta?reseller=${perfil.id}`} style={{ fontSize: "12px", color: "var(--admin-accent)", textDecoration: "none" }}>
                                    Ver todas →
                                </Link>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {perfil.maletas.length === 0 ? (
                                    <p style={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>Nenhuma maleta</p>
                                ) : (
                                    perfil.maletas.slice(0, 5).map((m) => {
                                        const st = statusMap[m.status] || statusMap.concluida;
                                        return (
                                            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                                <div>
                                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                                                        #{m.numero} <span style={{ color: "var(--admin-text-muted)" }}>Maleta</span>
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                                                        {m.status === "ativa" ? `Vence ${formatDate(m.data_limite)}` : `Finalizada ${formatDate(m.data_envio)}`}
                                                    </div>
                                                </div>
                                                <span className="admin-badge" style={{ background: st.bg, color: st.color }}>
                                                    {st.label}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados Bancários */}
                    <Card>
                        <CardContent style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "16px" }}>
                                Dados Bancários
                            </h3>
                            {perfil.dados_bancarios ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div>
                                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Tipo</div>
                                        <div style={{ fontSize: "14px", fontWeight: 500 }}>
                                            {perfil.dados_bancarios.tipo === "alias" ? "Bancard — Alias" : "Cuenta Bancaria"}
                                        </div>
                                    </div>
                                    {perfil.dados_bancarios.tipo === "alias" ? (
                                        <>
                                            <div>
                                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Alias</div>
                                                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--admin-accent)" }}>
                                                    {maskAlias(perfil.dados_bancarios.alias_valor || "")}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Titular</div>
                                                <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.dados_bancarios.alias_titular || "—"}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Banco</div>
                                                <div style={{ fontSize: "14px", fontWeight: 500 }}>{perfil.dados_bancarios.banco || "—"}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Cuenta</div>
                                                <div style={{ fontSize: "14px", fontWeight: 500 }}>{maskCuenta(perfil.dados_bancarios.cuenta || "")}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p style={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>Nenhum dado bancário cadastrado</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Faturamento Card (full width) */}
                <Card>
                    <CardContent style={{ padding: "24px" }}>
                        <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "16px" }}>
                            Faturamento
                        </h3>
                        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Total Acumulado</div>
                                <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                                    {formatGsCompact(faturamentoTotal)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Este Mês</div>
                                <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--admin-accent)" }}>
                                    {formatGsCompact(faturamentoMes)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "4px" }}>Maletas Fechadas</div>
                                <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                                    {perfil.maletas.filter((m) => m.status === "concluida").length}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
