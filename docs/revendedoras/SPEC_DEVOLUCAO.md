# SPEC — Devolução / Acerto de Consignação

## Objetivo
Permitir que a revendedora registre o encerramento de uma maleta (marcando itens vendidos, anexando foto do comprovante e enviando para revisão), deixando a maleta em `aguardando_revisao` até a confirmação física pela consultora/admin.

## Atores
- **Revendedora** — inicia o processo e envia comprovante.
- **Consultora/Admin** — confirma recepção física e fecha a maleta (ver `SPEC_ADMIN_CONFERIR_MALETA.md`).
- **Sistema de gamificação** — concede +30 pts se devolução no prazo.

## Fluxo
1. Em `/app/maleta/[id]` toca "Devolver Consignación" → `/app/maleta/[id]/devolver`.
2. Paso 1: resumo da maleta (itens enviados, vendidos, a devolver).
3. Paso 2: foto do comprovante usando câmera nativa PWA.
4. Paso 3: revisão final + envio.
5. Paso 4: confirmação na tela com status "Esperando recepción".
6. Admin/consultora conclui fisicamente → maleta passa para `concluida`.

## Regras de negócio
- Ciclo de vida da maleta: `ativa` → (`atrasada`) → `aguardando_revisao` → `concluida`.
- Estoque só é restaurado ao atingir `concluida`.
- Comissões só são calculadas em `concluida`.
- Foto do comprovante é obrigatória no envio.
- Ponto `devolucao_prazo` concedido apenas se enviada antes de `data_limite`.
- Após envio, revendedora não pode mais editar a maleta.

## Edge cases
- Maleta já em `aguardando_revisao` → tela mostra status somente-leitura.
- Foto do comprovante falha no upload → reteste; permitir tentar novamente.
- Conexão perde no envio → salvar rascunho local para retomar.
- Itens marcados como vendidos sem venda registrada → exigir registro antes de enviar (ou gerar venda automática).
- Maleta vencida (`atrasada`) → fluxo idêntico mas sem bônus de pontos.

## Dependências
- `SPEC_MALETA.md` — estado atual da maleta.
- `SPEC_ADMIN_CONFERIR_MALETA.md` — confirmação do lado admin.
- `SPEC_API_UPLOAD_R2.md` — upload da foto do comprovante.
- `SPEC_NOTIFICACOES.md` — evento `acerto_confirmado`.
- `SPEC_PROGRESSO.md` — regra `devolucao_prazo`.

---

## Detalhes técnicos / Referência

**Ruta:** `/app/maleta/[id]/devolver`  
**Tipo:** Client Component (multi-step) + Server Actions

---

## Contexto

La revendedora inicia el proceso de devolución: informa qué artículos fueron vendidos, fotografía el comprobante y envía todo. La consignación queda en `aguardando_revisao` hasta que la consultora confirme físicamente la recepción.

---

## Ciclo de Vida Completo de la Consignación

```
ativa
  │  (vencimiento pasa sin devolución)
  ├──→ atrasada
  │
  │  (revendedora envía acerto + foto)
  ↓
aguardando_revisao    ← consignación enviada, esperando llegada física
  │
  │  (consultora/admin confirma recepción y verifica artículos)
  ↓
concluida             ← stock restaurado, comisiones calculadas
```

---

## Flujo Multi-Step (app de la revendedora)

```
Paso 1: Resumen de la Consignación
         ↓
Paso 2: Foto del Comprobante  ← CÁMARA NATIVA PWA
         ↓
Paso 3: Revisión Final + Enviar
         ↓
Paso 4: Confirmación — Esperando Recepción
```

---

## Paso 1: Resumen de la Consignación

```
┌─────────────────────────────────────┐
│  ← Devolver Consig. #102            │
│                                     │
│  📅 Vencimiento: 15 Dic 2024        │
│  [Atrasada — 3 días]                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  12 artículos enviados      │    │
│  │   8 marcados como vendidos  │    │
│  │   4 a devolver              │    │
│  └─────────────────────────────┘    │
│                                     │
│  Al confirmar, enviarás un          │
│  comprobante de devolución.         │
│  La consignación solo se cerrará    │
│  cuando tu consultora confirme el   │
│  recibo físico.                     │
│                                     │
│  [Continuar →]                      │
└─────────────────────────────────────┘
```

---

## Paso 2: Foto del Comprobante 📸

```
┌─────────────────────────────────────┐
│  ← Foto del Comprobante             │
│                                     │
│  Fotografía los artículos que       │
│  devolverás, ordenados y visibles.  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   [📷 Tomar Foto]           │    │  ← abre cámara nativa
│  └─────────────────────────────┘    │
│                                     │
│  (sin foto seleccionada)            │
└─────────────────────────────────────┘

── Después de capturar ───────────────

┌─────────────────────────────────────┐
│  ← Foto del Comprobante             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  [Preview de la foto]       │    │
│  └─────────────────────────────┘    │
│                                     │
│  [🔄 Tomar Otra Foto]               │
│                                     │
│  [Siguiente: Revisar y Enviar →]    │
└─────────────────────────────────────┘
```

### Implementación de la Cámara Nativa (PWA)

