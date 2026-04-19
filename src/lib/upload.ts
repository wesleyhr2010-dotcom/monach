// ============================================
// Shared image upload helpers for R2 storage
// ============================================

import { createR2Client, R2_BUCKET, R2_PUBLIC_DOMAIN } from "@/lib/r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * Upload a product image to R2, converting to optimized WebP.
 * Returns the public URL or null on failure.
 */
export async function uploadProductImage(
    file: File,
    sku: string,
    index: number
): Promise<string | null> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const webpBuffer = await sharp(buffer)
            .resize(1080, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const key = `produtos/${sku}-${index}.webp`;
        const r2 = createR2Client();
        await r2.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: webpBuffer,
                ContentType: "image/webp",
            })
        );

        return `https://${R2_PUBLIC_DOMAIN}/${key}`;
    } catch (error) {
        console.error("Image upload failed:", error);
        return null;
    }
}

/**
 * Upload a reseller avatar to R2, converting to 300x300 WebP.
 * Returns the public URL.
 */
export async function uploadAvatar(
    file: File,
    slug: string
): Promise<string> {
    const ab = await file.arrayBuffer();
    const webp = await sharp(Buffer.from(ab))
        .resize(300, 300, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

    const key = `revendedoras/${slug}-avatar.webp`;
    const r2 = createR2Client();
    await r2.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: webp,
            ContentType: "image/webp",
        })
    );

    return `https://${R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Delete an image from R2 by its public URL.
 * Silently ignores errors (best-effort deletion).
 */
export async function deleteR2Image(url: string): Promise<void> {
    try {
        const key = url.replace(`https://${R2_PUBLIC_DOMAIN}/`, "");
        const r2 = createR2Client();
        await r2.send(
            new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
        );
    } catch {
        // Ignore individual image delete errors
    }
}
