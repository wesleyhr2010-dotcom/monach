"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { previewSync, executeSync, type SyncPreview } from "@/lib/actions/estoque-sync";
import { StockSyncPreview } from "./StockSyncPreview";

/** Converte ArrayBuffer para base64 usando API do browser */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function StockSyncUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [updateStock, setUpdateStock] = useState(true);
  const [updatePrice, setUpdatePrice] = useState(true);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number; rejected: import("@/lib/actions/estoque-sync").RejectedProduct[]; movements: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Solo se aceptan archivos Excel (.xlsx ou .xls)");
      return;
    }

    setFile(selectedFile);
    setPreview(null);
    setSyncResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      toast.error("Selecciona un archivo Excel primero");
      return;
    }
    if (!updateStock && !updatePrice) {
      toast.error("Selecciona al menos una opción de actualización");
      return;
    }

    setLoading(true);
    try {
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      const result = await previewSync(
        { name: file.name, data: base64 },
        { updateStock, updatePrice }
      );
      setPreview(result);
      toast.success(`Análisis completo: ${result.matched.length} productos encontrados, ${result.rejected.length} rechazados`);
    } catch (error) {
      toast.error("Error al analizar el archivo: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }, [file, updateStock, updatePrice]);

  const handleConfirm = useCallback(async () => {
    if (!file) return;

    setSyncing(true);
    try {
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      const result = await executeSync(
        { name: file.name, data: base64 },
        { updateStock, updatePrice }
      );
      setSyncResult(result);
      toast.success(`Sincronización completa: ${result.updated} productos actualizados`);
    } catch (error) {
      toast.error("Error al sincronizar: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSyncing(false);
    }
  }, [file, updateStock, updatePrice]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setSyncResult(null);
    setUpdateStock(true);
    setUpdatePrice(true);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--admin-text)",
          margin: 0,
          fontFamily: "Raleway, sans-serif",
        }}>
          Sincronización de Stock desde CRM
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--admin-muted)",
          margin: "8px 0 0",
          fontFamily: "Raleway, sans-serif",
        }}>
          Subí la planilla Excel exportada del CRM para actualizar stock y precios
        </p>
      </div>

      {/* Upload Area */}
      {!syncResult && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? "var(--admin-accent)" : "var(--admin-border)"}`,
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
              background: dragActive ? "rgba(139, 28, 28, 0.05)" : "transparent",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              style={{ display: "none" }}
            />
            <FileSpreadsheet size={48} strokeWidth={1.5} style={{ color: "var(--admin-muted)", margin: "0 auto 16px" }} />
            {file ? (
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text)", margin: 0, fontFamily: "Raleway, sans-serif" }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 13, color: "var(--admin-muted)", margin: "4px 0 0", fontFamily: "Raleway, sans-serif" }}>
                  {(file.size / 1024).toFixed(1)} KB — Click para cambiar
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text)", margin: 0, fontFamily: "Raleway, sans-serif" }}>
                  Arrastrá la planilla aquí o click para seleccionar
                </p>
                <p style={{ fontSize: 13, color: "var(--admin-muted)", margin: "4px 0 0", fontFamily: "Raleway, sans-serif" }}>
                  Formato Excel (.xlsx ou .xls)
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div style={{
            display: "flex",
            gap: 24,
            padding: 16,
            background: "var(--admin-bg-secondary)",
            borderRadius: 8,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "Raleway, sans-serif" }}>
              <input
                type="checkbox"
                checked={updateStock}
                onChange={(e) => setUpdateStock(e.target.checked)}
                style={{ accentColor: "var(--admin-accent)" }}
              />
              <span style={{ fontSize: 14, color: "var(--admin-text)" }}>
                Actualizar Cantidad en Stock
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "Raleway, sans-serif" }}>
              <input
                type="checkbox"
                checked={updatePrice}
                onChange={(e) => setUpdatePrice(e.target.checked)}
                style={{ accentColor: "var(--admin-accent)" }}
              />
              <span style={{ fontSize: 14, color: "var(--admin-text)" }}>
                Actualizar Precios
              </span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleAnalyze}
              disabled={!file || loading || (!updateStock && !updatePrice)}
              style={{
                padding: "10px 24px",
                background: !file || loading || (!updateStock && !updatePrice) ? "var(--admin-border)" : "var(--admin-accent)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: !file || loading || (!updateStock && !updatePrice) ? "not-allowed" : "pointer",
                fontFamily: "Raleway, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Analizar Planilla
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <StockSyncPreview
              preview={preview}
              onConfirm={handleConfirm}
              onReset={handleReset}
              syncing={syncing}
            />
          )}
        </>
      )}

      {/* Result */}
      {syncResult && (
        <div style={{
          padding: 24,
          background: "var(--admin-bg-secondary)",
          borderRadius: 12,
          border: "1px solid var(--admin-border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <CheckCircle size={24} style={{ color: "var(--admin-success, #22c55e)" }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, fontFamily: "Raleway, sans-serif" }}>
              Sincronización Completada
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ padding: 16, background: "var(--admin-bg)", borderRadius: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--admin-accent)", fontFamily: "Raleway, sans-serif" }}>
                {syncResult.updated}
              </p>
              <p style={{ fontSize: 13, margin: "4px 0 0", color: "var(--admin-muted)", fontFamily: "Raleway, sans-serif" }}>
                Productos actualizados
              </p>
            </div>
            <div style={{ padding: 16, background: "var(--admin-bg)", borderRadius: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--admin-accent)", fontFamily: "Raleway, sans-serif" }}>
                {syncResult.movements}
              </p>
              <p style={{ fontSize: 13, margin: "4px 0 0", color: "var(--admin-muted)", fontFamily: "Raleway, sans-serif" }}>
                Movimientos registrados
              </p>
            </div>
            {syncResult.rejected.length > 0 && (
              <div style={{ padding: 16, background: "var(--admin-bg)", borderRadius: 8 }}>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--admin-danger, #ef4444)", fontFamily: "Raleway, sans-serif" }}>
                  {syncResult.rejected.length}
                </p>
                <p style={{ fontSize: 13, margin: "4px 0 0", color: "var(--admin-muted)", fontFamily: "Raleway, sans-serif" }}>
                  Productos rechazados
                </p>
              </div>
            )}
          </div>

          {syncResult.rejected.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8, fontFamily: "Raleway, sans-serif" }}>
                <AlertCircle size={16} style={{ color: "var(--admin-danger, #ef4444)" }} />
                Productos No Encontrados en el Sistema
              </h3>
              <div style={{
                maxHeight: 300,
                overflowY: "auto",
                border: "1px solid var(--admin-border)",
                borderRadius: 8,
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Raleway, sans-serif" }}>
                  <thead style={{ background: "var(--admin-bg)", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>SKU</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Nombre</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncResult.rejected.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{r.sku}</td>
                        <td style={{ padding: "8px 12px" }}>{r.nome}</td>
                        <td style={{ padding: "8px 12px", color: "var(--admin-muted)" }}>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            style={{
              marginTop: 24,
              padding: "10px 24px",
              background: "var(--admin-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Raleway, sans-serif",
            }}
          >
            Nueva Sincronización
          </button>
        </div>
      )}
    </div>
  );
}
