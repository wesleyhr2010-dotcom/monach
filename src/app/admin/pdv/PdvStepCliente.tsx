"use client";

import { useState, useRef, useTransition } from "react";
import { UserCheck, UserX } from "lucide-react";
import { buscarClientePorRuc, criarCliente } from "@/app/admin/actions-clientes";
import type { ClienteSeleccionado } from "./PdvClient";

type Props = {
  cliente: ClienteSeleccionado | null;
  onSelect: (cliente: ClienteSeleccionado) => void;
};

type BuscaState =
  | { kind: "idle" }
  | { kind: "buscando" }
  | { kind: "encontrado"; cliente: { id: string; nombre: string; ruc: string | null; ciudad: string | null } }
  | { kind: "no_encontrado"; rucBuscado: string }
  | { kind: "error"; message: string };

export default function PdvStepCliente({ cliente, onSelect }: Props) {
  const [ruc, setRuc] = useState<string>("");
  const [busca, setBusca] = useState<BuscaState>({ kind: "idle" });
  const [mostrarMiniForm, setMostrarMiniForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [miniFormError, setMiniFormError] = useState<string | null>(null);
  const [isPendingBusca, startBusca] = useTransition();
  const [isPendingCreate, startCreate] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRucChange(value: string) {
    setRuc(value);
    setMostrarMiniForm(false);
    setMiniFormError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setBusca({ kind: "idle" });
      return;
    }
    debounceRef.current = setTimeout(() => {
      runBusca(value.trim());
    }, 400);
  }

  function runBusca(rucValue: string) {
    setBusca({ kind: "buscando" });
    startBusca(async () => {
      const result = await buscarClientePorRuc(rucValue);
      if (!result.success) {
        setBusca({ kind: "error", message: result.error || "Error al buscar." });
        return;
      }
      if (result.data) {
        setBusca({
          kind: "encontrado",
          cliente: {
            id: result.data.id,
            nombre: result.data.nombre,
            ruc: result.data.ruc,
            ciudad: result.data.ciudad,
          },
        });
      } else {
        setBusca({ kind: "no_encontrado", rucBuscado: rucValue });
      }
    });
  }

  function handleSelectCliente(c: { id: string; nombre: string; ruc: string | null; ciudad: string | null }) {
    onSelect({ tipo: "cliente", id: c.id, nombre: c.nombre, ruc: c.ruc, ciudad: c.ciudad });
  }

  function handleConsumidorFinal() {
    onSelect({ tipo: "consumidor_final" });
  }

  function handleAbrirMiniForm() {
    setMostrarMiniForm(true);
    setNombre("");
    setCiudad("");
    setTelefono("");
    setMiniFormError(null);
  }

  function handleCriarClienteInline(e: React.FormEvent) {
    e.preventDefault();
    setMiniFormError(null);

    if (!nombre.trim()) {
      setMiniFormError("El nombre es obligatorio.");
      return;
    }
    const rucValue = busca.kind === "no_encontrado" ? busca.rucBuscado : ruc.trim();

    startCreate(async () => {
      const result = await criarCliente({
        nombre: nombre.trim(),
        ruc: rucValue || "",
        ciudad: ciudad.trim() || "",
        telefono: telefono.trim() || "",
      });
      if (!result.success) {
        if (result.error?.toLowerCase().includes("ruc") || result.error?.toLowerCase().includes("existe")) {
          setMiniFormError("Ya existe un cliente con ese RUC.");
        } else {
          setMiniFormError(result.error || "No se pudo crear el cliente.");
        }
        return;
      }
      onSelect({
        tipo: "cliente",
        id: result.data.id,
        nombre: nombre.trim(),
        ruc: rucValue || null,
        ciudad: ciudad.trim() || null,
      });
    });
  }

  function handleCambiarCliente() {
    setRuc("");
    setBusca({ kind: "idle" });
    setMostrarMiniForm(false);
    setMiniFormError(null);
    onSelect(null as unknown as ClienteSeleccionado);
  }

  // Se já há cliente selecionado, mostra resumo + botão "Cambiar cliente"
  if (cliente) {
    return (
      <div className="admin-card">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
          ¿Quién compra?
        </h2>

        {cliente.tipo === "cliente" ? (
          <div className="flex items-center justify-between gap-4 p-4 rounded" style={{ background: "var(--admin-bg)" }}>
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5" style={{ color: "var(--admin-success)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{cliente.nombre}</p>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  RUC: {cliente.ruc ?? "—"}{cliente.ciudad ? ` · ${cliente.ciudad}` : ""}
                </p>
              </div>
            </div>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={handleCambiarCliente}>
              Cambiar cliente
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-4 rounded" style={{ background: "var(--admin-bg)" }}>
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5" style={{ color: "var(--admin-text-muted)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>Consumidor Final</p>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Sin identificación registrada</p>
              </div>
            </div>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={handleCambiarCliente}>
              Cambiar cliente
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h2 className="text-base font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
        ¿Quién compra?
      </h2>

      <div className="flex flex-col gap-3">
        <label htmlFor="pdv-ruc" className="text-sm" style={{ color: "var(--admin-text)" }}>
          RUC / Cédula
        </label>
        <input
          id="pdv-ruc"
          type="text"
          className="admin-input"
          placeholder="Buscá por RUC o cédula"
          value={ruc}
          onChange={(e) => handleRucChange(e.target.value)}
          autoFocus
          disabled={isPendingBusca || isPendingCreate}
        />
      </div>

      {busca.kind === "buscando" && (
        <p className="text-xs mt-3" style={{ color: "var(--admin-text-muted)" }}>Buscando...</p>
      )}

      {busca.kind === "encontrado" && (
        <div className="mt-4 flex items-center justify-between gap-4 p-4 rounded" style={{ background: "var(--admin-success-10)" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{busca.cliente.nombre}</p>
            <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
              RUC: {busca.cliente.ruc ?? "—"}{busca.cliente.ciudad ? ` · ${busca.cliente.ciudad}` : ""}
            </p>
            <span
              className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded"
              style={{ background: "var(--admin-success-10)", color: "var(--admin-success)" }}
            >
              Cliente encontrado
            </span>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleSelectCliente(busca.cliente)}>
            Usar cliente
          </button>
        </div>
      )}

      {busca.kind === "no_encontrado" && !mostrarMiniForm && (
        <div className="mt-4">
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            No encontramos a nadie con ese RUC. ¿Querés registrarlo?
          </p>
          <div className="flex gap-3 mt-3">
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleAbrirMiniForm}>
              Registrar cliente
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={handleConsumidorFinal}>
              Continuar como Consumidor Final
            </button>
          </div>
        </div>
      )}

      {busca.kind === "error" && (
        <div className="admin-alert admin-alert-error mt-3">{busca.message}</div>
      )}

      {busca.kind === "idle" && (
        <div className="mt-4">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={handleConsumidorFinal}>
            Continuar como Consumidor Final
          </button>
        </div>
      )}

      {mostrarMiniForm && (
        <form onSubmit={handleCriarClienteInline} className="mt-4 flex flex-col gap-3 p-4 rounded" style={{ background: "var(--admin-bg)" }}>
          <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            RUC: {busca.kind === "no_encontrado" ? busca.rucBuscado : ruc}
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-sm" style={{ color: "var(--admin-text)" }}>Nombre completo</label>
            <input type="text" className="admin-input" placeholder="Ej: María González" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm" style={{ color: "var(--admin-text)" }}>Ciudad</label>
            <input type="text" className="admin-input" placeholder="Ej: Asunción" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm" style={{ color: "var(--admin-text)" }}>Teléfono (opcional)</label>
            <input type="tel" className="admin-input" placeholder="Ej: 0981 000 000" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>

          {miniFormError && <div className="admin-alert admin-alert-error">{miniFormError}</div>}

          <button type="submit" className="admin-btn admin-btn-primary" disabled={isPendingCreate}>
            {isPendingCreate ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      )}
    </div>
  );
}
