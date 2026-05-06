# SPEC — Vitrine Pública da Revendedora

## Objetivo
Oferecer a cada revendedora uma "loja online pessoal" (URL compartilhável) onde clientes finais podem ver seu catálogo ativo, adicionar produtos a um carrinho e finalizar o pedido via WhatsApp com mensagem pré-preenchida. O sistema registra visitas e eventos de analytics de forma anônima.

## Atores
- **Cliente final** — visitante público sem autenticação.
- **Revendedora** — dona da vitrine; compartilha URL com clientes.
- **Sistema de analytics** — registra acessos, visitantes únicos e cliques em `AnalyticsAcesso`.

## Fluxo
1. Cliente acessa `https://monarca.com.py/vitrina/{slug}`.
2. Servidor busca `Reseller` pelo slug e carrega itens da maleta ativa (ISR).
3. Exibe foto de perfil, nome e grid de produtos da maleta ativa.
4. Cliente clica em um produto → vai para página de detalhe do produto.
5. Na página de detalhe, cliente clica "Agregar al carrito".
6. Carrinho é armazenado em localStorage; badge flutuante mostra contador de itens.
7. Cliente clica no badge para ver o carrinho.
8. Cliente clica "Finalizar pedido" → gera mensagem formatada e abre WhatsApp.
9. Toda visita e evento de tracking grava em `AnalyticsAcesso` com `visitor_id` (cookie).

## Requisitos

### Vitrina Base (VITR-01 .. VITR-12)
- **VITR-01**: Cliente pode acessar vitrina pública via URL `/vitrina/{slug}`
- **VITR-02**: Vitrina exibe foto de perfil, nome e CTA WhatsApp da revendedora
- **VITR-03**: Vitrina exibe grid de produtos da maleta ativa com preços
- **VITR-04**: Slug inexistente ou revendedora inativa retorna 404
- **VITR-05**: Sem maleta ativa exibe mensagem "Próximamente artículos disponibles" + CTA WhatsApp
- **VITR-06**: SEO metadata gerada dinamicamente (título, descrição, OG tags, imagem perfil)
- **VITR-07**: Página usa `robots: noindex` para evitar thin content no Google
- **VITR-08**: Visitas são rastreadas anonimamente com `visitor_id` em cookie (30 dias, SameSite=Lax)
- **VITR-09**: API de tracking aceita apenas eventos whitelist (`catalogo_revendedora`, `clique_whatsapp`)
- **VITR-10**: RLS permite leitura anônima de dados da vitrina sem autenticação
- **VITR-11**: ISR com revalidate de 300s para performance
- **VITR-12**: Preço exibido é o preço atual do ProductVariant (não o snapshot da maleta)

### Página de Detalhe do Produto (VITR-13 .. VITR-14)
- **VITR-13**: Produto na grid é clicável e leva para `/vitrina/{slug}/{produtoId}`
- **VITR-14**: Página de detalhe exibe fotos do produto (ProductVariant), nome, preço, descrição e botão "Agregar al carrito"

### Carrinho de Compras (VITR-15 .. VITR-16)
- **VITR-15**: Carrinho armazenado em localStorage do navegador com estrutura `{ items: [{ productId, variantId, name, price, quantity, image }] }`
- **VITR-16**: Badge flutuante sticky no canto inferior direito exibe contador de itens do carrinho em todas as páginas da vitrina

### Checkout WhatsApp (VITR-17)
- **VITR-17**: "Finalizar pedido" gera mensagem formatada para WhatsApp com lista de produtos (nome + preço) e valor total, e abre `wa.me/{whatsapp}` com a mensagem pré-preenchida

