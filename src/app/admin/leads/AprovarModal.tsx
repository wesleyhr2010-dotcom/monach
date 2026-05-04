"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { LeadItem } from "../actions-leads";

interface AprovarModalProps {
  lead: LeadItem;
  colaboradoras: { id: string; name: string }[];
  onApprove: (colaboradoraId: string | undefined, taxaComissao: number) => void;
  onClose: () => void;
  isPending: boolean;
}

export default function AprovarModal({
  lead,
  colaboradoras,
  onApprove,
  onClose,
  isPending,
}: AprovarModalProps) {
  const [colaboradoraId, setColaboradoraId] = useState<string>("");
  const [taxaComissao, setTaxaComissao] = useState<number>(25);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApprove(
      colaboradoraId || undefined,
      taxaComissao
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text)",
          maxWidth: "460px",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--admin-text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} color="#10b981" />
            Aprobar Lead
          </DialogTitle>
          <DialogDescription style={{ color: "var(--admin-text-muted)" }}>
            {lead.nome} — {lead.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
          <div
            style={{
              padding: "12px",
              borderRadius: "var(--admin-radius)",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              fontSize: "12px",
              color: "var(--admin-text)",
            }}
          >
            <AlertCircle size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
            Al aprobar, se creará un usuario en el sistema y se enviará un email de bienvenida con la contraseña temporal.
          </div>

          <div>
            <label className="admin-label">Consultora asignada</label>
            <select
              value={colaboradoraId}
              onChange={(e) => setColaboradoraId(e.target.value)}
              className="admin-input"
              style={{ width: "100%" }}
            >
              <option value="">— Seleccionar consultora —</option>
              {colaboradoras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Comisión (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={taxaComissao}
              onChange={(e) => setTaxaComissao(Number(e.target.value))}
              className="admin-input"
              required
              style={{ width: "100px" }}
            />
          </div>

          <DialogFooter style={{ gap: "8px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ background: "#10b981", borderColor: "#10b981" }}
            >
              {isPending ? "Aprobando..." : "Aprobar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
