# SPEC — Pantallas: Perfil (Ver, Editar, Documentos, Bancario)

**Rutas:**
- `/app/perfil` — Mi Perfil
- `/app/perfil/datos` — Editar Mis Datos
- `/app/perfil/documentos` — Documentos y Contratos
- `/app/perfil/bancario` — Datos Bancarios
- `/app/perfil/notificaciones` — Ver `SPEC_NOTIFICACOES.md`
- `/app/perfil/soporte` — Soporte y Ayuda

---

## Decisión: Datos Bancarios pertenecen al portal Revendedora

Los datos bancarios son ingresados por la **revendedora** en su propio portal `/app`,
utilizando el bottom nav estándar: `Inicio | Catálogo | Consig. | Más`.

El nav alternativo que aparecía en los diseños iniciales (`Maletas | Inventario | Ventas | Reportes | Perfil`)
corresponde a un **prototipo antiguo descartado**. El portal de la Colaboradora (si se implementa en el futuro)
tendrá su propia especificación separada y su propio layout.

**Nuevo schema:** Ver `SPEC_DATABASE_FINAL.md` — modelos `ResellerDocumento`, `Contrato`, `DadosBancarios`.

---

## Pantalla 1: Mi Perfil `/app/perfil`

### Layout
```
┌─────────────────────────────────────┐
│           Mi Perfil                 │
│         [Avatar circular]           │
│           Ana Silva                 │
│       [Diamante / VIP 🏅] ← rango  │
│   correo: anasilva@gmail.com        │
│   WhatsApp: (595) 981-000-000       │
│                                     │
│  ┌────────────────┐ ┌────────────┐  │
│  │ Tasa Comisión  │ │ Consultora │  │
│  │     25%        │ │María Santos│  │
│  └────────────────┘ └────────────┘  │
│                                     │
│  > Mis Datos              ›         │
│  > Documentos y Contratos ›         │
│  > Datos Bancarios        ›         │
│  > Notificaciones         ›         │
│  > Soporte y Ayuda        ›         │
│                                     │
│  [Cerrar Sesión]  ← rojo            │
└─────────────────────────────────────┘
```

### Datos Mostrados

| Campo | Fuente |
|-------|--------|
| Avatar | `reseller.avatar_url` |
| Nombre | `reseller.name` |
| Badge de Rango | `getRankAtual(resellerId)` → `NivelRegra` |
| Correo | `supabase.auth.user.email` (no del Reseller) |
| WhatsApp | `reseller.whatsapp` |
| Tasa de Comisión | `reseller.taxa_comissao` — solo lectura (definida por admin) |
| Consultora | `reseller.colaboradora.name` |

### Menú de Navegación

| Ítem | Ruta |
|------|------|
| Mis Datos | `/app/perfil/datos` |
| Documentos y Contratos | `/app/perfil/documentos` |
| Datos Bancarios | `/app/perfil/bancario` |
| Notificaciones | `/app/perfil/notificaciones` |
| Soporte y Ayuda | Redirige a WhatsApp de soporte (`wa.me/+595...`) |

### Cerrar Sesión
```ts
// LogoutButton.tsx — Client Component
await supabase.auth.signOut();
redirect('/app/login');
```

### Componentes
- `PerfilPage` — Server Component
- `LogoutButton` — **Client Component**

---

## Pantalla 2: Editar Mis Datos `/app/perfil/datos`

### Campos del Formulario

| Campo | Editable | Fuente |
|-------|----------|--------|
| Foto de perfil | ✅ | Upload → R2 → `reseller.avatar_url` |
| Nombre completo | ✅ | `reseller.name` |
| WhatsApp | ✅ | `reseller.whatsapp` |
| Correo | ❌ (solo lectura 🔒) | `supabase.auth.user.email` — "Para acceso y seguridad" |
| Dirección (6 campos) | ✅ | `reseller.endereco_*` |

### Upload de Avatar
- Input `<input type="file" accept="image/*" capture="camera">` para abrir cámara/galeria
- Upload a R2: `resellers/{resellerId}/avatar.webp` (ver `SPEC_API_UPLOAD_R2.md`)
- Preview inmediato antes de guardar

### Gamificación: `perfil_completo`
```ts
// Tras guardar con éxito, verificar si el perfil está 100% completo
const perfilCompleto = !!(name && whatsapp && avatar_url &&
  endereco_cep && endereco_logradouro && endereco_cidade);

if (perfilCompleto) {
  await awardPoints(resellerId, 'perfil_completo');
  // Solo puntúa 1x — tipo = "unico" en GamificacaoRegra
}
```

### Server Action: `actualizarPerfilRevendedora(data)`
```ts
const schema = z.object({
  name: z.string().min(2).max(100),
  whatsapp: z.string().min(8).max(20),
  avatar_url: z.string().url().optional(),
  endereco_cep: z.string().max(10).optional(),
  endereco_logradouro: z.string().max(200).optional(),
  endereco_numero: z.string().max(20).optional(),
  endereco_complemento: z.string().max(100).optional(),
  endereco_cidade: z.string().max(100).optional(),
  endereco_estado: z.string().max(100).optional(),
});
```

### Componentes
- `EditarDatosPage` — **Client Component** (formulario con estado local)
- `AvatarUploader` — **Client Component** (cámara/galería + preview)

---

## Pantalla 3: Documentos y Contratos `/app/perfil/documentos`

### Layout
```
┌─────────────────────────────────────┐
│  ← Documentos y Contratos           │
│                                     │
│  Documentos Personales              │
│  ┌── Identidad (CI) ─── [Aprobado] ┐│
│  │         [📷 cámara]             ││
│  └────────────────────────────────┘ │
│                                     │
│  Contratos                          │
│  [PDF] Término de Consignación 2026 │
│         Descargar   Leer >          │
│  [PDF] Manual de Conducta           │
│         Descargar   Leer >          │
│                                     │
│  [Enviar para Revisión]             │
└─────────────────────────────────────┘
```

