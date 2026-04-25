"use client";

import { useState, useEffect, useTransition, useCallback } from "react";

export const dynamic = "force-dynamic";
import {
    getRevendedoras,
    getColaboradoras,
    criarRevendedora,
    atualizarMembro,
    deletarMembro,
    vincularRevendedora,
} from "../actions-equipe";
import type { RevendedoraItem, ColaboradoraItem } from "../actions-equipe";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    UserPlus,
    Check,
    ArrowRight,
    Trash2,
    Edit,
} from "lucide-react";

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

// ─── Component: Badge Maleta ─────────────────────────────────────────────────

function MaletaBadge({ status }: { status: string | null | undefined }) {
    if (!status || status === "sem_maleta") {
        return (
            <span style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 600,
                background: "#1a1a1a",
                color: "#666666",
                border: "1px solid #2a2a2a",
            }}>
                Sem maleta
            </span>
        );
    }
    const configs: Record<string, { bg: string; color: string; border: string; label: string }> = {
        ativa: { bg: "#1C3A35", color: "#4ADE80", border: "#2A5A2A", label: "Ativa" },
        atrasada: { bg: "#3A1C1C", color: "#E05C5C", border: "#5A2A2A", label: "Atrasada" },
        aguardando_revisao: { bg: "#3A3A1C", color: "#FACC15", border: "#5A5A2A", label: "Ag. revisão" },
        concluida: { bg: "#1C3A35", color: "#4ADE80", border: "#2A5A2A", label: "Concluída" },
    };
    const cfg = configs[status] || configs.ativa;
    return (
        <span style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 600,
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
        }}>
            {cfg.label}
        </span>
    );
}

// ─── Component: Badge Status ─────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 600,
            background: "#1C3A35",
            color: "#4ADE80",
            border: "1px solid #2A5A2A",
        }}>
            Ativa
        </span>
    ) : (
        <span style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 600,
            background: "#1a1a1a",
            color: "#666666",
            border: "1px solid #2a2a2a",
        }}>
            Inativa
        </span>
    );
}

// ─── Component: Doc Badge ────────────────────────────────────────────────────

