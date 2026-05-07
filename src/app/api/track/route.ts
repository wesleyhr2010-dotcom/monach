import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import { createRateLimitResponse, RATE_LIMIT_MESSAGES } from "@/lib/rate-limit-errors";

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
    // Rate limit check first
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limitResult = await checkRateLimit(rateLimiters.trackEvento, `ip:${ip}`);

    if (!limitResult.success) {
        return createRateLimitResponse(
            Math.ceil((limitResult.reset - Date.now()) / 1000),
            RATE_LIMIT_MESSAGES.track
        );
    }

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

        // Add rate limit headers to successful response
        response.headers.set("X-RateLimit-Limit", String(limitResult.limit));
        response.headers.set("X-RateLimit-Remaining", String(limitResult.remaining));

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