### Estados del Card de Documento (CI)

| Estado | Visual |
|--------|--------|
| Sin upload | Borde punteado + ícono cámara centrado |
| `pendente` con archivo | Borde sólido + thumbnail + "Esperando revisión" |
| `em_analise` | Badge amarillo "En revisión" |
| `aprovado` | Badge verde "Aprobado" |
| `rejeitado` | Badge rojo "Rechazado" + texto de `observacao` |

### Upload del CI
```ts
// Acepta imagen o PDF
<input type="file" accept="image/*,application/pdf" capture="camera" />
// Upload a R2: resellers/{resellerId}/docs/ci.{ext} (ver SPEC_API_UPLOAD_R2.md)
// Upsert: ResellerDocumento WHERE tipo='ci' AND reseller_id
```

### Contratos (gestionados por admin)
- Listados de `Contrato WHERE ativo = true`
- "Descargar" → `<a href={url} download>` — abre PDF del R2
- "Leer >" → abre en nueva pestaña

### Botón "Enviar para Revisión"
- Activo solo cuando hay documento con `status = 'pendente'`
- Acción: cambia status → `'em_analise'` + notifica admin por email
- **Email al admin:** Supabase Edge Function `notificar-documento-enviado`
  - Destinatario: todos los `ADMIN` con email
  - Asunto: `Nuevo documento para revisar — {reseller.name}`
  - Cuerpo: Nombre + tipo de documento + enlace al panel admin

### Server Actions
```ts
uploadDocumento(resellerId, tipo, file)    // upload R2 + upsert ResellerDocumento
enviarParaRevision(resellerId)             // status pendente → em_analise + email admin
getDocumentosYContratos(resellerId)        // retorna documentos + contratos activos
```

---

## Pantalla 4: Datos Bancarios `/app/perfil/bancario`

### Layout
```
┌─────────────────────────────────────┐
│  ← Datos Bancarios                  │
│  🔒 Usados solo para comisiones     │
│                                     │
│  [Alias] [Cuenta Bancaria] ← tabs   │
│                                     │
│  --- PESTAÑA: ALIAS ---             │
│  Tipo de Alias: [CI ▼]              │
│  Alias: [_____________________]     │
│  Nombre del Titular: [___________]  │
│  CI/RUC: [_______________________]  │
│                                     │
│  [Guardar Datos Bancarios]          │
└─────────────────────────────────────┘
```

### Contexto Bancario: Paraguay
El "Alias" es del sistema **Bancard** — equivalente al PIX en Brasil.

**Tipos de Alias:**
- CI (Cédula de Identidad)
- RUC (Registro fiscal)
- Celular
- Email

### Pestañas: Alias vs Cuenta Bancaria

| Pestaña | Campos |
|---------|--------|
| Alias (Bancard) | Tipo de Alias, Alias, Nombre del Titular, CI/RUC |
| Cuenta Bancaria | Banco, Sucursal, Cuenta, Tipo (corriente/ahorro), Titular, CI/RUC |

### Server Action: `guardarDatosBancarios(resellerId, data)`

```ts
const aliasSchema = z.object({
  tipo: z.literal('alias'),
  alias_tipo: z.enum(['CI', 'RUC', 'Celular', 'Email']),
  alias_valor: z.string().min(1),
  alias_titular: z.string().min(2),
  alias_ci_ruc: z.string().min(4),
});

const cuentaBancariaSchema = z.object({
  tipo: z.literal('cuenta_bancaria'),
  banco: z.string().min(2),
  agencia: z.string().optional(),
  cuenta: z.string().min(4),
  tipo_cuenta: z.enum(['corriente', 'ahorro']),
  titular: z.string().min(2),
  ci_ruc: z.string().min(4),
});

const datosBancariosSchema = z.discriminatedUnion('tipo', [aliasSchema, cuentaBancariaSchema]);
```

### Componentes
- `DatosBancariosPage` — **Client Component** (pestañas + formulario)
- `AliasForm` / `CuentaBancariaForm` — Client Components hijos

---

## Pantalla 5: Soporte y Ayuda `/app/perfil/soporte`

**Decisión:** Redirige directamente al WhatsApp de soporte de la consultora responsable.

```ts
// src/app/app/perfil/soporte/page.tsx
export default async function SoportePage() {
  const session = await getServerSession();
  const reseller = await getResellerConColaboradora(session.resellerId);

  // Si la revendedora tiene consultora asignada, abrir su WhatsApp
  const whatsapp = reseller.colaboradora?.whatsapp ?? WHATSAPP_SOPORTE_GENERAL;
  const mensaje = encodeURIComponent(`Hola, soy ${reseller.name} y necesito ayuda con el portal.`);

  redirect(`https://wa.me/${whatsapp}?text=${mensaje}`);
}
```

> `WHATSAPP_SOPORTE_GENERAL` es una variable de entorno con el número de soporte general.

---

## Mapa de Rutas del Módulo Perfil

```
src/app/app/perfil/
├── page.tsx                ← Mi Perfil (resumen)
├── datos/
│   └── page.tsx            ← Editar Mis Datos
├── documentos/
│   └── page.tsx            ← Documentos y Contratos
├── bancario/
│   └── page.tsx            ← Datos Bancarios
├── notificaciones/
│   └── page.tsx            ← Ver SPEC_NOTIFICACOES.md
└── soporte/
    └── page.tsx            ← Redirect a WhatsApp
```
