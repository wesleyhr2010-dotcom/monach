"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarVenda } from "@/app/app/actions-revendedora";
import { ActionButton } from "@/components/app/ActionButton";
import { BottomAction } from "@/components/app/AppPageShell";

type ItemDisponivel = {
  id: string;
  productName: string;
  sku: string;
  precoFixado: number;
  quantidadeEnviada: number;
  quantidadeVendida: number;
  quantidadeDisponivel: number;
  imageUrl: string | null;
};

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

interface RegistrarVentaClientProps {
  maletaId: string;
  itens: ItemDisponivel[];
}

export default function RegistrarVentaClient({ maletaId, itens }: RegistrarVentaClientProps) {
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filteredItens = itens.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedItem = itens.find((item) => item.id === selectedItemId);
  const canSubmit = selectedItemId && clienteNome.length >= 2 && clienteTelefone.length >= 8;

  function handleSubmit() {
    if (!selectedItemId || !canSubmit) return;
    setError("");

    startTransition(async () => {
      try {
        await registrarVenda({
          maleta_item_id: selectedItemId,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          preco_unitario: selectedItem!.precoFixado,
        });
        router.push(`/app/maleta/${maletaId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar la venta.");
      }
    });
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF] relative">
      {/* Header */}
      <div className="flex items-center pt-6 pb-4 gap-4 bg-[#F5F2EF] px-5 sticky top-0 z-10">
        <Link href={`/app/maleta/${maletaId}`} className="shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span
          className="tracking-[0.5px] uppercase text-[#1A1A1A] font-bold text-sm leading-[18px] m-0"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          REGISTRAR VENTA
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col pb-[200px] gap-6 px-5">
        {/* Client info */}
        <div className="flex flex-col gap-4">
          {/* Nombre del Cliente */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span
                className="text-[#1A1A1A] font-semibold text-[13px] leading-4"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                Nombre del Cliente
              </span>
            </label>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Ej: Maria Pérez"
              className="rounded-xl py-3.5 px-4 bg-white border border-[#D9D6D2] text-[#1A1A1A] placeholder:text-[#B4ABA2] text-sm focus:outline-none focus:ring-2 focus:ring-[#35605A]/30 transition-all"
              style={{ fontFamily: "var(--font-raleway)" }}
            />
          </div>

          {/* WhatsApp / Teléfono */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span
                className="text-[#1A1A1A] font-semibold text-[13px] leading-4"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                WhatsApp / Teléfono
              </span>
            </label>
            <input
              type="tel"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              placeholder="+595 991 123456"
              className="rounded-xl py-3.5 px-4 bg-white border border-[#D9D6D2] text-[#1A1A1A] placeholder:text-[#B4ABA2] text-sm focus:outline-none focus:ring-2 focus:ring-[#35605A]/30 transition-all"
              style={{ fontFamily: "var(--font-raleway)" }}
            />
          </div>
        </div>

        {/* Seleccionar Artículo */}
        <div className="flex flex-col gap-3">
          <span
            className="text-[#1A1A1A] text-lg leading-[22px]"
            style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
          >
            Seleccionar Artículo
          </span>

          {/* Search */}
          <div className="flex items-center rounded-[100px] py-3 px-4 gap-3 bg-[#EBEBEB]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre o SKU..."
              className="bg-transparent border-none outline-none text-sm text-[#1A1A1A] placeholder:text-[#777777] flex-1"
              style={{ fontFamily: "var(--font-raleway)" }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-[#FDE8E8] p-3">
              <span className="text-[#9B1C1C] text-sm font-medium" style={{ fontFamily: "var(--font-raleway)" }}>
                {error}
              </span>
            </div>
          )}

          {/* Item list */}
          {filteredItens.map((item) => {
            const isSelected = item.id === selectedItemId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                className={`flex items-center rounded-2xl gap-4 p-3 text-left transition-all ${
                  isSelected
                    ? "bg-[#F8FAF9] border-2 border-[#35605A]"
                    : "bg-[#EBEBEB] border-2 border-transparent hover:border-[#D9D6D2]"
                }`}
              >
                <div className="flex items-center justify-center shrink-0 rounded-xl bg-[#D9D6D2] w-14 h-14 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B4ABA2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col grow min-w-0">
                  <span
                    className="mb-0.5 text-[#1A1A1A] font-semibold text-sm leading-[18px] truncate"
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {item.productName}
                  </span>
                  <span
                    className={`${isSelected ? "text-[#35605A] font-semibold" : "text-[#777777]"} text-xs leading-4`}
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {formatCurrency(item.precoFixado)}
                  </span>
                </div>
                {isSelected ? (
                  <div className="flex items-center justify-center rounded-full bg-[#35605A] shrink-0 w-6 h-6">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                ) : (
                  <div className="rounded-full border-2 border-[#D9D6D2] shrink-0 w-6 h-6" />
                )}
              </button>
            );
          })}

          {filteredItens.length === 0 && (
            <p
              className="text-center py-8 text-[#777777] text-sm"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              No se encontraron artículos.
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Submit */}
      <BottomAction>
        <ActionButton
          label="Confirmar Venta"
          variant="primary"
          disabled={!canSubmit}
          loading={isPending}
          onClick={handleSubmit}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          }
        />
      </BottomAction>
    </div>
  );
}