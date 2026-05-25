"use client";

import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";

import {
    getRegras,
    getResgates,
    atualizarRegra,
    atualizarStatusResgate,
} from "../actions-gamificacao";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Award, Gift, ToggleLeft, ToggleRight, Check, X, Pencil } from "lucide-react";

type Regra = Awaited<ReturnType<typeof getRegras>>[number];
type Resgate = Awaited<ReturnType<typeof getResgates>>[number];

export default function GamificacaoAdminPage() {
    const [regras, setRegras] = useState<Regra[]>([]);
    const [resgates, setResgates] = useState<Resgate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPtsGs, setEditingPtsGs] = useState<string | null>(null);
    const [ptsGsValue, setPtsGsValue] = useState("");

    async function reload() {
        const [r, res] = await Promise.all([getRegras(), getResgates()]);
        setRegras(r);
        setResgates(res);
        setLoading(false);
    }

    useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pendentes = resgates.filter(r => r.status === "pendente").length;

    if (loading) {
        return (
            <>
                <AdminTopHeader breadcrumb="Admin / Gamificación" title="Gamificación" />
                <div style={{
                    textAlign: "center", padding: "60px 32px",
                    color: "var(--admin-text-muted)",
                    fontFamily: "Raleway, sans-serif", fontSize: 13,
                }}>
                    Cargando...
                </div>
            </>
        );
    }

    return (
        <>
            <AdminTopHeader
                breadcrumb="Admin / Gamificación"
                title="Gamificación"
                action={pendentes > 0 ? (
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                        background: "#3A3A1C", color: "var(--admin-warning)", border: "1px solid #5A5A2A",
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--admin-warning)" }} />
                        {pendentes} canje{pendentes !== 1 ? "s" : ""} pendiente{pendentes !== 1 ? "s" : ""}
                    </span>
                ) : undefined}
            />

            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Reglas de Puntos */}
                <AdminSectionCard
                    title="Reglas de Puntos"
                    icon={<Award size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
                    noPadContent
                >
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Regla</th>
                                <th>Acción</th>
                                <th>Tipo</th>
                                <th style={{ textAlign: "right" }}>Puntos</th>
                                <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>Pts/Gs</th>
                                <th style={{ textAlign: "center", width: 80 }}>Activo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regras.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-muted)" }}>
                                        Sin reglas configuradas.
                                    </td>
                                </tr>
                            ) : regras.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--admin-text)" }}>
                                            {r.nome}
                                        </div>
                                        {r.descricao && (
                                            <div style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 2 }}>
                                                {r.descricao}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <code style={{ fontSize: 11 }}>{r.acao}</code>
                                    </td>
                                    <td>
                                        <code style={{ fontSize: 11 }}>{r.tipo}</code>
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                                        {r.pontos}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {r.acao === "venda_maleta" ? (
                                            editingPtsGs === r.id ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    min="0"
                                                    value={ptsGsValue}
                                                    onChange={(e) => setPtsGsValue(e.target.value)}
                                                    style={{
                                                        width: 90,
                                                        padding: "3px 6px",
                                                        fontSize: 12,
                                                        fontFamily: "Raleway, sans-serif",
                                                        border: "1px solid var(--admin-border)",
                                                        borderRadius: 4,
                                                        background: "var(--admin-bg-elevated)",
                                                        color: "var(--admin-text)",
                                                    }}
                                                />
                                                <button
                                                    className="admin-btn admin-btn-sm admin-btn-primary"
                                                    style={{ fontSize: 11, padding: "2px 8px" }}
                                                    onClick={async () => {
                                                        try {
                                                            const val = ptsGsValue.trim() !== "" ? parseFloat(ptsGsValue) : null;
                                                            await atualizarRegra(r.id, {
                                                                nome: r.nome,
                                                                descricao: r.descricao,
                                                                pontos: r.pontos,
                                                                ativo: r.ativo,
                                                                icone: r.icone,
                                                                ordem: r.ordem,
                                                                limite_diario: r.limite_diario,
                                                                meta_valor: r.meta_valor != null ? Number(r.meta_valor) : null,
                                                                pontos_por_guarani: val,
                                                            });
                                                            setEditingPtsGs(null);
                                                            reload();
                                                        } catch (err) {
                                                            alert(err instanceof Error ? err.message : "Error al guardar");
                                                        }
                                                    }}
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    className="admin-btn admin-btn-sm"
                                                    style={{ fontSize: 11, padding: "2px 8px" }}
                                                    onClick={() => setEditingPtsGs(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ fontSize: 12, color: r.pontos_por_guarani != null ? "var(--admin-text)" : "var(--admin-text-dim)", fontFamily: "'Playfair Display', serif" }}>
                                                    {r.pontos_por_guarani != null
                                                        ? Number(r.pontos_por_guarani).toLocaleString("es-PY", { maximumFractionDigits: 6 })
                                                        : "—"}
                                                </span>
                                                <button
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        padding: 0,
                                                        color: "var(--admin-text-muted)",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                    }}
                                                    title="Editar Pts/Gs"
                                                    onClick={() => {
                                                        setEditingPtsGs(r.id);
                                                        setPtsGsValue(r.pontos_por_guarani != null ? String(r.pontos_por_guarani) : "");
                                                    }}
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            </div>
                                        )
                                        ) : (
                                            <span style={{ fontSize: 12, color: "var(--admin-text-dim)" }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await atualizarRegra(r.id, {
                                                        nome: r.nome,
                                                        descricao: r.descricao,
                                                        pontos: r.pontos,
                                                        ativo: !r.ativo,
                                                        icone: r.icone,
                                                        ordem: r.ordem,
                                                        limite_diario: r.limite_diario,
                                                        meta_valor: r.meta_valor != null ? Number(r.meta_valor) : null,
                                                        pontos_por_guarani: r.pontos_por_guarani != null ? Number(r.pontos_por_guarani) : null,
                                                    });
                                                    reload();
                                                } catch (err) {
                                                    alert(err instanceof Error ? err.message : "Error al actualizar");
                                                }
                                            }}
                                            style={{
                                                background: "none", border: "none",
                                                cursor: "pointer", display: "inline-flex",
                                                color: r.ativo ? "var(--admin-success)" : "var(--admin-text-dim)",
                                            }}
                                            title={r.ativo ? "Desactivar" : "Activar"}
                                        >
                                            {r.ativo
                                                ? <ToggleRight size={22} />
                                                : <ToggleLeft size={22} />
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </AdminSectionCard>

                {/* Canjes Pendientes */}
                <AdminSectionCard
                    title="Canjes Pendientes"
                    icon={<Gift size={15} color="var(--admin-warning)" strokeWidth={1.5} />}
                    noPadContent
                >
                    {resgates.length === 0 ? (
                        <div style={{
                            textAlign: "center", padding: "40px 20px",
                            color: "var(--admin-text-muted)",
                            fontFamily: "Raleway, sans-serif", fontSize: 13,
                        }}>
                            Ningún canje solicitado.
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Revendedora</th>
                                    <th>Premio</th>
                                    <th style={{ textAlign: "right" }}>Puntos</th>
                                    <th>Estado</th>
                                    <th style={{ width: 100 }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resgates.map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{r.reseller_name}</td>
                                        <td>{r.premio}</td>
                                        <td style={{ textAlign: "right", fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                                            {r.pontos}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: 11, fontWeight: 700,
                                                padding: "2px 8px", borderRadius: 4,
                                                background: r.status === "pendente"
                                                    ? "var(--admin-warning-10)"
                                                    : r.status === "aprovado"
                                                    ? "var(--admin-success-10)"
                                                    : "var(--admin-muted-10)",
                                                color: r.status === "pendente"
                                                    ? "var(--admin-warning)"
                                                    : r.status === "aprovado"
                                                    ? "var(--admin-success)"
                                                    : "var(--admin-text-muted)",
                                            }}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td>
                                            {r.status === "pendente" && (
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    <button
                                                        className="admin-btn admin-btn-icon"
                                                        style={{ background: "var(--admin-success-10)", color: "var(--admin-success)" }}
                                                        title="Aprobar"
                                                        onClick={async () => { await atualizarStatusResgate(r.id, "aprovado"); reload(); }}
                                                    >
                                                        <Check size={13} />
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-icon"
                                                        style={{ background: "var(--admin-danger-10)", color: "var(--admin-danger)" }}
                                                        title="Rechazar"
                                                        onClick={async () => { await atualizarStatusResgate(r.id, "recusado"); reload(); }}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            )}
                                            {r.status === "aprovado" && (
                                                <button
                                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                                    onClick={async () => { await atualizarStatusResgate(r.id, "entregue"); reload(); }}
                                                >
                                                    Entregar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </AdminSectionCard>

            </div>
        </>
    );
}
