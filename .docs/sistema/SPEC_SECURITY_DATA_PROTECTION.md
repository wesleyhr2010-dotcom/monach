# SPEC — Segurança: Proteção de Dados Sensíveis (PII, Documentos, Dados Bancários)

> Define como dados pessoais e financeiros são armazenados, acessados e protegidos.

---

## 1. Classificação de Dados Sensíveis

| Dado | Tabela/Campo | Sensibilidade | Proteção |
|------|-------------|--------------|---------|
| CI/RUC do Paraguay | `dados_bancarios.alias_ci_ruc` | 🔴 Alta | Criptografia at-rest |
| Número de conta bancária | `dados_bancarios.cuenta` | 🔴 Alta | Criptografia at-rest |
| Alias Bancard | `dados_bancarios.alias_valor` | 🟡 Média | Criptografia at-rest |
| Documentos pessoais (CI, RG) | `reseller_documentos.url` | 🔴 Alta | Signed URLs + acesso controlado |
| Email | `resellers.email` | 🟡 Média | Não logar, não expor em UI pública |
| WhatsApp | `resellers.whatsapp` | 🟡 Média | Não expor na vitrina pública |
| Endereço | `resellers.endereco_*` | 🟡 Média | Não expor publicamente |
| Dados financeiros (comissões) | `maletas.valor_*` | 🟡 Média | Acesso por role, não logar |

---

## 2. Criptografia de Dados Bancários

### Implementação: Prisma Middleware

```ts
// src/lib/prisma/encrypt-middleware.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

function encrypt(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Formato: iv:encrypted:authTag (todos em hex)
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}

function decrypt(value: string): string {
  const [ivHex, encryptedHex, authTagHex] = value.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Campos sensíveis do modelo DadosBancarios
const ENCRYPTED_FIELDS = ['alias_ci_ruc', 'alias_valor', 'cuenta', 'ci_ruc'];

export function addEncryptionMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params, next) => {
    if (params.model === 'DadosBancarios') {
      // Criptografar ao salvar
      if (['create', 'update', 'upsert'].includes(params.action)) {
        for (const field of ENCRYPTED_FIELDS) {
          if (params.args.data?.[field]) {
            params.args.data[field] = encrypt(params.args.data[field]);
          }
        }
      }

      const result = await next(params);

      // Decriptografar ao ler
      if (['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
        const decrypt_ = (item: Record<string, unknown>) => {
          if (!item) return item;
          for (const field of ENCRYPTED_FIELDS) {
            if (typeof item[field] === 'string' && item[field].includes(':')) {
              item[field] = decrypt(item[field] as string);
            }
          }
          return item;
        };
        return Array.isArray(result) ? result.map(decrypt_) : decrypt_(result);
      }

      return result;
    }
    return next(params);
  });
}
```

### Registrar no Cliente Prisma

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { addEncryptionMiddleware } from './prisma/encrypt-middleware';

const prisma = new PrismaClient();
addEncryptionMiddleware(prisma);

