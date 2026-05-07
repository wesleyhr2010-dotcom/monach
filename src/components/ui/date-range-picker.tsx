"use client";

import * as React from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import "react-day-picker/style.css";
import "./date-range-picker.css";
export type DateRangeValue = { from: Date; to: Date } | undefined;

type Props = {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
};

export function DatePickerWithRange({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setOpen(false);
    } else if (range?.from) {
      onChange({ from: range.from, to: range.from });
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  // Close on outside click
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
        onClick={() => setOpen((v) => !v)}
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
            padding: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <DayPicker
            mode="range"
            selected={
              value
                ? { from: value.from, to: value.to }
                : undefined
            }
            onSelect={handleSelect}
            locale={es}
            numberOfMonths={2}
            classNames={{
              root: "rdp-root",
              months: "rdp-months",
              month: "rdp-month",
              caption: "rdp-caption",
              caption_label: "rdp-caption-label",
              nav: "rdp-nav",
              button_previous: "rdp-button-previous",
              button_next: "rdp-button-next",
              month_grid: "rdp-month-grid",
              weekdays: "rdp-weekdays",
              weekday: "rdp-weekday",
              week: "rdp-week",
              day: "rdp-day",
              day_button: "rdp-day-button",
              range_start: "rdp-range-start",
              range_end: "rdp-range-end",
              range_middle: "rdp-range-middle",
              selected: "rdp-selected",
              outside: "rdp-outside",
              disabled: "rdp-disabled",
              hidden: "rdp-hidden",
              today: "rdp-today",
              focused: "rdp-focused",
            }}
          />
        </div>
      )}

    </div>
  );
}
