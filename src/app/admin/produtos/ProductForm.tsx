"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "../actions-products";
import { ImageUploader } from "./ImageUploader";
import { VariantManager } from "./VariantManager";
import { CategorySelect } from "./CategorySelect";
import type { Product } from "@/lib/types";
import type { Category } from "../actions-categories";

interface VariantInput {
    attribute_name: string;
    attribute_value: string;
    price: string;
    sku: string;
    stock_quantity: string;
}

interface ProductFormProps {
    product?: Product;
    allCategories?: Category[];
}

export function ProductForm({ product, allCategories = [] }: ProductFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [productType, setProductType] = useState<string>(product?.product_type || "simple");
    const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(product?.categories || []);
    const [variants, setVariants] = useState<VariantInput[]>(
        product?.product_variants?.map((v) => ({
            attribute_name: v.attribute_name,
            attribute_value: v.attribute_value,
            price: v.price?.toString() || "",
            sku: v.sku || "",
            stock_quantity: v.stock_quantity?.toString() || "0",
        })) || []
    );

    function showToast(type: "success" | "error", message: string) {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }

    function handleImagesChange(existing: string[], files: File[]) {
        setExistingImages(existing);
        setNewImageFiles(files);
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Override product_type since select might not be in form
        formData.set("product_type", productType);
        formData.set("categories", selectedCategories.join(","));

        // Add existing images
        formData.set("existing_images", JSON.stringify(existingImages));

        // Remove default file input and add new files
        formData.delete("images");
        for (const file of newImageFiles) {
            formData.append("images", file);
        }

        // Add variants
        if (productType === "variable") {
            const variantData = variants
                .filter((v) => v.attribute_name && v.attribute_value)
                .map((v) => ({
                    attribute_name: v.attribute_name,
                    attribute_value: v.attribute_value,
                    price: v.price ? parseFloat(v.price) : null,
                    sku: v.sku || null,
                    stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : 0,
                }));
            formData.set("variants", JSON.stringify(variantData));
        }

        startTransition(async () => {
            let result;
            if (product) {
                result = await updateProduct(product.id, formData);
            } else {
                result = await createProduct(formData);
            }

            if (result.success) {
                showToast("success", product ? "Producto actualizado" : "Producto creado");
                if (!product && "data" in result) {
                    router.push(`/admin/produtos/${result.data}`);
                } else {
                    router.refresh();
                }
            } else {
                showToast("error", result.error || "Error desconocido");
            }
        });
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="admin-content">
                    {/* Basic Info */}
                    <div className="admin-card" style={{ marginBottom: "20px", position: "relative", zIndex: 10 }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>
                            Información General
                        </h2>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label className="admin-label" htmlFor="name">Nombre *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="admin-input"
                                    required
                                    defaultValue={product?.name || ""}
                                    placeholder="Nombre del producto"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label" htmlFor="sku">SKU</label>
                                <input
                                    id="sku"
                                    name="sku"
                                    type="text"
                                    className="admin-input"
                                    defaultValue={product?.sku || ""}
                                    placeholder="Auto-generado si vacío"
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label className="admin-label" htmlFor="product_type">Tipo</label>
                                <select
                                    id="product_type"
                                    className="admin-select"
                                    value={productType}
                                    onChange={(e) => setProductType(e.target.value)}
                                >
                                    <option value="simple">Simple</option>
                                    <option value="variable">Variable</option>
                                </select>
                            </div>
                            {productType === "simple" && (
                                <>
                                    <div className="admin-form-group">
                                        <label className="admin-label" htmlFor="price">Precio ₲</label>
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            className="admin-input"
                                            defaultValue={product?.price?.toString() || ""}
                                            placeholder="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label" htmlFor="stock_quantity">Estoque</label>
                                        <input
                                            id="stock_quantity"
                                            name="stock_quantity"
                                            type="number"
                                            className="admin-input"
                                            defaultValue={product?.product_variants?.[0]?.stock_quantity?.toString() || "0"}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label">Categorías</label>
                            <CategorySelect
                                allCategories={allCategories}
                                selected={selectedCategories}
                                onChange={setSelectedCategories}
                            />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="admin-card" style={{ marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>
                            Descripciones
                        </h2>

                        <div className="admin-form-group">
                            <label className="admin-label" htmlFor="short_description">Descripción Corta</label>
                            <textarea
                                id="short_description"
                                name="short_description"
                                className="admin-textarea"
                                rows={2}
                                defaultValue={product?.short_description || ""}
                                placeholder="Resumen breve del producto"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label" htmlFor="description">Descripción Completa</label>
                            <textarea
                                id="description"
                                name="description"
                                className="admin-textarea"
                                rows={4}
                                defaultValue={product?.description || ""}
                                placeholder="Descripción detallada del producto"
                            />
                        </div>
                    </div>

                    {/* Images */}
                    <div className="admin-card" style={{ marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>
                            Imágenes
                        </h2>
                        <ImageUploader
                            existingImages={existingImages}
                            onImagesChange={handleImagesChange}
                        />
                    </div>

                    {/* Variants (only for variable products) */}
                    {productType === "variable" && (
                        <div className="admin-card" style={{ marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                                Variantes
                            </h2>
                            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "16px" }}>
                                Defina las variantes del producto (ej: tamaños, colores, letras)
                            </p>
                            <VariantManager variants={variants} onChange={setVariants} />
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => router.back()}
                            disabled={isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                            disabled={isPending}
                        >
                            {isPending
                                ? "Guardando..."
                                : product
                                    ? "Guardar Cambios"
                                    : "Crear Producto"}
                        </button>
                    </div>
                </div>
            </form>

            {/* Toast */}
            {toast && (
                <div className={`admin-toast ${toast.type === "success" ? "admin-toast-success" : "admin-toast-error"}`}>
                    {toast.type === "success" ? "✅" : "❌"} {toast.message}
                </div>
            )}
        </>
    );
}
