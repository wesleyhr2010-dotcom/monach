# SPEC — API de Upload para Cloudflare R2

## Objetivo
Centralizar todos os uploads de arquivos do sistema (fotos de comprovante, avatares, documentos CI, imagens de produto e brindes) em uma única Route Handler autenticada, delegando armazenamento ao Cloudflare R2.

## Atores
- **Usuário autenticado** (revendedora ou admin) — envia arquivos.
- **Route Handler `/api/upload-r2`** — valida sessão, parseia FormData, assina PUT para R2.
- **Cloudflare R2 (S3-compatible)** — destino do arquivo.
- **Supabase Auth** — fornece sessão.

## Fluxo
1. Client envia `FormData` com `file` e `key` via POST.
2. Route verifica sessão via `createRouteHandlerClient`; se não autenticado → 401.
3. Valida inputs (arquivo presente, key válida) — 400 se faltar.
4. Valida MIME type e tamanho conforme contexto de uso.
5. Executa `PutObjectCommand` no R2.
6. Retorna URL pública do objeto.

## Regras de negócio
- Rota é sempre autenticada — nunca pública.
- `key` segue convenção por domínio (ex.: `reseller/{id}/avatar.webp`, `produto/{id}/{variant}.webp`).
- Tamanho máximo por tipo de upload:
  - Avatar: 2 MB (image/*)
  - Comprovante / documento: 5 MB (image/*)
  - Produto/brinde: 5 MB (image/*)
- Overwrite permitido (mesma key substitui).
- Nome do arquivo no R2 nunca contém dados sensíveis em claro.

## Edge cases
- Token de sessão expirado → 401.
- Arquivo acima do limite → 413 (ou 400) com mensagem clara.
- Tipo de MIME não permitido → 400.
- Falha no R2 (rede/credenciais) → 502 + log em Sentry.
- Upload duplicado (mesma key) → sobrescreve; cliente deve gerar chave com hash/timestamp se necessário.

## Dependências
- `SPEC_ENVIRONMENT_VARIABLES.md` — credenciais R2 (`R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`).
- `SPEC_SECURITY_API_ENDPOINTS.md` — políticas de autenticação.
- `SPEC_LOGGING_MONITORING.md` — rastreio de falhas.
- Todas as SPECs que fazem upload (Perfil, Devolução, Produtos, Brindes).

---

## Detalhes técnicos / Referência

**Ruta:** `POST /api/upload-r2`  
**Archivo:** `src/app/api/upload-r2/route.ts`  
**Tipo:** Next.js Route Handler (no Server Action — necesita manejar FormData grande)

---

## Contexto

Esta ruta centraliza **todos** los uploads de archivos del sistema. Se usa para:
- Foto comprobante de devolución de maleta
- Avatar de la revendedora
- Documentos personales (CI, RG, CPF)
- Imágenes de productos (admin)
- Imágenes de brindes (admin)

---

## Autenticación

**Obligatoria.** La ruta verifica sesión activa antes de cualquier operación:

```ts
// src/app/api/upload-r2/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  // 1. Verificar sesión
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Parsear FormData
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const key = formData.get('key') as string | null;

  // 3. Validar inputs
  if (!file || !key) {
    return NextResponse.json({ error: 'Archivo y key son requeridos' }, { status: 400 });
  }

  // 4. Validar key (solo paths permitidos para el user)
  validateKey(key, session.user.id); // lanza error si no autorizado

  // 5. Validar tipo y tamaño
  validateFile(file);

  // 6. Upload a R2
  const url = await uploadToR2(file, key);

  return NextResponse.json({ url });
}
```

---

## Estructura de Paths en R2

Todos los paths siguen el patrón `{categoría}/{scope}/{filename}`.

| Uso | Path en R2 | Ejemplo |
|-----|-----------|---------|
| Avatar de revendedora | `resellers/{resellerId}/avatar.webp` | `resellers/abc-123/avatar.webp` |
| Documento personal | `resellers/{resellerId}/docs/{tipo}.{ext}` | `resellers/abc-123/docs/ci.jpg` |
| Comprobante de devolución | `comprovantes/{maletaId}/{timestamp}.jpg` | `comprovantes/mal-456/1710000000.jpg` |
| Imagen de producto | `products/{productId}/variants/{variantId}.webp` | `products/p-789/variants/v-001.webp` |
| Imagen de brinde | `brindes/{brindeId}/imagen.webp` | `brindes/b-123/imagen.webp` |
| Contrato PDF | `contratos/{filename}.pdf` | `contratos/termino-2026.pdf` |

---

## Validación de Autorización por Path

```ts
function validateKey(key: string, userId: string): void {
  // Revendedoras solo pueden subir a su propio espacio
  const reseller_paths = [
    `resellers/${userId}/`,
    `comprovantes/`, // validar que la maleta pertenece al user en la action
  ];

  const allowed = reseller_paths.some(prefix => key.startsWith(prefix));

  // Paths de admin (products/*, brindes/*, contratos/*) solo para ADMIN/COLABORADORA
  const admin_paths = ['products/', 'brindes/', 'contratos/'];
  // Nota: verificar role del session.user contra resellers.role antes de permitir

  if (!allowed) {
    throw new Error(`Path "${key}" no autorizado para este usuario`);
  }
}
```

---

## Validación de Archivo

```ts
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',   // fotos de iPhone sin convertir
  'application/pdf', // para documentos y contratos
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateFile(file: File): void {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Archivo demasiado grande. Máximo: 10 MB. Recibido: ${(file.size / 1024 / 1024).toFixed(1)} MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }
}
```

---

## Upload al Bucket R2

```ts
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadToR2(file: File, key: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000', // 1 año — assets inmutables
  }));

  // Retorna URL pública
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

---

## Configuración CORS del Bucket R2

Configurar en el dashboard de Cloudflare R2 → Bucket Settings → CORS:

```json
[
  {
    "AllowedOrigins": ["https://monarca.com.py", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "MaxAgeSeconds": 3600
  }
]
```

> ⚠️ **No usar `*` en AllowedOrigins en producción.** Las imágenes son públicas (GET),
> pero el PUT debe restringirse al dominio propio.

---

## Compresión Client-Side (recomendada)

Antes de llamar a `/api/upload-r2`, comprimir imágenes en el cliente:

```ts
// src/lib/compress-image.ts
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  if (file.type === 'application/pdf') return file; // PDFs no se comprimen

  return imageCompression(file, {
    maxSizeMB: 1,          // máx 1 MB después de comprimir
    maxWidthOrHeight: 1920, // máx resolución
    useWebWorker: true,
  });
}
```

Usar `browser-image-compression` (npm install browser-image-compression).

---

## Errores y Mensajes

| Código HTTP | Condición | Mensaje |
|-------------|-----------|---------|
| 401 | Sin sesión | "No autorizado" |
| 400 | Sin archivo o key | "Archivo y key son requeridos" |
| 400 | Archivo muy grande | "Archivo demasiado grande. Máximo: 10 MB." |
| 400 | Tipo no permitido | "Tipo de archivo no permitido: {type}" |
| 403 | Path no autorizado | "Path no autorizado para este usuario" |
| 500 | Error en R2 | "Error al subir el archivo. Intente nuevamente." |

---

## Uso desde el cliente

```ts
// Patrón estándar — usar en todos los componentes de upload
async function uploadFile(file: File, key: string): Promise<string> {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('key', key);

  const res = await fetch('/api/upload-r2', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? 'Error al subir archivo');
  }

  const { url } = await res.json();
  return url;
}
```

---

## Variables de Entorno

```env
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET_NAME=monarca-assets
R2_PUBLIC_URL=https://assets.monarca.com.py
```
