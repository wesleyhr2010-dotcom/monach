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

const ALLOWED_EVENTS = ["catalogo_revendedora", "clique_whatsapp"] as const;

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
    const { reseller_id, tipo_evento, produto_id } = body;

    if (!reseller_id || !tipo_evento) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });
    }

    if (!ALLOWED_EVENTS.includes(tipo_evento)) {
      return NextResponse.json({ error: "Evento no permitido" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";
    const botDetected = isBot(userAgent);
    const visitorId = request.cookies.get("mnrc_vid")?.value || null;

    // Fire-and-forget insert
    prisma.analyticsAcesso.create({
      data: {
        reseller_id,
        visitor_id: visitorId,
        tipo_evento,
        produto_id: produto_id ?? null,
        page_url: referrer,
        user_agent: userAgent.slice(0, 500),
        referrer: referrer.slice(0, 500),
        is_bot: botDetected,
      },
    }).catch(() => {});

    const response = NextResponse.json({ ok: true });

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", String(limitResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(limitResult.remaining));

    return response;
  } catch {
    return NextResponse.json({ ok: true }); // Fail silently
  }
}
