import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxy de imagens para contornar CORS do R2 no PWA.
 * Recebe ?url=<image_url>, faz fetch do blob e retorna com headers permissivos.
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing url param" }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                // Evitar que o R2 bloqueie por referrer
                Referer: "",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream error: ${response.status}` },
                { status: 502 }
            );
        }

        const blob = await response.blob();
        const contentType = response.headers.get("content-type") || blob.type || "image/webp";

        return new NextResponse(blob, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }
}
