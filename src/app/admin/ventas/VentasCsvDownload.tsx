"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { exportVentasCSV } from "@/app/admin/actions-ventas";
import type { ListVentasParams } from "@/app/admin/actions-ventas";

type Props = {
  params: ListVentasParams;
  filename: string;
};

export function VentasCsvDownload({ params, filename }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const result = await exportVentasCSV(params);
    setLoading(false);
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5"
      style={{
        backgroundColor: "var(--admin-surface)",
        color: "var(--admin-text-muted)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <Download className="w-3.5 h-3.5" />
      {loading ? "Generando..." : "Exportar CSV"}
    </button>
  );
}
