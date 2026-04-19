// ============================================
// Monarca Semijoyas — Cart Store (localStorage)
// ============================================

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    sku?: string;
    variantLabel?: string; // e.g. "Tamaño: M"
}

export interface CartContext {
    /** If set, this cart belongs to a reseller catalog */
    resellerSlug?: string;
    resellerWhatsapp?: string;
    resellerName?: string;
}

const CART_KEY = "monarca_cart";
const CART_CONTEXT_KEY = "monarca_cart_context";
export const CART_UPDATED_EVENT = "cart-updated";

// ---- Read ----

export function getCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getCartContext(): CartContext | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CART_CONTEXT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getCartCount(): number {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(): number {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ---- Write ----

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function setCartContext(ctx: CartContext | null) {
    if (ctx) {
        localStorage.setItem(CART_CONTEXT_KEY, JSON.stringify(ctx));
    } else {
        localStorage.removeItem(CART_CONTEXT_KEY);
    }
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
    const cart = getCart();
    const key = item.variantLabel
        ? `${item.productId}__${item.variantLabel}`
        : item.productId;

    const existing = cart.find(
        (c) =>
            c.productId === item.productId &&
            (c.variantLabel || "") === (item.variantLabel || "")
    );

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...item, quantity });
    }

    saveCart(cart);
}

export function updateQuantity(productId: string, quantity: number, variantLabel?: string) {
    const cart = getCart();
    const idx = cart.findIndex(
        (c) =>
            c.productId === productId &&
            (c.variantLabel || "") === (variantLabel || "")
    );
    if (idx === -1) return;

    if (quantity <= 0) {
        cart.splice(idx, 1);
    } else {
        cart[idx].quantity = quantity;
    }
    saveCart(cart);
}

export function removeFromCart(productId: string, variantLabel?: string) {
    const cart = getCart().filter(
        (c) =>
            !(
                c.productId === productId &&
                (c.variantLabel || "") === (variantLabel || "")
            )
    );
    saveCart(cart);
}

export function clearCart() {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_CONTEXT_KEY);
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

// ---- WhatsApp Message Builder ----

export function buildOrderMessage(items: CartItem[], total: number, resellerName?: string): string {
    const header = resellerName
        ? `🦋 *Pedido via Catálogo — ${resellerName}*`
        : `🦋 *Nuevo Pedido — Monarca Semijoyas*`;

    const lines = items.map(
        (item, i) =>
            `${i + 1}. ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} — x${item.quantity} — ₲ ${(item.price * item.quantity).toLocaleString("es-PY")}`
    );

    const footer = `\n💰 *Total: ₲ ${total.toLocaleString("es-PY")}*\n\n¡Hola! Me gustaría realizar este pedido. 🙏`;

    return `${header}\n\n${lines.join("\n")}${footer}`;
}
