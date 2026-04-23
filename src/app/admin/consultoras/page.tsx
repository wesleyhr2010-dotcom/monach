"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getColaboradoras,
    criarColaboradora,
    deletarMembro,
} from "../actions-equipe";
import type { ColaboradoraItem } from "../actions-equipe";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatGsCompact } from "@/lib/format";
import { UserPlus, Search, Trash2, ArrowRight, Users, Phone, Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ConsultorasPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [consultoras, setConsultoras] = useState<ColaboradoraItem[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"todos" | "ativas" | "inativas">("todos");
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await getColaboradoras();
        setConsultoras(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
            const res = await criarColaboradora(fd);
            if (res.success) {
                showMsg("success", "Consultora criada com sucesso!");
                setShowNew(false);
                loadData();
            } else {
                showMsg("error", res.error || "Erro ao criar consultora");
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

    const filtered = consultoras.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === "todos"
                ? true
                : statusFilter === "ativas"
                ? c.is_active
                : !c.is_active;
        return matchesSearch && matchesStatus;
    });

    const ativas = consultoras.filter((c) => c.is_active).length;
    const inativas = consultoras.filter((c) => !c.is_active).length;

    return (
        <>
            <header className="admin-header">
                <div>
                    <div style={{ fontSize: "11px", color: "var(--admin-text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        ADMIN / CONSULTORAS
                    </div>
                    <h1>Consultoras</h1>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Badge variant="secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4ade80", marginRight: 6 }} />
                            {ativas} ativas
                        </Badge>
                        <Badge variant="secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#888", marginRight: 6 }} />
                            {inativas} inativa{inativas !== 1 ? "s" : ""}
                        </Badge>
                    </div>
                    <Dialog open={showNew} onOpenChange={setShowNew}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="w-4 h-4 mr-2" /> Nova Consultora
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Consultora</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleNew} className="space-y-4">
                                <div>
                                    <Label htmlFor="new-name">Nome *</Label>
                                    <Input id="new-name" name="name" required placeholder="Nome completo" />
                                </div>
                                <div>
                                    <Label htmlFor="new-whatsapp">WhatsApp *</Label>
                                    <Input id="new-whatsapp" name="whatsapp" required placeholder="+595 ..." />
                                </div>
                                <div>
                                    <Label htmlFor="new-email">Email</Label>
                                    <Input id="new-email" name="email" type="email" placeholder="email@..." />
                                </div>
                                <div>
                                    <Label htmlFor="new-taxa">Comissão %</Label>
                                    <Input id="new-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue="10" />
                                </div>
                                <div>
                                    <Label htmlFor="new-avatar">Foto</Label>
                                    <Input id="new-avatar" name="avatar" type="file" accept="image/*" />
                                </div>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? "Criando..." : "Criar e Enviar Convite"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="admin-content">
                {/* Toast */}
                {success && <div className="admin-toast admin-toast-success">✅ {success}</div>}
                {error && <div className="admin-toast admin-toast-error">❌ {error}</div>}

                {/* Filters */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "420px" }}>
                        <Search className="w-4 h-4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)" }} />
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: "36px" }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "todos" | "ativas" | "inativas")}
                        style={{
                            padding: "8px 12px", borderRadius: "6px", fontSize: "13px",
                            border: "1px solid var(--admin-border)",
                            background: "var(--admin-surface)", color: "var(--admin-text)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="todos">Status: Todos</option>
                        <option value="ativas">Ativas</option>
                        <option value="inativas">Inativas</option>
                    </select>
                </div>

                {/* Table */}
                {loading ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-muted-foreground">Carregando...</p>
                        </CardContent>
                    </Card>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                {search || statusFilter !== "todos" ? "Nenhuma consultora encontrada" : "Nenhuma consultora cadastrada"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: 24 }}>CONSULTORA</th>
                                            <th>REVENDEDORAS</th>
                                            <th>FATURAMENTO DO GRUPO</th>
                                            <th>COMISSÃO</th>
                                            <th>STATUS</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((c) => (
                                            <tr key={c.id}>
                                                <td style={{ paddingLeft: 24 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: "50%",
                                                            background: "linear-gradient(135deg, #35605a, #2a4d48)",
                                                            color: "white", display: "flex", alignItems: "center",
                                                            justifyContent: "center", fontSize: "14px", fontWeight: 600,
                                                            overflow: "hidden", flexShrink: 0,
                                                        }}>
                                                            {c.avatar_url ? (
                                                                <img src={c.avatar_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            ) : (
                                                                c.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: "14px" }}>{c.name}</p>
                                                            <p style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>{c.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span style={{ fontSize: "13px" }}>
                                                            {c.revendedorasAtivas} ativa{c.revendedorasAtivas !== 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: "14px" }}>{formatGsCompact(c.faturamentoGrupo)}</p>
                                                        <p style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                                                            G$ {(c.faturamentoGrupo / 12).toLocaleString("es-PY", { maximumFractionDigits: 0 })} este mês
                                                        </p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span style={{ fontSize: "13px", fontWeight: 500 }}>{c.taxa_comissao}%</span>
                                                        <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                                                            G$ {((c.faturamentoGrupo / 12) * (c.taxa_comissao / 100)).toLocaleString("es-PY", { maximumFractionDigits: 0 })} este mês
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="admin-badge" style={{
                                                        background: c.is_active ? "rgba(74, 222, 128, 0.12)" : "rgba(136, 136, 136, 0.12)",
                                                        color: c.is_active ? "#4ade80" : "#888",
                                                    }}>
                                                        {c.is_active ? "ATIVA" : "INATIVA"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "4px" }}>
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/admin/consultoras/${c.id}`}>
                                                                <ArrowRight className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.name)}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div style={{ fontSize: "12px", color: "var(--admin-text-muted)", marginTop: "8px" }}>
                    Total: {consultoras.length} consultora{consultoras.length !== 1 ? "s" : ""}
                </div>
            </div>
        </>
    );
}