export { prisma };
```

---

## 3. Documentos Pessoais — Signed URLs

Documentos pessoais (CI, RG, CPF) **não devem ter URL pública permanente**.

### Upload: Pasta Privada

```ts
// src/app/api/upload-r2/route.ts
// Documentos vão para pasta "private/" (não servida publicamente)
const path = `private/resellers/${resellerId}/docs/${tipo}_${timestamp}.jpg`;
```

### Acesso: Gerar Signed URL sob Demanda

```ts
// src/app/app/perfil/actions.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getDocumentSignedUrl(documentoId: string): Promise<ActionResult<string>> {
  const reseller = await requireAuth();

  const documento = await prisma.resellerDocumento.findFirst({
    where: { id: documentoId, reseller_id: reseller.id },  // ← owner check
  });
  if (!documento) return { success: false, error: 'Documento no encontrado.', code: 'NOT_FOUND' };

  // Extrair path relativo da URL completa
  const key = documento.url.replace(process.env.R2_PUBLIC_URL! + '/', '');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    { expiresIn: 3600 }  // 1 hora
  );

  // Log de auditoria (sem dados pessoais)
  console.log(JSON.stringify({
    event: 'document_accessed',
    documento_id: documentoId,
    reseller_id: reseller.id,
    timestamp: new Date().toISOString(),
  }));

  return { success: true, data: signedUrl };
}
```

### Admin — Acesso a Documentos de Revendedoras

Admin também usa signed URLs, com log de auditoria adicional:

```ts
export async function getDocumentSignedUrlAdmin(documentoId: string): Promise<ActionResult<string>> {
  const admin = await requireAuth(['ADMIN', 'COLABORADORA']);

  const documento = await prisma.resellerDocumento.findUnique({
    where: { id: documentoId },
    include: { reseller: { select: { manager_id: true } } },
  });

  // COLABORADORA só pode ver documentos das suas revendedoras
  if (admin.role === 'COLABORADORA') {
    if (documento?.reseller.manager_id !== admin.id) {
      return { success: false, error: 'Sin permiso.', code: 'FORBIDDEN' };
    }
  }

  // Gerar signed URL...
  // Log adicional para admin
  console.log(JSON.stringify({
    event: 'admin_document_accessed',
    documento_id: documentoId,
    accessed_by: admin.id,
    admin_role: admin.role,
    timestamp: new Date().toISOString(),
  }));
}
```

---

## 4. Sanitização de Logs

```ts
// src/lib/errors/sanitize-log.ts

// Lista de campos que NUNCA devem aparecer em logs
const SENSITIVE_FIELDS = [
  'password', 'senha', 'alias_ci_ruc', 'ci_ruc', 'cuenta',
  'alias_valor', 'email', 'whatsapp', 'name', 'nome',
  'endereco', 'cpf', 'rg',
];

export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const isSensitive = SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f));
      return [key, isSensitive ? '[REDACTED]' : value];
    })
  );
}

// Uso em catch:
} catch (error) {
  console.error('[createMaleta] Error:', sanitizeForLog({ resellerId, error: (error as Error).message }));
}
```

---

## 5. Dados na Vitrina Pública — O Que Expor

A vitrina pública (`/vitrina/[slug]`) é **pública e indexável**. Apenas expor:

| Campo | Expor? | Motivo |
|-------|--------|--------|
| `name` | ✅ Sim | Nome comercial |
| `avatar_url` | ✅ Sim | Foto de perfil |
| `slug` | ✅ Sim | Já está na URL |
| `email` | ❌ Não | PII |
| `whatsapp` | ✅ Apenas link wa.me | Não expor o número diretamente |
| `endereco_*` | ❌ Não | PII |
| `taxa_comissao` | ❌ Não | Dado interno |
| `role` | ❌ Não | Dado interno |

---

## 6. Dados Bancários — Exibição Mascarada na UI

Ao exibir dados bancários para a revendedora, mascarar parcialmente:

```ts
// Mascarar alias Bancard
function maskAlias(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '****' + value.slice(-2);
}

// Mascarar número de conta
function maskCuenta(value: string): string {
  return '•••• ' + value.slice(-4);
}
```

---

## 7. LGPD / Privacidade — Política Mínima

O sistema processa dados pessoais de cidadãos paraguaios e potencialmente brasileiros. Requisitos mínimos:

1. **Aviso de coleta** na tela de perfil: "Tus datos son usados solo para el pago de comisiones."
2. **Direito de exclusão:** Admin pode inativar revendedora (`ativo = false`). Exclusão completa é manual via banco.
3. **Cookies de tracking** (vitrina): Aviso de cookie ao primeiro acesso com opt-out.
4. **Retenção:** Dados bancários removidos após 1 ano de inatividade (processo manual com script).
