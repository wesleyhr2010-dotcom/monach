# SPEC — Pantalla: Vitrina Pública (URL compartible)

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

## Layout

```
┌─────────────────────────────────────┐
│  [Logo Monarca]               [🛍️]  │
├─────────────────────────────────────┤
│                                     │
│         [Foto de Perfil]            │
│         Ana Silva                   │
│         Revendedora Monarca 💎      │
│                                     │
│  [💬 Consultar por WhatsApp]        │
│                                     │
│  ─────────────────────────────────  │
│  COLECCIÓN (12 artículos)           │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [img] Collar Elegance          │ │
│  │       G$ 1.250                 │ │
│  │ [💬 Consultar]                 │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ [img] Pulsera Boho             │ │
│  │       G$ 850                   │ │
│  │ [💬 Consultar]                 │ │
│  └────────────────────────────────┘ │
│                                     │
│  Powered by Monarca                 │
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

## Tracking de Clics en WhatsApp

Cuando el visitante hace clic en "Consultar por WhatsApp":

```ts
// src/app/vitrina/[slug]/WhatsAppButton.tsx — Client Component
'use client';

async function handleWhatsAppClick(
  resellerId: string,
  visitorId: string,
  productoId?: string
) {
  // 1. Registrar clic (fire and forget)
  await fetch('/api/track-evento', {
    method: 'POST',
    body: JSON.stringify({
      reseller_id: resellerId,
      tipo_evento: 'clique_whatsapp',
      visitor_id: visitorId,
      produto_id: productoId ?? null,
    }),
  });

  // 2. Abrir WhatsApp con mensaje prellenado
  const msg = encodeURIComponent(
    productoId
      ? `Hola ${resellerName}, me interesa consultar sobre este producto de Monarca 💎`
      : `Hola ${resellerName}, me interesan sus joyas Monarca 💎`
  );
  window.open(`https://wa.me/${reseller.whatsapp}?text=${msg}`, '_blank');
}
```

### Ruta API de Tracking

```ts
// src/app/api/track-evento/route.ts
export async function POST(req: NextRequest) {
  const { reseller_id, tipo_evento, visitor_id, produto_id } = await req.json();

  // Validación básica
  if (!reseller_id || !tipo_evento) return NextResponse.json({ ok: false });

  await prisma.analyticsAcesso.create({
    data: { reseller_id, tipo_evento, visitor_id, produto_id: produto_id ?? null },
  });

  return NextResponse.json({ ok: true });
}
```

> **Sin autenticación:** Esta ruta es pública, pero sin datos sensibles. Solo acepta
> `tipo_evento IN ['catalogo_revendedora', 'clique_whatsapp']` — validar en la ruta.

---

## Botón "Consultar por WhatsApp" (Revendedora)

Mensaje prellenado al hacer clic en el producto individual:

```
Hola [nombre-revendedora], quisiera consultar sobre 
[nombre-producto] · G$ [precio]. ¿Está disponible?
```

Mensaje genérico (botón flotante de perfil):

```
Hola [nombre-revendedora], me interesan sus joyas Monarca 💎
```

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
| `VitrinaPage` | Server | Fetch reseller + artículos + registrar visita |
| `VitrinaHeader` | Server | Avatar + nombre + botón WhatsApp |
| `ArticuloCard` | Server | Imagen + nombre + precio + botón consultar |
| `WhatsAppConsultarButton` | **Client** | Tracking + abrir WhatsApp |
