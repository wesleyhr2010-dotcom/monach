"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getMaletaById,
    devolverMaleta,
    fecharMaleta,
    conciliarMaleta,
} from "@/app/admin/actions-maletas";
import type { MaletaDetail, MaletaItemDetail } from "@/app/admin/actions-maletas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Briefcase,
    Clock,
    CheckCircle,
    AlertTriangle,
    Upload,
    DollarSign,
    Package,
} from "lucide-react";

// ---------- Helpers ----------

const statusConfig: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
> = {
    ativa: {
        label: "Ativa",
        color: "bg-emerald-100 text-emerald-700",
        icon: <Briefcase className="w-3 h-3" />,
    },
    atrasada: {
        label: "Atrasada",
        color: "bg-red-100 text-red-700",
        icon: <AlertTriangle className="w-3 h-3" />,
    },
    aguardando_revisao: {
        label: "Aguardando Revisão",
        color: "bg-amber-100 text-amber-700",
        icon: <Clock className="w-3 h-3" />,
    },
    concluida: {
        label: "Concluída",
        color: "bg-blue-100 text-blue-700",
        icon: <CheckCircle className="w-3 h-3" />,
    },
};

function daysRemaining(dataLimite: string): number {
    const now = new Date();
    const limit = new Date(dataLimite);
    return Math.ceil((limit.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtCurrency(val: number | null): string {
    if (val === null || val === undefined) return "—";
    return `₲ ${val.toLocaleString("es-PY")}`;
}

// ---------- Component ----------

interface MaletaDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function MaletaDetailPage({ params }: MaletaDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [maleta, setMaleta] = useState<MaletaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Devolver dialog
    const [showDevolverDialog, setShowDevolverDialog] = useState(false);
    const [comprovanteUrl, setComprovanteUrl] = useState("");
    const [devolvendo, setDevolvendo] = useState(false);

    // Conciliação state
    const [vendidos, setVendidos] = useState<Record<string, number>>({});
    const [conciliando, setConciliando] = useState(false);

    async function loadMaleta() {
        setLoading(true);
        try {
            const data = await getMaletaById(id);
            setMaleta(data);
            if (data) {
                // Initialize vendidos map
                const initial: Record<string, number> = {};
                for (const item of data.itens) {
                    initial[item.id] = item.quantidade_vendida;
                }
                setVendidos(initial);
            }
        } catch {
            setError("Erro ao carregar maleta");
        }
        setLoading(false);
    }

    useEffect(() => {
        loadMaleta();
    }, [id]);

    // Devolver maleta
    async function handleDevolver() {
        if (!comprovanteUrl.trim()) return;
        setDevolvendo(true);
        setError("");
        const result = await devolverMaleta(id, comprovanteUrl);
        if (result.success) {
            setShowDevolverDialog(false);
            setSuccessMsg("Maleta devolvida com sucesso!");
            loadMaleta();
            setTimeout(() => setSuccessMsg(""), 3000);
        } else {
            setError(result.error || "Erro ao devolver");
        }
        setDevolvendo(false);
    }

    // Conciliar maleta (fechar + conciliar)
    async function handleConciliar() {
        setConciliando(true);
        setError("");
        try {
            // First, register sold quantities
            const itensVendidos = Object.entries(vendidos).map(
                ([maleta_item_id, quantidade_vendida]) => ({
                    maleta_item_id,
                    quantidade_vendida,
                })
            );
            const fecharResult = await fecharMaleta(id, itensVendidos);
            if (!fecharResult.success) {
                setError(fecharResult.error || "Erro ao fechar maleta");
                setConciliando(false);
                return;
            }

            // Then, freeze values and return stock
            const conciliarResult = await conciliarMaleta(id);
            if (conciliarResult.success) {
                setSuccessMsg("Maleta conciliada com sucesso!");
                loadMaleta();
                setTimeout(() => setSuccessMsg(""), 3000);
            } else {
                setError(conciliarResult.error || "Erro na conciliação");
            }
        } catch {
            setError("Erro inesperado na conciliação");
        }
        setConciliando(false);
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Carregando maleta...
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!maleta) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">
                            Maleta não encontrada
                        </p>
                        <Link href="/admin/maleta">
                            <Button className="mt-4" variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const sc = statusConfig[maleta.status];
    const days = daysRemaining(maleta.data_limite);
    const isActive = maleta.status === "ativa" || maleta.status === "atrasada";
    const isAguardando = maleta.status === "aguardando_revisao";
    const isConcluida = maleta.status === "concluida";

    // Calculate preview values for conciliation form
    const previewTotal = maleta.itens.reduce((sum, item) => {
        const qty = vendidos[item.id] || 0;
        const preco = item.preco_fixado || 0;
        return sum + preco * qty;
    }, 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/maleta">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        {maleta.reseller.avatar_url ? (
                            <img
                                src={maleta.reseller.avatar_url}
                                alt={maleta.reseller.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                👤
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold">
                                {maleta.reseller.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                    className={`${sc.color} gap-1`}
                                    variant="secondary"
                                >
                                    {sc.icon}
                                    {sc.label}
                                </Badge>
                                {isActive && (
                                    <span
                                        className={`text-xs font-medium ${days < 0
                                            ? "text-red-600"
                                            : days <= 3
                                                ? "text-amber-600"
                                                : "text-emerald-600"
                                            }`}
                                    >
                                        {days < 0
                                            ? `${Math.abs(days)}d atrasada`
                                            : `${days}d restantes`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    {isActive && (
                        <Button
                            onClick={() => setShowDevolverDialog(true)}
                            variant="outline"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Devolver Maleta
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm border border-emerald-200">
                    {successMsg}
                </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Enviada em</p>
                        <p className="text-sm font-semibold mt-1">
                            {new Date(maleta.data_envio).toLocaleDateString("pt-BR")}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Prazo</p>
                        <p className="text-sm font-semibold mt-1">
                            {new Date(maleta.data_limite).toLocaleDateString("pt-BR")}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Itens</p>
                        <p className="text-sm font-semibold mt-1">
                            {maleta.itens.reduce((s, i) => s + i.quantidade_enviada, 0)}{" "}
                            peças
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Comissão</p>
                        <p className="text-sm font-semibold mt-1">
                            {maleta.reseller.taxa_comissao}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Items table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Variante</TableHead>
                                <TableHead className="text-right">Qtd Enviada</TableHead>
                                <TableHead className="text-right">
                                    {isAguardando ? "Qtd Vendida" : "Vendida"}
                                </TableHead>
                                <TableHead className="text-right">Preço Fixado</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {maleta.itens.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {item.product_variant.product.images?.[0] ? (
                                                <img
                                                    src={
                                                        item.product_variant.product
                                                            .images[0]
                                                    }
                                                    alt={
                                                        item.product_variant.product.name
                                                    }
                                                    className="w-8 h-8 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs">
                                                    📦
                                                </div>
                                            )}
                                            <span className="text-sm font-medium">
                                                {item.product_variant.product.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.product_variant.attribute_value}
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                        {item.quantidade_enviada}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isAguardando ? (
                                            <Input
                                                type="number"
                                                min={0}
                                                max={item.quantidade_enviada}
                                                value={vendidos[item.id] ?? 0}
                                                onChange={(e) => {
                                                    const val = Math.min(
                                                        item.quantidade_enviada,
                                                        Math.max(0, parseInt(e.target.value) || 0)
                                                    );
                                                    setVendidos((prev) => ({
                                                        ...prev,
                                                        [item.id]: val,
                                                    }));
                                                }}
                                                className="w-20 text-right ml-auto"
                                            />
                                        ) : (
                                            <span className="text-sm">
                                                {item.quantidade_vendida}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                        {fmtCurrency(item.preco_fixado)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-medium">
                                        {fmtCurrency(
                                            (item.preco_fixado || 0) *
                                            (isAguardando
                                                ? vendidos[item.id] || 0
                                                : item.quantidade_vendida)
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Conciliation action for aguardando_revisao */}
            {isAguardando && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Conciliar Maleta</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Preencha as quantidades vendidas acima, depois confirme
                                    a conciliação.
                                </p>
                                <p className="text-sm font-medium mt-2">
                                    Total vendido estimado:{" "}
                                    <span className="text-emerald-600">
                                        {fmtCurrency(previewTotal)}
                                    </span>
                                </p>
                            </div>
                            <Button
                                onClick={handleConciliar}
                                disabled={conciliando}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {conciliando
                                    ? "Conciliando..."
                                    : "Confirmar Conciliação"}
                                <CheckCircle className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Financial summary for concluida */}
            {isConcluida && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4" />
                            Resumo Financeiro (Valores Congelados)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    Total Vendido
                                </p>
                                <p className="text-lg font-bold text-emerald-600 mt-1">
                                    {fmtCurrency(maleta.valor_total_vendido)}
                                </p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    Comissão Revendedora
                                </p>
                                <p className="text-lg font-bold text-blue-600 mt-1">
                                    {fmtCurrency(maleta.valor_comissao_revendedora)}
                                </p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    Comissão Colaboradora
                                </p>
                                <p className="text-lg font-bold text-purple-600 mt-1">
                                    {fmtCurrency(maleta.valor_comissao_colaboradora)}
                                </p>
                            </div>
                        </div>

                        {maleta.comprovante_devolucao_url && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Comprovante de Devolução
                                </p>
                                <a
                                    href={maleta.comprovante_devolucao_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Ver comprovante →
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Devolver Dialog */}
            <Dialog
                open={showDevolverDialog}
                onOpenChange={setShowDevolverDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Devolver Maleta
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-sm mb-2 block">
                            URL do Comprovante de Devolução
                        </Label>
                        <Input
                            placeholder="https://..."
                            value={comprovanteUrl}
                            onChange={(e) => setComprovanteUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Cole o link da foto ou documento comprovando a devolução
                            dos produtos.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDevolverDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDevolver}
                            disabled={devolvendo || !comprovanteUrl.trim()}
                        >
                            {devolvendo ? "Enviando..." : "Confirmar Devolução"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
