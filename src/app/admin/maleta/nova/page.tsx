"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getActiveResellers,
    getAvailableVariants,
    criarMaleta,
} from "@/app/admin/actions-maletas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    ChevronRight,
    Plus,
    Minus,
    Trash2,
    Briefcase,
    Search,
    Package,
    CheckCircle,
} from "lucide-react";

// ---------- Types ----------

interface ResellerOption {
    id: string;
    name: string;
    avatar_url: string;
    whatsapp: string;
    taxa_comissao: number;
}

interface VariantOption {
    id: string;
    attribute_name: string;
    attribute_value: string;
    price: number | null;
    stock_quantity: number;
    sku: string | null;
    product: { id: string; name: string; images: string[] };
}

interface SelectedItem {
    variant: VariantOption;
    quantidade: number;
}

// ---------- Steps ----------

const STEPS = [
    { label: "Revendedora", icon: <Briefcase className="w-4 h-4" /> },
    { label: "Prazo", icon: <Briefcase className="w-4 h-4" /> },
    { label: "Produtos", icon: <Package className="w-4 h-4" /> },
    { label: "Confirmar", icon: <CheckCircle className="w-4 h-4" /> },
];

export default function NovaMaletaPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Step 1 - Reseller
    const [resellers, setResellers] = useState<ResellerOption[]>([]);
    const [selectedResellerId, setSelectedResellerId] = useState("");

    // Step 2 - Deadline
    const [dataLimite, setDataLimite] = useState("");

    // Step 3 - Products
    const [variants, setVariants] = useState<VariantOption[]>([]);
    const [search, setSearch] = useState("");
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // Load resellers on mount
    useEffect(() => {
        getActiveResellers().then(setResellers);
    }, []);

    // Load variants when entering step 3
    useEffect(() => {
        if (step === 2) {
            loadVariants("");
        }
    }, [step]);

    async function loadVariants(q: string) {
        const data = await getAvailableVariants(q || undefined);
        setVariants(data);
    }

    function handleSearch(q: string) {
        setSearch(q);
        loadVariants(q);
    }

    function addItem(variant: VariantOption) {
        if (selectedItems.find((i) => i.variant.id === variant.id)) return;
        setSelectedItems((prev) => [...prev, { variant, quantidade: 1 }]);
    }

    function removeItem(variantId: string) {
        setSelectedItems((prev) => prev.filter((i) => i.variant.id !== variantId));
    }

    function updateQty(variantId: string, delta: number) {
        setSelectedItems((prev) =>
            prev.map((i) => {
                if (i.variant.id !== variantId) return i;
                const newQty = Math.max(1, Math.min(i.variant.stock_quantity, i.quantidade + delta));
                return { ...i, quantidade: newQty };
            })
        );
    }

    function canAdvance(): boolean {
        if (step === 0) return !!selectedResellerId;
        if (step === 1) return !!dataLimite;
        if (step === 2) return selectedItems.length > 0;
        return true;
    }

    const selectedReseller = resellers.find((r) => r.id === selectedResellerId);
    const totalValue = selectedItems.reduce(
        (sum, i) => sum + (i.variant.price || 0) * i.quantidade,
        0
    );

    async function handleConfirm() {
        setSaving(true);
        setError("");
        try {
            const result = await criarMaleta(
                selectedResellerId,
                dataLimite,
                selectedItems.map((i) => ({
                    product_variant_id: i.variant.id,
                    quantidade: i.quantidade,
                }))
            );
            if (result.success && result.id) {
                router.push(`/admin/maleta/${result.id}`);
            } else {
                setError(result.error || "Erro ao criar maleta");
                setSaving(false);
            }
        } catch {
            setError("Erro inesperado");
            setSaving(false);
        }
    }

    // Already-selected variant IDs to filter them out
    const selectedIds = new Set(selectedItems.map((i) => i.variant.id));

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Nova Maleta</h1>
                    <p className="text-sm text-muted-foreground">
                        Criar consignação para revendedora
                    </p>
                </div>
                <Link href="/admin/maleta">
                    <Button variant="ghost">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {STEPS.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${idx === step
                                ? "bg-primary text-primary-foreground"
                                : idx < step
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {idx < step ? (
                                <CheckCircle className="w-3 h-3" />
                            ) : (
                                s.icon
                            )}
                            {s.label}
                        </div>
                        {idx < STEPS.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                    {error}
                </div>
            )}

            {/* Step 1: Select Reseller */}
            {step === 0 && (
                <Card>
                    <CardContent className="p-6">
                        <Label className="text-sm font-medium mb-3 block">
                            Selecionar Revendedora
                        </Label>
                        <Select
                            value={selectedResellerId}
                            onValueChange={setSelectedResellerId}
                        >
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Escolha uma revendedora..." />
                            </SelectTrigger>
                            <SelectContent>
                                {resellers.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                        <div className="flex items-center gap-2">
                                            {r.avatar_url ? (
                                                <img
                                                    src={r.avatar_url}
                                                    alt={r.name}
                                                    className="w-5 h-5 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                                                    👤
                                                </div>
                                            )}
                                            <span>{r.name}</span>
                                            <span className="text-muted-foreground text-xs ml-1">
                                                ({r.taxa_comissao}%)
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedReseller && (
                            <div className="mt-4 flex items-center gap-3 p-3 bg-muted rounded-lg">
                                {selectedReseller.avatar_url ? (
                                    <img
                                        src={selectedReseller.avatar_url}
                                        alt={selectedReseller.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                        👤
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-sm">
                                        {selectedReseller.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        WhatsApp: {selectedReseller.whatsapp} · Comissão:{" "}
                                        {selectedReseller.taxa_comissao}%
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Deadline */}
            {step === 1 && (
                <Card>
                    <CardContent className="p-6">
                        <Label className="text-sm font-medium mb-3 block">
                            Data Limite para Devolução
                        </Label>
                        <Input
                            type="date"
                            value={dataLimite}
                            onChange={(e) => setDataLimite(e.target.value)}
                            className="w-full max-w-xs"
                            min={new Date().toISOString().split("T")[0]}
                        />
                        {dataLimite && (
                            <p className="text-sm text-muted-foreground mt-3">
                                A revendedora terá até{" "}
                                <strong>
                                    {new Date(dataLimite + "T12:00:00").toLocaleDateString(
                                        "pt-BR",
                                        { day: "2-digit", month: "long", year: "numeric" }
                                    )}
                                </strong>{" "}
                                para devolver a maleta.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Select Products/Variants */}
            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Available variants */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar produto..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                                {variants.filter((v) => !selectedIds.has(v.id)).length ===
                                    0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        {search
                                            ? "Nenhum resultado"
                                            : "Sem variantes com stock"}
                                    </p>
                                ) : (
                                    variants
                                        .filter((v) => !selectedIds.has(v.id))
                                        .map((v) => (
                                            <div
                                                key={v.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                            >
                                                {v.product.images?.[0] ? (
                                                    <img
                                                        src={v.product.images[0]}
                                                        alt={v.product.name}
                                                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs flex-shrink-0">
                                                        📦
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {v.product.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {v.attribute_value} · Stock:{" "}
                                                        {v.stock_quantity} ·{" "}
                                                        {v.price
                                                            ? `₲ ${v.price.toLocaleString("es-PY")}`
                                                            : "S/P"}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => addItem(v)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Selected items */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold">
                                    Itens Selecionados ({selectedItems.length})
                                </h3>
                                {selectedItems.length > 0 && (
                                    <Badge variant="secondary">
                                        Total: ₲{" "}
                                        {totalValue.toLocaleString("es-PY")}
                                    </Badge>
                                )}
                            </div>

                            {selectedItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">
                                        Selecione produtos à esquerda
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                                    {selectedItems.map((item) => (
                                        <div
                                            key={item.variant.id}
                                            className="flex items-center gap-3 p-2 bg-muted rounded-lg"
                                        >
                                            {item.variant.product.images?.[0] ? (
                                                <img
                                                    src={
                                                        item.variant.product
                                                            .images[0]
                                                    }
                                                    alt={
                                                        item.variant.product.name
                                                    }
                                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-background flex items-center justify-center text-xs flex-shrink-0">
                                                    📦
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {item.variant.product.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.variant.attribute_value} ·{" "}
                                                    {item.variant.price
                                                        ? `₲ ${(item.variant.price * item.quantidade).toLocaleString("es-PY")}`
                                                        : "S/P"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() =>
                                                        updateQty(
                                                            item.variant.id,
                                                            -1
                                                        )
                                                    }
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="text-sm font-medium w-6 text-center">
                                                    {item.quantidade}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() =>
                                                        updateQty(
                                                            item.variant.id,
                                                            1
                                                        )
                                                    }
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                onClick={() =>
                                                    removeItem(item.variant.id)
                                                }
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 4: Summary / Confirm */}
            {step === 3 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Resumo da Maleta
                        </h3>

                        {/* Reseller info */}
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
                            {selectedReseller?.avatar_url ? (
                                <img
                                    src={selectedReseller.avatar_url}
                                    alt={selectedReseller.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                    👤
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-sm">
                                    {selectedReseller?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Prazo:{" "}
                                    {new Date(
                                        dataLimite + "T12:00:00"
                                    ).toLocaleDateString("pt-BR")} · Comissão:{" "}
                                    {selectedReseller?.taxa_comissao}%
                                </p>
                            </div>
                        </div>

                        {/* Items table */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Variante</TableHead>
                                    <TableHead className="text-right">
                                        Qtd
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Preço Unit.
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Subtotal
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedItems.map((item) => (
                                    <TableRow key={item.variant.id}>
                                        <TableCell className="text-sm font-medium">
                                            {item.variant.product.name}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {item.variant.attribute_value}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {item.quantidade}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {item.variant.price
                                                ? `₲ ${item.variant.price.toLocaleString("es-PY")}`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium">
                                            {item.variant.price
                                                ? `₲ ${(item.variant.price * item.quantidade).toLocaleString("es-PY")}`
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Total */}
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <span className="font-semibold">
                                Total ({selectedItems.reduce((s, i) => s + i.quantidade, 0)}{" "}
                                peças)
                            </span>
                            <span className="text-lg font-bold">
                                ₲ {totalValue.toLocaleString("es-PY")}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    disabled={step === 0}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                </Button>

                {step < 3 ? (
                    <Button
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!canAdvance()}
                    >
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {saving ? "Criando..." : "Confirmar e Criar Maleta"}
                        <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
