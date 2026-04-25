"use client";

import { useState, useTransition } from "react";
import {
  updateNotificacaoTemplate,
  toggleNotificacaoTemplate,
  enviarPushTeste,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Bell, Pencil, Power, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import type { NotificacaoTemplate } from "@/generated/prisma/client";
import type { NotificacaoLogItem } from "./actions";

interface NotifPushClientProps {
  templates: NotificacaoTemplate[];
  logs: NotificacaoLogItem[];
  isConfigured: boolean;
  appId: string | undefined;
}

const TIPO_LABELS: Record<string, string> = {
  prazo_proximo_d3: "Prazo próximo (D-3)",
  prazo_proximo_d1: "Prazo próximo (D-1)",
  maleta_atrasada: "Maleta atrasada",
  maleta_devolvida_admin: "Devolución recibida (admin)",
  nova_maleta_revendedora: "Nova maleta (revendedora)",
  brinde_disponivel: "Brinde aprovado",
  pontos_concedidos: "Puntos ganhos",
  teste: "Prueba",
};

export default function NotifPushClient({ templates: initialTemplates, logs, isConfigured, appId }: NotifPushClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editTemplate, setEditTemplate] = useState<NotificacaoTemplate | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPendingTest, startTest] = useTransition();
  const [isPendingToggle, startToggle] = useTransition();
  const [isPendingSave, startSave] = useTransition();

  async function handleToggle(id: string, current: boolean) {
    startToggle(async () => {
      const updated = await toggleNotificacaoTemplate(id, !current);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    });
  }

  async function handleSaveEdit(formData: FormData) {
    if (!editTemplate) return;
    const titulo = formData.get("titulo") as string;
    const body = formData.get("body") as string;
    startSave(async () => {
      const updated = await updateNotificacaoTemplate(editTemplate.id, {
        titulo_es: titulo,
        body_es: body,
        ativo: editTemplate.ativo,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditTemplate(null);
    });
  }

  function handleTest() {
    startTest(async () => {
      const result = await enviarPushTeste();
      setTestStatus({ type: result.success ? "success" : "error", message: result.message });
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Notificaciones Push"
        description="Configuración de OneSignal y templates de notificaciones automáticas"
      />

      <div className="admin-content">
        {/* Seção A: Status da Integração */}
        <div className="admin-card" style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isConfigured ? "rgba(74,222,128,0.12)" : "rgba(224,92,92,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isConfigured ? (
                  <CheckCircle2 size={22} color="#4ADE80" />
                ) : (
                  <AlertCircle size={22} color="#E05C5C" />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>
                  {isConfigured ? "OneSignal conectado" : "OneSignal no configurado"}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", margin: "4px 0 0" }}>
                  {isConfigured
                    ? `App ID: ${appId?.slice(0, 8)}...${appId?.slice(-4)}`
                    : "Faltan las variables de entorno NEXT_PUBLIC_ONESIGNAL_APP_ID y ONESIGNAL_REST_API_KEY"}
                </p>
              </div>
            </div>

            <button
              onClick={handleTest}
              disabled={isPendingTest || !isConfigured}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ opacity: isPendingTest || !isConfigured ? 0.6 : 1 }}
            >
              <Send size={14} />
              {isPendingTest ? "Enviando..." : "Enviar prueba"}
            </button>
          </div>

          {testStatus && (
            <div
              className={`admin-alert ${testStatus.type === "success" ? "admin-alert-success" : "admin-alert-error"}`}
              style={{ marginTop: "16px" }}
            >
              {testStatus.message}
            </div>
          )}
        </div>

        {/* Seção B: Templates */}
        <div className="admin-card" style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Bell size={16} color="#35605A" />
            Templates de Notificación Automática
          </h3>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Título (ES)</th>
                  <th>Mensaje</th>
                  <th style={{ width: "80px" }}>Activo</th>
                  <th style={{ width: "60px" }} />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>
                        {TIPO_LABELS[t.tipo] || t.tipo}
                      </span>
                    </td>
                    <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.titulo_es}
                    </td>
                    <td
                      style={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--admin-text-muted)",
                      }}
                    >
                      {t.body_es}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(t.id, t.ativo)}
                        disabled={isPendingToggle}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          color: t.ativo ? "#4ADE80" : "#666",
                          transition: "color 0.15s ease",
                        }}
                        title={t.ativo ? "Desactivar" : "Activar"}
                      >
                        <Power size={16} />
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => setEditTemplate(t)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          color: "var(--admin-text-muted)",
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Variables legend */}
        <div
          style={{
            fontSize: "12px",
            color: "var(--admin-text-muted)",
            marginBottom: "24px",
            padding: "12px 16px",
            background: "var(--admin-bg)",
            borderRadius: "var(--admin-radius)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <strong style={{ color: "var(--admin-text)" }}>Variables disponibles:</strong>{" "}
          {"{maleta_id}"} {"{dias_restantes}"} {"{nome_revendedora}"} {"{pontos}"}
        </div>

        {/* Seção C: Histórico */}
        <div className="admin-card">
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Send size={16} color="#35605A" />
            Historial de Notificaciones
          </h3>

          {logs.length === 0 ? (
            <div className="admin-empty" style={{ padding: "32px" }}>
              <p>No hay envíos registrados aún.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: "right" }}>Enviadas</th>
                    <th style={{ textAlign: "right" }}>Fallos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleString("es-PY", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>
                          {TIPO_LABELS[log.tipo] || log.tipo}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{log.total_enviado}</td>
                      <td style={{ textAlign: "right", color: log.total_falha > 0 ? "#E05C5C" : "inherit" }}>
                        {log.total_falha}
                      </td>
                      <td>
                        {log.total_falha === 0 ? (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "rgba(74,222,128,0.12)",
                              color: "#4ADE80",
                            }}
                          >
                            ✅ Enviado
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "rgba(224,92,92,0.12)",
                              color: "#E05C5C",
                            }}
                          >
                            ⚠️ Parcial
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editTemplate && (
        <Dialog open onOpenChange={() => setEditTemplate(null)}>
          <DialogContent
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)",
              maxWidth: "480px",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "var(--admin-text)" }}>Editar Template</DialogTitle>
              <DialogDescription style={{ color: "var(--admin-text-muted)" }}>
                {TIPO_LABELS[editTemplate.tipo] || editTemplate.tipo}
              </DialogDescription>
            </DialogHeader>

            <form action={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <div>
                <label className="admin-label">Título (ES)</label>
                <input
                  name="titulo"
                  defaultValue={editTemplate.titulo_es}
                  className="admin-input"
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <label className="admin-label">Mensaje (ES)</label>
                <textarea
                  name="body"
                  defaultValue={editTemplate.body_es}
                  className="admin-textarea"
                  required
                  maxLength={500}
                  rows={4}
                />
              </div>

              <DialogFooter style={{ gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setEditTemplate(null)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPendingSave}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {isPendingSave ? "Guardando..." : "Guardar Template"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
