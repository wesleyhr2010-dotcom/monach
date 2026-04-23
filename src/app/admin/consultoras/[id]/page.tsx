"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPerfilConsultora } from "../../actions-equipe";
import type { ConsultoraPerfil } from "@/lib/types";
import { formatGs, formatGsCompact, formatPct } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Users,
    TrendingUp,
    DollarSign,
    Phone,
    Mail,
    ArrowRight,
    Package,
    Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ConsultoraPerfilPage() {
    const params = useParams();
    const id = (params?.id as string) || "";
    const [perfil, setPerfil] = useState<ConsultoraPerfil | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        async function fetchPerfil() {
            setLoading(true);
            const data = await getPerfilConsultora(id);
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
                <div className="text-center py-20 text-muted-foreground">Consultora não encontrada</div>
            </div>
        );
    }

    const avatarIniciais = perfil.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <>
            {/* Header */}
            <header className="admin-header">
                <div>
                    <div style={{ fontSize: "11px", color: "var(--admin-text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        <Link href="/admin/consultoras" style={{ color: "inherit", textDecoration: "none" }}>
                            ADMIN / CONSULTORAS
                        </Link>{" "}
                        / {perfil.name.toUpperCase()}
                    </div>
                    <h1>Perfil da Consultora</h1>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="outline" size="sm">
                        Editar Dados
                    </Button>
                    <Button variant="destructive" size="sm">
                        {perfil.is_active ? "Desativar" : "Reativar"}
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
                                    <span className="admin-badge" style={{
                                        background: perfil.is_active ? "rgba(74, 222, 128, 0.12)" : "rgba(136, 136, 136, 0.12)",
                                        color: perfil.is_active ? "#4ade80" : "#888",
                                    }}>
                                        {perfil.is_active ? "ATIVA" : "INATIVA"}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", color: "var(--admin-text-muted)", fontSize: "13px" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Mail className="w-3 h-3" /> {perfil.email || "—"}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Phone className="w-3 h-3" /> {perfil.whatsapp}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#4ade80" }}>
                                        {formatPct(perfil.taxa_comissao)}
                                    </div>
                                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>Comissão</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <Card>
                        <CardContent style={{ padding: "20px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "8px" }}>
                                Revendedoras Ativas
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                                {perfil.revendedoras_ativas}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                                {perfil.revendedoras_inativas} inativa{perfil.revendedoras_inativas !== 1 ? "s" : ""}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent style={{ padding: "20px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "8px" }}>
                                Faturamento do Grupo
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                                {formatGsCompact(perfil.faturamento_grupo_total)}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                                Total acumulado
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent style={{ padding: "20px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "8px" }}>
                                Comissão Total
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--admin-accent)" }}>
                                {formatGsCompact(perfil.comissao_grupo_total)}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                                {formatPct(perfil.taxa_comissao)} do faturamento
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Revendedoras do Grupo */}
                <Card>
                    <CardContent style={{ padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>
                                Suas Revendedoras
                            </h3>
                            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>
                                {perfil.revendedoras.length} total
                            </span>
                        </div>
                        {perfil.revendedoras.length === 0 ? (
                            <p style={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>Nenhuma revendedora vinculada</p>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: 24 }}>REVENDEDORA</th>
                                            <th>MALETAS</th>
                                            <th>FATURAMENTO</th>
                                            <th>PONTOS</th>
                                            <th>STATUS</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {perfil.revendedoras.map((rev) => (
                                            <tr key={rev.id}>
                                                <td style={{ paddingLeft: 24 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: "50%",
                                                            background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                                                            color: "white", display: "flex", alignItems: "center",
                                                            justifyContent: "center", fontSize: "12px", fontWeight: 600,
                                                            overflow: "hidden", flexShrink: 0,
                                                        }}>
                                                            {rev.avatar_url ? (
                                                                <img src={rev.avatar_url} alt={rev.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            ) : (
                                                                rev.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 500, fontSize: "14px" }}>{rev.name}</p>
                                                            <p style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                                                                Comissão: {rev.taxa_comissao}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span style={{ fontSize: "13px" }}>{rev.maletas_count}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                                                        {formatGsCompact(rev.faturamento_total)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <Award className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span style={{ fontSize: "13px" }}>{rev.pontos_total.toLocaleString("es-PY")}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="admin-badge" style={{
                                                        background: rev.is_active ? "rgba(74, 222, 128, 0.12)" : "rgba(136, 136, 136, 0.12)",
                                                        color: rev.is_active ? "#4ade80" : "#888",
                                                    }}>
                                                        {rev.is_active ? "ATIVA" : "INATIVA"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/admin/revendedoras/${rev.id}`}>
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
