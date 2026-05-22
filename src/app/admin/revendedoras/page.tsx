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
    getUserRoleInfo,
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
    AlertTriangle,
    RotateCcw,
} from "lucide-react";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const avatarColors = [
    "var(--admin-accent)", "#7C3A2D", "#2D5A7C", "#5A2D7C", "#7C5A2D", "#2D7C5A", "#3A2D7C", "#7C2D5A",
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
                background: "var(--admin-surface)",
                color: "var(--admin-text-dim)",
                border: "1px solid var(--admin-border)",
            }}>
                Sem maleta
            </span>
        );
    }
    const configs: Record<string, { bg: string; color: string; border: string; label: string }> = {
        ativa: { bg: "var(--admin-accent-hover)", color: "var(--admin-success)", border: "var(--admin-border)", label: "Ativa" },
        atrasada: { bg: "var(--admin-danger-15)", color: "var(--admin-danger)", border: "var(--admin-border)", label: "Atrasada" },
        aguardando_revisao: { bg: "var(--admin-warning-15)", color: "var(--admin-warning)", border: "var(--admin-border)", label: "Ag. revisão" },
        concluida: { bg: "var(--admin-accent-hover)", color: "var(--admin-success)", border: "var(--admin-border)", label: "Concluída" },
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
            background: "var(--admin-accent-hover)",
            color: "var(--admin-success)",
            border: "1px solid var(--admin-border)",
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
            background: "var(--admin-surface)",
            color: "var(--admin-text-dim)",
            border: "1px solid var(--admin-border)",
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
            background: ok ? "var(--admin-accent-hover)" : "var(--admin-danger-15)",
            color: ok ? "var(--admin-success)" : "var(--admin-danger)",
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
    const [userRole, setUserRole] = useState<string>("");
    const [userProfileId, setUserProfileId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [r, c, roleInfo] = await Promise.all([
                getRevendedoras(),
                getColaboradoras().catch((): ColaboradoraItem[] => []),
                getUserRoleInfo(),
            ]);
            setRevendedoras(r);
            setColaboradoras(c);
            setUserRole(roleInfo.role);
            setUserProfileId(roleInfo.profileId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function handleNew(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (userRole === "COLABORADORA" && userProfileId) {
            fd.set("colaboradora_id", userProfileId);
        }
        startTransition(async () => {
            const res = await criarRevendedora(fd);
            if (res.success) {
                toast.success("¡Revendedora creada con éxito!");
                setShowNew(false);
                loadData();
            } else {
                toast.error(res.error || "Error al crear la revendedora");
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
                toast.success("¡Revendedora actualizada!");
                setEditId(null);
                loadData();
            } else {
                toast.error(res.error || "Error al actualizar");
            }
        });
    }

    function handleDelete(id: string, name: string) {
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
        startTransition(async () => {
            const res = await deletarMembro(id);
            if (res.success) {
                toast.success(`"${name}" eliminada`);
                loadData();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        });
    }

    function handleVincular(revendedoraId: string, colaboradoraId: string) {
        startTransition(async () => {
            const cId = colaboradoraId === "none" ? null : colaboradoraId;
            const res = await vincularRevendedora(revendedoraId, cId);
            if (res.success) {
                toast.success("¡Vínculo actualizado!");
                loadData();
            } else {
                toast.error(res.error || "Error al vincular");
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
            <AdminTopHeader
                breadcrumb="Admin / Revendedoras"
                title="Revendedoras"
                action={
                    <>
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                            background: "var(--admin-accent-hover)", color: "var(--admin-success)", border: "1px solid var(--admin-border)",
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--admin-success)" }} />
                            {ativas} ativas
                        </span>
                        {pendentes > 0 && (
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                                background: "var(--admin-warning-15)", color: "var(--admin-warning)", border: "1px solid var(--admin-border)",
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--admin-warning)" }} />
                                {pendentes} pendentes
                            </span>
                        )}
                        <Dialog open={showNew} onOpenChange={setShowNew}>
                            <DialogTrigger asChild>
                                <Button size="sm" style={{ background: "var(--admin-accent)", color: "#fff" }}>
                                    <UserPlus className="w-4 h-4 mr-2" /> Nueva revendedora
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nueva Revendedora</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleNew} className="space-y-4">
                                    <div>
                                        <Label htmlFor="new-name">Nombre *</Label>
                                        <Input id="new-name" name="name" required placeholder="Nombre completo" />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-whatsapp">WhatsApp *</Label>
                                        <Input id="new-whatsapp" name="whatsapp" required placeholder="+595 ..." />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-email">Email</Label>
                                        <Input id="new-email" name="email" type="email" placeholder="email@ejemplo.com" />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-taxa">Comisión %</Label>
                                        <Input id="new-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue="10" />
                                    </div>
                                    {userRole === "ADMIN" && (
                                        <div>
                                            <Label htmlFor="new-colab">Consultora</Label>
                                            <select
                                                id="new-colab"
                                                name="colaboradora_id"
                                                style={{
                                                    width: "100%", padding: "8px 12px", borderRadius: "6px",
                                                    border: "1px solid var(--admin-border)",
                                                    background: "var(--admin-bg)", color: "var(--admin-text)",
                                                }}
                                            >
                                                <option value="">Sin consultora</option>
                                                {colaboradoras.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="new-avatar">Foto</Label>
                                        <Input id="new-avatar" name="avatar" type="file" accept="image/*" />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isPending}>
                                        {isPending ? "Creando..." : "Crear Revendedora"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </>
                }
            />

            <div className="admin-content" style={{ gap: "0" }}>
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
                            placeholder="Buscar por nombre, CI o email..."
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
                    <div className="flex flex-col gap-3 py-4">
                        <SkeletonCard className="bg-[var(--admin-surface)] border-[var(--admin-border)]" />
                        <SkeletonCard className="bg-[var(--admin-surface)] border-[var(--admin-border)]" />
                        <SkeletonCard className="bg-[var(--admin-surface)] border-[var(--admin-border)]" />
                    </div>
                ) : error ? (
                    <ErrorState
                        title="Error al cargar"
                        description={error}
                        onRetry={() => { setError(null); loadData(); }}
                        className="py-12"
                    />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<Search className="w-10 h-10" />}
                        title={search ? "Ninguna revendedora encontrada" : "No hay revendedoras"}
                        description={search ? "Probá con otros términos de búsqueda." : "Aún no tenés revendedoras en el sistema."}
                        className="py-12"
                    />
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
                            background: "var(--admin-bg)",
                            borderBottom: "1px solid var(--admin-surface-hover)",
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
                            const colabColor = r.colaboradora ? getAvatarColor(r.colaboradora.name) : "var(--admin-text-muted)";
                            return (
                                <div key={r.id} style={{
                                    display: "flex", alignItems: "center",
                                    height: "58px", paddingInline: "24px",
                                    background: "var(--admin-surface)",
                                    borderBottom: "1px solid var(--admin-surface)",
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
                                            <div style={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600, lineHeight: "16px" }}>
                                                {r.name}
                                                {r.documentos_pendentes > 0 && (
                                                    <span style={{
                                                        marginLeft: "8px",
                                                        padding: "1px 6px", borderRadius: "4px",
                                                        fontSize: "9px", fontWeight: 600,
                                                        background: "var(--admin-warning-15)", color: "var(--admin-warning)",
                                                    }}>
                                                        CI pendente
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: "var(--admin-text-muted)", fontSize: "11px", lineHeight: "14px" }}>
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
                                                <span style={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
                                                    {r.colaboradora.name.split(" ").map((n) => n[0]).join("").toUpperCase() === getInitials(r.colaboradora.name)
                                                        ? r.colaboradora.name
                                                        : `M. ${r.colaboradora.name.split(" ").pop()}`}
                                                </span>
                                            </>
                                        ) : (
                                            <span style={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>—</span>
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
                                            color: "var(--admin-text-muted)", fontSize: "13px",
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
                                        <Link href={`/admin/revendedoras/${r.id}`} style={{ color: "var(--admin-text-dim)" }} title="Ver perfil">
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
                                    <Label htmlFor="edit-name">Nombre *</Label>
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
                                    <Label htmlFor="edit-taxa">Comisión %</Label>
                                    <Input id="edit-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue={editingRevend.taxa_comissao} />
                                </div>
                                {userRole === "ADMIN" && (
                                    <div>
                                        <Label htmlFor="edit-colab">Consultora</Label>
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
                                            <option value="">Sin consultora</option>
                                            {colaboradoras.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="edit-active">Estado</Label>
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
                                        <option value="true">Activa</option>
                                        <option value="false">Inactiva</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-avatar">Nueva Foto</Label>
                                    <Input id="edit-avatar" name="avatar" type="file" accept="image/*" />
                                </div>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
