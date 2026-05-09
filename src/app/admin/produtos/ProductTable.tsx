"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "../actions-products";
import type { Product } from "@/lib/types";
import { Pencil, Trash2, Box } from "lucide-react";

function formatPrice(price: number | null) {
    if (price === null) return "—";
    return `₲ ${price.toLocaleString("es-PY")}`;
}

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
            <div style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-surface-hover)",
                borderRadius: 12,
                textAlign: "center",
                padding: "60px 0",
            }}>
                <Box size={36} style={{ margin: "0 auto 12px", color: "var(--admin-text-dim)" }} />
                <p style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, color: "var(--admin-text-muted)" }}>
                    No se encontraron productos
                </p>
            </div>
        );
    }

    return (
        <>
            <div style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-surface-hover)",
                borderRadius: 12,
                overflow: "hidden",
            }}>
                <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 56 }} />
                                <th>Nombre</th>
                                <th>SKU</th>
                                <th>Tipo</th>
                                <th>Precio</th>
                                <th>Categorías</th>
                                <th style={{ textAlign: "right", width: 80 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    {/* Imagen */}
                                    <td>
                                        {product.images?.[0] ? (
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                width={40}
                                                height={40}
                                                className="admin-table-thumb"
                                            />
                                        ) : (
                                            <div style={{
                                                width: 40, height: 40,
                                                borderRadius: "var(--admin-radius-sm)",
                                                background: "var(--admin-surface-hover)",
                                                border: "1px solid var(--admin-border)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 18,
                                            }}>
                                                🦋
                                            </div>
                                        )}
                                    </td>

                                    {/* Nombre */}
                                    <td>
                                        <Link
                                            href={`/admin/produtos/${product.id}`}
                                            style={{
                                                color: "var(--admin-text)",
                                                fontWeight: 600,
                                                fontSize: 14,
                                                textDecoration: "none",
                                            }}
                                        >
                                            {product.name}
                                        </Link>
                                    </td>

                                    {/* SKU */}
                                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--admin-text-muted)" }}>
                                        {product.sku || "—"}
                                    </td>

                                    {/* Tipo */}
                                    <td>
                                        <span className={`admin-badge ${product.product_type === "variable" ? "admin-badge-variable" : "admin-badge-simple"}`}>
                                            {product.product_type === "variable" ? "Variable" : "Simple"}
                                        </span>
                                    </td>

                                    {/* Precio */}
                                    <td style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: 13 }}>
                                        {formatPrice(product.price)}
                                    </td>

                                    {/* Categorías */}
                                    <td>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                            {(product.categories || []).slice(0, 2).map((cat) => (
                                                <span key={cat} style={{
                                                    fontSize: 10, fontWeight: 500,
                                                    padding: "2px 6px", borderRadius: 4,
                                                    background: "var(--admin-surface-hover)",
                                                    color: "var(--admin-text-muted)",
                                                    border: "1px solid var(--admin-border)",
                                                }}>
                                                    {cat.split(">")[0].trim()}
                                                </span>
                                            ))}
                                            {(product.categories || []).length > 2 && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 500,
                                                    padding: "2px 6px", borderRadius: 4,
                                                    background: "var(--admin-surface-hover)",
                                                    color: "var(--admin-text-dim)",
                                                }}>
                                                    +{product.categories.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Acciones */}
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                            <Link
                                                href={`/admin/produtos/${product.id}`}
                                                title="Editar"
                                                className="admin-btn admin-btn-icon"
                                                style={{ textDecoration: "none" }}
                                            >
                                                <Pencil size={14} />
                                            </Link>
                                            <button
                                                title="Eliminar"
                                                className="admin-btn admin-btn-icon"
                                                style={{ color: "var(--admin-danger)" }}
                                                onClick={() => handleDeleteClick(product)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de confirmação de exclusão */}
            {deleteId && (
                <div
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0, 0, 0, 0.75)",
                        zIndex: 50, display: "flex",
                        alignItems: "center", justifyContent: "center",
                    }}
                    onClick={() => !isPending && setDeleteId(null)}
                >
                    <div
                        style={{
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            borderRadius: 12,
                            padding: 24,
                            maxWidth: 380,
                            width: "100%",
                            margin: "0 16px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 18, fontWeight: 600,
                            color: "var(--admin-text)", marginBottom: 8,
                        }}>
                            Eliminar Producto
                        </h3>
                        <p style={{
                            fontFamily: "Raleway, sans-serif",
                            fontSize: 13, color: "var(--admin-text-muted)",
                            marginBottom: 24, lineHeight: "20px",
                        }}>
                            ¿Estás seguro de que deseas eliminar &quot;{deleteName}&quot;? Esta acción eliminará
                            también todas las variantes e imágenes asociadas.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setDeleteId(null)}
                                disabled={isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                className="admin-btn admin-btn-danger"
                                onClick={handleConfirmDelete}
                                disabled={isPending}
                            >
                                {isPending ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
