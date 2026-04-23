"use client";

const PROXY_URL = "/api/proxy-image";

export interface ShareableItem {
    id: string;
    producto: {
        id: string;
        name: string;
        sku?: string | null;
        images: string[];
        slug?: string;
    };
    variante?: {
        attribute_name?: string;
        attribute_value?: string;
    };
    preco_fixado?: number;
}

/**
 * Baixa uma imagem do R2 via proxy local e converte para File.
 * Retorna null em caso de falha (para não quebrar o fluxo de share).
 */
export async function downloadImageAsFile(
    imageUrl: string,
    fileName: string
): Promise<File | null> {
    try {
        const proxy = `${PROXY_URL}?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxy);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type || "image/webp" });
    } catch {
        return null;
    }
}

/**
 * Verifica se o dispositivo suporta compartilhamento de arquivos via Web Share API.
 */
export function isShareFilesSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    return typeof navigator.canShare === "function" && typeof navigator.share === "function";
}

/**
 * Verifica se um array específico de File[] pode ser compartilhado.
 */
export function canShareFiles(files: File[]): boolean {
    if (typeof navigator === "undefined") return false;
    if (!navigator.canShare) return false;
    try {
        return navigator.canShare({ files });
    } catch {
        return false;
    }
}

/**
 * Tenta compartilhar imagens via navigator.share({ files, text }).
 * Trata AbortError como operação cancelada pelo usuário (não lança erro).
 * Retorna { shared: boolean, cancelled: boolean }.
 */
export async function shareImages(
    files: File[],
    text: string
): Promise<{ shared: boolean; cancelled: boolean }> {
    if (!isShareFilesSupported()) {
        return { shared: false, cancelled: false };
    }

    if (!canShareFiles(files)) {
        return { shared: false, cancelled: false };
    }

    try {
        await navigator.share({ files, text });
        return { shared: true, cancelled: false };
    } catch (err: unknown) {
        // AbortError = usuário cancelou o share sheet
        if (err instanceof Error && err.name === "AbortError") {
            return { shared: false, cancelled: true };
        }
        throw err;
    }
}

/**
 * Fallback para WhatsApp com nomes e links dos produtos.
 * Usa slug se disponível; senão, usa id do produto.
 */
export function fallbackWhatsApp(items: ShareableItem[], siteUrl?: string): void {
    const baseUrl = siteUrl || (typeof window !== "undefined" ? window.location.origin : "https://monarca.com.py");

    const lines = items
        .map((i) => {
            const slug = i.producto.slug || i.producto.id;
            const url = `${baseUrl}/produto/${slug}`;
            return `• ${i.producto.name}\n${url}`;
        })
        .join("\n\n");

    const text = `Joyas Monarca 💎\n\n${lines}`;
    const waText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${waText}`, "_blank");
}

/**
 * Fallback para WhatsApp de um único item, com preço e variante.
 */
export function fallbackWhatsAppIndividual(
    item: ShareableItem,
    siteUrl?: string,
    formatPrice?: (n: number) => string
): void {
    const baseUrl = siteUrl || (typeof window !== "undefined" ? window.location.origin : "https://monarca.com.py");
    const slug = item.producto.slug || item.producto.id;
    const url = `${baseUrl}/produto/${slug}`;

    let text = `¡Mira estas joyas de Monarca! 💎\n${item.producto.name}`;
    if (item.variante?.attribute_value) {
        text += ` — ${item.variante.attribute_value}`;
    }
    if (item.preco_fixado !== undefined && formatPrice) {
        text += `\n${formatPrice(item.preco_fixado)}`;
    }
    text += `\n${url}`;

    const waText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${waText}`, "_blank");
}
