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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Phone, Percent, Trash2, Search, Edit, X, ArrowRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export default function RevendedorasPage() {
    const [isPending, startTransition] = useTransition();
    const [revendedoras, setRevendedoras] = useState<RevendedoraItem[]>([]);
    const [colaboradoras, setColaboradoras] = useState<ColaboradoraItem[]>([]);
    const [search, setSearch] = useState("");
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

    const filtered = revendedoras.filter(
        (r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.whatsapp.includes(search) ||
            r.email.toLowerCase().includes(search.toLowerCase())
    );

    const editingRevend = editId ? revendedoras.find((r) => r.id === editId) : null;

    return (
        <>
            <header className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Users className="w-6 h-6" />
                    <div>
                        <h1>Revendedoras</h1>
                        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                            Gerenciar revendedoras da Monarca
                        </p>
                    </div>
                </div>
            </header>

            <div className="admin-content">
                {/* Toast */}
                {success && <div className="admin-toast admin-toast-success">✅ {success}</div>}
                {error && <div className="admin-toast admin-toast-error">❌ {error}</div>}

                {/* Actions bar */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 240px", maxWidth: "400px" }}>
                        <Search className="w-4 h-4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)" }} />
                        <Input
                            placeholder="Buscar por nome, WhatsApp ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: "36px" }}
                        />
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                        <Dialog open={showNew} onOpenChange={setShowNew}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="w-4 h-4 mr-2" /> Nova Revendedora
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
                </div>

                {/* Summary */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <Badge variant="secondary" style={{ fontSize: "13px", padding: "4px 12px" }}>
                        {revendedoras.length} revendedoras
                    </Badge>
                    <Badge variant="outline" style={{ fontSize: "13px", padding: "4px 12px" }}>
                        {revendedoras.filter((r) => r.is_active).length} ativas
                    </Badge>
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
                                {search ? "Nenhuma revendedora encontrada" : "Nenhuma revendedora cadastrada"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>WhatsApp</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Comissão</TableHead>
                                        <TableHead>Colaboradora</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[80px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: "50%",
                                                        background: "#a855f7", color: "white",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: "14px", fontWeight: 600,
                                                        overflow: "hidden", flexShrink: 0,
                                                    }}>
                                                        {r.avatar_url ? (
                                                            <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        ) : (
                                                            r.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 500, fontSize: "14px" }}>{r.name}</span>
                                                        <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                                                            {r.documentos_pendentes > 0 && (
                                                                <span className="admin-badge" style={{ background: "rgba(250, 204, 21, 0.12)", color: "#facc15", fontSize: "10px", padding: "2px 8px" }}>
                                                                    <AlertTriangle className="w-3 h-3" style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                                                                    Doc pendiente
                                                                </span>
                                                            )}
                                                            {r.maletas_aguardando_revisao > 0 && (
                                                                <span className="admin-badge" style={{ background: "rgba(96, 165, 250, 0.12)", color: "#60a5fa", fontSize: "10px", padding: "2px 8px" }}>
                                                                    <Clock className="w-3 h-3" style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                                                                    Acerto aguardando
                                                                </span>
                                                            )}
                                                            {r.documentos_pendentes === 0 && r.maletas_aguardando_revisao === 0 && (
                                                                <span className="admin-badge" style={{ background: "rgba(74, 222, 128, 0.12)", color: "#4ade80", fontSize: "10px", padding: "2px 8px" }}>
                                                                    <CheckCircle2 className="w-3 h-3" style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                                                                    OK
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell style={{ fontSize: "13px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    {r.whatsapp}
                                                </div>
                                            </TableCell>
                                            <TableCell style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                                                {r.email || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    <Percent className="w-3 h-3 mr-1" /> {r.taxa_comissao}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    value={r.colaboradora?.id || "none"}
                                                    onChange={(e) => handleVincular(r.id, e.target.value)}
                                                    disabled={isPending}
                                                    style={{
                                                        padding: "4px 8px", borderRadius: "6px", fontSize: "13px",
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
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={r.is_active ? "default" : "secondary"}>
                                                    {r.is_active ? "Ativa" : "Inativa"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div style={{ display: "flex", gap: "4px" }}>
                                                    <Button variant="ghost" size="icon" asChild title="Ver perfil">
                                                        <Link href={`/admin/revendedoras/${r.id}`}>
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditId(r.id)} title="Editar">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.name)} title="Remover">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Edit Dialog */}
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
