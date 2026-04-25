"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, X, PackageCheck, ChevronRight } from "lucide-react";
import type { Role } from "@/lib/user";

interface MaletaAlerta {
  id: string;
  numero: number;
  revendedoraNome: string;
  dataDevolucao: string; // ISO date
}

interface AdminAlertBellProps {
  initialCount: number;
  userRole: Role;
}

export function AdminAlertBell({ initialCount, userRole }: AdminAlertBellProps) {
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const [maletas, setMaletas] = useState<MaletaAlerta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/alertas/count");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      // Silencioso — não quebrar UI
    }
  }, []);

  const fetchMaletas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alertas/maletas");
      if (!res.ok) {
        setMaletas([]);
        return;
      }
      const data = await res.json();
      setMaletas(data.maletas ?? []);
    } catch {
      setMaletas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling leve a cada 30s
  useEffect(() => {
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Atualizar contagem quando abrir
  useEffect(() => {
    if (open) {
      fetchCount();
      fetchMaletas();
    }
  }, [open, fetchCount, fetchMaletas]);

  // Bloquear scroll do body quando drawer aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (userRole === "REVENDEDORA") return null;

  return (
    <>
      {/* Botão sininho */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Alertas de devoluciones"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
          color: "var(--admin-text-muted)",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--admin-surface-hover)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-muted)";
        }}
      >
        <Bell size={20} strokeWidth={1.5} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "#E05C5C",
              color: "#fff",
              borderRadius: "50%",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Raleway, sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              padding: "0 4px",
              boxShadow: "0 0 0 2px var(--admin-surface)",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              animation: "fadeIn 0.2s ease",
            }}
          />

          {/* Painel */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "380px",
              height: "100%",
              background: "var(--admin-surface)",
              borderLeft: "1px solid var(--admin-border)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s ease",
            }}
          >
            {/* Header do drawer */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--admin-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--admin-text)",
                    margin: 0,
                  }}
                >
                  Devoluciones Pendientes
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--admin-text-muted)",
                    margin: "4px 0 0",
                  }}
                >
                  {count} maleta{count !== 1 ? "s" : ""} aguardando conferencia
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--admin-text-muted)",
                  padding: "4px",
                  borderRadius: "4px",
                }}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px",
                    color: "var(--admin-text-muted)",
                  }}
                >
                  <div className="admin-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                </div>
              ) : maletas.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--admin-text-muted)",
                  }}
                >
                  <PackageCheck size={40} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: "14px" }}>No hay devoluciones pendientes</p>
                </div>
              ) : (
                maletas.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "var(--admin-bg)",
                      border: "1px solid var(--admin-border)",
                      borderRadius: "var(--admin-radius)",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--admin-text)",
                        }}
                      >
                        📦 Maleta #{m.numero}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#FACC15",
                          background: "rgba(250,204,21,0.1)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Aguardando
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--admin-text-muted)",
                        margin: 0,
                      }}
                    >
                      {m.revendedoraNome} •{" "}
                      {new Date(m.dataDevolucao).toLocaleDateString("es-PY", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <Link
                      href={`/admin/maleta/${m.id}/conferir`}
                      onClick={() => setOpen(false)}
                      style={{
                        alignSelf: "flex-start",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#35605A",
                        textDecoration: "none",
                        marginTop: "4px",
                      }}
                    >
                      Conferir <ChevronRight size={14} />
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--admin-border)",
              }}
            >
              <Link
                href="/admin/maleta"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--admin-text-muted)",
                  textDecoration: "none",
                  padding: "10px",
                  borderRadius: "var(--admin-radius)",
                  border: "1px solid var(--admin-border)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--admin-surface-hover)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--admin-text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--admin-text-muted)";
                }}
              >
                Ver todas las maletas
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
