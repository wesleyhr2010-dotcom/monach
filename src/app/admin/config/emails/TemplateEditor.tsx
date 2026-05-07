"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TIPO_EMAIL_OPTIONS, EMAIL_VARIAVEIS_POR_TIPO, EMAIL_VARIAVEIS_GLOBAIS } from "@/lib/emails-shared";
import { saveEmailTemplate, deleteEmailTemplate } from "./actions";
import type { EmailTemplate } from "@/generated/prisma/client";

interface TemplateEditorProps {
  template: EmailTemplate | null;
  tipo: string;
}

export default function TemplateEditor({ template, tipo }: TemplateEditorProps) {
  const router = useRouter();
  const htmlBodyRef = useRef<HTMLTextAreaElement>(null);
  const textBodyRef = useRef<HTMLTextAreaElement>(null);

  const [subject, setSubject] = useState(template?.subject ?? "");
  const [greeting, setGreeting] = useState(template?.greeting ?? "");
  const [bodyHtml, setBodyHtml] = useState(template?.body_html ?? "");
  const [bodyText, setBodyText] = useState(template?.body_text ?? "");
  const [preview, setPreview] = useState(template?.preview ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const label = TIPO_EMAIL_OPTIONS.find((t) => t.value === tipo)?.label ?? tipo;
  const tipoWhitelist = EMAIL_VARIAVEIS_POR_TIPO[tipo] ?? [];
  const allVariables = [...new Set([...tipoWhitelist, ...EMAIL_VARIAVEIS_GLOBAIS])];

  // Detecta variables desconocidas en HTML
  const unknownVars = useMemo(() => {
    const found = bodyHtml.match(/\{([^}]+)\}/g) ?? [];
    return found
      .map((m) => m.slice(1, -1))
      .filter((v) => !allVariables.includes(v));
  }, [bodyHtml, allVariables]);

  // Valida sintaxis de llaves
  const hasSyntaxError = useMemo(() => {
    let balance = 0;
    for (const content of [subject, bodyHtml]) {
      for (let i = 0; i < content.length; i++) {
        if (content[i] === "{") balance++;
        if (content[i] === "}") balance--;
        if (balance < 0) return true;
      }
      if (balance !== 0) return true;
      balance = 0;
    }
    return false;
  }, [subject, bodyHtml]);

  function insertVariable(varName: string, targetRef: React.RefObject<HTMLTextAreaElement>) {
    const el = targetRef.current;
    if (!el) return;

    const start = el.selectionStart ?? (targetRef === htmlBodyRef ? bodyHtml.length : bodyText.length);
    const end = el.selectionEnd ?? start;
    const currentValue = targetRef === htmlBodyRef ? bodyHtml : bodyText;
    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    const next = `${before}{${varName}}${after}`;

    if (targetRef === htmlBodyRef) {
      setBodyHtml(next);
    } else {
      setBodyText(next);
    }

    requestAnimationFrame(() => {
      const pos = start + varName.length + 2;
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const result = await saveEmailTemplate({
      tipo,
      subject,
      body_html: bodyHtml,
      body_text: bodyText || undefined,
      preview: preview || undefined,
      greeting: greeting || undefined,
    });

    setIsSaving(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error);
    }
  }

  async function handleReset() {
    if (!confirm("¿Restablecer esta plantilla a su versión estándar? Se eliminarán todos los cambios personalizados.")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteEmailTemplate(tipo);
    setIsDeleting(false);

    if (result.success) {
      router.push("/admin/config/emails");
    } else {
      setError(result.error);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Encabezado */}
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', system-ui, sans-serif", fontSize: "20px", marginBottom: "4px" }}>
          {label}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
          {template ? "Personalizado (BD)" : "Estándar (Código) — se creará un override al guardar"}
        </p>
      </div>

      {/* Errores y éxito */}
      {error && (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--admin-radius)",
            background: "rgba(224, 92, 92, 0.12)",
            color: "#E05C5C",
            fontSize: "13px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--admin-radius)",
            background: "rgba(74, 222, 128, 0.12)",
            color: "#4ADE80",
            fontSize: "13px",
          }}
        >
          ✓ Plantilla guardada exitosamente
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="admin-label">Asunto</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="admin-input"
          placeholder="Ej: Confirmación de Consignación #{maleta_numero}"
          maxLength={200}
        />
      </div>

      {/* Greeting */}
      <div>
        <label className="admin-label">Saludo (opcional)</label>
        <input
          type="text"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          className="admin-input"
          placeholder="Ej: Hola {nome_revendedora},"
          maxLength={100}
        />
      </div>

      {/* Preview Text */}
      <div>
        <label className="admin-label">Texto de Previsualización (opcional)</label>
        <input
          type="text"
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          className="admin-input"
          placeholder="Texto que aparece en la vista previa del correo"
          maxLength={200}
        />
      </div>

      {/* Body HTML */}
      <div>
        <label className="admin-label">Cuerpo HTML</label>
        <textarea
          ref={htmlBodyRef}
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          className="admin-input"
          style={{ fontFamily: "monospace", minHeight: "200px", whiteSpace: "pre" }}
          placeholder="<p>Tu consultora confirmó la recepción...</p>"
        />
      </div>

      {/* Body Text (Plain Text) */}
      <div>
        <label className="admin-label">Cuerpo Texto Plano (opcional)</label>
        <textarea
          ref={textBodyRef}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          className="admin-input"
          style={{ minHeight: "120px" }}
          placeholder="Se generará automáticamente desde el HTML si se deja vacío"
        />
      </div>

      {/* Variables disponibles */}
      <div
        style={{
          padding: "16px",
          borderRadius: "var(--admin-radius)",
          background: "var(--admin-bg)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            marginBottom: "12px",
            color: "var(--admin-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Variables disponibles
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {allVariables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v, htmlBodyRef)}
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
      </div>

      {/* Aviso de variables desconocidas */}
      {unknownVars.length > 0 && (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--admin-radius)",
            background: "rgba(234, 179, 8, 0.12)",
            color: "#eab308",
            fontSize: "12px",
          }}
        >
          <strong>Atención:</strong> Variable{" "}
          {unknownVars.map((v) => `"{${v}}"`).join(", ")} no está en la lista permitida para este tipo. Será ignorada en el envío.
        </div>
      )}

      {/* Error de sintaxis */}
      {hasSyntaxError && (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--admin-radius)",
            background: "rgba(224, 92, 92, 0.12)",
            color: "#E05C5C",
            fontSize: "12px",
          }}
        >
          <strong>Error de sintaxis:</strong> Llaves desbalanceadas. Verifica que todas las {"{"} tengan su {"}"}.
        </div>
      )}

      {/* Botones de acción */}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || hasSyntaxError}
          className="admin-btn admin-btn-primary"
          style={{ flex: 1 }}
        >
          {isSaving ? "Guardando..." : "Guardar Plantilla"}
        </button>

        {template && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isDeleting}
            className="admin-btn admin-btn-secondary"
          >
            {isDeleting ? "Restableciendo..." : "Restablecer a estándar"}
          </button>
        )}

        <button
          type="button"
          onClick={() => router.back()}
          className="admin-btn admin-btn-secondary"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