function DocBadge({ status, label }: { status: string | null | undefined; label: string }) {
    const ok = status === "aprovado";
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 500,
            background: ok ? "#1C3A35" : "#3A1C1C",
            color: ok ? "#4ADE80" : "#E05C5C",
        }}>
            {label} {ok && <Check className="w-3 h-3" />}
        </span>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RevendedorasPage() {
    const [isPending, startTransition] = useTransition();
    const [revendedoras, setRevendedoras] = useState<RevendedoraItem[]>([]);
    const [colaboradoras, setColaboradoras] = useState<ColaboradoraItem[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");
    const [consultoraFilter, setConsultoraFilter] = useState("todos");
    const [docsFilter, setDocsFilter] = useState("todos");
    const [showNew, setShowNew] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [r, c] = await Promise.all([getRevendedoras(), getColaboradoras()]);
        setRevendedoras(r);
        setColaboradoras(c);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function showMsg(type: "success" | "error", msg: string) {
        if (type === "success") {
            setSuccess(msg);
            setTimeout(() => setSuccess(null), 3000);
        } else {
            setError(msg);
            setTimeout(() => setError(null), 4000);
        }
    }

    function handleNew(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await criarRevendedora(fd);
            if (res.success) {
                showMsg("success", "Revendedora criada com sucesso!");
                setShowNew(false);
                loadData();
            } else {
                showMsg("error", res.error || "Erro ao criar revendedora");
            }
        });
    }

    function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editId) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await atualizarMembro(editId, fd);
            if (res.success) {
                showMsg("success", "Revendedora atualizada!");
                setEditId(null);
                loadData();
            } else {
                showMsg("error", res.error || "Erro ao atualizar");
            }
        });
    }

    function handleDelete(id: string, name: string) {
        if (!confirm(`Remover "${name}"? Esta ação não pode ser desfeita.`)) return;
        startTransition(async () => {
            const res = await deletarMembro(id);
            if (res.success) {
                showMsg("success", `"${name}" removida`);
                loadData();
            } else {
                showMsg("error", res.error || "Erro ao remover");
            }
        });
    }

    function handleVincular(revendedoraId: string, colaboradoraId: string) {
        startTransition(async () => {
            const cId = colaboradoraId === "none" ? null : colaboradoraId;
            const res = await vincularRevendedora(revendedoraId, cId);
            if (res.success) {
                showMsg("success", "Vínculo atualizado!");
                loadData();
            } else {
                showMsg("error", res.error || "Erro ao vincular");
            }
        });
    }

    // Filtros
    const filtered = revendedoras.filter((r) => {
        const matchSearch =
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.whatsapp.includes(search) ||
            r.email.toLowerCase().includes(search.toLowerCase()) ||
            (r.cedula && r.cedula.includes(search));

        const matchStatus =
            statusFilter === "todos" ? true :
            statusFilter === "ativa" ? r.is_active :
            statusFilter === "inativa" ? !r.is_active :
            true;

        const matchConsultora =
            consultoraFilter === "todos" ? true :
            r.colaboradora?.id === consultoraFilter;

        const matchDocs =
            docsFilter === "todos" ? true :
            docsFilter === "pendente" ? (r.doc_ci_status !== "aprovado" || r.doc_contrato_status !== "aprovado") :
            docsFilter === "aprovado" ? (r.doc_ci_status === "aprovado" && r.doc_contrato_status === "aprovado") :
            true;

        return matchSearch && matchStatus && matchConsultora && matchDocs;
    });

    const ativas = revendedoras.filter((r) => r.is_active).length;
    const pendentes = revendedoras.filter((r) => r.documentos_pendentes > 0).length;

    const editingRevend = editId ? revendedoras.find((r) => r.id === editId) : null;

    return (
        <>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="admin-header">
                <div>
                    <div style={{ fontSize: "11px", color: "var(--admin-text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        ADMIN / REVENDEDORAS
                    </div>
                    <h1 style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                        Revendedoras
                    </h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Badge ativas */}
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 500,
                        background: "#1C3A35", color: "#4ADE80", border: "1px solid #2A5A2A",
                    }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ADE80" }} />
                        {ativas} ativas
                    </span>
                    {/* Badge pendentes */}
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 500,
                        background: "#3A3A1C", color: "#FACC15", border: "1px solid #5A5A2A",
                    }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FACC15" }} />
                        {pendentes} pendentes
                    </span>
                    {/* Nova revendedora */}
                    <Dialog open={showNew} onOpenChange={setShowNew}>
                        <DialogTrigger asChild>
                            <Button size="sm" style={{ background: "var(--admin-accent)", color: "#fff" }}>
                                <UserPlus className="w-4 h-4 mr-2" /> Nova revendedora
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Revendedora</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleNew} className="space-y-4">
                                <div>
                                    <Label htmlFor="new-name">Nome *</Label>
                                    <Input id="new-name" name="name" required placeholder="Nome completo" />
                                </div>
                                <div>
                                    <Label htmlFor="new-whatsapp">WhatsApp *</Label>
                                    <Input id="new-whatsapp" name="whatsapp" required placeholder="+55 ..." />
                                </div>
                                <div>
                                    <Label htmlFor="new-email">Email</Label>
                                    <Input id="new-email" name="email" type="email" placeholder="email@exemplo.com" />
                                </div>
                                <div>
                                    <Label htmlFor="new-taxa">Comissão %</Label>
                                    <Input id="new-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue="10" />
                                </div>
                                <div>
                                    <Label htmlFor="new-colab">Colaboradora</Label>
                                    <select
                                        id="new-colab"
                                        name="colaboradora_id"
                                        style={{
                                            width: "100%", padding: "8px 12px", borderRadius: "6px",
                                            border: "1px solid var(--admin-border)",
                                            background: "var(--admin-bg)", color: "var(--admin-text)",
                                        }}
                                    >
                                        <option value="">Sem colaboradora</option>
                                        {colaboradoras.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="new-avatar">Foto</Label>
                                    <Input id="new-avatar" name="avatar" type="file" accept="image/*" />
                                </div>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? "Criando..." : "Criar Revendedora"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="admin-content" style={{ padding: "24px 32px", gap: "0" }}>
                {/* Toasts */}
                {success && <div className="admin-toast admin-toast-success">✅ {success}</div>}
                {error && <div className="admin-toast admin-toast-error">❌ {error}</div>}

                {/* ── Filtros ────────────────────────────────────────────────── */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    marginBottom: "20px", flexWrap: "wrap",
                }}>
                    {/* Busca */}
                    <div style={{
                        position: "relative", flex: "1 1 260px", maxWidth: "360px",
                    }}>
                        <Search className="w-4 h-4" style={{
                            position: "absolute", left: "12px", top: "50%",
                            transform: "translateY(-50%)", color: "var(--admin-text-muted)",
                        }} />
                        <Input
                            placeholder="Buscar por nome, CI ou e-mail..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                paddingLeft: "36px", background: "var(--admin-bg)",
                                borderColor: "var(--admin-border)", color: "var(--admin-text)",
                            }}
                        />
                    </div>

                    {/* Status */}
                    <div style={{ position: "relative" }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: "8px 28px 8px 12px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)",
                                background: "var(--admin-bg)", color: "var(--admin-text)",
                                fontSize: "13px", cursor: "pointer", appearance: "none",
                            }}
                        >
                            <option value="todos">Status: Todos</option>
                            <option value="ativa">Ativas</option>
                            <option value="inativa">Inativas</option>
                        </select>
                        <ChevronDown className="w-3 h-3" style={{
                            position: "absolute", right: "8px", top: "50%",
                            transform: "translateY(-50%)", color: "var(--admin-text-muted)", pointerEvents: "none",
                        }} />
                    </div>

                    {/* Consultora */}
                    <div style={{ position: "relative" }}>
                        <select
                            value={consultoraFilter}
                            onChange={(e) => setConsultoraFilter(e.target.value)}
                            style={{
                                padding: "8px 28px 8px 12px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)",
                                background: "var(--admin-bg)", color: "var(--admin-text)",
                                fontSize: "13px", cursor: "pointer", appearance: "none",
                            }}
                        >
                            <option value="todos">Consultora: Todas</option>
                            {colaboradoras.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3" style={{
                            position: "absolute", right: "8px", top: "50%",
                            transform: "translateY(-50%)", color: "var(--admin-text-muted)", pointerEvents: "none",
                        }} />
                    </div>

                    {/* Docs */}
                    <div style={{ position: "relative" }}>
                        <select
                            value={docsFilter}
                            onChange={(e) => setDocsFilter(e.target.value)}
                            style={{
                                padding: "8px 28px 8px 12px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)",
                                background: "var(--admin-bg)", color: "var(--admin-text)",
                                fontSize: "13px", cursor: "pointer", appearance: "none",
                            }}
                        >
                            <option value="todos">Docs: Todos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="aprovado">Aprovados</option>
                        </select>
                        <ChevronDown className="w-3 h-3" style={{
                            position: "absolute", right: "8px", top: "50%",
                            transform: "translateY(-50%)", color: "var(--admin-text-muted)", pointerEvents: "none",
                        }} />
                    </div>

                    <div style={{ marginLeft: "auto" }}>
                        <Button variant="outline" size="sm" style={{
                            borderColor: "var(--admin-border)", color: "var(--admin-text-muted)",
                            background: "transparent",
                        }}>
                            <Download className="w-4 h-4 mr-2" /> Exportar
                        </Button>
                    </div>
                </div>

                {/* ── Tabela ─────────────────────────────────────────────────── */}
                {loading ? (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "60px 0", color: "var(--admin-text-muted)",
                    }}>
                        Cargando revendedoras...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", padding: "60px 0", color: "var(--admin-text-muted)",
                        gap: "12px",
                    }}>
                        <Search className="w-10 h-10" />
                        <p>{search ? "Nenhuma revendedora encontrada" : "Nenhuma revendedora cadastrada"}</p>
                    </div>
                ) : (
                    <div style={{
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius)",
                        overflow: "hidden",
                    }}>
                        {/* Header */}
                        <div style={{
                            display: "flex", alignItems: "center",
                            height: "34px", paddingInline: "24px",
                            background: "#111111",
                            borderBottom: "1px solid #1E1E1E",
                            fontSize: "10px", fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "1px",
                            color: "var(--admin-text-dim)",
                        }}>
                            <div style={{ flex: "2 1 0%" }}>Revendedora</div>
                            <div style={{ width: "130px", flexShrink: 0, textAlign: "center" }}>Consultora</div>
                            <div style={{ width: "90px", flexShrink: 0, textAlign: "center" }}>Maleta</div>
                            <div style={{ width: "110px", flexShrink: 0, textAlign: "center" }}>Documentos</div>
                            <div style={{ width: "110px", flexShrink: 0, textAlign: "right" }}>Faturamento</div>
                            <div style={{ width: "90px", flexShrink: 0, textAlign: "center" }}>Status</div>
                            <div style={{ width: "40px", flexShrink: 0 }} />
                        </div>

                        {/* Rows */}
                        {filtered.map((r) => {
                            const avatarColor = getAvatarColor(r.name);
                            const colabColor = r.colaboradora ? getAvatarColor(r.colaboradora.name) : "#555";
                            return (
                                <div key={r.id} style={{
                                    display: "flex", alignItems: "center",
                                    height: "58px", paddingInline: "24px",
                                    background: "#141A12",
                                    borderBottom: "1px solid #1A1A1A",
                                    fontSize: "12px", lineHeight: "16px",
                                }}>
                                    {/* Revendedora */}
                                    <div style={{ flex: "2 1 0%", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{
                                            width: "36px", height: "36px", borderRadius: "50%",
                                            background: avatarColor, color: "#fff",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "11px", fontWeight: 700, flexShrink: 0,
                                            overflow: "hidden",
                                        }}>
                                            {r.avatar_url ? (
                                                <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                getInitials(r.name)
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ color: "#DDDDDD", fontSize: "13px", fontWeight: 600, lineHeight: "16px" }}>
                                                {r.name}
                                                {r.documentos_pendentes > 0 && (
                                                    <span style={{
                                                        marginLeft: "8px",
                                                        padding: "1px 6px", borderRadius: "4px",
                                                        fontSize: "9px", fontWeight: 600,
                                                        background: "#3A3A1C", color: "#FACC15",
                                                    }}>
                                                        CI pendente
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: "#555555", fontSize: "11px", lineHeight: "14px" }}>
                                                {r.email} · CI: {r.cedula || "—"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Consultora */}
                                    <div style={{ width: "130px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                        {r.colaboradora ? (
                                            <>
                                                <div style={{
                                                    width: "18px", height: "18px", borderRadius: "50%",
                                                    background: colabColor, color: "#fff",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "7px", fontWeight: 700, flexShrink: 0,
                                                }}>
                                                    {getInitials(r.colaboradora.name).slice(0, 2)}
                                                </div>
                                                <span style={{ color: "#888888", fontSize: "12px" }}>
                                                    {r.colaboradora.name.split(" ").map((n) => n[0]).join("").toUpperCase() === getInitials(r.colaboradora.name)
                                                        ? r.colaboradora.name
                                                        : `M. ${r.colaboradora.name.split(" ").pop()}`}
                                                </span>
                                            </>
                                        ) : (
                                            <span style={{ color: "#555555", fontSize: "12px" }}>—</span>
                                        )}
                                    </div>

                                    {/* Maleta */}
                                    <div style={{ width: "90px", flexShrink: 0, display: "flex", justifyContent: "center" }}>
                                        <MaletaBadge status={r.maleta_status} />
                                    </div>

                                    {/* Documentos */}
                                    <div style={{ width: "110px", flexShrink: 0, display: "flex", justifyContent: "center", gap: "5px" }}>
                                        <DocBadge status={r.doc_ci_status} label="CI" />
                                        <DocBadge status={r.doc_contrato_status} label="Contrato" />
                                    </div>

                                    {/* Faturamento */}
                                    <div style={{ width: "110px", flexShrink: 0, textAlign: "right" }}>
                                        <span style={{
                                            color: "#BBBBBB", fontSize: "13px",
                                            fontFamily: "'Playfair Display', system-ui, serif",
                                        }}>
                                            {formatGsCompact(r.faturamento_total || 0)}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div style={{ width: "90px", flexShrink: 0, display: "flex", justifyContent: "center" }}>
                                        <StatusBadge active={r.is_active} />
                                    </div>

                                    {/* Ação */}
                                    <div style={{ width: "40px", flexShrink: 0, display: "flex", justifyContent: "center", gap: "4px" }}>
                                        <Link href={`/admin/revendedoras/${r.id}`} style={{ color: "#444444" }} title="Ver perfil">
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Footer ─────────────────────────────────────────────────── */}
                {!loading && filtered.length > 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginTop: "16px", paddingTop: "12px",
                        borderTop: "1px solid var(--admin-border)",
                    }}>
                        <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                            Total: {filtered.length} revendedoras
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button style={{
                                width: "28px", height: "28px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)", background: "var(--admin-bg)",
                                color: "var(--admin-text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer",
                            }}>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button style={{
                                width: "28px", height: "28px", borderRadius: "6px",
                                border: "1px solid var(--admin-accent)", background: "var(--admin-accent)",
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: "12px", fontWeight: 600,
                            }}>
                                1
                            </button>
                            <button style={{
                                width: "28px", height: "28px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)", background: "var(--admin-bg)",
                                color: "var(--admin-text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: "12px",
                            }}>
                                2
                            </button>
                            <button style={{
                                width: "28px", height: "28px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)", background: "var(--admin-bg)",
                                color: "var(--admin-text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: "12px",
                            }}>
                                3
                            </button>
                            <button style={{
                                width: "28px", height: "28px", borderRadius: "6px",
                                border: "1px solid var(--admin-border)", background: "var(--admin-bg)",
                                color: "var(--admin-text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer",
                            }}>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Edit Dialog ────────────────────────────────────────────── */}
                <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Revendedora</DialogTitle>
                        </DialogHeader>
                        {editingRevend && (
                            <form onSubmit={handleEdit} className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">Nome *</Label>
                                    <Input id="edit-name" name="name" required defaultValue={editingRevend.name} />
                                </div>
                                <div>
                                    <Label htmlFor="edit-whatsapp">WhatsApp *</Label>
                                    <Input id="edit-whatsapp" name="whatsapp" required defaultValue={editingRevend.whatsapp} />
                                </div>
                                <div>
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input id="edit-email" name="email" type="email" defaultValue={editingRevend.email} />
                                </div>
                                <div>
                                    <Label htmlFor="edit-taxa">Comissão %</Label>
                                    <Input id="edit-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue={editingRevend.taxa_comissao} />
                                </div>
                                <div>
                                    <Label htmlFor="edit-colab">Colaboradora</Label>
                                    <select
                                        id="edit-colab"
                                        name="colaboradora_id"
                                        defaultValue={editingRevend.colaboradora?.id || ""}
                                        style={{
                                            width: "100%", padding: "8px 12px", borderRadius: "6px",
                                            border: "1px solid var(--admin-border)",
                                            background: "var(--admin-bg)", color: "var(--admin-text)",
                                        }}
                                    >
                                        <option value="">Sem colaboradora</option>
                                        {colaboradoras.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-active">Status</Label>
                                    <select
                                        id="edit-active"
                                        name="is_active"
                                        defaultValue={editingRevend.is_active ? "true" : "false"}
                                        style={{
                                            width: "100%", padding: "8px 12px", borderRadius: "6px",
                                            border: "1px solid var(--admin-border)",
                                            background: "var(--admin-bg)", color: "var(--admin-text)",
                                        }}
                                    >
                                        <option value="true">Ativa</option>
                                        <option value="false">Inativa</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-avatar">Nova Foto</Label>
                                    <Input id="edit-avatar" name="avatar" type="file" accept="image/*" />
                                </div>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
