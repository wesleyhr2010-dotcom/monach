"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  getDocumentosRevendedora,
  aprovarDocumento,
  rejeitarDocumento,
} from "./actions";
import type { DocumentoRevendedora } from "./actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendente: { label: "PENDENTE", color: "#facc15", bg: "rgba(250, 204, 21, 0.12)", icon: <Clock className="w-3 h-3" /> },
  em_analise: { label: "EM ANÁLISE", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.12)", icon: <Clock className="w-3 h-3" /> },
  aprovado: { label: "APROVADO", color: "#4ade80", bg: "rgba(74, 222, 128, 0.12)", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejeitado: { label: "REJEITADO", color: "#e05c5c", bg: "rgba(224, 92, 92, 0.12)", icon: <XCircle className="w-3 h-3" /> },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentosRevendedoraPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [documentos, setDocumentos] = useState<DocumentoRevendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rejeitandoId, setRejeitandoId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!id) return;
    async function fetchDocs() {
      setLoading(true);
      try {
        const data = await getDocumentosRevendedora(id);
        setDocumentos(data);
      } catch {
        setError("Erro ao carregar documentos.");
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [id]);

  function showMsg(type: "success" | "error", msg: string) {
    if (type === "success") {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    }
  }

  function handleAprovar(documentoId: string) {
    startTransition(async () => {
      const res = await aprovarDocumento(documentoId);
      if (res.success) {
        showMsg("success", "Documento aprobado.");
        setDocumentos((prev) =>
          prev.map((d) => (d.id === documentoId ? { ...d, status: "aprovado", observacao: "" } : d))
        );
      } else {
        showMsg("error", res.error || "Error al aprobar.");
      }
    });
  }

  function handleRejeitar(documentoId: string) {
    if (!observacao.trim()) {
      showMsg("error", "La observación es obligatoria al rechazar.");
      return;
    }
    startTransition(async () => {
      const res = await rejeitarDocumento(documentoId, observacao.trim());
      if (res.success) {
        showMsg("success", "Documento rechazado.");
        setDocumentos((prev) =>
          prev.map((d) => (d.id === documentoId ? { ...d, status: "rejeitado", observacao: observacao.trim() } : d))
        );
        setRejeitandoId(null);
        setObservacao("");
      } else {
        showMsg("error", res.error || "Error al rechazar.");
      }
    });
  }

  const docAtual = documentos[0];
  const historico = documentos.slice(1);

  return (
    <>
      <AdminPageHeader
        title="Documentos"
        breadcrumb={`ADMIN / REVENDEDORAS / ${id.slice(0, 8).toUpperCase()}`}
        backHref={`/admin/revendedoras/${id}`}
      />

      <div className="admin-content">
        {/* Toasts */}
        {success && (
          <div className="admin-toast admin-toast-success">✅ {success}</div>
        )}
        {error && (
          <div className="admin-toast admin-toast-error">❌ {error}</div>
        )}

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Cargando documentos...</p>
            </CardContent>
          </Card>
        ) : documentos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum documento enviado</p>
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Documento Atual */}
            <Card>
              <CardContent style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)" }}>
                    Documento Enviado
                  </h3>
                  {docAtual && (
                    <span className="admin-badge" style={{
                      background: statusConfig[docAtual.status]?.bg || "rgba(136, 136, 136, 0.12)",
                      color: statusConfig[docAtual.status]?.color || "#888",
                    }}>
                      {statusConfig[docAtual.status]?.label || docAtual.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {docAtual && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Preview */}
                    <div style={{
                      border: "1px solid var(--admin-border)",
                      borderRadius: "var(--admin-radius)",
                      overflow: "hidden",
                      background: "var(--admin-bg)",
                      maxHeight: "400px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {docAtual.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        <img
                          src={docAtual.url}
                          alt="Documento"
                          style={{ maxWidth: "100%", maxHeight: "380px", objectFit: "contain" }}
                        />
                      ) : (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
                          <p style={{ color: "var(--admin-text-muted)" }}>Ver documento</p>
                          <a
                            href={docAtual.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--admin-accent)", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "8px" }}
                          >
                            Abrir <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px", color: "var(--admin-text-muted)" }}>
                      <span>Enviado em: <strong style={{ color: "var(--admin-text)" }}>{formatDate(docAtual.created_at)}</strong></span>
                      <span>Tipo: <strong style={{ color: "var(--admin-text)" }}>{docAtual.tipo === "ci" ? "Identidad CI / DNI" : docAtual.tipo}</strong></span>
                    </div>

                    {/* Ações */}
                    {(docAtual.status === "pendente" || docAtual.status === "em_analise") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {rejeitandoId === docAtual.id ? (
                          <>
                            <textarea
                              placeholder="Motivo del rechazo..."
                              value={observacao}
                              onChange={(e) => setObservacao(e.target.value)}
                              rows={3}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "var(--admin-radius)",
                                background: "var(--admin-bg)",
                                border: "1px solid var(--admin-border)",
                                color: "var(--admin-text)",
                                fontFamily: "inherit",
                                fontSize: "14px",
                                resize: "vertical",
                              }}
                            />
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <Button variant="outline" size="sm" onClick={() => { setRejeitandoId(null); setObservacao(""); }}>
                                Cancelar
                              </Button>
                              <Button variant="destructive" size="sm" disabled={isPending} onClick={() => handleRejeitar(docAtual.id)}>
                                {isPending ? "Rechazando..." : "Confirmar Rechazo"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleAprovar(docAtual.id)}
                              style={{ background: "var(--admin-success)", color: "#000" }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isPending}
                              onClick={() => setRejeitandoId(docAtual.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {docAtual.status === "rejeitado" && docAtual.observacao && (
                      <div style={{
                        padding: "12px 16px",
                        background: "rgba(224, 92, 92, 0.08)",
                        borderRadius: "var(--admin-radius)",
                        border: "1px solid rgba(224, 92, 92, 0.2)",
                        fontSize: "13px",
                        color: "var(--admin-danger)",
                      }}>
                        <strong>Motivo del rechazo:</strong> {docAtual.observacao}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico */}
            {historico.length > 0 && (
              <Card>
                <CardContent style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--admin-text-dim)", marginBottom: "16px" }}>
                    Histórico
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {historico.map((doc) => {
                      const st = statusConfig[doc.status];
                      return (
                        <div key={doc.id} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: "var(--admin-bg)",
                          borderRadius: "var(--admin-radius)",
                          border: "1px solid var(--admin-border)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <FileText className="w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 500 }}>
                                {doc.tipo === "ci" ? "Identidad CI / DNI" : doc.tipo}
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>
                                {formatDate(doc.created_at)}
                                {doc.observacao ? ` — "${doc.observacao}"` : ""}
                              </div>
                            </div>
                          </div>
                          <span className="admin-badge" style={{
                            background: st?.bg || "rgba(136, 136, 136, 0.12)",
                            color: st?.color || "#888",
                          }}>
                            {st?.label || doc.status.toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
