"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "../actions-categories";
import type { Category } from "../actions-categories";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Plus, Trash2, Edit2, Check, X, CornerDownRight } from "lucide-react";
import { toast } from "sonner";

interface CategoryTree extends Category {
    children: CategoryTree[];
}

export function CategoryManager({ categories }: { categories: Category[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [addingToParent, setAddingToParent] = useState<string | null>(null);
    const [newChildName, setNewChildName] = useState("");

    // Montar árvore de categorias
    const tree: CategoryTree[] = [];
    const map = new Map<string, CategoryTree>();
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));
    categories.forEach(c => {
        if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.children.push(map.get(c.id)!);
        } else {
            tree.push(map.get(c.id)!);
        }
    });

    function handleCreateTopLevel() {
        if (!newName.trim()) return;
        startTransition(async () => {
            const result = await createCategory(newName.trim(), null);
            if (result.success) {
                toast.success("Categoría creada");
                setNewName("");
                router.refresh();
            } else {
                toast.error(result.error || "Error");
            }
        });
    }

    function handleCreateChild(parentId: string) {
        if (!newChildName.trim()) return;
        startTransition(async () => {
            const result = await createCategory(newChildName.trim(), parentId);
            if (result.success) {
                toast.success("Subcategoría creada");
                setNewChildName("");
                setAddingToParent(null);
                router.refresh();
            } else {
                toast.error(result.error || "Error");
            }
        });
    }

    function handleUpdate(id: string) {
        if (!editName.trim()) return;
        startTransition(async () => {
            const result = await updateCategory(id, editName.trim());
            if (result.success) {
                toast.success("Categoría actualizada");
                setEditingId(null);
                router.refresh();
            } else {
                toast.error(result.error || "Error");
            }
        });
    }

    function handleDelete(id: string, name: string) {
        if (!confirm(`¿Eliminar la categoría "${name}"? Se eliminarán también las subcategorías.`)) return;
        startTransition(async () => {
            const result = await deleteCategory(id);
            if (result.success) {
                toast.success("Categoría eliminada");
                router.refresh();
            } else {
                toast.error(result.error || "Error");
            }
        });
    }

    function Row({ item, depth }: { item: CategoryTree; depth: number }) {
        const isEditing = editingId === item.id;
        const isAdding = addingToParent === item.id;

        return (
            <>
                <tr key={item.id}>
                    {/* Nombre */}
                    <td style={{ paddingLeft: depth * 24 + 20 }}>
                        {isEditing ? (
                            <input
                                type="text"
                                className="admin-input"
                                style={{ height: 34, fontSize: 13, maxWidth: 280 }}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdate(item.id);
                                    if (e.key === "Escape") setEditingId(null);
                                }}
                                autoFocus
                            />
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {depth > 0 && (
                                    <CornerDownRight size={14} style={{ color: "var(--admin-text-dim)", flexShrink: 0 }} />
                                )}
                                <span style={{
                                    fontWeight: depth === 0 ? 600 : 400,
                                    fontSize: 14,
                                    color: depth === 0 ? "var(--admin-text)" : "var(--admin-text-muted)",
                                }}>
                                    {item.name}
                                </span>
                            </div>
                        )}
                    </td>

                    {/* Slug */}
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--admin-text-dim)" }}>
                        {item.slug}
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <button
                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                    onClick={() => handleUpdate(item.id)}
                                    disabled={isPending}
                                >
                                    <Check size={13} />
                                </button>
                                <button
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    onClick={() => setEditingId(null)}
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                {depth === 0 && (
                                    <button
                                        className="admin-btn admin-btn-icon"
                                        title="Agregar Subcategoría"
                                        onClick={() => {
                                            setAddingToParent(item.id);
                                            setNewChildName("");
                                            setEditingId(null);
                                        }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                                <button
                                    className="admin-btn admin-btn-icon"
                                    title="Editar"
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setEditName(item.name);
                                        setAddingToParent(null);
                                    }}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    className="admin-btn admin-btn-icon"
                                    style={{ color: "var(--admin-danger)" }}
                                    title="Eliminar"
                                    onClick={() => handleDelete(item.id, item.name)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </td>
                </tr>

                {/* Fila para agregar subcategoría */}
                {isAdding && (
                    <tr style={{ background: "var(--admin-surface-hover)" }}>
                        <td style={{ paddingLeft: (depth + 1) * 24 + 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <CornerDownRight size={14} style={{ color: "var(--admin-text-dim)", flexShrink: 0 }} />
                                <input
                                    type="text"
                                    className="admin-input"
                                    style={{ height: 34, fontSize: 13, maxWidth: 200 }}
                                    placeholder="Nombre subcategoría"
                                    value={newChildName}
                                    onChange={(e) => setNewChildName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateChild(item.id);
                                        if (e.key === "Escape") setAddingToParent(null);
                                    }}
                                    autoFocus
                                />
                            </div>
                        </td>
                        <td />
                        <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button
                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                    onClick={() => handleCreateChild(item.id)}
                                    disabled={isPending || !newChildName.trim()}
                                >
                                    Guardar
                                </button>
                                <button
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    onClick={() => setAddingToParent(null)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </td>
                    </tr>
                )}

                {item.children.map(child => (
                    <Row key={child.id} item={child} depth={depth + 1} />
                ))}
            </>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Agregar categoría principal */}
            <AdminSectionCard title="Agregar Categoría Principal">
                <div style={{ display: "flex", gap: 12, maxWidth: 480 }}>
                    <input
                        type="text"
                        className="admin-input"
                        style={{ flex: 1 }}
                        placeholder="Ej: Anillos, Collares"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateTopLevel()}
                    />
                    <button
                        className="admin-btn admin-btn-primary"
                        style={{ flexShrink: 0 }}
                        onClick={handleCreateTopLevel}
                        disabled={isPending || !newName.trim()}
                    >
                        {isPending ? "..." : <><Plus size={14} /> Agregar</>}
                    </button>
                </div>
            </AdminSectionCard>

            {/* Lista de categorías */}
            <AdminSectionCard
                title={`Categorías (${categories.length})`}
                noPadContent
            >
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Slug</th>
                            <th style={{ textAlign: "right", width: 160 }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tree.map(cat => (
                            <Row key={cat.id} item={cat} depth={0} />
                        ))}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-muted)" }}>
                                    No hay categorías. ¡Agregue la primera!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </AdminSectionCard>
        </div>
    );
}
