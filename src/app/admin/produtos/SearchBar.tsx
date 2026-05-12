"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

export function SearchBar({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(defaultValue);
    const [, startTransition] = useTransition();

    function handleSearch(newValue: string) {
        setValue(newValue);
        startTransition(() => {
            const params = new URLSearchParams(searchParams?.toString() ?? "");
            if (newValue) {
                params.set("search", newValue);
            } else {
                params.delete("search");
            }
            params.delete("page");
            router.push(`/admin/produtos?${params.toString()}`);
        });
    }

    return (
        <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
            <Search size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--admin-text-muted)",
                pointerEvents: "none",
            }} />
            <input
                type="text"
                className="admin-input"
                style={{ paddingLeft: 36 }}
                placeholder="Buscar productos..."
                value={value}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </div>
    );
}
