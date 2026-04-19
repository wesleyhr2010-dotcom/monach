// ============================================
// Monarca Semijoyas — Store Config
// ============================================

export const STORE_CONFIG = {
    name: "Monarca Semijoyas",
    whatsapp: "+595981234567", // placeholder — trocar pelo número real
    currency: "₲",
    locale: "es-PY",
} as const;

/**
 * Gera a URL do WhatsApp com a mensagem formatada.
 * Funciona tanto no mobile (abre app) quanto no desktop (abre web).
 */
export function buildWhatsAppUrl(
    phone: string,
    message: string
): string {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
