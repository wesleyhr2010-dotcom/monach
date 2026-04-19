"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "../actions-categories";
import type { Category } from "../actions-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Check, X, CornerDownRight } from "lucide-react";

interface CategoryTree extends Category {
    children: CategoryTree[];
}

export function CategoryManager({ categories }: { categories: Category[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // For Top Level creation
    const [newName, setNewName] = useState("");

    // For Inline editing/creating
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [addingToParent, setAddingToParent] = useState<string | null>(null);
    const [newChildName, setNewChildName] = useState("");

    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Build the tree
    const tree: CategoryTree[] = [];
    const map = new Map<string, CategoryTree>();

    // Initialize map
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));

    // Build tree
    categories.forEach(c => {
        if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.children.push(map.get(c.id)!);
        } else {
            tree.push(map.get(c.id)!);
        }
    });

    function showToast(type: "success" | "error", msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    }

    function handleCreateTopLevel() {
        if (!newName.trim()) return;
        startTransition(async () => {
            const result = await createCategory(newName.trim(), null);
            if (result.success) {
                showToast("success", "Categoría creada");
                setNewName("");
                router.refresh();
            } else {
                showToast("error", result.error || "Error");
            }
        });
    }

    function handleCreateChild(parentId: string) {
        if (!newChildName.trim()) return;
        startTransition(async () => {
            const result = await createCategory(newChildName.trim(), parentId);
            if (result.success) {
                showToast("success", "Subcategoría creada");
                setNewChildName("");
                setAddingToParent(null);
                router.refresh();
            } else {
                showToast("error", result.error || "Error");
            }
        });
    }

    function handleUpdate(id: string) {
        if (!editName.trim()) return;
        startTransition(async () => {
            const result = await updateCategory(id, editName.trim());
            if (result.success) {
                showToast("success", "Categoría actualizada");
                setEditingId(null);
                router.refresh();
            } else {
                showToast("error", result.error || "Error");
            }
        });
    }

    function handleDelete(id: string, name: string) {
        if (!confirm(`¿Eliminar la categoría "${name}"? Se eliminarán también las subcategorías.`)) return;
        startTransition(async () => {
            const result = await deleteCategory(id);
            if (result.success) {
                showToast("success", "Categoría eliminada");
                router.refresh();
            } else {
                showToast("error", result.error || "Error");
            }
        });
    }

    function Row({ item, depth }: { item: CategoryTree; depth: number }) {
        const isEditing = editingId === item.id;
        const isAdding = addingToParent === item.id;
        const indentStr = "—".repeat(depth) + (depth > 0 ? " " : "");

        return (
            <>
                <TableRow key={item.id}>
                    <TableCell style={{ paddingLeft: `${depth * 24 + 16}px` }}>
                        {isEditing ? (
                            <Input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdate(item.id);
                                    if (e.key === "Escape") setEditingId(null);
                                }}
                                autoFocus
                                className="h-8 text-sm"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                {depth > 0 && <CornerDownRight className="w-4 h-4 text-muted-foreground" />}
                                {depth === 0 ? <strong className="font-medium">{item.name}</strong> : item.name}
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                        {item.slug}
                    </TableCell>
                    <TableCell className="text-right">
                        {isEditing ? (
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={() => handleUpdate(item.id)} disabled={isPending}>
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-1 justify-end">
                                {depth === 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Agregar Subcategoría"
                                        onClick={() => {
                                            setAddingToParent(item.id);
                                            setNewChildName("");
                                            setEditingId(null);
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Editar"
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setEditName(item.name);
                                        setAddingToParent(null);
                                    }}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Eliminar"
                                    onClick={() => handleDelete(item.id, item.name)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </TableCell>
                </TableRow>
                {isAdding && (
                    <TableRow className="bg-muted/50">
                        <TableCell style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}>
                            <div className="flex items-center gap-2">
                                <CornerDownRight className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Nombre subcategoría"
                                    value={newChildName}
                                    onChange={(e) => setNewChildName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateChild(item.id);
                                        if (e.key === "Escape") setAddingToParent(null);
                                    }}
                                    autoFocus
                                    className="h-8 text-sm max-w-[200px]"
                                />
                            </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={() => handleCreateChild(item.id)} disabled={isPending || !newChildName.trim()}>
                                    Guardar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setAddingToParent(null)}>
                                    Cancelar
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                {item.children.map(child => (
                    <Row key={child.id} item={child} depth={depth + 1} />
                ))}
            </>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Add Top Level category */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        Agregar Categoría Principal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 max-w-xl">
                        <Input
                            type="text"
                            placeholder="Ej: Anillos, Collares"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateTopLevel()}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleCreateTopLevel}
                            disabled={isPending || !newName.trim()}
                        >
                            {isPending ? "..." : "Agregar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Categories list */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        Categorías ({categories.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead className="text-right w-[160px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tree.map(cat => <Row key={cat.id} item={cat} depth={0} />)}
                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No hay categorías. ¡Agregue la primera!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg border ${toast.type === "success" ? "bg-green-50 text-green-900 border-green-200" : "bg-red-50 text-red-900 border-red-200"}`}>
                    <div className="flex items-center gap-2">
                        {toast.type === "success" ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
                        <p className="text-sm font-medium">{toast.msg}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

