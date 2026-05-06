"use client";

import Image from "next/image";
import { useState } from "react";
import { useVitrinaCart } from "./CartProvider";
import {
  removeFromVitrinaCart,
  buildWhatsAppMessage,
  getVitrinaCart,
} from "@/lib/cart-vitrina";
import { formatGs } from "@/lib/format";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resellerWhatsapp: string;
  resellerName?: string;
  resellerId: string;
}

export default function CartDrawer({
  isOpen,
  onClose,
  resellerWhatsapp,
  resellerName,
  resellerId,
}: CartDrawerProps) {
  const { items, total } = useVitrinaCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const waNumber = resellerWhatsapp.replace(/\D/g, "");

  const handleCheckout = () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);

    // Fire tracking event
    fetch("/api/vitrina/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reseller_id: resellerId,
        tipo_evento: "clique_whatsapp",
        page_url: window.location.href,
      }),
      keepalive: true,
    }).catch(() => {});

    const cart = getVitrinaCart();
    const message = cart
      ? buildWhatsAppMessage(cart, resellerName)
      : "";

    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

    setTimeout(() => setIsCheckingOut(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-auto p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tu Carrito</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Tu carrito está vacío</p>
            <button
              onClick={onClose}
              className="mt-4 text-[#35605a] underline"
            >
              Volver a la vitrina
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product_variant_id}
                  className="flex items-center gap-3"
                >
                  <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      x{item.quantity} — {formatGs(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatGs(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeFromVitrinaCart(item.product_variant_id)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-lg font-semibold">
                Total: {formatGs(total)}
              </p>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="block w-full mt-4 py-3 bg-[#25D366] text-white text-center rounded-lg font-medium hover:bg-[#1ebe5a] transition"
            >
              💬 Finalizar pedido por WhatsApp
            </button>
          </>
        )}
      </div>
    </div>
  );
}
