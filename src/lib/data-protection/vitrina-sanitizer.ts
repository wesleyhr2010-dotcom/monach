// ============================================
// Sanitizador de dados para vitrina pública
// Ref: docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md §5
// A vitrina pública (/vitrina/[slug]) é indexável e expõe apenas
// campos explicitamente permitidos. Nunca expor PII.
// ============================================

import { prisma } from "@/lib/prisma";

export type PublicVitrinaData = {
    name: string;
    avatar_url: string;
    slug: string;
    whatsapp_link: string | null;
};

/**
 * Retorna apenas os campos permitidos para exposição pública na vitrina.
 * Nunca expõe: email, endereço, taxa_comissao, role, dados bancários, documentos.
 */
export async function getPublicVitrinaData(slug: string): Promise<PublicVitrinaData | null> {
    const reseller = await prisma.reseller.findUnique({
        where: { slug },
        select: {
            name: true,
            avatar_url: true,
            slug: true,
            whatsapp: true,
        },
    });

    if (!reseller) return null;

    return {
        name: reseller.name,
        avatar_url: reseller.avatar_url,
        slug: reseller.slug,
        whatsapp_link: reseller.whatsapp
            ? `https://wa.me/${reseller.whatsapp.replace(/\D/g, "")}`
            : null,
    };
}

/**
 * Filtra um objeto Reseller retornando apenas campos seguros para UI pública.
 * Útil para APIs e Server Components que alimentam a vitrina.
 */
export function toPublicResellerPayload(reseller: {
    name: string;
    avatar_url: string;
    slug: string;
    whatsapp?: string | null;
}): PublicVitrinaData {
    return {
        name: reseller.name,
        avatar_url: reseller.avatar_url,
        slug: reseller.slug,
        whatsapp_link: reseller.whatsapp
            ? `https://wa.me/${reseller.whatsapp.replace(/\D/g, "")}`
            : null,
    };
}
