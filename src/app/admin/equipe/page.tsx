"use client";

import { useState, useEffect, useTransition } from "react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Phone, Percent, Trash2, Link2, X } from "lucide-react";

export default function EquipePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [tab, setTab] = useState<"colaboradoras" | "revendedoras">("colaboradoras");
    const [colaboradoras, setColaboradoras] = useState<ColaboradoraItem[]>([]);
    const [revendedoras, setRevendedoras] = useState<RevendedoraItem[]>([]);
    const [showNewColab, setShowNewColab] = useState(false);
    const [showNewRevend, setShowNewRevend] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [c, r] = await Promise.all([getColaboradoras(), getRevendedoras()]);
        setColaboradoras(c);
        setRevendedoras(r);
    }

    function showMsg(type: "success" | "error", msg: string) {
        if (type === "success") {
            setSuccess(msg);
            setTimeout(() => setSuccess(null), 3000);
        } else {
            setError(msg);
            setTimeout(() => setError(null), 4000);
        }
    }

    function handleNewColab(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await criarColaboradora(fd);
            if (res.success) {
                showMsg("success", "Colaboradora criada!");
                setShowNewColab(false);
                loadData();
            } else {
                showMsg("error", res.error || "Erro");
            }
        });
    }

    function handleNewRevend(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await criarRevendedora(fd);
            if (res.success) {
                showMsg("success", "Revendedora criada!");
                setShowNewRevend(false);
                loadData();
            } else {
                showMsg("error", res.error || "Erro");
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
                showMsg("error", res.error || "Erro");
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
                showMsg("error", res.error || "Erro");
            }
        });
    }

    return (
        <>
            <header className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Users className="w-6 h-6" />
                    <div>
                        <h1>Equipe</h1>
                        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                            Gerenciar colaboradoras e revendedoras
                        </p>
                    </div>
                </div>
            </header>

            <div className="admin-content">
                {/* Toast */}
                {success && <div className="admin-toast admin-toast-success">✅ {success}</div>}
                {error && <div className="admin-toast admin-toast-error">❌ {error}</div>}

                {/* Tabs */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                    <Button
                        variant={tab === "colaboradoras" ? "default" : "outline"}
                        onClick={() => setTab("colaboradoras")}
                    >
                        Colaboradoras
                        <Badge variant="secondary" className="ml-2">{colaboradoras.length}</Badge>
                    </Button>
                    <Button
                        variant={tab === "revendedoras" ? "default" : "outline"}
                        onClick={() => setTab("revendedoras")}
                    >
                        Revendedoras
                        <Badge variant="secondary" className="ml-2">{revendedoras.length}</Badge>
                    </Button>
                </div>

                {/* ===== COLABORADORAS TAB ===== */}
                {tab === "colaboradoras" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                            <Dialog open={showNewColab} onOpenChange={setShowNewColab}>
                                <DialogTrigger asChild>
                                    <Button><UserPlus className="w-4 h-4 mr-2" /> Nova Colaboradora</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nova Colaboradora</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleNewColab} className="space-y-4">
                                        <div>
                                            <Label htmlFor="colab-name">Nome *</Label>
                                            <Input id="colab-name" name="name" required placeholder="Nome completo" />
                                        </div>
                                        <div>
                                            <Label htmlFor="colab-whatsapp">WhatsApp *</Label>
                                            <Input id="colab-whatsapp" name="whatsapp" required placeholder="+595 ..." />
                                        </div>
                                        <div>
                                            <Label htmlFor="colab-email">Email</Label>
                                            <Input id="colab-email" name="email" type="email" placeholder="email@..." />
                                        </div>
                                        <div>
                                            <Label htmlFor="colab-taxa">Comissão %</Label>
                                            <Input id="colab-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue="5" placeholder="0" />
                                        </div>
                                        <div>
                                            <Label htmlFor="colab-avatar">Foto</Label>
                                            <Input id="colab-avatar" name="avatar" type="file" accept="image/*" />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isPending}>
                                            {isPending ? "Criando..." : "Criar Colaboradora"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {colaboradoras.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Nenhuma colaboradora cadastrada</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                                {colaboradoras.map((c) => (
                                    <Card key={c.id}>
                                        <CardContent className="pt-6">
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                                <div style={{
                                                    width: 48, height: 48, borderRadius: "50%",
                                                    background: "var(--admin-primary)", color: "white",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "18px", fontWeight: 600,
                                                    overflow: "hidden",
                                                }}>
                                                    {c.avatar_url ? (
                                                        <img src={c.avatar_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        c.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 600, fontSize: "15px" }}>{c.name}</p>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--admin-text-muted)" }}>
                                                        <Phone className="w-3 h-3" /> {c.whatsapp}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.name)} title="Remover">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <Badge variant="outline">
                                                    <Percent className="w-3 h-3 mr-1" /> {c.taxa_comissao}%
                                                </Badge>
                                                <Badge variant="secondary">
                                                    <Users className="w-3 h-3 mr-1" /> {c.revendedorasCount} revendedoras
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ===== REVENDEDORAS TAB ===== */}
                {tab === "revendedoras" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                            <Dialog open={showNewRevend} onOpenChange={setShowNewRevend}>
                                <DialogTrigger asChild>
                                    <Button><UserPlus className="w-4 h-4 mr-2" /> Nova Revendedora</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nova Revendedora</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleNewRevend} className="space-y-4">
                                        <div>
                                            <Label htmlFor="rev-name">Nome *</Label>
                                            <Input id="rev-name" name="name" required placeholder="Nome completo" />
                                        </div>
                                        <div>
                                            <Label htmlFor="rev-whatsapp">WhatsApp *</Label>
                                            <Input id="rev-whatsapp" name="whatsapp" required placeholder="+595 ..." />
                                        </div>
                                        <div>
                                            <Label htmlFor="rev-email">Email</Label>
                                            <Input id="rev-email" name="email" type="email" placeholder="email@..." />
                                        </div>
                                        <div>
                                            <Label htmlFor="rev-taxa">Comissão %</Label>
                                            <Input id="rev-taxa" name="taxa_comissao" type="number" step="0.01" defaultValue="10" placeholder="0" />
                                        </div>
                                        <div>
                                            <Label htmlFor="rev-colab">Colaboradora</Label>
                                            <select
                                                id="rev-colab"
                                                name="colaboradora_id"
                                                className="admin-select"
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
                                            >
                                                <option value="">Sem colaboradora</option>
                                                {colaboradoras.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="rev-avatar">Foto</Label>
                                            <Input id="rev-avatar" name="avatar" type="file" accept="image/*" />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isPending}>
                                            {isPending ? "Criando..." : "Criar Revendedora"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {revendedoras.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Nenhuma revendedora cadastrada</p>
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
                                                <TableHead>Comissão</TableHead>
                                                <TableHead>Colaboradora</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {revendedoras.map((r) => (
                                                <TableRow key={r.id}>
                                                    <TableCell>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                            <div style={{
                                                                width: 32, height: 32, borderRadius: "50%",
                                                                background: "#a855f7", color: "white",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: "13px", fontWeight: 600,
                                                                overflow: "hidden", flexShrink: 0,
                                                            }}>
                                                                {r.avatar_url ? (
                                                                    <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                ) : (
                                                                    r.name.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 500, fontSize: "14px" }}>{r.name}</p>
                                                                {r.email && <p style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>{r.email}</p>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell style={{ fontSize: "13px" }}>{r.whatsapp}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{r.taxa_comissao}%</Badge>
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
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.name)}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
