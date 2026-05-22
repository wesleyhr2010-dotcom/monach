"use client";

import { useState, useTransition } from "react";
import { upsertNivelRegra } from "../../actions-config";
import { toast } from "sonner";

interface Nivel {
  id: string;
  nome: string;
  pontos_minimos: number;
  cor: string;
  ordem: number;
  ativo: boolean;
}

interface NivelFormProps {
  nivel?: Nivel;
  onClose: () => void;
  onSaved: () => void;
}

export default function NivelForm({ nivel, onClose, onSaved }: NivelFormProps) {
  const [nome, setNome] = useState(nivel?.nome ?? "");
  const [pontosMinimos, setPontosMinimos] = useState(nivel?.pontos_minimos ?? 0);
  const [cor, setCor] = useState(nivel?.cor ?? "#C9A84C");
  const [ordem, setOrdem] = useState(nivel?.ordem ?? 0);
  const [ativo, setAtivo] = useState(nivel?.ativo ?? true);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertNivelRegra({
        id: nivel?.id,
        nome,
        pontos_minimos: pontosMinimos,
        cor,
        ordem,
        ativo,
      });
      if (result.success) {
        toast.success(nivel ? "Nivel actualizado" : "Nivel creado");
        onSaved();
      } else {
        toast.error(result.error || "Error al guardar");
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
          maxWidth: "420px",
          color: "var(--admin-text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
          {nivel ? "Editar Nivel" : "Nuevo Nivel de Gamificación"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="admin-label">Nombre</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="admin-input"
              required
              maxLength={30}
            />
          </div>

          <div>
            <label className="admin-label">Puntos mínimos</label>
            <input
              type="number"
              min={0}
              value={pontosMinimos}
              onChange={(e) => setPontosMinimos(Number(e.target.value))}
              className="admin-input"
              required
            />
          </div>

          <div>
            <label className="admin-label">Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                style={{ width: "40px", height: "40px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
              <input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="admin-input"
                required
                pattern="^#[0-9A-Fa-f]{6}$"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Orden</label>
            <input
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              className="admin-input"
              required
              style={{ width: "100px" }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            Activo
          </label>

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
              disabled={isPending}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {isPending ? "Guardando..." : nivel ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
