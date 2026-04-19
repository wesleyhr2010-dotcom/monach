# SPEC — Pantallas: Catálogo y Compartir Fotos

**Rutas:** `/app/catalogo` · `/app/catalogo/compartir`

---

## Pantalla 1: Catálogo `/app/catalogo`

Vitrina de los productos disponibles en la consignación activa de la revendedora.

### Datos Necesarios

| Dato | Fuente |
|------|--------|
| `articulos_disponibles[]` | `maleta_item WHERE maleta.reseller_id AND maleta.status='ativa' AND quantidade_vendida < quantidade_enviada` |
| `producto.imagenes` | `product_variant.image_url` |
| `producto.precio` | `maleta_item.preco_fixado` |

### Funcionalidades
- Filtro por categoría o búsqueda por nombre
- Botón "Compartir" navega a `/app/catalogo/compartir`
- Cada producto tiene botón de compartir individual (Web Share API — enlace)

---

## Pantalla 2: Seleccionar Fotos `/app/catalogo/compartir`

### Layout
```
┌─────────────────────────────────────┐
│  ← SELECCIONA FOTOS PARA COMPARTIR │
│                                     │
│  [img][img][img✓]                   │
│  [img][img✓][img✓]                  │
│  [img✓][img][img]                   │
│  [img✓][img✓][img]                  │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  6 IMÁGENES SELECCIONADAS           │
│  [CANCELAR]  [📲 COMPARTIR]         │
└─────────────────────────────────────┘
```

### Reglas de Negocio
1. Muestra **productos de la consignación activa** (no el catálogo general)
2. Selección **multi-select** — máximo 10 imágenes
3. Imagen seleccionada: checkmark verde + borde (`#35605a`)
4. Barra inferior adherida (sticky): conteo dinámico + botones. **Debe posicionarse por encima de la navegación global** para mantener consistencia.
5. "Cancelar" vuelve a `/app/catalogo`
6. **Consistencia de Navegación**: La barra de navegación inferior (`BottomNavigation`) **MANDATORIAMENTE** debe mantenerse visible en todo el flujo para no aislar a la usuaria.

---

## Lógica de Compartir — Imágenes Reales

La implementación usa `navigator.share({ files: [] })` con objetos `File` generados
dinámicamente a partir de las imágenes del R2.

```ts
// src/app/app/catalogo/compartir/CompartirButton.tsx
'use client';

async function compartirImagenes(selectedItems: MaletaItem[], userId: string) {
  // 1. Mostrar loading: "Descargando 1/6, 2/6..."
  const imageFiles = await Promise.all(
    selectedItems.map(async (item, i) => {
      setProgress(`${i + 1}/${selectedItems.length}`);
      const response = await fetch(item.image_url); // URL pública del R2
      const blob = await response.blob();
      return new File(
        [blob],
        `${item.product_variant.sku}.webp`,
        { type: blob.type || 'image/webp' }
      );
    })
  );

  // 2. Verificar soporte
  if (navigator.canShare && navigator.canShare({ files: imageFiles })) {
    await navigator.share({
      files: imageFiles,
      text: `¡Joyas hermosas de Monarca! 💎\nVe más en: ${SITE_URL}?ref=${userId}`,
    });
  } else {
    // Fallback: WhatsApp con enlaces de texto
    const urls = selectedItems
      .map(i => `${SITE_URL}/producto/${i.slug}?ref=${userId}`)
      .join('\n');
    const waText = encodeURIComponent(`Joyas Monarca 💎\n${urls}`);
    window.open(`https://wa.me/?text=${waText}`, '_blank');
  }

  // 3. Registrar puntos (puntúa en ambos casos)
  await registrarPuntosCompartir();
}
```

### Consideraciones Técnicas

| Item | Detalle |
|------|---------|
| **Límite** | Máximo 10 imágenes por compartir |
| **Loading** | Mostrar progreso `Descargando X/Y...` mientras hace fetch |
| **Formato** | Imágenes R2 en `.webp` — compatible con Web Share API Files |
| **CORS** | Bucket R2 configurado según `SPEC_API_UPLOAD_R2.md` |

### Compatibilidad por Plataforma

| Plataforma | Comportamiento |
|------------|---------------|
| Android Chrome (PWA) | `navigator.share({ files })` — imágenes reales ✅ |
| iOS 16.4+ (PWA instalado) | `navigator.share({ files })` — imágenes reales ✅ |
| iOS < 16.4 | Fallback WhatsApp con enlaces |
| Desktop (cualquier) | Fallback WhatsApp con enlaces |

### Gamificación
- Al compartir (con éxito o fallback): `awardPoints(resellerId, 'compartilhou_catalogo')` → +50 pts
- Límite: máx 5x/día (campo `limite_diario = 5` en `GamificacaoRegra`)
- Verificación antes de puntuar:
```ts
const hoy = startOfDay(new Date());
const count = await prisma.pontosExtrato.count({
  where: { reseller_id, descricao: 'compartilhou_catalogo', created_at: { gte: hoy } }
});
if (count >= regra.limite_diario) return; // límite alcanzado
```

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `CatalogoPage` | Server | Lista productos de la consignación activa |
| `CompartirFotosPage` | **Client** | Grid con selección multi-foto |
| `FotoSeleccionable` | **Client** | Grid item con overlay de selección + checkmark |
| `BottomBarCompartir` | **Client** | Barra sticky: conteo + Cancelar + Compartir |
| `CompartirButton` | **Client** | Lógica de fetch + Web Share API |

**Estado del Client Component:**
```ts
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [progress, setProgress] = useState<string | null>(null);
const [isPending, startTransition] = useTransition();
```
