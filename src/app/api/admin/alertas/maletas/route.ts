import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getResellerScope } from "@/lib/auth/get-reseller-scope";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/alertas/maletas
 * Retorna a lista de maletas em status 'aguardando_revisao'
 * respeitando o escopo RBAC do caller.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Inactive" }, { status: 403 });
    }

    if (user.role === "REVENDEDORA") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = getResellerScope(user);

    const maletas = await prisma.maleta.findMany({
      where: {
        ...scope,
        status: "aguardando_revisao",
      },
      include: {
        reseller: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 50,
    });

    const mapped = maletas.map((m) => ({
      id: m.id,
      numero: m.numero,
      revendedoraNome: m.reseller.name,
      dataDevolucao: m.updated_at.toISOString(),
    }));

    return NextResponse.json({ maletas: mapped });
  } catch (error) {
    console.error("[api/admin/alertas/maletas] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
