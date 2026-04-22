"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type AdminFilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  }[];
  onClear?: () => void;
  className?: string;
};

export function AdminFilterBar({ searchValue, onSearchChange, onSearchSubmit, searchPlaceholder = "Buscar...", filters = [], onClear, className }: AdminFilterBarProps) {
  return (
    <div className={cn("flex items-center gap-4 flex-wrap", className)}>
      <div className="admin-search-bar flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
          className="w-full pl-9 pr-4 py-2.5 text-sm"
          style={{
            background: "var(--admin-bg)",
            border: "1px solid var(--admin-border)",
            borderRadius: "var(--admin-radius)",
            color: "var(--admin-text)",
          }}
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="admin-select w-[200px]"
        >
          {filter.placeholder && <option value="all">{filter.placeholder}</option>}
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {onClear && (
        <button
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={onClear}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}