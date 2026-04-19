"use client";

import Link from "next/link";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "../actions-products";
import type { Product } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Box } from "lucide-react";

export function ProductTable({ products }: { products: Product[] }) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleDeleteClick(product: Product) {
        setDeleteId(product.id);
        setDeleteName(product.name);
    }

    function handleConfirmDelete() {
        if (!deleteId) return;

        startTransition(async () => {
            const result = await deleteProduct(deleteId);
            if (result.success) {
                setDeleteId(null);
                router.refresh();
            } else {
                alert(`Error: ${result.error}`);
            }
        });
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-card border rounded-lg shadow-sm">
                <Box className="w-12 h-12 mb-4 opacity-50" />
                <p className="mb-4 text-sm">No se encontraron productos</p>
                <Link href="/admin/produtos/novo">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Crear primer producto
                    </Button>
                </Link>
            </div>
        );
    }

    function formatPrice(price: number | null) {
        if (price === null) return "—";
        return `₲ ${price.toLocaleString("es-PY")}`;
    }

    return (
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Categorías</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    {product.images?.[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            className="rounded-md object-cover h-10 w-10 border"
                                        />
                                    ) : (
                                        <div className="rounded-md h-10 w-10 border bg-muted flex items-center justify-center text-lg">
                                            🦋
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Link
                                        href={`/admin/produtos/${product.id}`}
                                        className="font-medium hover:underline text-foreground"
                                    >
                                        {product.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-xs">
                                    {product.sku}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={product.product_type === "variable" ? "secondary" : "default"} className="capitalize">
                                        {product.product_type === "variable" ? "Variable" : "Simple"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {formatPrice(product.price)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {(product.categories || []).slice(0, 2).map((cat) => (
                                            <Badge key={cat} variant="outline" className="text-[10px] font-normal px-2 py-0 h-5">
                                                {cat.split(">")[0].trim()}
                                            </Badge>
                                        ))}
                                        {(product.categories || []).length > 2 && (
                                            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 h-5">
                                                +{product.categories.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/admin/produtos/${product.id}`} title="Editar">
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Eliminar"
                                            onClick={() => handleDeleteClick(product)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Delete confirmation dialog */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in" onClick={() => !isPending && setDeleteId(null)}>
                    <div className="bg-card border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-2">Eliminar Producto</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            ¿Estás seguro de que deseas eliminar &quot;{deleteName}&quot;? Esta acción eliminará
                            también todas las variantes e imágenes asociadas.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteId(null)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={isPending}
                            >
                                {isPending ? "Eliminando..." : "Eliminar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
