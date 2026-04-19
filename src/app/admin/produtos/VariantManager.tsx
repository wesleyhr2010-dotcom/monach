"use client";

interface Variant {
    attribute_name: string;
    attribute_value: string;
    price: string;
    sku: string;
    stock_quantity: string;
}

interface VariantManagerProps {
    variants: Variant[];
    onChange: (variants: Variant[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
    function addVariant() {
        onChange([
            ...variants,
            {
                attribute_name: variants[0]?.attribute_name || "",
                attribute_value: "",
                price: "",
                sku: "",
                stock_quantity: "0",
            },
        ]);
    }

    function removeVariant(index: number) {
        onChange(variants.filter((_, i) => i !== index));
    }

    function updateVariant(index: number, field: keyof Variant, value: string) {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    }

    return (
        <div className="admin-variant-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--admin-text)" }}>
                    Variantes
                </label>
                <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={addVariant}
                >
                    + Agregar variante
                </button>
            </div>

            {variants.length === 0 && (
                <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", textAlign: "center", padding: "12px 0" }}>
                    No hay variantes. Haz click en &quot;Agregar variante&quot; para comenzar.
                </p>
            )}

            {variants.map((variant, index) => (
                <div key={index} className="admin-variant-row">
                    <div>
                        {index === 0 && <label className="admin-label">Atributo</label>}
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="ej: Tamaños"
                            value={variant.attribute_name}
                            onChange={(e) => updateVariant(index, "attribute_name", e.target.value)}
                        />
                    </div>
                    <div>
                        {index === 0 && <label className="admin-label">Valor</label>}
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="ej: 16"
                            value={variant.attribute_value}
                            onChange={(e) => updateVariant(index, "attribute_value", e.target.value)}
                        />
                    </div>
                    <div>
                        {index === 0 && <label className="admin-label">Precio ₲</label>}
                        <input
                            type="number"
                            className="admin-input"
                            placeholder="Precio"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, "price", e.target.value)}
                        />
                    </div>
                    <div>
                        {index === 0 && <label className="admin-label">Stock</label>}
                        <input
                            type="number"
                            className="admin-input"
                            placeholder="0"
                            min="0"
                            value={variant.stock_quantity}
                            onChange={(e) => updateVariant(index, "stock_quantity", e.target.value)}
                            style={{ width: "80px" }}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-icon"
                            onClick={() => removeVariant(index)}
                            title="Eliminar variante"
                            style={{ color: "var(--admin-danger)" }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