```tsx
// src/components/CameraCapture.tsx — Client Component
'use client';

export function CameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* input oculto — activa cámara nativa en móvil */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"   // ← cámara trasera
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="btn-camera"
      >
        📷 Tomar Foto
      </button>
    </>
  );
}
```

> **Por qué `<input capture="environment">`?** Es el estándar web para abrir directamente
> la cámara nativa en iOS y Android, sin APIs extras. En desktop, abre el selector de archivo.

### Upload del Comprobante a R2

```ts
// Ver SPEC_API_UPLOAD_R2.md para implementación completa
async function uploadComprobante(file: File, maletaId: string): Promise<string> {
  const key = `comprovantes/${maletaId}/${Date.now()}.jpg`;
  return await uploadFile(file, key); // usa la función estándar de upload
}
```

- Formato: JPEG, PNG, HEIC (cualquier imagen de cámara)
- Tamaño máximo: 10 MB
- Compresión client-side antes del upload (usando `browser-image-compression`)

---

## Paso 3: Revisión Final

```
┌─────────────────────────────────────┐
│  Revisión Final                     │
│                                     │
│  Consignación #102                  │
│                                     │
│  ✅ Vendidos (8 artículos)          │
│     Total: G$ 12.500               │
│  ↩ Devolución (4 artículos)        │
│     Total: G$ 4.200                │
│                                     │
│  Comisión estimada: G$ 3.125 (25%) │
│                                     │
│  📸 Comprobante                     │
│  [miniaturas de la foto]            │
│                                     │
│  ────────────────────────────────── │
│  Tras el envío, la consignación     │
│  quedará "Esperando Confirmación"   │
│  hasta que tu consultora confirme   │
│  la recepción física.               │
│                                     │
│  [← Atrás]  [✅ Enviar Devolución] │
└─────────────────────────────────────┘
```

---

## Paso 4: Confirmación de Envío

```
┌─────────────────────────────────────┐
│         ⏳ ¡Devolución Enviada!     │
│                                     │
│  Tu consultora fue notificada.      │
│  Entrega los artículos en persona   │
│  o coordina la logística.           │
│                                     │
│  Cuando ella confirme la recepción  │
│  recibirás una notificación y la    │
│  consignación será cerrada.         │
│                                     │
│  [Seguir en Inicio →]               │
└─────────────────────────────────────┘
```

La consignación aparece en Inicio como `"Esperando Confirmación ⏳"` en vez de `"En Proceso"`.

---

## Server Action: `submitDevolucao(input)`

```ts
// src/app/app/actions-revendedora.ts
async function submitDevolucao(input: {
  maleta_id: string;
  comprovante_url: string;           // URL de la foto en R2
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verificar ownership
    const maleta = await tx.maleta.findFirstOrThrow({
      where: { id: input.maleta_id, reseller_id: session.resellerId },
    });

    // 2. Validar estado (solo 'ativa' o 'atrasada' pueden devolver)
    if (!['ativa', 'atrasada'].includes(maleta.status)) {
      throw new Error('Esta consignación no puede devolverse en su estado actual.');
    }

    // 3. Actualizar estado de la consignación a pendiente de revisión material
    await tx.maleta.update({
      where: { id: input.maleta_id },
      data: {
        status: 'aguardando_revisao',
        comprovante_devolucao_url: input.comprovante_url,
      },
    });

    // 4. Notificar consultora/admin
    await notificarDevolucaoPendente(maleta.reseller_id, input.maleta_id);
  });
}
```

---

## Notificación a la Consultora/Admin

```ts
async function notificarDevolucaoPendente(resellerId: string, maletaId: string) {
  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    include: { colaboradora: true },
  });

  const msg = `📦 ${reseller.name} devolvió su consignación. Esperando confirmación.`;

  // Notificar consultora responsable
  if (reseller.colaboradora) {
    await enviarPushParaRevendedora(reseller.colaboradora.auth_user_id!, msg);
  }

  // Notificar todos los SUPER_ADMINs
  const admins = await prisma.reseller.findMany({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    if (admin.auth_user_id) {
      await enviarPushParaRevendedora(admin.auth_user_id, msg);
    }
  }
}
```

---

## Gamificación

Los puntos **solo se otorgan** cuando la consultora confirma la recepción (no cuando la revendedora envía):

```ts
// Dentro de confirmarRecepcion() — en admin
if (new Date() <= maleta.data_limite) {
  await awardPoints(resellerId, 'devolucao_prazo'); // +30 pts (llegó a tiempo)
}
if (pct_vendido === 1.0) {
  await awardPoints(resellerId, 'maleta_completa'); // +200 pts
}
```

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `DevolverConsignacionPage` | **Client** | Orquesta multi-step con estado local |
| `ResumenConsignacionStep` | **Client** | Paso 1 |
| `ComprobanteStep` | **Client** | Paso 2 — `CameraCapture` + preview |
| `CameraCapture` | **Client** | `<input capture="environment">` |
| `RevisionFinalStep` | **Client** | Paso 3 — muestra todo antes de confirmar |
| `DevolucionEnviadaStep` | Server | Paso 4 — estado final |
