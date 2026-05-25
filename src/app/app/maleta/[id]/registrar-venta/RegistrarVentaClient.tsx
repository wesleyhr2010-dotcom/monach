"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarVendaMultipla } from "@/app/app/actions-revendedora";
import { ActionButton } from "@/components/app/ActionButton";
import { BottomAction } from "@/components/app/AppPageShell";
import { TransitionLink } from "@/components/app/transitions/TransitionLink";

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
  // cart: itemId → quantity selected
  const [cart, setCart] = useState<Record<string, number>>({});
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

  const totalUnidades = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const totalPrice = itens.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.precoFixado, 0);
  const canSubmit = totalUnidades > 0 && clienteNome.length >= 2 && clienteTelefone.length >= 8;

  function toggleItem(itemId: string) {
    setCart((prev) => {
      if (prev[itemId]) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: 1 };
    });
  }

  function setQuantity(itemId: string, qty: number, max: number) {
    if (qty <= 0) {
      setCart((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } else {
      setCart((prev) => ({ ...prev, [itemId]: Math.min(qty, max) }));
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setError("");

    const itensCarrinho = Object.entries(cart).map(([maleta_item_id, quantidade]) => ({
      maleta_item_id,
      quantidade,
    }));

    startTransition(async () => {
      try {
        const result = await registrarVendaMultipla({
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          itens: itensCarrinho,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.push(`/app/maleta/${maletaId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar la venta.");
      }
    });
  }

  return (
    <div className="flex flex-col min-h-full bg-app-bg relative">
      {/* Header */}
      <div className="flex items-center pt-6 pb-4 gap-4 bg-app-bg px-5 sticky top-0 z-10">
        <TransitionLink
          href={`/app/maleta/${maletaId}`}
          pattern="modal-close"
          className="shrink-0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </TransitionLink>
        <span
          className="tracking-[0.5px] uppercase text-app-text font-bold text-sm leading-[18px] m-0"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          REGISTRAR VENTA
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col pb-2 bottom-action-clearance gap-6 px-5">
        {/* Client info */}
        <div className="flex flex-col gap-4">
          {/* Nombre del Cliente */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span
                className="text-app-text font-semibold text-[13px] leading-4"
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
              className="rounded-xl py-3.5 px-4 bg-app-card-bg border border-app-border-strong text-app-text placeholder:text-app-muted text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 transition-all"
              style={{ fontFamily: "var(--font-raleway)" }}
            />
          </div>

          {/* WhatsApp / Teléfono */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span
                className="text-app-text font-semibold text-[13px] leading-4"
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
              className="rounded-xl py-3.5 px-4 bg-app-card-bg border border-app-border-strong text-app-text placeholder:text-app-muted text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 transition-all"
              style={{ fontFamily: "var(--font-raleway)" }}
            />
          </div>
        </div>

        {/* Seleccionar Artículos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className="text-app-text text-lg leading-[22px]"
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
            >
              Seleccionar Artículos
            </span>
            {totalUnidades > 0 && (
              <span
                className="text-xs text-app-primary font-semibold"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                {totalUnidades} seleccionado{totalUnidades !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center rounded-[100px] py-3 px-4 gap-3 bg-app-surface">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre o SKU..."
              className="bg-transparent border-none outline-none text-sm text-app-text placeholder:text-app-text-secondary flex-1"
              style={{ fontFamily: "var(--font-raleway)" }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-app-danger-bg p-3">
              <span className="text-app-danger text-sm font-medium" style={{ fontFamily: "var(--font-raleway)" }}>
                {error}
              </span>
            </div>
          )}

          {/* Item list */}
          {filteredItens.map((item) => {
            const qty = cart[item.id] ?? 0;
            const isSelected = qty > 0;
            return (
              <div
                key={item.id}
                className={`flex items-center rounded-2xl gap-4 p-3 transition-all ${
                  isSelected
                    ? "bg-app-accent-green-bg border-2 border-app-primary"
                    : "bg-app-surface border-2 border-transparent"
                }`}
              >
                {/* Thumbnail — tap deselects when selected */}
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="flex items-center justify-center shrink-0 rounded-xl bg-app-border-strong w-14 h-14 overflow-hidden"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}
                </button>

                {/* Name + price — tap toggles selection */}
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="flex flex-col grow min-w-0 text-left"
                >
                  <span
                    className="mb-0.5 text-app-text font-semibold text-sm leading-[18px] truncate"
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {item.productName}
                  </span>
                  <span
                    className={`text-xs leading-4 ${isSelected ? "text-app-primary font-semibold" : "text-app-text-secondary"}`}
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {formatCurrency(item.precoFixado)}
                    {item.quantidadeDisponivel > 1 && !isSelected && (
                      <span className="text-app-muted"> · {item.quantidadeDisponivel} disp.</span>
                    )}
                  </span>
                </button>

                {/* Right side: stepper when selected, circle when not */}
                {isSelected ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, qty - 1, item.quantidadeDisponivel)}
                      className="w-7 h-7 rounded-full border-2 border-app-primary flex items-center justify-center text-app-primary font-bold text-base leading-none transition-opacity"
                    >
                      −
                    </button>
                    <span
                      className="w-5 text-center font-bold text-sm text-app-text"
                      style={{ fontFamily: "var(--font-raleway)" }}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, qty + 1, item.quantidadeDisponivel)}
                      disabled={qty >= item.quantidadeDisponivel}
                      className="w-7 h-7 rounded-full bg-app-primary flex items-center justify-center text-white font-bold text-base leading-none transition-opacity disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="rounded-full border-2 border-app-border-strong shrink-0 w-6 h-6"
                  />
                )}
              </div>
            );
          })}

          {filteredItens.length === 0 && (
            <p
              className="text-center py-8 text-app-text-secondary text-sm"
              style={{ fontFamily: "var(--font-raleway)" }}
            >
              No se encontraron artículos.
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Summary + Submit */}
      <BottomAction>
        <div className="flex flex-col gap-3 w-full">
          {totalUnidades > 0 && (
            <div className="flex items-center justify-between px-1">
              <span
                className="text-app-text-secondary text-sm"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                {totalUnidades} artículo{totalUnidades !== 1 ? "s" : ""}
              </span>
              <span
                className="text-app-primary font-bold text-sm"
                style={{ fontFamily: "var(--font-raleway)" }}
              >
                {formatCurrency(totalPrice)}
              </span>
            </div>
          )}
          <ActionButton
            label="Confirmar Venta"
            variant="primary"
            disabled={!canSubmit}
            loading={isPending}
            onClick={handleSubmit}
            className="w-full"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
          />
        </div>
      </BottomAction>
    </div>
  );
}