## Regras de negócio
- Acesso **público** — sem login.
- Slug único por revendedora: `{nombre-slug}-{random-3}`.
- Exibe apenas itens com saldo em maleta `ativa` da revendedora.
- Revendedora `ativo = false` → página 404.
- Sem maleta ativa → mostra perfil + mensagem "No tiene artículos disponibles momentáneamente" + CTA WhatsApp genérico.
- Metadata gerada dinamicamente para SEO e preview de compartilhamento.
- Eventos de analytics: `catalogo_revendedora` (acesso) e `clique_whatsapp` (clique).
- Preço exibido na vitrina é o **preço atual do ProductVariant** (exceção à regra de imutabilidade da maleta para vitrina pública).
- Carrinho não persiste no servidor — apenas localStorage do navegador.

## Edge cases
- Slug inexistente → 404.
- Revendedora desativada → 404.
- Produto com imagem quebrada → placeholder.
- Cliente sem cookies → `visitor_id` por request; não entra em contagem de únicos.
- Preço nulo ou zerado → oculta valor e mantém CTA.
- Carrinho vazio ao clicar "Finalizar" → mostrar mensagem "Tu carrito está vacío" com link para voltar à vitrina.
- localStorage indisponível ou limpo → carrinho inicia vazio; mensagem genérica no checkout.
- Cliente recarrega a página → carrinho persistido em localStorage é restaurado.
- Produto adicionado 2x ao carrinho → incrementar quantidade (não duplicar item).

## Dependências
- `SPEC_DESEMPENHO.md` — consome eventos gerados aqui.
- `SPEC_MALETA.md` — fonte dos itens.
- `SPEC_API_UPLOAD_R2.md` — imagens.
- `SPEC_DATABASE.md` — `Reseller.slug`, `AnalyticsAcesso`.

---

## Detalhes técnicos / Referência

**Ruta:** `/vitrina/[slug]`  
**Tipo:** Server Component (con SEO) + tracking anónimo  
**Acceso:** Público — sin autenticación requerida

---

## Propósito

La vitrina pública es la "tienda online personal" de la revendedora.
Acceden los clientes finales a través de un enlace compartido en WhatsApp o redes sociales.

El enlace sigue el patrón: `https://monarca.com.py/vitrina/ana-silva-a3f`

El `slug` es único, generado al crear la revendedora: `{nombre-slug}-{random-3chars}`

---

## Layout — Grid da Vitrina

```
┌─────────────────────────────────────┐
│  [Logo Monarca]               [🛍️]  │  ← Badge carrinho (flutuante)
├─────────────────────────────────────┤
│                                     │
│         [Foto de Perfil]            │
│         Ana Silva                   │
│         Revendedora Monarca 💎      │
│                                     │
│  ─────────────────────────────────  │
│  COLECCIÓN (12 artículos)           │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [img] Collar Elegance          │ │
│  │       G$ 1.250                 │ │
│  │ [👁 Ver producto]              │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ [img] Pulsera Boho             │ │
│  │       G$ 850                   │ │
│  │ [👁 Ver producto]              │ │
│  └────────────────────────────────┘ │
│                                     │
│  Powered by Monarca                 │
└─────────────────────────────────────┘
```

## Layout — Página de Detalhe do Produto

```
┌─────────────────────────────────────┐
│  [← Volver]  [🛍️ 2]                │  ← Badge carrinho
├─────────────────────────────────────┤
│                                     │
│      [img grande del producto]      │
│                                     │
│  Collar Elegance                    │
│  G$ 1.250                           │
│                                     │
│  Descripción del producto...        │
│                                     │
│  [📦 Agregar al carrito]            │
│                                     │
└─────────────────────────────────────┘
```

## Layout — Carrinho (Drawer/Modal)

```
┌─────────────────────────────────────┐
│  🛍️ Tu Carrito              [✕]    │
├─────────────────────────────────────┤
│  ┌────────────────────────────────┐ │
│  │ [img] Collar Elegance    G$1.250│ │
│  │        Cantidad: 2        [🗑️]  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ [img] Pulsera Boho       G$850 │ │
│  │        Cantidad: 1        [🗑️]  │ │
│  └────────────────────────────────┘ │
│                                     │
│  Total: G$ 3.350                    │
│                                     │
│  [💬 Finalizar pedido por WhatsApp] │
└─────────────────────────────────────┘
```

