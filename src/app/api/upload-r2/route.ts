import { createSupabaseSSRClient } from "@/lib/supabase-ssr";
import { NextRequest, NextResponse } from "next/server";
import { createR2Client, R2_BUCKET } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const uploadSchema = z.object({
  key: z.string().min(1),
});

function validateFile(file: File): void {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `Archivo demasiado grande. Máximo: 10 MB. Recibido: ${(file.size / 1024 / 1024).toFixed(1)} MB`
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }
}

async function validateKey(key: string, userId: string, resellerId: string, role?: string): Promise<void> {
  // Revendedoras solo pueden subir a su propio espacio, comprovantes de sus maletas o documentos privados
  const resellerPaths = [
    `resellers/${userId}/`,
    `resellers/${resellerId}/`,
    `comprovantes/`,
    `private/resellers/`,
  ];
  const adminPaths = ["products/", "brindes/", "contratos/", "private/"];

  const isAdmin = role === "ADMIN" || role === "COLABORADORA";
  const isResellerPath = resellerPaths.some((prefix) => key.startsWith(prefix));
  const isAdminPath = adminPaths.some((prefix) => key.startsWith(prefix));

  if (!isAdmin && isAdminPath) {
    throw new Error(`Path "${key}" no autorizado para este usuario`);
  }

  if (!isAdmin && !isResellerPath) {
    throw new Error(`Path "${key}" no autorizado para este usuario`);
  }

  // Si es comprovante, validar que la maleta pertenece al usuario
  if (key.startsWith("comprovantes/")) {
    const parts = key.split("/");
    const maletaId = parts[1];
    if (!maletaId) {
      throw new Error("Path de comprobante inválido");
    }
    const maleta = await prisma.maleta.findFirst({
      where: { id: maletaId },
      select: { reseller: { select: { auth_user_id: true } } },
    });
    if (!maleta || maleta.reseller.auth_user_id !== userId) {
      throw new Error("No autorizado para subir comprobante de esta consignación");
    }
  }

  // Si es documento privado de revendedora, validar ownership
  if (key.startsWith("private/resellers/")) {
    const parts = key.split("/");
    const resellerIdFromPath = parts[2];
    if (!resellerIdFromPath) {
      throw new Error("Path de documento privado inválido");
    }
    const reseller = await prisma.reseller.findFirst({
      where: { id: resellerIdFromPath },
      select: { auth_user_id: true },
    });
    if (!isAdmin && (!reseller || reseller.auth_user_id !== userId)) {
      throw new Error("No autorizado para subir documento en este path privado");
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sesión
    const supabase = await createSupabaseSSRClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar role e id del usuario
    const reseller = await prisma.reseller.findFirst({
      where: { auth_user_id: user.id },
      select: { id: true, role: true },
    });

    if (!reseller) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
    }

    // 2. Parsear FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const key = formData.get("key") as string | null;

    // 3. Validar inputs
    if (!file || !key) {
      return NextResponse.json(
        { error: "Archivo y key son requeridos" },
        { status: 400 }
      );
    }

    const parseResult = uploadSchema.safeParse({ key });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Key inválida" }, { status: 400 });
    }

    // 4. Validar key (solo paths permitidos para el user)
    await validateKey(key, user.id, reseller.id, reseller.role);

    // 5. Validar tipo y tamaño
    try {
      validateFile(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Archivo inválido";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 6. Upload a R2
    const r2 = createR2Client();
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000",
      })
    );

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}/${key}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al subir el archivo. Intente nuevamente.";
    console.error("[upload-r2] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
