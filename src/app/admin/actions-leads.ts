"use server";

import { prisma } from "@/lib/prisma";
import { createSupabaseSSRClient } from "@/lib/supabase-ssr";
import { requireAuth } from "@/lib/user";

// ============================================
// Types
// ============================================

export interface LeadItem {
    id: string;
    nome: string;
    whatsapp: string;
    email: string;
    cidade: string;
    status: string;
    taxa_comissao: number | null;
    observacao: string;
    created_at: string;
}

// ============================================
// Public: Submit Lead
// ============================================

export async function submitLead(data: {
    nome: string;
    whatsapp: string;
    email: string;
    cidade: string;
}): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Tabela LeadRevendedora não existe mais." };
}

// ============================================
// Admin: List Leads
// ============================================

export async function getLeads(status?: string): Promise<LeadItem[]> {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    return [];
}

// ============================================
// Admin: Approve Lead (create Supabase user + Reseller)
// ============================================

export async function aprovarLead(
    leadId: string,
    taxaComissao: number
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    return { success: false, error: "Tabela LeadRevendedora não existe mais" };
}

// ============================================
// Admin: Reject Lead
// ============================================

export async function recusarLead(
    leadId: string,
    observacao: string
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    return { success: false, error: "Tabela LeadRevendedora não existe mais" };
}

// ============================================
// Helpers
// ============================================

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
}
