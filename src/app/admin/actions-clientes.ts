"use server";

import { prisma } from "@/lib/prisma";
import { safeAction, BusinessError } from "@/lib/action-utils";
import { requireAuth } from "@/lib/user";
import type { ActionResult } from "@/lib/action-utils";
import type { ClienteItem, ClienteFormData } from "@/lib/types";

// ============================================
// Helper: serializar Prisma Cliente → ClienteItem
// ============================================
function serializeCliente(c: {
  id: string;
  nombre: string;
  ruc: string;
  ciudad: string;
  telefono: string;
  origen: string;
  created_at: Date;
  updated_at: Date;
}): ClienteItem {
  return {
    id: c.id,
    nombre: c.nombre,
    ruc: c.ruc,
    ciudad: c.ciudad,
    telefono: c.telefono,
    origen: c.origen as "LOJA" | "REVENDEDORA",
    created_at: c.created_at.toISOString(),
    updated_at: c.updated_at.toISOString(),
  };
}

// ============================================
// Action: criarCliente
// ============================================
export async function criarCliente(
  data: ClienteFormData
): Promise<ActionResult<ClienteItem>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    // Validação: RUC obrigatório e único
    const rucLimpo = data.ruc.trim();
    if (!rucLimpo) {
      throw new BusinessError("El RUC es obligatorio.");
    }

    const existente = await prisma.cliente.findUnique({
      where: { ruc: rucLimpo },
    });
    if (existente) {
      throw new BusinessError("Ya existe un cliente con ese RUC.");
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: data.nombre.trim(),
        ruc: rucLimpo,
        ciudad: data.ciudad.trim(),
        telefono: data.telefono.trim(),
      },
    });

    return serializeCliente(cliente);
  }, { actionName: "criarCliente" });
}

// ============================================
// Action: editarCliente
// ============================================
export async function editarCliente(
  id: string,
  data: ClienteFormData
): Promise<ActionResult<ClienteItem>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    if (!id) {
      throw new BusinessError("ID de cliente no proporcionado.");
    }

    const rucLimpo = data.ruc.trim();
    if (!rucLimpo) {
      throw new BusinessError("El RUC es obligatorio.");
    }

    // Verificar duplicidade de RUC em OUTRO cliente
    const existente = await prisma.cliente.findFirst({
      where: { ruc: rucLimpo, NOT: { id } },
    });
    if (existente) {
      throw new BusinessError("Ya existe otro cliente con ese RUC.");
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: data.nombre.trim(),
        ruc: rucLimpo,
        ciudad: data.ciudad.trim(),
        telefono: data.telefono.trim(),
      },
    });

    return serializeCliente(cliente);
  }, { actionName: "editarCliente" });
}

// ============================================
// Action: buscarClientePorRuc
// ============================================
export async function buscarClientePorRuc(
  ruc: string
): Promise<ActionResult<ClienteItem | null>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const cliente = await prisma.cliente.findUnique({
      where: { ruc: ruc.trim() },
    });

    return cliente ? serializeCliente(cliente) : null;
  }, { actionName: "buscarClientePorRuc" });
}

// ============================================
// Action: getClientes (lista unificada)
// ============================================
export async function getClientes(params?: {
  origem?: "LOJA" | "REVENDEDORA" | "TODOS";
}): Promise<ActionResult<ClienteItem[]>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const filtro = params?.origem ?? "TODOS";
    const resultado: ClienteItem[] = [];

    // Branch 1: clientes da loja (com RUC)
    if (filtro === "LOJA" || filtro === "TODOS") {
      const clientesLoja = await prisma.cliente.findMany({
        orderBy: { nombre: "asc" },
      });
      resultado.push(...clientesLoja.map(serializeCliente));
    }

    // Branch 2: compradores de maletas (sem RUC, nome + telefone)
    if (filtro === "REVENDEDORA" || filtro === "TODOS") {
      const compradores = await prisma.vendaMaleta.findMany({
        distinct: ["cliente_nome", "cliente_telefone"],
        select: {
          cliente_nome: true,
          cliente_telefone: true,
        },
        orderBy: { cliente_nome: "asc" },
      });

      // Mapear para ClienteItem com ID sintético
      const compradoresMapped: ClienteItem[] = compradores.map((c, idx) => ({
        id: `REV-${idx}`,
        nombre: c.cliente_nome,
        ruc: "",
        ciudad: "",
        telefono: c.cliente_telefone,
        origen: "REVENDEDORA",
        created_at: "",
        updated_at: "",
      }));

      resultado.push(...compradoresMapped);
    }

    // Ordenar alfabeticamente por nombre
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    return resultado;
  }, { actionName: "getClientes" });
}
