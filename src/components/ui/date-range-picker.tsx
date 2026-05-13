"use client";

import * as React from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import "./date-range-picker.css";

export type DateRangeValue = { from: Date; to: Date } | undefined;

type Props = {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
};

export function DatePickerWithRange({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(undefined);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Ao abrir o calendário, sempre começa seleção do zero.
  // Necessário porque quando já há um range completo o DayPicker v9
  // interpreta o 1º clique como "ajuste do range" e retorna { from, to }
  // imediatamente, acionando setOpen(false) antes da 2ª data ser escolhida.
  const handleToggle = () => {
    if (!open) {
      setInternalRange(undefined);
    }
    setOpen((v) => !v);
  };

  // react-day-picker v9 seta to=from no primeiro clique (min=0 padrão).
  // Só fechar e propagar quando from e to são dias distintos.
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleSelect = (range: DateRange | undefined) => {
    setInternalRange(range);
    if (range?.from && range?.to && !isSameDay(range.from, range.to)) {
      onChange({ from: range.from, to: range.to });
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalRange(undefined);
    onChange(undefined);
  };

  // Fecha ao clicar fora
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const displayText = value
    ? `${format(value.from, "dd/MM/yyyy", { locale: es })} — ${format(value.to, "dd/MM/yyyy", { locale: es })}`
    : "Seleccionar fechas";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          borderRadius: "var(--admin-radius)",
          border: "1px solid var(--admin-border)",
          background: "var(--admin-surface)",
          color: value ? "var(--admin-text)" : "var(--admin-text-muted)",
          fontSize: "13px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <CalendarIcon className="w-3.5 h-3.5" style={{ color: "var(--admin-text-muted)" }} />
        <span>{displayText}</span>
        {value && (
          <span
            onClick={handleClear}
            style={{
              display: "inline-flex",
              marginLeft: "4px",
              cursor: "pointer",
              color: "var(--admin-text-muted)",
            }}
            title="Limpiar"
          >
            <XIcon className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 50,
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: "var(--admin-radius)",
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <DayPicker
            mode="range"
            selected={internalRange}
            onSelect={handleSelect}
            locale={es}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}
