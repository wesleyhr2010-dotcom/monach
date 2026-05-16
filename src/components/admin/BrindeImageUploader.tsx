"use client";

import { useRef, useState } from "react";

interface BrindeImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
}

export function BrindeImageUploader({ value, onChange }: BrindeImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        if (!file.type.startsWith("image/")) {
            setUploadError("Solo se aceptan imágenes (JPG, PNG, WebP).");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError("La imagen no puede superar 10 MB.");
            return;
        }

        setUploading(true);
        setUploadError("");

        try {
            const ext = file.name.split(".").pop() ?? "jpg";
            const key = `brindes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("key", key);

            const res = await fetch("/api/upload-r2", { method: "POST", body: fd });
            const json = await res.json() as { url?: string; error?: string };
            if (!res.ok || !json.url) throw new Error(json.error ?? "Error al subir la imagen.");
            onChange(json.url);
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : "Error al subir la imagen.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--admin-text-muted)", marginBottom: 6 }}>
                Imagen del regalo
            </label>

            <div
                onClick={() => !uploading && inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                }}
                style={{
                    border: "2px dashed var(--admin-border)",
                    borderRadius: 10,
                    cursor: uploading ? "wait" : "pointer",
                    background: "var(--admin-surface)",
                    overflow: "hidden",
                    minHeight: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = "";
                    }}
                />

                {uploading ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div className="admin-spinner" style={{ margin: "0 auto 10px" }} />
                        <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Subiendo imagen...</span>
                    </div>
                ) : value ? (
                    <div style={{ position: "relative", width: "100%" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={value}
                            alt="Preview"
                            style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }}
                        />
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.45)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0,
                            transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                        >
                            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Cambiar imagen</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                        <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                            <strong>Click o arrastra</strong> una imagen aquí
                        </span>
                        <div style={{ fontSize: 12, color: "var(--admin-text-dim)", marginTop: 4 }}>
                            JPG, PNG, WebP — máx. 10 MB
                        </div>
                    </div>
                )}
            </div>

            {uploadError && (
                <p style={{ fontSize: 12, color: "var(--admin-danger)", marginTop: 6 }}>{uploadError}</p>
            )}

            <button
                type="button"
                onClick={() => setShowUrlInput((v) => !v)}
                style={{
                    fontSize: 12,
                    color: "var(--admin-text-muted)",
                    background: "none",
                    border: "none",
                    padding: "6px 0 0",
                    cursor: "pointer",
                    textDecoration: "underline",
                }}
            >
                {showUrlInput ? "Ocultar URL manual" : "O escribir URL"}
            </button>

            {showUrlInput && (
                <input
                    type="url"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--admin-surface)",
                        border: "1px solid var(--admin-border)",
                        borderRadius: 8,
                        color: "var(--admin-text)",
                        fontSize: 13,
                        outline: "none",
                        marginTop: 6,
                        boxSizing: "border-box",
                    }}
                />
            )}
        </div>
    );
}
