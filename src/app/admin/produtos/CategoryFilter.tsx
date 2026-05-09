"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function CategoryFilter({ categories, current }: { categories: string[]; current: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (value && value !== "all_categories") {
            params.set("category", value);
        } else {
            params.delete("category");
        }
        params.delete("page");
        router.push(`/admin/produtos?${params.toString()}`);
    }

    return (
        <div style={{ position: "relative" }}>
            <select
                value={current || "all_categories"}
                onChange={(e) => handleChange(e.target.value)}
                style={{
                    padding: "10px 32px 10px 14px",
                    background: "var(--admin-bg)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius)",
                    color: "var(--admin-text)",
                    fontSize: 14,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    appearance: "none" as const,
                    WebkitAppearance: "none" as const,
                    minWidth: 180,
                    transition: "border-color 0.15s ease",
                }}
            >
                <option value="all_categories">Todas las categorías</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
            <ChevronDown size={12} style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", color: "var(--admin-text-muted)",
                pointerEvents: "none",
            }} />
        </div>
    );
}
