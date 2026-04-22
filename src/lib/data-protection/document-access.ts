import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { assertIsInGroup } from "@/lib/auth/assert-in-group";
import type { ActionResult } from "@/lib/action-utils";
import { safeLogError } from "@/lib/errors/sanitize-log";
import { createR2Client, R2_BUCKET, R2_PUBLIC_DOMAIN } from "@/lib/r2";

const SIGNED_URL_EXPIRES_SECONDS = 3600; // 1 hora

/**
 * Revendedora: acessar próprio documento via signed URL.
 * Ref: docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md §3
 */
export async function getDocumentSignedUrl(
    documentoId: string
): Promise<ActionResult<string>> {
    try {
        const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);

        const documento = await prisma.resellerDocumento.findFirst({
            where: { id: documentoId, reseller_id: user.profileId! },
        });
        if (!documento) {
            return { success: false, error: "Documento no encontrado." };
        }

        const signedUrl = await _generateSignedUrl(documento.url);

        // Log de auditoria (sem PII)
        console.log(
            JSON.stringify({
                event: "document_accessed",
                documento_id: documentoId,
                reseller_id: user.profileId,
                timestamp: new Date().toISOString(),
            })
        );

        return { success: true, data: signedUrl };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao gerar link do documento";
        safeLogError("[getDocumentSignedUrl] Error:", { documentoId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Admin/Consultora: acessar documento de qualquer revendedora.
 * COLABORADORA só pode ver documentos de revendedoras sob seu manager_id.
 * Ref: docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md §3
 */
export async function getDocumentSignedUrlAdmin(
    documentoId: string
): Promise<ActionResult<string>> {
    try {
        const admin = await requireAuth(["ADMIN", "COLABORADORA"]);

        const documento = await prisma.resellerDocumento.findUnique({
            where: { id: documentoId },
            include: { reseller: { select: { id: true, colaboradora_id: true } } },
        });

        if (!documento) {
            return { success: false, error: "Documento no encontrado." };
        }

        if (admin.role === "COLABORADORA") {
            await assertIsInGroup(documento.reseller.id, admin.profileId!);
        }

        const signedUrl = await _generateSignedUrl(documento.url);

        // Log de auditoria (sem PII)
        console.log(
            JSON.stringify({
                event: "admin_document_accessed",
                documento_id: documentoId,
                accessed_by: admin.profileId,
                admin_role: admin.role,
                timestamp: new Date().toISOString(),
            })
        );

        return { success: true, data: signedUrl };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao gerar link do documento";
        safeLogError("[getDocumentSignedUrlAdmin] Error:", { documentoId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Extrai a chave relativa do R2 a partir da URL pública completa.
 */
function _extractKeyFromUrl(url: string): string {
    const base = R2_PUBLIC_DOMAIN.replace(/\/$/, "");
    if (url.startsWith(base + "/")) {
        return url.slice(base.length + 1);
    }
    // Se já for apenas a chave
    return url;
}

async function _generateSignedUrl(publicUrl: string): Promise<string> {
    const key = _extractKeyFromPublicUrl(publicUrl);
    const s3 = createR2Client();
    return getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
        { expiresIn: SIGNED_URL_EXPIRES_SECONDS }
    );
}

// Alias para compatibilidade com chamadas existentes
function _extractKeyFromPublicUrl(url: string): string {
    return _extractKeyFromUrl(url);
}
