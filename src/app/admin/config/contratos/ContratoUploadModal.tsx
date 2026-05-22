"use client";

import { useState, useTransition } from "react";
import { uploadContrato } from "../../actions-config";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";

interface ContratoUploadModalProps {
  onUpload: () => void;
  onClose: () => void;
}

export default function ContratoUploadModal({
  onUpload,
  onClose,
}: ContratoUploadModalProps) {
  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [obrigatorio, setObrigatorio] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  function validateFile(f: File): string | null {
    if (f.type !== "application/pdf") return "Solo se aceptan archivos PDF.";
    if (f.size > 10 * 1024 * 1024) return "El archivo no puede superar 10MB.";
    return null;
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    const err = validateFile(selected);
    if (err) {
      toast.error(err);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !nome.trim()) {
      toast.error("Nombre y archivo son obligatorios.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nome", nome.trim());
    formData.append("obrigatorio", String(obrigatorio));
    formData.append("ativo", String(ativo));

    startTransition(async () => {
      const result = await uploadContrato(formData);
      if (result.success) {
        toast.success("Contrato subido correctamente");
        onUpload();
      } else {
        toast.error(result.error || "Error al subir");
      }
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius)",
          padding: "24px",
          width: "100%",
          maxWidth: "460px",
          color: "var(--admin-text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
          Nuevo Contrato
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="admin-label">Nombre del contrato</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="admin-input"
              required
              placeholder="Ej: Contrato de Consignación 2024"
            />
          </div>

          {/* Drag & drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "#35605a" : "var(--admin-border)"}`,
              borderRadius: "var(--admin-radius)",
              padding: "24px",
              textAlign: "center",
              background: dragOver ? "rgba(53,96,90,0.05)" : "var(--admin-bg)",
              transition: "all 0.15s ease",
              cursor: "pointer",
            }}
          >
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FileText size={18} color="#35605a" />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                >
                  <X size={14} color="#ef4444" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={24} color="var(--admin-text-muted)" style={{ marginBottom: "8px" }} />
                <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", margin: 0 }}>
                  Arrastra un PDF aquí o{" "}
                  <label style={{ color: "#35605a", cursor: "pointer", fontWeight: 600 }}>
                    selecciona un archivo
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                      style={{ display: "none" }}
                    />
                  </label>
                </p>
                <p style={{ fontSize: "11px", color: "var(--admin-text-muted)", margin: "4px 0 0" }}>
                  Máximo 10MB
                </p>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={obrigatorio}
                onChange={(e) => setObrigatorio(e.target.checked)}
              />
              Obligatorio para nuevas revendedoras
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Activo
            </label>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
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
              disabled={isPending || !file}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {isPending ? "Subiendo..." : "Subir Contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
