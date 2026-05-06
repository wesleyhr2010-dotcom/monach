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

const ALLOWED_EVENTS = ["catalogo_revendedora", "clique_whatsapp"] as const;

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Fail silently
  }
}
