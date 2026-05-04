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
import { XCircle, AlertCircle } from "lucide-react";
import type { LeadItem } from "../actions-leads";

interface RecusarModalProps {
  lead: LeadItem;
  onReject: (observacao: string) => void;
  onClose: () => void;
  isPending: boolean;
}

export default function RecusarModal({
  lead,
  onReject,
  onClose,
  isPending,
}: RecusarModalProps) {
  const [observacao, setObservacao] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onReject(observacao);
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
            <XCircle size={18} color="#ef4444" />
            Rechazar Lead
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
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              fontSize: "12px",
              color: "var(--admin-text)",
            }}
          >
            <AlertCircle size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
            Se enviará un email de rechazo a {lead.email}.
          </div>

          <div>
            <label className="admin-label">Observación (opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="admin-textarea"
              rows={3}
              placeholder="Motivo del rechazo..."
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
              style={{ background: "#ef4444", borderColor: "#ef4444" }}
            >
              {isPending ? "Rechazando..." : "Rechazar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
