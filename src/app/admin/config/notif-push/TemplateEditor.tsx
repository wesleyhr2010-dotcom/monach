"use client";

import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VARIAVEIS_POR_TIPO, mapTipoParaWhitelist } from "@/lib/notifications-shared";
import type { NotificacaoTemplate } from "@/generated/prisma/client";

interface TemplateEditorProps {
  template: NotificacaoTemplate;
  onSave: (formData: FormData) => void;
  onClose: () => void;
  isPending: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  prazo_proximo_d3: "Prazo próximo (D-3)",
  prazo_proximo_d1: "Prazo próximo (D-1)",
  maleta_atrasada: "Maleta atrasada",
  maleta_devolvida_admin: "Devolución recibida (admin)",
  nova_maleta_revendedora: "Nova maleta (revendedora)",
  brinde_disponivel: "Brinde aprobado",
  pontos_concedidos: "Puntos ganhos",
  teste: "Prueba",
  campanha_manual: "Campaña manual",
};

export default function TemplateEditor({
  template,
  onSave,
  onClose,
  isPending,
}: TemplateEditorProps) {
  const [body, setBody] = useState(template.body_es);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const tipoKey = mapTipoParaWhitelist(template.tipo);
  const variaveis = tipoKey ? VARIAVEIS_POR_TIPO[tipoKey] : null;

  const unknownVars = useMemo(() => {
    if (!variaveis) return [];
    const found = body.match(/\{([^}]+)\}/g) ?? [];
    return found
      .map((m) => m.slice(1, -1))
      .filter((v) => !variaveis.includes(v));
  }, [body, variaveis]);

  function insertVariable(varName: string) {
    const el = bodyRef.current;
    if (!el) return;

    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const before = body.slice(0, start);
    const after = body.slice(end);
    const next = `${before}{${varName}}${after}`;
    setBody(next);

    // Reposição do cursor após a inserção
    requestAnimationFrame(() => {
      const pos = start + varName.length + 2;
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text)",
          maxWidth: "520px",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--admin-text)" }}>
            Editar Template
          </DialogTitle>
          <DialogDescription style={{ color: "var(--admin-text-muted)" }}>
            {TIPO_LABELS[template.tipo] || template.tipo}
          </DialogDescription>
        </DialogHeader>

        <form
          action={onSave}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          <div>
            <label className="admin-label">Título (ES)</label>
            <input
              name="titulo"
              defaultValue={template.titulo_es}
              className="admin-input"
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="admin-label">Mensaje (ES)</label>
            <textarea
              ref={bodyRef}
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="admin-textarea"
              required
              maxLength={500}
              rows={4}
            />
          </div>

          {/* Variáveis disponíveis */}
          <div
            style={{
              padding: "12px",
              borderRadius: "var(--admin-radius)",
              background: "var(--admin-bg)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "var(--admin-text-muted)",
              }}
            >
              Variables disponibles
            </p>
            {variaveis ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {variaveis.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "1px solid var(--admin-border)",
                      background: "var(--admin-surface)",
                      color: "var(--admin-text)",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "monospace",
                    }}
                    title={`Insertar {${v}}`}
                  >
                    {"{"}
                    {v}
                    {"}"}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>
                Todas las variables están permitidas
              </p>
            )}
          </div>

          {/* Aviso de variáveis desconhecidas */}
          {unknownVars.length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--admin-radius)",
                background: "rgba(234,179,8,0.12)",
                color: "#eab308",
                fontSize: "12px",
              }}
            >
              <strong>Atención:</strong> Variable{" "}
              {unknownVars.map((v) => `"{${v}}"`).join(", ")} no está en la
              lista permitida para este tipo. Será ignorada en el envío.
            </div>
          )}

          <DialogFooter style={{ gap: "8px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {isPending ? "Guardando..." : "Guardar Template"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
