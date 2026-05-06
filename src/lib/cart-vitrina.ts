import { formatGs } from "@/lib/format";

export interface VitrinaCartItem {
  product_variant_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface VitrinaCart {
  reseller_slug: string;
  items: VitrinaCartItem[];
  updated_at: string;
}

const CART_KEY = "monarca_vitrina_cart";
export const VITRINA_CART_UPDATED_EVENT = "vitrina-cart-updated";

export function getVitrinaCart(): VitrinaCart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as VitrinaCart) : null;
  } catch {
    return null;
  }
}

function saveVitrinaCart(cart: VitrinaCart) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(VITRINA_CART_UPDATED_EVENT));
}

export function clearVitrinaCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new CustomEvent(VITRINA_CART_UPDATED_EVENT));
}

export function addToVitrinaCart(
  item: Omit<VitrinaCartItem, "quantity">,
  resellerSlug: string,
  quantity = 1
) {
  if (typeof window === "undefined") return;

  const existing = getVitrinaCart();

  if (!existing || existing.reseller_slug !== resellerSlug) {
    const cart: VitrinaCart = {
      reseller_slug: resellerSlug,
      items: [{ ...item, quantity }],
      updated_at: new Date().toISOString(),
    };
    saveVitrinaCart(cart);
    return;
  }

  const found = existing.items.find(
    (i) => i.product_variant_id === item.product_variant_id
  );

  if (found) {
    found.quantity = Math.min(found.quantity + quantity, 10);
  } else {
    existing.items.push({ ...item, quantity });
  }

  existing.updated_at = new Date().toISOString();
  saveVitrinaCart(existing);
}

export function removeFromVitrinaCart(variantId: string) {
  if (typeof window === "undefined") return;
  const cart = getVitrinaCart();
  if (!cart) return;
  cart.items = cart.items.filter((i) => i.product_variant_id !== variantId);
  cart.updated_at = new Date().toISOString();
  saveVitrinaCart(cart);
}

export function getVitrinaCartCount(): number {
  const cart = getVitrinaCart();
  return cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
}

export function getVitrinaCartTotal(): number {
  const cart = getVitrinaCart();
  return cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0;
}

export function buildWhatsAppMessage(
  cart: VitrinaCart,
  resellerName?: string
): string {
  const header = `Hola ${resellerName || ""}, vi tu vitrina y me interesan estos productos:`;
  const lines = cart.items.map(
    (item, i) =>
      `${i + 1}. ${item.name} (x${item.quantity}) — ${formatGs(
        item.price * item.quantity
      )}`
  );
  const total = `Total: ${formatGs(
    cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  )}`;
  const footer = "¿Están disponibles? 💎";

  const msg = `${header}\n\n${lines.join("\n")}\n\n${total}\n\n${footer}`;

  if (msg.length > 2000) {
    return `${header}\n\nVi varios productos en tu vitrina. ¿Podemos hablar?\n\n${total}`;
  }

  return msg;
}
