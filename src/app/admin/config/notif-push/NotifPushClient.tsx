"use client";

import { useState, useTransition, useEffect } from "react";
import {
  updateNotificacaoTemplate,
  toggleNotificacaoTemplate,
  enviarPushTeste,
  getRevendedorasParaCampanha,
  enviarCampanhaPush,
  type RevendedoraCampanha,
  type FiltroCampanha,
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
  brinde_disponivel: "Brinde aprobado",
  pontos_concedidos: "Puntos ganhos",
  teste: "Prueba",
  campanha_manual: "Campaña manual",
};

export default function NotifPushClient({ templates: initialTemplates, logs, isConfigured, appId }: NotifPushClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editTemplate, setEditTemplate] = useState<NotificacaoTemplate | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPendingTest, startTest] = useTransition();
  const [isPendingToggle, startToggle] = useTransition();
  const [isPendingSave, startSave] = useTransition();

  // Campanha push em massa
  const [campanhaFiltro, setCampanhaFiltro] = useState<FiltroCampanha>("todas");
  const [revendedoras, setRevendedoras] = useState<RevendedoraCampanha[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [campanhaTitulo, setCampanhaTitulo] = useState("");
  const [campanhaMensagem, setCampanhaMensagem] = useState("");
  const [isLoadingRevendedoras, startLoadRevendedoras] = useTransition();
  const [isSendingCampanha, startSendCampanha] = useTransition();
  const [campanhaResult, setCampanhaResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showCampanhaSection, setShowCampanhaSection] = useState(false);

  useEffect(() => {
    if (showCampanhaSection && revendedoras.length === 0) {
      handleLoadRevendedoras("todas");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCampanhaSection]);

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

  function handleLoadRevendedoras(filtro: FiltroCampanha) {
    startLoadRevendedoras(async () => {
      const lista = await getRevendedorasParaCampanha(filtro);
      setRevendedoras(lista);
      setSelectedIds(new Set(lista.map((r) => r.id)));
      setCampanhaResult(null);
    });
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === revendedoras.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(revendedoras.map((r) => r.id)));
    }
  }

  function handleSendCampanha() {
    if (selectedIds.size === 0) {
      setCampanhaResult({ type: "error", message: "Selecciona al menos una revendedora." });
      return;
    }
    if (!campanhaTitulo.trim() || !campanhaMensagem.trim()) {
      setCampanhaResult({ type: "error", message: "Título y mensaje son obligatorios." });
      return;
    }
    startSendCampanha(async () => {
      const result = await enviarCampanhaPush(Array.from(selectedIds), campanhaTitulo, campanhaMensagem);
      setCampanhaResult({ type: result.success ? "success" : "error", message: result.message });
      if (result.success) {
        setCampanhaTitulo("");
        setCampanhaMensagem("");
      }
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

        {/* Seção D: Campanha Push em Massa */}
        <div className="admin-card" style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
            onClick={() => setShowCampanhaSection((s) => !s)}
          >
            <Send size={16} color="#35605A" />
            Campaña Push en Masa
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--admin-text-muted)" }}>
              {showCampanhaSection ? "Ocultar ▲" : "Mostrar ▼"}
            </span>
          </h3>

          {showCampanhaSection && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Filtro de destinatários */}
              <div>
                <label className="admin-label">Destinatarios</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                  {[
                    { value: "todas", label: "Todas activas" },
                    { value: "com_maleta_ativa", label: "Con maleta activa" },
                    { value: "sem_maleta", label: "Sin maleta" },
                    { value: "onboarding_incompleto", label: "Onboarding incompleto" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setCampanhaFiltro(opt.value as FiltroCampanha);
                        handleLoadRevendedoras(opt.value as FiltroCampanha);
                      }}
                      disabled={isLoadingRevendedoras}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--admin-radius)",
                        border: "1px solid var(--admin-border)",
                        background: campanhaFiltro === opt.value ? "#35605A" : "var(--admin-surface)",
                        color: campanhaFiltro === opt.value ? "#fff" : "var(--admin-text)",
                        fontSize: "13px",
                        cursor: "pointer",
                        opacity: isLoadingRevendedoras ? 0.6 : 1,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de revendedoras */}
              {revendedoras.length > 0 && (
                <div
                  style={{
                    maxHeight: "280px",
                    overflowY: "auto",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius)",
                    background: "var(--admin-bg)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--admin-border)",
                      position: "sticky",
                      top: 0,
                      background: "var(--admin-bg)",
                      zIndex: 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.size === revendedoras.length && revendedoras.length > 0}
                      onChange={toggleAll}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>
                      {selectedIds.size} de {revendedoras.length} seleccionadas
                    </span>
                  </div>
                  {revendedoras.map((r) => (
                    <label
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--admin-border)",
                        cursor: "pointer",
                        opacity: r.auth_user_id ? 1 : 0.5,
                      }}
                      title={r.auth_user_id ? "" : "Sin dispositivo vinculado — no recibirá push"}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelection(r.id)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                          {r.whatsapp}
                          {r.hasMaletaAtiva && (
                            <span style={{ marginLeft: "8px", color: "#4ADE80", fontWeight: 600 }}>● Maleta activa</span>
                          )}
                        </div>
                      </div>
                      {!r.auth_user_id && (
                        <span style={{ fontSize: "10px", color: "#E05C5C", fontWeight: 600 }}>Sin push</span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {revendedoras.length === 0 && !isLoadingRevendedoras && (
                <div className="admin-empty" style={{ padding: "16px" }}>
                  <p style={{ fontSize: "13px" }}>No hay revendedoras en este filtro.</p>
                </div>
              )}

              {/* Mensagem */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="admin-label">Título</label>
                  <input
                    className="admin-input"
                    value={campanhaTitulo}
                    onChange={(e) => setCampanhaTitulo(e.target.value)}
                    placeholder="Ej: ¡Nueva colección disponible!"
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="admin-label">Mensaje</label>
                  <textarea
                    className="admin-textarea"
                    value={campanhaMensagem}
                    onChange={(e) => setCampanhaMensagem(e.target.value)}
                    placeholder="Ej: Ya podés ver los nuevos artículos en tu catálogo..."
                    maxLength={500}
                    rows={3}
                  />
                </div>
              </div>

              {campanhaResult && (
                <div
                  className={`admin-alert ${campanhaResult.type === "success" ? "admin-alert-success" : "admin-alert-error"}`}
                >
                  {campanhaResult.message}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSendCampanha}
                  disabled={isSendingCampanha || selectedIds.size === 0}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  style={{ opacity: isSendingCampanha || selectedIds.size === 0 ? 0.6 : 1 }}
                >
                  <Send size={14} />
                  {isSendingCampanha ? "Enviando..." : `Enviar campaña (${selectedIds.size})`}
                </button>
              </div>
            </div>
          )}
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
