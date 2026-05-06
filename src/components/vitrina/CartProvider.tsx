"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  getVitrinaCart,
  addToVitrinaCart,
  removeFromVitrinaCart,
  clearVitrinaCart,
  VITRINA_CART_UPDATED_EVENT,
  type VitrinaCartItem,
} from "@/lib/cart-vitrina";

interface CartContextValue {
  items: VitrinaCartItem[];
  count: number;
  total: number;
  add: (item: Omit<VitrinaCartItem, "quantity">, quantity?: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  resellerSlug: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  resellerSlug,
}: {
  children: React.ReactNode;
  resellerSlug?: string;
}) {
  const [cart, setCart] = useState<VitrinaCartItem[]>([]);

  useEffect(() => {
    const c = getVitrinaCart();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(c && c.reseller_slug === resellerSlug ? c.items : []);
  }, [resellerSlug]);

  useEffect(() => {
    const handler = () => {
      const c = getVitrinaCart();
      if (c && c.reseller_slug === resellerSlug) {
        setCart(c.items);
      } else {
        setCart([]);
      }
    };
    window.addEventListener(VITRINA_CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(VITRINA_CART_UPDATED_EVENT, handler);
  }, [resellerSlug]);

  const add = useCallback(
    (item: Omit<VitrinaCartItem, "quantity">, quantity = 1) => {
      if (!resellerSlug) return;
      addToVitrinaCart(item, resellerSlug, quantity);
    },
    [resellerSlug]
  );

  const remove = useCallback((variantId: string) => {
    removeFromVitrinaCart(variantId);
  }, []);

  const clear = useCallback(() => {
    clearVitrinaCart();
  }, []);

  const count = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      items: cart,
      count,
      total,
      add,
      remove,
      clear,
      resellerSlug: resellerSlug ?? null,
    }),
    [cart, count, total, add, remove, clear, resellerSlug]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useVitrinaCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useVitrinaCart must be used within a CartProvider");
  }
  return ctx;
}
