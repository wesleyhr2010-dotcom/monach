"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function VentasSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams?.get("search") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/admin/ventas?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timeout);
  }, [value, router, searchParams]);

  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
      <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)" }} />
      <input
        type="text"
        placeholder="Buscar por cliente o RUC..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="admin-input"
        style={{ paddingLeft: 32 }}
      />
    </div>
  );
}
