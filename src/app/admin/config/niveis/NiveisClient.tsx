"use client";

import { useState, useTransition } from "react";
import { deleteNivelRegra } from "../../actions-config";
import NivelForm from "./NivelForm";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

interface Nivel {
  id: string;
  nome: string;
  pontos_minimos: number;
  cor: string;
  ordem: number;
  ativo: boolean;
}

interface NiveisClientProps {
  initialNiveis: Nivel[];
}

export default function NiveisClient({ initialNiveis }: NiveisClientProps) {
  const [niveis, setNiveis] = useState(initialNiveis);
  const [editingNivel, setEditingNivel] = useState<Nivel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este nivel?")) return;
    startTransition(async () => {
      const result = await deleteNivelRegra(id);
      if (result.success) {
        toast.success("Nivel eliminado");
        setNiveis((prev) => prev.filter((n) => n.id !== id));
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    });
  }

  function handleSaved() {
    setShowForm(false);
    setEditingNivel(null);
    window.location.reload();
  }

  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => {
            setEditingNivel(null);
            setShowForm(true);
          }}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          <Plus size={14} /> Novo Nivel
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puntos Mínimos</th>
              <th>Color</th>
              <th>Orden</th>
              <th>Estado</th>
              <th style={{ width: "100px" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {niveis.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--admin-text-muted)" }}>
                  <AlertTriangle size={20} style={{ marginBottom: "8px" }} />
                  <p>Nenhum nivel cadastrado.</p>
                </td>
              </tr>
            ) : (
              niveis.map((nivel) => (
                <tr key={nivel.id}>
                  <td style={{ fontWeight: 600 }}>{nivel.nome}</td>
                  <td>{nivel.pontos_minimos.toLocaleString("es-PY")}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        background: nivel.cor,
                        border: "1px solid var(--admin-border)",
                        verticalAlign: "middle",
                        marginRight: "6px",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontFamily: "monospace" }}>{nivel.cor}</span>
                  </td>
                  <td>{nivel.ordem}</td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: nivel.ativo ? "rgba(74,222,128,0.12)" : "rgba(100,100,100,0.12)",
                        color: nivel.ativo ? "#4ADE80" : "#888",
                      }}
                    >
                      {nivel.ativo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          setEditingNivel(nivel);
                          setShowForm(true);
                        }}
                        className="admin-btn admin-btn-icon admin-btn-sm"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(nivel.id)}
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

      {showForm && (
        <NivelForm
          nivel={editingNivel ?? undefined}
          onClose={() => {
            setShowForm(false);
            setEditingNivel(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