---

## Datos

| Dato | Fuente |
|------|--------|
| `reseller` | `Reseller WHERE slug = params.slug AND ativo = true` |
| `articulos` | `MaletaItem JOIN ProductVariant WHERE maleta.reseller_id AND maleta.status = 'ativa' AND quantidade_vendida < quantidade_enviada` |
| `numero_articulos` | `COUNT(articulos)` |

> Si la revendedora no tiene consignación activa: mostrar mensaje "Próximamente artículos disponibles. Consulta por WhatsApp."

---

## SEO y Metadata

```ts
// src/app/vitrina/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const reseller = await getResellerBySlug(params.slug);

  return {
    title: `${reseller.name} | Joyería Monarca`,
    description: `Descubrí las hermosas joyas y semijoyería de ${reseller.name}. Consula disponibilidad y precios directamente por WhatsApp.`,
    openGraph: {
      title: `${reseller.name} | Joyería Monarca`,
      description: `Joyas exclusivas por ${reseller.name}`,
      images: [reseller.avatar_url || '/og-default.jpg'],
      type: 'website',
    },
    robots: 'noindex', // vitrina personal — no indexar en Google
  };
}
```

> **Por qué `noindex`:** Las vitrinas son personales y masivas. Indexarlas en Google
> crearía miles de URLs similares compitiendo entre sí (contenido duplicado).

---

## Tracking de Analytics

Registrar la visita de forma **anónima** mediante un `visitor_id` persistente.

### Mecanismo de `visitor_id`

El `visitor_id` es una cadena UUID almacenada en una cookie del navegador del visitante.
No está vinculada a ningún usuario real — solo sirve para contar visitantes únicos.

```ts
// src/app/vitrina/[slug]/page.tsx — Server Component
export default async function VitrinaPage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();

  // Leer o crear visitor_id en la cookie
  let visitorId = cookieStore.get('monarca_visitor_id')?.value;

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    // La response header establece la cookie en el cliente
    // (usar middleware para establecer la cookie si las Server Components no pueden setear headers)
  }

  const reseller = await getResellerBySlug(params.slug);

  // Registrar visita (sin await para no bloquear el render de la página)
  trackearAcceso(reseller.id, 'catalogo_revendedora', visitorId);

  return <VitrinaView reseller={reseller} visitorId={visitorId} />;
}
```

### Configuración de la Cookie

```ts
// Duración: 30 días — suficiente para contar visitantes únicos recurrentes
// HttpOnly: false — necesita ser accesible para el JS del visor-tracking
// SameSite: Lax — funciona con links externos (WhatsApp, Instagram, etc.)
//
// Nombre de la cookie: monarca_visitor_id
// Valor: UUID v4 aleatorio (ej: "a1b2c3d4-e5f6-...")
```

### Edge Case: Visitas desde iframe / pre-fetch
```ts
// Si el referer es del propio dominio monarca.com.py, no contar como "visita nueva"
// Esto evita contar pre-fetches de Next.js como visitas reales
```

---

## Tracking de Eventos

### Tracking de Acesso (Visita)

Realizado via endpoint dedicado `/api/vitrina/track`:

```ts
// Componente client-side na vitrina
useEffect(() => {
  fetch('/api/vitrina/track', {
    method: 'POST',
    body: JSON.stringify({
      reseller_id: resellerId,
      tipo_evento: 'catalogo_revendedora',
      page_url: window.location.href,
    }),
    keepalive: true,
  });
}, []);
```

### Tracking de Checkout WhatsApp

