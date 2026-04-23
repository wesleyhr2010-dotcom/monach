"use client";

import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";
import {
    getNiveis,
    getRegras,
    getResgates,
    upsertNivelRegra,
    deleteNivelRegra,
    atualizarRegra,
    atualizarStatusResgate,
} from "../actions-gamificacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Award, Gift, Plus, Trash2, ToggleLeft, ToggleRight, Check, X } from "lucide-react";

type Nivel = Awaited<ReturnType<typeof getNiveis>>[number];
type Regra = Awaited<ReturnType<typeof getRegras>>[number];
type Resgate = Awaited<ReturnType<typeof getResgates>>[number];

export default function GamificacaoAdminPage() {
    const [niveis, setNiveis] = useState<Nivel[]>([]);
    const [regras, setRegras] = useState<Regra[]>([]);
    const [resgates, setResgates] = useState<Resgate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNovoNivel, setShowNovoNivel] = useState(false);

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
                <header className="admin-header"><h1>Gamificación</h1></header>
                <div className="admin-content">
                    <p style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-text-muted)" }}>Cargando...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <header className="admin-header"><h1>🎮 Gamificación</h1></header>
            <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Niveles */}
                <Card>
                    <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <CardTitle style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Star className="w-4 h-4" style={{ color: "#d4af37" }} />
                            Niveles
                        </CardTitle>
                        <button
                            onClick={() => setShowNovoNivel(!showNovoNivel)}
                            style={{ fontSize: "12px", background: "#35605a", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            <Plus className="w-3 h-3" /> Nuevo Nivel
                        </button>
                    </CardHeader>
                    <CardContent>
                        {showNovoNivel && <NovoNivelForm onCreated={() => { setShowNovoNivel(false); reload(); }} />}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-right">Puntos Mínimos</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead className="text-right">Orden</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {niveis.map((n) => (
                                    <TableRow key={n.id}>
                                        <TableCell className="font-medium">{n.nome}</TableCell>
                                        <TableCell className="text-right tabular-nums">{n.pontos_minimos}</TableCell>
                                        <TableCell>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: n.cor, border: "1px solid var(--admin-border)" }} />
                                                <code style={{ fontSize: "11px" }}>{n.cor}</code>
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{n.ordem}</TableCell>
                                        <TableCell>
                                            {n.pontos_minimos > 0 && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`¿Eliminar nivel "${n.nome}"?`)) {
                                                            try {
                                                                await deleteNivelRegra(n.id);
                                                                reload();
                                                            } catch (err) {
                                                                alert(err instanceof Error ? err.message : "Error al eliminar");
                                                            }
                                                        }
                                                    }}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Regras */}
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Award className="w-4 h-4" />
                            Reglas de Puntos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Regla</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Puntos</TableHead>
                                    <TableHead className="text-center">Activo</TableHead>
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
                                        <TableCell><code style={{ fontSize: "11px" }}>{r.tipo}</code></TableCell>
                                        <TableCell className="text-right tabular-nums font-bold">{r.pontos}</TableCell>
                                        <TableCell className="text-center">
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
                                                        });
                                                        reload();
                                                    } catch (err) {
                                                        alert(err instanceof Error ? err.message : "Error al actualizar");
                                                    }
                                                }}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: r.ativo ? "#10b981" : "#6b7280" }}
                                            >
                                                {r.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
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
                            Canjes Pendientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {resgates.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", textAlign: "center", padding: "16px 0" }}>
                                Ningún canje solicitado.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Revendedora</TableHead>
                                        <TableHead>Premio</TableHead>
                                        <TableHead className="text-right">Puntos</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-20">Acciones</TableHead>
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

function NovoNivelForm({ onCreated }: { onCreated: () => void }) {
    const [nome, setNome] = useState("");
    const [pontosMinimos, setPontosMinimos] = useState(0);
    const [cor, setCor] = useState("#35605a");
    const [ordem, setOrdem] = useState(0);
    const [saving, setSaving] = useState(false);

    return (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", padding: "12px", background: "var(--admin-bg-secondary)", borderRadius: "8px" }}>
            <input placeholder="Nombre" value={nome} onChange={(e) => setNome(e.target.value)} className="admin-input" style={{ flex: 1, minWidth: "120px" }} />
            <input placeholder="Puntos mínimos" type="number" value={pontosMinimos} onChange={(e) => setPontosMinimos(Number(e.target.value))} className="admin-input" style={{ width: "120px" }} />
            <input placeholder="#hex" value={cor} onChange={(e) => setCor(e.target.value)} className="admin-input" style={{ width: "100px" }} />
            <input placeholder="Orden" type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} className="admin-input" style={{ width: "80px" }} />
            <button
                disabled={saving || !nome}
                onClick={async () => {
                    setSaving(true);
                    try {
                        await upsertNivelRegra({ nome, pontos_minimos: pontosMinimos, cor, ordem });
                        onCreated();
                    } catch (err) {
                        alert(err instanceof Error ? err.message : "Error al crear");
                    } finally {
                        setSaving(false);
                    }
                }}
                style={{ background: "#35605a", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "12px" }}
            >
                {saving ? "..." : "Crear"}
            </button>
        </div>
    );
}
