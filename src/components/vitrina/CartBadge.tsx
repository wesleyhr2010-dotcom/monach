"use client";

import { useVitrinaCart } from "./CartProvider";

interface CartBadgeProps {
  onClick: () => void;
}

export default function CartBadge({ onClick }: CartBadgeProps) {
  const { count } = useVitrinaCart();

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 bg-[#35605a] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      aria-label="Abrir carrito"
    >
      <span className="text-xl">🛍️</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
