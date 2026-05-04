"use server";

import { prisma } from "@/lib/prisma";
import { safeAction, type ActionResult } from "@/lib/action-utils";
import { requireAuth } from "@/lib/user";
import { createServerClient } from "@/lib/supabase";
import { emailCandidaturaAprovada } from "@/lib/email-templates/candidatura-aprovada";
import { emailCandidaturaRechazada } from "@/lib/email-templates/candidatura-rechazada";
import { z } from "zod";

// ============================================
// Types
// ============================================

export interface LeadItem {
  id: string;
  nome: string;
  cedula: string;
  whatsapp: string;
  email: string;
  direccion: string;
  status: string;
  taxa_comissao: number | null;
  observacao_admin: string | null;
  created_at: Date;
  colaboradora: { id: string; name: string } | null;
}

// ============================================
// Public: Submit Lead
// ============================================

const submitLeadSchema = z.object({
  nome: z.string().min(2, "El nombre es obligatorio"),
  cedula: z.string().min(1, "La cédula es obligatoria"),
  edad: z.string().optional(),
  direccion: z.string().min(1, "La dirección es obligatoria"),
  estado_civil: z.string().optional(),
  hijos: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().min(1, "El WhatsApp es obligatorio"),
  empresa: z.string().optional(),
  informconf: z.string().optional(),
});

export type SubmitLeadInput = z.infer<typeof submitLeadSchema>;

export async function submitLead(
  rawData: SubmitLeadInput
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const data = submitLeadSchema.parse(rawData);

    const lead = await prisma.revendedoraLead.create({
      data: {
        nome: data.nome,
        cedula: data.cedula,
        edad: data.edad ?? "",
        direccion: data.direccion,
        estado_civil: data.estado_civil ?? "",
        hijos: data.hijos ?? "",
        instagram: data.instagram ?? "",
        whatsapp: data.whatsapp,
        empresa: data.empresa ?? "",
        informconf: data.informconf ?? "",
        status: "pendente",
      },
    });

    return { id: lead.id };
  });
}

// ============================================
// Admin: List Leads
// ============================================

export async function getLeads(
  status?: string
): Promise<ActionResult<LeadItem[]>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN", "COLABORADORA"]);

    const where = status
      ? { status: status as "pendente" | "aprovado" | "rejeitado" }
      : {};

    const leads = await prisma.revendedoraLead.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        colaboradora: { select: { id: true, name: true } },
      },
    });

    return leads.map((l) => ({
      id: l.id,
      nome: l.nome,
      cedula: l.cedula,
      whatsapp: l.whatsapp,
      email: l.email,
      direccion: l.direccion,
      status: l.status,
      taxa_comissao: l.taxa_comissao ? Number(l.taxa_comissao) : null,
      observacao_admin: l.observacao_admin,
      created_at: l.created_at,
      colaboradora: l.colaboradora,
    }));
  });
}

// ============================================
// Admin: Approve Lead
// ============================================

export async function aprovarLead(
  leadId: string,
  options: { colaboradoraId?: string; taxaComissao?: number }
): Promise<ActionResult<{ resellerId: string }>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const supabaseAdmin = createServerClient();

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Buscar lead pendente (race protection via WHERE status='pendente')
        const lead = await tx.revendedoraLead.findFirst({
          where: { id: leadId, status: "pendente" },
        });

        // 2. Idempotência: se não encontrou, verifica se já está aprovado
        if (!lead) {
          const alreadyApproved = await tx.revendedoraLead.findFirst({
            where: { id: leadId, status: "aprovado" },
          });
          if (alreadyApproved) {
            const existingReseller = await tx.reseller.findFirst({
              where: { email: alreadyApproved.email },
            });
            return {
              resellerId: existingReseller?.id ?? alreadyApproved.id,
              alreadyApproved: true,
            };
          }
          throw new Error("Lead no encontrada o no está pendiente.");
        }

        // 3. Verificar se já existe reseller com mesmo email
        const existingReseller = await tx.reseller.findFirst({
          where: { email: lead.email },
        });
        if (existingReseller) {
          throw new Error("Ya existe una revendedora con ese correo.");
        }

        // 4. Criar usuário no Supabase Auth
        const tempPassword = generateTempPassword();
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: lead.email,
            password: tempPassword,
            email_confirm: true,
          });

        if (authError) {
          throw new Error(
            `Error al crear usuario: ${authError.message}`
          );
        }

        if (!authData.user) {
          throw new Error("No se pudo crear el usuario de autenticación.");
        }

        const authUserId = authData.user.id;

        // 5. Criar Reseller
        const slugBase = lead.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

        const reseller = await tx.reseller.create({
          data: {
            auth_user_id: authUserId,
            name: lead.nome,
            email: lead.email,
            whatsapp: lead.whatsapp,
            slug,
            role: "REVENDEDORA",
            taxa_comissao: options.taxaComissao ?? 25,
            colaboradora_id: options.colaboradoraId ?? null,
            cedula: lead.cedula,
            instagram: lead.instagram,
            edad: lead.edad,
            estado_civil: lead.estado_civil,
            hijos: lead.hijos,
            empresa: lead.empresa,
            informconf: lead.informconf,
          },
        });

        // 6. Atualizar lead
        await tx.revendedoraLead.update({
          where: { id: leadId },
          data: {
            status: "aprovado",
            colaboradora_id: options.colaboradoraId ?? null,
            taxa_comissao: options.taxaComissao ?? 25,
          },
        });

        return { resellerId: reseller.id, tempPassword, alreadyApproved: false };
      },
      { isolationLevel: "Serializable" }
    );

    // 7. Enviar email de boas-vindas (fora da transação)
    if (!result.alreadyApproved) {
      try {
        const lead = await prisma.revendedoraLead.findUnique({
          where: { id: leadId },
        });
        if (lead) {
          await emailCandidaturaAprovada({
            email: lead.email,
            nome: lead.nome,
            senhaTemp: result.tempPassword!,
          });
        }
      } catch (emailErr) {
        console.error("[aprovarLead] Error al enviar email de bienvenida:", emailErr);
        // Email failure não falha a ação
      }
    }

    return { resellerId: result.resellerId };
  });
}

// ============================================
// Admin: Reject Lead
// ============================================

export async function recusarLead(
  leadId: string,
  observacao: string
): Promise<ActionResult<void>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const lead = await prisma.revendedoraLead.update({
      where: { id: leadId },
      data: {
        status: "rejeitado",
        observacao_admin: observacao,
      },
    });

    // Enviar email de rechazo (best-effort)
    try {
      await emailCandidaturaRechazada({
        email: lead.email,
        nome: lead.nome,
      });
    } catch (emailErr) {
      console.error("[recusarLead] Error al enviar email de rechazo:", emailErr);
    }
  });
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
