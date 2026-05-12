"use client";

import { useState, useCallback } from "react";
import { Users, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ClienteRow } from "./ClienteRow";
import { ClienteFormModal } from "./ClienteFormModal";
import { getClientes } from "../actions-clientes";
import type { ClienteItem } from "@/lib/types";

type Tab = "TODOS" | "LOJA" | "REVENDEDORA";

interface ClientesClientProps {
  initialClientes: ClienteItem[];
}

export function ClientesClient({ initialClientes }: ClientesClientProps) {
  const [clientes, setClientes] = useState<ClienteItem[]>(initialClientes);
  const [activeTab, setActiveTab] = useState<Tab>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteItem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabChange = useCallback(
    async (tab: Tab) => {
      setActiveTab(tab);
      setLoading(true);
      const result = await getClientes({ origem: tab });
      if (result.success) {
        setClientes(result.data);
      }
      setLoading(false);
    },
    []
  );

  const handleCreate = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const handleEdit = (cliente: ClienteItem) => {
    setEditingCliente(cliente);
    setModalOpen(true);
  };

  const handleSuccess = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_cliente: ClienteItem) => {
      const result = await getClientes({ origem: activeTab });
      if (result.success) {
        setClientes(result.data);
      }
    },
    [activeTab]
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "TODOS", label: "Todos" },
    { key: "LOJA", label: "Loja" },
    { key: "REVENDEDORA", label: "Revendedoras" },
  ];

  return (
    <>
      <AdminPageHeader
        breadcrumb="Admin / Clientes"
        title="Clientes"
        description="Gestión de clientes de la tienda y compradores de revendedoras"
        action={
          <button
            onClick={handleCreate}
            className="admin-btn admin-btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} />
            Nuevo Cliente
          </button>
        }
      />

      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--admin-border)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--admin-accent)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--admin-text)" : "var(--admin-text-muted)",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: activeTab === tab.key ? "var(--admin-accent)" : "var(--admin-text-dim)",
                }}
              >
                {tab.key === "TODOS"
                  ? clientes.length
                  : clientes.filter((c) => c.origen === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--admin-text-muted)" }}>
            Cargando...
          </div>
        ) : clientes.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="Ningún cliente encontrado"
            description={
              activeTab === "LOJA"
                ? "No hay clientes registrados en la tienda."
                : activeTab === "REVENDEDORA"
                ? "No hay compradores de maletas registrados."
                : "No hay clientes ni compradores registrados."
            }
            action={
              activeTab !== "REVENDEDORA" && (
                <button
                  onClick={handleCreate}
                  className="admin-btn admin-btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Plus size={16} />
                  Nuevo Cliente
                </button>
              )
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clientes.map((cliente) => (
              <ClienteRow key={cliente.id} cliente={cliente} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ClienteFormModal
          cliente={editingCliente}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
