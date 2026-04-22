// ============================================
// Centralized DTO types for the Monarca system
// ============================================

// ============================================
// Products
// ============================================

export interface Product {
    id: string;
    sku: string;
    name: string;
    short_description: string;
    description: string;
    price: number | null;
    categories: string[];
    images: string[];
    product_type: "simple" | "variable";
    created_at: string;
    updated_at: string;
    product_variants?: ProductVariant[];
}

export interface ProductVariant {
    id: string;
    product_id: string;
    attribute_name: string;
    attribute_value: string;
    price: number | null;
    sku: string | null;
    in_stock: boolean;
    stock_quantity: number;
    created_at: string;
}

export interface ProductsResponse {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
}

// ============================================
// Resellers
// ============================================

export interface Reseller {
    id: string;
    name: string;
    slug: string;
    whatsapp: string;
    email: string;
    avatar_url: string;
    bio: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ResellerProduct {
    id: string;
    reseller_id: string;
    product_id: string;
    custom_price: number | null;
    is_featured: boolean;
    added_at: string;
    product?: Product; // joined
}

export interface ResellersResponse {
    resellers: Reseller[];
    total: number;
    page: number;
    pageSize: number;
}

// ============================================
// Equipe (Colaboradoras & Revendedoras)
// ============================================

export interface ColaboradoraItem {
    id: string;
    name: string;
    slug: string;
    whatsapp: string;
    email: string;
    avatar_url: string;
    taxa_comissao: number;
    is_active: boolean;
    revendedorasCount: number;
}

export interface RevendedoraItem {
    id: string;
    name: string;
    slug: string;
    whatsapp: string;
    email: string;
    avatar_url: string;
    taxa_comissao: number;
    is_active: boolean;
    colaboradora: { id: string; name: string } | null;
}

// ============================================
// Maletas (Consignação)
// ============================================

export type { MaletaStatus } from "@/generated/prisma/client";

export interface MaletaListItem {
    id: string;
    numero: number;
    status: string;
    data_envio: string;
    data_limite: string;
    created_at: string;
    reseller: { id: string; name: string; avatar_url: string };
    _count: { itens: number };
    valor_total_vendido: number | null;
}

export interface MaletaDetail {
    id: string;
    numero: number;
    status: string;
    data_envio: string;
    data_limite: string;
    comprovante_devolucao_url: string | null;
    valor_total_enviado: number | null;
    valor_total_vendido: number | null;
    valor_comissao_revendedora: number | null;
    valor_comissao_colaboradora: number | null;
    pct_comissao_aplicado: number | null;
    nota_acerto: string | null;
    created_at: string;
    updated_at: string;
    reseller: {
        id: string;
        name: string;
        whatsapp: string;
        avatar_url: string;
        taxa_comissao: number;
        colaboradora: { id: string; name: string; taxa_comissao: number } | null;
        nivel: string | null;
        nivel_cor: string | null;
        pontos: number;
    };
    itens: MaletaItemDetail[];
}

export interface MaletaItemDetail {
    id: string;
    quantidade_enviada: number;
    quantidade_vendida: number;
    quantidade_recebida: number | null;
    preco_fixado: number | null;
    product_variant: {
        id: string;
        attribute_name: string;
        attribute_value: string;
        price: number | null;
        sku: string | null;
        stock_quantity: number;
        product: {
            id: string;
            name: string;
            images: string[];
            category_name: string | null;
        };
    };
}
