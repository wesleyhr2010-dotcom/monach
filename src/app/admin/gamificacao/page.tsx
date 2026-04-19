"use client";

import { useState, useEffect } from "react";
import { getNiveis, getRegras, getResgates, criarNivel, criarRegra, atualizarRegra, deletarRegra, atualizarStatusResgate } from "../actions-gamificacao";
import type { NivelGamificacaoItem, RegraGamificacaoItem, ResgateItem } from "../actions-gamificacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Award, Gift, Plus, Trash2, ToggleLeft, ToggleRight, Check, X } from "lucide-react";

export default function GamificacaoAdminPage() {
    const [niveis, setNiveis] = useState<NivelGamificacaoItem[]>([]);
    const [regras, setRegras] = useState<RegraGamificacaoItem[]>([]);
    const [resgates, setResgates] = useState<ResgateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNovoNivel, setShowNovoNivel] = useState(false);
    const [showNovaRegra, setShowNovaRegra] = useState(false);

    async function reload() {
        const [n, r, res] = await Promise.all([getNiveis(), getRegras(), getResgates()]);
        setNiveis(n);
        setRegras(r);
        setResgates(res);
        setLoading(false);
    }

    useEffect(() => { reload(); }, []);

    if (loading) {
        return (
            <>
                <header className="admin-header"><h1>Gamificação</h1></header>
                <div className="admin-content">
                    <p style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-text-muted)" }}>Carregando...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <header className="admin-header"><h1>🎮 Gamificação</h1></header>
            <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Níveis */}
                <Card>
                    <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <CardTitle style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Star className="w-4 h-4" style={{ color: "#d4af37" }} />
                            Níveis
                        </CardTitle>
                        <button
                            onClick={() => setShowNovoNivel(!showNovoNivel)}
                            style={{ fontSize: "12px", background: "#35605a", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            <Plus className="w-3 h-3" /> Novo Nível
                        </button>
                    </CardHeader>
                    <CardContent>
                        {showNovoNivel && <NovoNivelForm onCreated={() => { setShowNovoNivel(false); reload(); }} />}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="text-right">XP Mínimo</TableHead>
                                    <TableHead className="text-right">Bônus Comissão</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {niveis.map((n) => (
                                    <TableRow key={n.id}>
                                        <TableCell className="font-medium">{n.nome}</TableCell>
                                        <TableCell className="text-right tabular-nums">{n.xp_minimo} XP</TableCell>
                                        <TableCell className="text-right tabular-nums">+{n.bonus_comissao}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Regras */}
                <Card>
                    <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <CardTitle style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Award className="w-4 h-4" />
                            Regras de XP
                        </CardTitle>
                        <button
                            onClick={() => setShowNovaRegra(!showNovaRegra)}
                            style={{ fontSize: "12px", background: "#35605a", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            <Plus className="w-3 h-3" /> Nova Regra
                        </button>
                    </CardHeader>
                    <CardContent>
                        {showNovaRegra && <NovaRegraForm onCreated={() => { setShowNovaRegra(false); reload(); }} />}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Regra</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead className="text-right">Pontos</TableHead>
                                    <TableHead className="text-center">Ativo</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {regras.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <p className="font-medium">{r.nome}</p>
                                            <p style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>{r.descricao}</p>
                                        </TableCell>
                                        <TableCell><code style={{ fontSize: "11px" }}>{r.acao}</code></TableCell>
                                        <TableCell className="text-right tabular-nums font-bold">{r.pontos}</TableCell>
                                        <TableCell className="text-center">
                                            <button
                                                onClick={async () => {
                                                    await atualizarRegra(r.id, { ativo: !r.ativo });
                                                    reload();
                                                }}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: r.ativo ? "#10b981" : "#6b7280" }}
                                            >
                                                {r.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Deletar regra?")) {
                                                        await deletarRegra(r.id);
                                                        reload();
                                                    }
                                                }}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Resgates */}
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Gift className="w-4 h-4" />
                            Resgates Pendentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {resgates.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", textAlign: "center", padding: "16px 0" }}>
                                Nenhum resgate solicitado.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Revendedora</TableHead>
                                        <TableHead>Prêmio</TableHead>
                                        <TableHead className="text-right">Pontos</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-20">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resgates.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">{r.reseller_name}</TableCell>
                                            <TableCell>{r.premio}</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.pontos}</TableCell>
                                            <TableCell>
                                                <span style={{
                                                    fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px",
                                                    background: r.status === "pendente" ? "#f59e0b20" : r.status === "aprovado" ? "#10b98120" : "#6b728020",
                                                    color: r.status === "pendente" ? "#f59e0b" : r.status === "aprovado" ? "#10b981" : "#6b7280",
                                                }}>
                                                    {r.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {r.status === "pendente" && (
                                                    <div style={{ display: "flex", gap: "4px" }}>
                                                        <button
                                                            onClick={async () => { await atualizarStatusResgate(r.id, "aprovado"); reload(); }}
                                                            style={{ background: "#10b981", color: "white", border: "none", borderRadius: "4px", padding: "4px", cursor: "pointer" }}
                                                        ><Check className="w-3 h-3" /></button>
                                                        <button
                                                            onClick={async () => { await atualizarStatusResgate(r.id, "recusado"); reload(); }}
                                                            style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "4px", padding: "4px", cursor: "pointer" }}
                                                        ><X className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                                {r.status === "aprovado" && (
                                                    <button
                                                        onClick={async () => { await atualizarStatusResgate(r.id, "entregue"); reload(); }}
                                                        style={{ fontSize: "11px", background: "#35605a", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                                                    >Entregar</button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Mini forms

function NovoNivelForm({ onCreated }: { onCreated: () => void }) {
    const [nome, setNome] = useState("");
    const [xp, setXp] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [saving, setSaving] = useState(false);

    return (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", padding: "12px", background: "var(--admin-bg-secondary)", borderRadius: "8px" }}>
            <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="admin-input" style={{ flex: 1, minWidth: "120px" }} />
            <input placeholder="XP Mínimo" type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} className="admin-input" style={{ width: "100px" }} />
            <input placeholder="Bônus %" type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} className="admin-input" style={{ width: "80px" }} />
            <button
                disabled={saving || !nome}
                onClick={async () => {
                    setSaving(true);
                    await criarNivel({ nome, xp_minimo: xp, bonus_comissao: bonus });
                    setSaving(false);
                    onCreated();
                }}
                style={{ background: "#35605a", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "12px" }}
            >
                {saving ? "..." : "Criar"}
            </button>
        </div>
    );
}

function NovaRegraForm({ onCreated }: { onCreated: () => void }) {
    const [nome, setNome] = useState("");
    const [acao, setAcao] = useState("");
    const [pontos, setPontos] = useState(10);
    const [desc, setDesc] = useState("");
    const [saving, setSaving] = useState(false);

    return (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", padding: "12px", background: "var(--admin-bg-secondary)", borderRadius: "8px" }}>
            <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="admin-input" style={{ flex: 1, minWidth: "120px" }} />
            <input placeholder="Ação (ex: venda_maleta)" value={acao} onChange={(e) => setAcao(e.target.value)} className="admin-input" style={{ flex: 1, minWidth: "120px" }} />
            <input placeholder="Pontos" type="number" value={pontos} onChange={(e) => setPontos(Number(e.target.value))} className="admin-input" style={{ width: "80px" }} />
            <input placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} className="admin-input" style={{ flex: 2, minWidth: "150px" }} />
            <button
                disabled={saving || !nome || !acao}
                onClick={async () => {
                    setSaving(true);
                    await criarRegra({ nome, acao, pontos, descricao: desc });
                    setSaving(false);
                    onCreated();
                }}
                style={{ background: "#35605a", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "12px" }}
            >
                {saving ? "..." : "Criar"}
            </button>
        </div>
    );
}
