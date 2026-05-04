"use client";

import { useState, useTransition } from "react";
import { deleteContrato, updateContrato } from "../../actions-config";
import type { ContratoItem } from "../../actions-config";
import ContratoUploadModal from "./ContratoUploadModal";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, FileText, AlertTriangle } from "lucide-react";

interface ContratosClientProps {
  initialContratos: ContratoItem[];
}

export default function ContratosClient({ initialContratos }: ContratosClientProps) {
  const [contratos, setContratos] = useState(initialContratos);
  const [showUpload, setShowUpload] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este contrato?")) return;
    startTransition(async () => {
      const result = await deleteContrato(id);
      if (result.success) {
        toast.success("Contrato eliminado");
        setContratos((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    });
  }

  async function handleToggleAtivo(id: string, current: boolean) {
    startTransition(async () => {
      const result = await updateContrato(id, { nome: "", obrigatorio: false, ativo: !current });
      if (result.success) {
        toast.success(current ? "Contrato desactivado" : "Contrato activado");
        window.location.reload();
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    });
  }

  async function handleToggleObrigatorio(id: string, nome: string, currentObr: boolean, ativo: boolean) {
    startTransition(async () => {
      const result = await updateContrato(id, { nome, obrigatorio: !currentObr, ativo });
      if (result.success) {
        toast.success(currentObr ? "Ya no es obligatorio" : "Marcado como obligatorio");
        window.location.reload();
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    });
  }

  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setShowUpload(true)}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          <Plus size={14} /> Novo Contrato
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Obrigatório</th>
              <th>Estado</th>
              <th style={{ width: "140px" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--admin-text-muted)" }}>
                  <AlertTriangle size={20} style={{ marginBottom: "8px" }} />
                  <p>Nenhum contrato cadastrado.</p>
                </td>
              </tr>
            ) : (
              contratos.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={16} color="#35605a" />
                      <span style={{ fontWeight: 500 }}>{c.nome}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleObrigatorio(c.id, c.nome, c.obrigatorio, c.ativo)}
                      disabled={isPending}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: c.obrigatorio ? "rgba(239,68,68,0.12)" : "rgba(100,100,100,0.08)",
                        color: c.obrigatorio ? "#ef4444" : "#888",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {c.obrigatorio ? "Sí" : "No"}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleAtivo(c.id, c.ativo)}
                      disabled={isPending}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: c.ativo ? "rgba(74,222,128,0.12)" : "rgba(100,100,100,0.08)",
                        color: c.ativo ? "#4ADE80" : "#888",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {c.ativo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-icon admin-btn-sm"
                        title="Ver PDF"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="admin-btn admin-btn-icon admin-btn-sm"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showUpload && (
        <ContratoUploadModal
          onUpload={() => {
            setShowUpload(false);
            window.location.reload();
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
}