```ts
// Ao clicar "Finalizar pedido por WhatsApp"
async function handleCheckout(resellerId: string, visitorId: string) {
  // 1. Registrar evento de checkout (fire and forget)
  fetch('/api/vitrina/track', {
    method: 'POST',
    body: JSON.stringify({
      reseller_id: resellerId,
      tipo_evento: 'clique_whatsapp',
      page_url: window.location.href,
    }),
    keepalive: true,
  });

  // 2. Gerar mensagem formatada com itens do carrinho
  const msg = generateWhatsAppMessage(cartItems, resellerName, total);

  // 3. Abrir WhatsApp
  window.open(`https://wa.me/${reseller.whatsapp}?text=${msg}`, '_blank');
}
```

### Ruta API de Tracking da Vitrina

```ts
// src/app/api/vitrina/track/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reseller_id, tipo_evento, visitor_id, produto_id } = body;

  // Whitelist strict de eventos
  if (!['catalogo_revendedora', 'clique_whatsapp'].includes(tipo_evento)) {
    return NextResponse.json({ error: 'Evento no permitido' }, { status: 400 });
  }

  if (!reseller_id || !tipo_evento) {
    return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  }

  // Fire-and-forget insert
  prisma.analyticsAcesso.create({
    data: {
      reseller_id,
      visitor_id: visitor_id || null,
      tipo_evento,
      produto_id: produto_id ?? null,
      page_url: req.headers.get('referer') || '',
    },
  }).catch(() => { /* fail silently */ });

  return NextResponse.json({ ok: true });
}
```

> **Sin autenticación:** Ruta pública sem datos sensibles. Whitelist strict de eventos.

---

## 404 y Casos de Error

| Condición | Respuesta |
|-----------|-----------|
| `slug` no existe | `notFound()` → página 404 estándar de Next.js |
| Revendedora `ativo = false` | `notFound()` → 404 |
| Sin consignación activa | Mostrar perfil + mensaje "Próximamente disponible" |

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `VitrinaPage` | Server | Fetch reseller + artículos da maleta ativa + metadata SEO |
| `VitrinaHeader` | Server | Avatar + nombre + badge carrinho |
| `ProductGrid` | Server | Grid de cards dos produtos da maleta ativa |
| `ProductCard` | Server | Imagen + nombre + precio + link para detalhe |
| `ProductDetailPage` | Server | Fetch produto + variant + metadata |
| `ProductDetailView` | Client | Fotos + descrição + botão "Agregar al carrito" |
| `CartBadge` | **Client** | Badge flutuante sticky com contador de itens |
| `CartDrawer` | **Client** | Drawer/modal com lista de itens, quantidade, total, botão finalizar |
| `CartProvider` | **Client** | Contexto React para gerenciar carrinho em localStorage |
| `WhatsAppCheckoutButton` | **Client** | Gera mensagem formatada + abre WhatsApp |
| `AnalyticsTracker` | **Client** | Tracking de visita via /api/vitrina/track |

---

## Carrinho de Compras

### Especificação do Carrinho

O carrinho é uma funcionalidade **client-side only**, sem persistência no servidor.

#### Estrutura do localStorage

```json
{
  "vitrina_cart": {
    "reseller_slug": "ana-silva-a3f",
    "items": [
      {
        "product_variant_id": "uuid",
        "product_id": "uuid",
        "name": "Collar Elegance",
        "price": 125000,
        "quantity": 2,
        "image_url": "https://r2..."
      }
    ],
    "updated_at": "2026-05-05T12:00:00Z"
  }
}
```

#### Regras do Carrinho
- Chave no localStorage: `monarca_vitrina_cart`
- Carrinho é **isolado por revendedora** — ao acessar vitrina de outra revendedora, carrinho anterior é limpo ou um novo é iniciado
- Produto adicionado 2x → incrementa `quantity` (máximo 10 por item)
- Botão de remover item (🗑️) no drawer
- Total calculado client-side: `sum(items.price * items.quantity)`
- Badge flutuante mostra `sum(items.quantity)`

#### Mensagem WhatsApp Formatada

```
Hola Ana, vi tu vitrina y me interesan estos productos:

1. Collar Elegance (x2) — G$ 250.000
2. Pulsera Boho (x1) — G$ 85.000

Total: G$ 335.000

¿Están disponibles? 💎
```

- Usar `encodeURIComponent` para a mensagem
- Limitar a ~2000 caracteres
- Incluir link da vitrina no final como fallback
