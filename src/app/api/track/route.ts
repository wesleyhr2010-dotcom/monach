import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Known bot user-agent patterns
const BOT_PATTERNS = [
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i,
    /yandexbot/i, /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
    /whatsapp/i, /telegrambot/i, /applebot/i, /semrushbot/i, /ahrefsbot/i,
    /mj12bot/i, /dotbot/i, /petalbot/i, /bytespider/i, /gptbot/i,
    /claudebot/i, /anthropic/i, /crawler/i, /spider/i, /bot\//i,
    /headlesschrome/i, /lighthouse/i, /pagespeed/i,
];

function isBot(userAgent: string): boolean {
    return BOT_PATTERNS.some((p) => p.test(userAgent));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tipo_evento, page_url, reseller_id } = body;

        if (!tipo_evento || !page_url) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const userAgent = request.headers.get("user-agent") || "";
        const referrer = request.headers.get("referer") || "";
        const botDetected = isBot(userAgent);

        // Read or create visitor_id cookie
        let visitorId = request.cookies.get("mnrc_vid")?.value;
        if (!visitorId) {
            visitorId = crypto.randomUUID();
        }

        // Fire-and-forget insert (non-blocking)
        prisma.analyticsAcesso.create({
            data: {
                reseller_id: reseller_id || null,
                visitor_id: visitorId,
                tipo_evento,
                page_url,
                user_agent: userAgent.slice(0, 500),
                referrer: referrer.slice(0, 500),
                is_bot: botDetected,
            },
        }).catch((err: unknown) => {
            console.error("[Analytics] Failed to track:", err instanceof Error ? err.message : err);
        });

        const response = new NextResponse(null, { status: 204 });

        // Set visitor cookie (1 year)
        response.cookies.set("mnrc_vid", visitorId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
        });

        return response;
    } catch {
        return new NextResponse(null, { status: 204 }); // Fail silently
    }
}
