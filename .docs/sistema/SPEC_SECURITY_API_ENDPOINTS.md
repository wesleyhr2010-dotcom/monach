# SPEC — Segurança: Rate Limiting, Validação de APIs e Upload Seguro

> Define proteções para todos os endpoints públicos e semi-públicos do sistema.

---

## 1. Endpoints por Nível de Proteção

| Endpoint | Auth | Rate Limit | Validação Entrada |
|----------|------|-----------|------------------|
| `POST /api/upload-r2` | ✅ Session | 10 req/min por user | Tipo + tamanho + magic bytes |
| `POST /api/track-evento` | ❌ Público | 100 req/min por IP | Zod schema estrito |
| `GET /vitrina/[slug]` | ❌ Público | Não (CDN handle) | N/A |
| `POST /app/login` | ❌ Público | 5 tentativas / 15min | Supabase lida |
| `POST /app/login/recuperar` | ❌ Público | 3 req / 15min | Email válido |
| `GET /api/health` | ❌ Público | Não | N/A |
| Server Actions (`/app/*`, `/admin/*`) | ✅ Session | N/A (sessão inválida = erro) | Zod por action |

---

## 2. Rate Limiting — Implementação com Upstash Redis

### Instalação

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Helper Centralizado

```ts
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiters = {
  // 10 uploads por minuto por usuário
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'upload',
  }),

  // 100 eventos de analytics por minuto por IP
  trackEvento: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    prefix: 'track',
  }),

  // 3 emails de recuperação por 15 min
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '15 m'),
    prefix: 'pwd-reset',
  }),
};
```

### Uso em Route Handlers

```ts
// src/app/api/upload-r2/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit por user ID
  const { success, limit, reset, remaining } = await rateLimiters.upload.limit(
    `user:${session.user.id}`
  );

  if (!success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  }

  // ... continua processamento
}
```

---

## 3. Validação de Tipo de Arquivo — Magic Bytes

**Não confiar no `Content-Type` enviado pelo cliente.** Verificar os bytes reais do arquivo:

```ts
// src/lib/upload/validate-magic-bytes.ts
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png':  [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],  // "RIFF"
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],  // "%PDF"
};

export async function validateMagicBytes(
  file: File,
  claimedType: string
): Promise<boolean> {
  const allowedSignatures = MAGIC_BYTES[claimedType];
  if (!allowedSignatures) return false;

  // Ler apenas os primeiros 8 bytes
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return allowedSignatures.some(signature =>
    signature.every((byte, i) => bytes[i] === byte)
  );
}

// Uso no handler de upload:
const isValid = await validateMagicBytes(file, file.type);
if (!isValid) {
  return Response.json(
    { error: 'El archivo no corresponde al tipo declarado.' },
    { status: 400 }
  );
}
```

---

## 4. Endpoint `POST /api/track-evento` — Proteção Completa

```ts
// src/app/api/track-evento/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const trackEventoSchema = z.object({
  reseller_id: z.string().uuid(),
  tipo_evento: z.enum(['catalogo_revendedora', 'clique_whatsapp']),
  visitor_id: z.string().uuid().optional(),
  produto_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit por IP
  const ip = req.headers.get('x-forwarded-for') ?? req.ip ?? 'unknown';
  const { success } = await rateLimiters.trackEvento.limit(`ip:${ip}`);

  if (!success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  // Validação estrita com Zod
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parse = trackEventoSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { reseller_id, tipo_evento, visitor_id, produto_id } = parse.data;

  // Verificar que reseller_id existe (previne data pollution)
  const resellerExists = await prisma.reseller.findUnique({
    where: { id: reseller_id },
    select: { id: true },
  });
  if (!resellerExists) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await prisma.analyticsAcesso.create({
    data: { reseller_id, tipo_evento, visitor_id, produto_id },
  });

  return NextResponse.json({ ok: true });
}

// CORS: apenas origem do próprio site
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
  ];

  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

---

## 5. Regras de Validação Zod — Schemas Completos por Action

### `createMaletaSchema`

```ts
export const createMaletaSchema = z.object({
  reseller_id: z.string().uuid(),
  data_limite: z.string().datetime(),  // ISO 8601
  itens: z.array(z.object({
    product_variant_id: z.string().uuid(),
    quantidade: z.number().int().min(1).max(999),
    preco_fixado: z.number().positive(),
  })).min(1).max(100),
});
```

### `closeMaletaSchema`

```ts
export const closeMaletaSchema = z.object({
  maleta_id: z.string().uuid(),
  acerto: z.array(z.object({
    item_id: z.string().uuid(),
    quantidade_vendida: z.number().int().min(0),
  })).min(1),
  nota_acerto: z.string().max(500).optional(),
});
```

### `submitDevolucaoSchema`

```ts
export const submitDevolucaoSchema = z.object({
  maleta_id: z.string().uuid(),
  comprovante_url: z.string().url(),
  itens_confirmados: z.array(z.string().uuid()),
});
```

### `awardPointsSchema`

```ts
export const awardPointsSchema = z.object({
  reseller_id: z.string().uuid(),
  regra_acao: z.enum([
    'primeiro_acesso', 'perfil_completo', 'venda_maleta',
    'devolucao_prazo', 'maleta_completa', 'compartilhou_catalogo', 'meta_mensal',
  ]),
  pontos: z.number().int().min(1).max(10000),
});
```

---

## 6. Headers de Segurança (next.config.js)

```ts
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.onesignal.com",  // OneSignal
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://assets.monarca.com.py",
      "connect-src 'self' https://*.supabase.co https://onesignal.com",
      "frame-src 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## 7. Fallback se Upstash não Estiver Configurado

```ts
// src/lib/rate-limit.ts
export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<boolean> {
  if (!limiter) return true;  // Rate limiting desabilitado — permitir
  const { success } = await limiter.limit(key);
  return success;
}
```

> Se `UPSTASH_REDIS_REST_URL` não estiver configurado, rate limiting é desabilitado gracefully.
> Obrigatório em produção. Opcional em desenvolvimento.
