"use client";

import { useState, useEffect, useTransition } from "react";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminAvatar } from "@/components/admin/AdminAvatar";

export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import {
    getColaboradoras,
    getRevendedoras,
    criarColaboradora,
    criarRevendedora,
    atualizarMembro,
    deletarMembro,
    vincularRevendedora,
} from "../actions-equipe";
import type { ColaboradoraItem, RevendedoraItem } from "../actions-equipe";
import { Users, UserPlus, Phone, Percent, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function EquipePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [tab, setTab] = useState<"colaboradoras" | "revendedoras">("colaboradoras");
    const [colaboradoras, setColaboradoras] = useState<ColaboradoraItem[]>([]);
    const [revendedoras, setRevendedoras] = useState<RevendedoraItem[]>([]);
    const [showNewColab, setShowNewColab] = useState(false);
    const [showNewRevend, setShowNewRevend] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [c, r] = await Promise.all([getColaboradoras(), getRevendedoras()]);
            setColaboradoras(c);
            setRevendedoras(r);
        } catch {
            router.replace("/admin");
        }
    }

    function handleNewColab(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await criarColaboradora(fd);
            if (res.success) {
                toast.success("Colaboradora criada!");
                setShowNewColab(false);
                loadData();
            } else {
                toast.error(res.error || "Erro");
            }
        });
    }

    function handleNewRevend(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await criarRevendedora(fd);
            if (res.success) {
                toast.success("Revendedora criada!");
                setShowNewRevend(false);
                loadData();
            } else {
                toast.error(res.error || "Erro");
            }
        });
    }

    function handleDelete(id: string, name: string) {
        if (!confirm(`Remover "${name}"? Esta ação não pode ser desfeita.`)) return;
        startTransition(async () => {
            const res = await deletarMembro(id);
            if (res.success) {
                toast.success(`"${name}" removida`);
                loadData();
            } else {
                toast.error(res.error || "Erro");
            }
        });
    }

    function handleVincular(revendedoraId: string, colaboradoraId: string) {
        startTransition(async () => {
            const cId = colaboradoraId === "none" ? null : colaboradoraId;
            const res = await vincularRevendedora(revendedoraId, cId);
            if (res.success) {
                toast.success("Vínculo atualizado!");
                loadData();
            } else {
                toast.error(res.error || "Erro");
            }
        });
    }

    return (
        <>
            <AdminTopHeader
                breadcrumb="Admin / Equipe"
                title="Equipe"
                action={
                    tab === "colaboradoras" ? (
                        <button
                            className="admin-btn admin-btn-primary"
                            style={{ borderRadius: "var(--admin-radius-pill)", display: "inline-flex", alignItems: "center", gap: 6 }}
                            onClick={() => setShowNewColab(true)}
                        >
                            <UserPlus size={14} />
                            Nova Consultora
                        </button>
                    ) : (
                        <button
                            className="admin-btn admin-btn-primary"
                            style={{ borderRadius: "var(--admin-radius-pill)", display: "inline-flex", alignItems: "center", gap: 6 }}
                            onClick={() => setShowNewRevend(true)}
                        >
                            <UserPlus size={14} />
                            Nova Revendedora
                        </button>
                    )
                }
            />

            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 8 }}>
                    {(["colaboradoras", "revendedoras"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={tab === t ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-secondary"}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                            <Users size={13} />
                            {t === "colaboradoras" ? "Consultoras" : "Revendedoras"}
                            <span style={{
                                fontSize: 11, fontWeight: 700, lineHeight: 1,
                                padding: "2px 6px", borderRadius: 10,
                                background: tab === t ? "rgba(255,255,255,0.2)" : "var(--admin-surface-hover)",
                                color: tab === t ? "#fff" : "var(--admin-text-dim)",
                            }}>
                                {t === "colaboradoras" ? colaboradoras.length : revendedoras.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ===== COLABORADORAS TAB ===== */}
                {tab === "colaboradoras" && (
                    colaboradoras.length === 0 ? (
                        <AdminEmptyState icon={Users} title="Nenhuma consultora cadastrada" description="Adicione a primeira consultora pelo botão acima." />
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                            {colaboradoras.map((c) => (
                                <div key={c.id} className="admin-card">
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                        <AdminAvatar src={c.avatar_url} name={c.name} size="md" />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 600, fontSize: 15, color: "var(--admin-text)", margin: 0, fontFamily: "Raleway, sans-serif" }}>{c.name}</p>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--admin-text-muted)", marginTop: 2 }}>
                                                <Phone size={11} /> {c.whatsapp}
                                            </div>
                                        </div>
                                        <button
                                            className="admin-btn-icon"
                                            onClick={() => handleDelete(c.id, c.name)}
                                            title="Remover"
                                            style={{ background: "transparent", border: "none", color: "var(--admin-danger)", cursor: "pointer" }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--admin-border)", color: "var(--admin-text-muted)" }}>
                                            <Percent size={11} /> {c.taxa_comissao}%
                                        </span>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "var(--admin-surface-hover)", color: "var(--admin-text-dim)" }}>
                                            <Users size={11} /> {c.revendedorasCount} revendedoras
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ===== REVENDEDORAS TAB ===== */}
                {tab === "revendedoras" && (
                    revendedoras.length === 0 ? (
                        <AdminEmptyState icon={Users} title="Nenhuma revendedora cadastrada" description="Adicione a primeira revendedora pelo botão acima." />
                    ) : (
                        <div className="admin-card" style={{ padding: 0 }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>WhatsApp</th>
                                        <th>Comissão</th>
                                        <th>Consultora</th>
                                        <th style={{ width: 50 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {revendedoras.map((r) => (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <AdminAvatar src={r.avatar_url} name={r.name} size="sm" />
                                                    <div>
                                                        <p style={{ fontWeight: 500, fontSize: 14, color: "var(--admin-text)", margin: 0 }}>{r.name}</p>
                                                        {r.email && <p style={{ fontSize: 12, color: "var(--admin-text-muted)", margin: 0 }}>{r.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{r.whatsapp}</td>
                                            <td>
                                                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--admin-border)", color: "var(--admin-text-muted)" }}>
                                                    {r.taxa_comissao}%
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={r.colaboradora?.id || "none"}
                                                    onChange={(e) => handleVincular(r.id, e.target.value)}
                                                    disabled={isPending}
                                                    style={{
                                                        padding: "4px 8px", borderRadius: 6, fontSize: 13,
                                                        border: "1px solid var(--admin-border)",
                                                        background: "var(--admin-bg)", color: "var(--admin-text)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <option value="none">Sem vínculo</option>
                                                    {colaboradoras.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className="admin-btn-icon"
                                                    onClick={() => handleDelete(r.id, r.name)}
                                                    style={{ color: "var(--admin-danger)" }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Modal Nova Consultora */}
            {showNewColab && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 50,
                    background: "rgba(0,0,0,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{
                        background: "var(--admin-surface)", borderRadius: 12,
                        border: "1px solid var(--admin-border)",
                        padding: 28, width: "100%", maxWidth: 440,
                        maxHeight: "90vh", overflowY: "auto",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--admin-text)", margin: 0 }}>
                                Nova Consultora
                            </h3>
                            <button className="admin-btn-icon" onClick={() => setShowNewColab(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleNewColab} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Nome *</label>
                                <input name="name" required placeholder="Nome completo" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>WhatsApp *</label>
                                <input name="whatsapp" required placeholder="+595 ..." className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Email</label>
                                <input name="email" type="email" placeholder="email@..." className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Comissão %</label>
                                <input name="taxa_comissao" type="number" step="0.01" defaultValue="5" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Foto</label>
                                <input name="avatar" type="file" accept="image/*" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                                {isPending ? "Criando..." : "Criar Consultora"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Nova Revendedora */}
            {showNewRevend && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 50,
                    background: "rgba(0,0,0,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{
                        background: "var(--admin-surface)", borderRadius: 12,
                        border: "1px solid var(--admin-border)",
                        padding: 28, width: "100%", maxWidth: 440,
                        maxHeight: "90vh", overflowY: "auto",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--admin-text)", margin: 0 }}>
                                Nova Revendedora
                            </h3>
                            <button className="admin-btn-icon" onClick={() => setShowNewRevend(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleNewRevend} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Nome *</label>
                                <input name="name" required placeholder="Nome completo" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>WhatsApp *</label>
                                <input name="whatsapp" required placeholder="+595 ..." className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Email</label>
                                <input name="email" type="email" placeholder="email@..." className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Comissão %</label>
                                <input name="taxa_comissao" type="number" step="0.01" defaultValue="10" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Consultora</label>
                                <select name="colaboradora_id" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13 }}>
                                    <option value="">Sem consultora</option>
                                    {colaboradoras.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Foto</label>
                                <input name="avatar" type="file" accept="image/*" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                                {isPending ? "Criando..." : "Criar Revendedora"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
