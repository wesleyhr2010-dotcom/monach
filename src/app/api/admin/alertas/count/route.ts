import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getResellerScope } from "@/lib/auth/get-reseller-scope";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/alertas/count
 * Retorna a contagem de maletas em status 'aguardando_revisao'
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

    const count = await prisma.maleta.count({
      where: {
        ...scope,
        status: "aguardando_revisao",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[api/admin/alertas/count] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
