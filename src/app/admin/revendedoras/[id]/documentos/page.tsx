"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  getDocumentosRevendedora,
  aprovarDocumento,
  rejeitarDocumento,
} from "./actions";
import type { DocumentoRevendedora } from "./actions";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

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
        toast.error("Erro ao carregar documentos.");
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [id]);

  function handleAprovar(documentoId: string) {
    startTransition(async () => {
      const res = await aprovarDocumento(documentoId);
      if (res.success) {
        toast.success("Documento aprobado.");
        setDocumentos((prev) =>
          prev.map((d) => (d.id === documentoId ? { ...d, status: "aprovado", observacao: "" } : d))
        );
      } else {
        toast.error(res.error || "Error al aprobar.");
      }
    });
  }

  function handleRejeitar(documentoId: string) {
    if (!observacao.trim()) {
      toast.error("La observación es obligatoria al rechazar.");
      return;
    }
    startTransition(async () => {
      const res = await rejeitarDocumento(documentoId, observacao.trim());
      if (res.success) {
        toast.success("Documento rechazado.");
        setDocumentos((prev) =>
          prev.map((d) => (d.id === documentoId ? { ...d, status: "rejeitado", observacao: observacao.trim() } : d))
        );
        setRejeitandoId(null);
        setObservacao("");
      } else {
        toast.error(res.error || "Error al rechazar.");
      }
    });
  }

  const docAtual = documentos[0];
  const historico = documentos.slice(1);

  return (
    <>
      <AdminTopHeader
        breadcrumb="Revendedoras"
        backHref={`/admin/revendedoras/${id}`}
        title="Documentos"
      />

      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--admin-text-muted)", fontSize: 14 }}>Cargando documentos...</div>
        ) : documentos.length === 0 ? (
          <AdminEmptyState icon={FileText} title="Nenhum documento enviado" description="A revendedora ainda não enviou documentos." />
        ) : (
          <>
            {/* Documento Atual */}
            <div className="admin-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--admin-text-dim)" }}>
                  Documento Enviado
                </span>
                {docAtual && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", borderRadius: 4,
                    background: statusConfig[docAtual.status]?.bg || "rgba(136,136,136,0.12)",
                    color: statusConfig[docAtual.status]?.color || "#888",
                  }}>
                    {statusConfig[docAtual.status]?.label || docAtual.status.toUpperCase()}
                  </span>
                )}
              </div>

              {docAtual && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Preview */}
                  <div style={{
                    border: "1px solid var(--admin-border)", borderRadius: 8,
                    overflow: "hidden", background: "var(--admin-bg)",
                    maxHeight: 400, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {docAtual.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      <img src={docAtual.url} alt="Documento" style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain" }} />
                    ) : (
                      <div style={{ padding: 40, textAlign: "center" }}>
                        <FileText style={{ width: 48, height: 48, margin: "0 auto 16px", color: "var(--admin-text-muted)" }} />
                        <p style={{ color: "var(--admin-text-muted)", margin: 0 }}>Ver documento</p>
                        <a href={docAtual.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--admin-accent)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                          Abrir <ExternalLink style={{ width: 12, height: 12 }} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--admin-text-muted)" }}>
                    <span>Enviado em: <strong style={{ color: "var(--admin-text)" }}>{formatDate(docAtual.created_at)}</strong></span>
                    <span>Tipo: <strong style={{ color: "var(--admin-text)" }}>{docAtual.tipo === "ci" ? "Identidad CI / DNI" : docAtual.tipo}</strong></span>
                  </div>

                  {/* Ações */}
                  {(docAtual.status === "pendente" || docAtual.status === "em_analise") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {rejeitandoId === docAtual.id ? (
                        <>
                          <textarea
                            placeholder="Motivo del rechazo..."
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            rows={3}
                            style={{
                              width: "100%", padding: "10px 12px", borderRadius: 8,
                              background: "var(--admin-bg)", border: "1px solid var(--admin-border)",
                              color: "var(--admin-text)", fontFamily: "inherit", fontSize: 14, resize: "vertical",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button className="admin-btn admin-btn-secondary" onClick={() => { setRejeitandoId(null); setObservacao(""); }}>
                              Cancelar
                            </button>
                            <button
                              className="admin-btn"
                              disabled={isPending}
                              onClick={() => handleRejeitar(docAtual.id)}
                              style={{ background: "rgba(220,53,69,0.15)", color: "var(--admin-danger)", border: "1px solid rgba(220,53,69,0.3)" }}
                            >
                              {isPending ? "Rechazando..." : "Confirmar Rechazo"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button
                            className="admin-btn"
                            disabled={isPending}
                            onClick={() => handleAprovar(docAtual.id)}
                            style={{ background: "var(--admin-success)", color: "#000", display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <CheckCircle2 style={{ width: 15, height: 15 }} /> Aprobar
                          </button>
                          <button
                            className="admin-btn"
                            disabled={isPending}
                            onClick={() => setRejeitandoId(docAtual.id)}
                            style={{ background: "rgba(220,53,69,0.15)", color: "var(--admin-danger)", border: "1px solid rgba(220,53,69,0.3)", display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <XCircle style={{ width: 15, height: 15 }} /> Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {docAtual.status === "rejeitado" && docAtual.observacao && (
                    <div style={{
                      padding: "12px 16px", background: "rgba(224, 92, 92, 0.08)",
                      borderRadius: 8, border: "1px solid rgba(224, 92, 92, 0.2)",
                      fontSize: 13, color: "var(--admin-danger)",
                    }}>
                      <strong>Motivo del rechazo:</strong> {docAtual.observacao}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Histórico */}
            {historico.length > 0 && (
              <div className="admin-card">
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--admin-text-dim)", marginBottom: 16 }}>
                  Histórico
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {historico.map((doc) => {
                    const st = statusConfig[doc.status];
                    return (
                      <div key={doc.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", background: "var(--admin-bg)",
                        borderRadius: 8, border: "1px solid var(--admin-border)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <FileText style={{ width: 16, height: 16, color: "var(--admin-text-muted)" }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--admin-text)" }}>
                              {doc.tipo === "ci" ? "Identidad CI / DNI" : doc.tipo}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                              {formatDate(doc.created_at)}
                              {doc.observacao ? ` — "${doc.observacao}"` : ""}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", borderRadius: 4,
                          background: st?.bg || "rgba(136,136,136,0.12)",
                          color: st?.color || "#888",
                        }}>
                          {st?.label || doc.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
