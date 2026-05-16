"use client";

import { Download } from "lucide-react";

type Props = {
  csv: string;
  filename: string;
};

export function VitrinaCsvDownload({ csv, filename }: Props) {
  const handleDownload = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] border border-[var(--admin-border)] inline-flex items-center gap-1.5"
    >
      <Download className="w-3.5 h-3.5" />
      Exportar CSV
    </button>
  );
}
