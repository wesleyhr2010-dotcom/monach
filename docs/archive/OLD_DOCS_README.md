# Documentación Técnica — Monarca Semijoyas

Este directorio contiene toda la documentación técnica del proyecto **next-monarca**, organizada por dominio.

> **Idioma del código:** Inglés · **Idioma de UI / documentación:** Español

---

## Estructura

```
.docs/
├── sistema/          Specs de infraestructura, seguridad, base de datos
├── admin/            Specs del panel administrativo (Super Admin)
├── revendedoras/     Specs del portal PWA de revendedoras
├── consultoras/      Specs del portal de consultoras
└── README.md         Este archivo
```

---

## `sistema/` — Infraestructura y Base

| Archivo | Descripción |
|---------|-------------|
| `DESIGN_SYSTEM.md` | Tokens de diseño, colores, tipografía, componentes UI (dark admin + light app) |
| `SPEC_DESIGN_MODULES.md` | Módulos de UI del app revendedora (átomos, moléculas, organismos) |
| `CODE_PATTERNS.md` | Convenciones de código, estructura de archivos, Server Actions |
| `SPEC_DATABASE.md` | **Schema Prisma completo — fuente única de verdad (18 tablas)** |
| `SPEC_BACKEND.md` | Server Actions, lógica de negocio, seguridad RBAC |
| `SPEC_FRONTEND.md` | Estructura frontend, layouts, PWA, performance |
| `SPEC_SECURITY_RBAC.md` | **RBAC completo** — guard, IDOR, RLS Supabase, matriz de permisos |
| `SPEC_SECURITY_DATA_PROTECTION.md` | Cifrado de datos bancarios, Signed URLs, sanitización de logs |
| `SPEC_SECURITY_API_ENDPOINTS.md` | Rate limiting, magic bytes upload, validación Zod por endpoint |
| `SPEC_API_UPLOAD_R2.md` | Ruta `/api/upload-r2` — autenticación, paths, CORS, R2 |
| `SPEC_CRON_JOBS.md` | Edge Functions: prazo, atraso, analytics agregado |
| `SPEC_EMAILS.md` | **Sistema de emails completo — Supabase Auth + Brevo transaccional** |
| `SPEC_ERROR_HANDLING.md` | Catálogo de errores, mensajes en español, patrón ActionResult |
| `SPEC_CACHING_STRATEGY.md` | Cache Next.js: qué cachear, TTLs, invalidación por tags |
| `SPEC_LOGGING_MONITORING.md` | Sentry, logs de cron jobs, alertas, health check |
| `SPEC_MIGRATIONS_SEED.md` | Estrategia de migrations Prisma + seed de datos obligatorios |
| `SPEC_GAMIFICACAO_OVERVIEW.md` | Visión general del sistema de gamificación |
| `SPEC_SKELETON_EMPTY_STATES.md` | Skeletons, estados vacíos y de error por pantalla |
| `SPEC_ENVIRONMENT_VARIABLES.md` | **Lista completa de variables de entorno** — todas las vars, por ambiente |
| `SPEC_TESTING_STRATEGY.md` | Estrategia de tests — Vitest, Playwright, casos críticos |
| `SPEC_DEPLOY_STRATEGY.md` | Deploy Vercel + Supabase, CI/CD, rollback, zero-downtime |
| `CHANGELOG.md` | Historial de cambios del proyecto |

---

## `admin/` — Panel Administrativo (Super Admin + Consultora)

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `SPEC_ADMIN_LAYOUT.md` | `/admin` | Layout, sidebar, RBAC, middleware de admin |
| `SPEC_ADMIN_DASHBOARD.md` | `/admin/dashboard` | KPIs globales, top revendedoras |
| `SPEC_ADMIN_MALETAS.md` | `/admin/maletas` | Gestión completa de consignaciones |
| `SPEC_ADMIN_EQUIPE.md` | `/admin/consultoras` + `/admin/revendedoras` | Gestión de consultoras y revendedoras |
| `SPEC_ADMIN_LEADS.md` | `/admin/leads` | Revisión de candidaturas, aprobar/rechazar |
| `SPEC_ADMIN_PRODUTOS.md` | `/admin/productos` + `/admin/categorias` | CRUD de productos, variantes, categorías |
| `SPEC_ADMIN_GAMIFICACAO.md` | `/admin/gamificacion` | Configuración de reglas, puntos y niveles |
| `SPEC_ADMIN_BRINDES.md` | `/admin/brindes` | Catálogo y solicitudes de regalos |
| `SPEC_ADMIN_CONFIG.md` | `/admin/config` | Tramos de comisión, contratos PDF |
| `SPEC_ADMIN_DOCUMENTOS_ACERTOS.md` | `/admin/documentos` | Aprobación de documentos y confirmación de acertos |
| `SPEC_ADMIN_CONFERIR_MALETA.md` | `/admin/maletas/[id]/conferir` | Conferencia física — recibir, contar y cerrar |
| `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` | `/admin/analytics` | Analytics del negocio, notificaciones push admin |

---

## `revendedoras/` — Portal PWA de Revendedoras

### Documentos Base

| Archivo | Descripción |
|---------|-------------|
| `PRD.md` | Product Requirements Document — visión, alcance y objetivos |
| `PRD_OneSignal_PWA.md` | Spec de PWA, notificaciones push y OneSignal |
| `CONTEXTO_SESSAO.md` | Contexto de la sesión actual — lo que ya está hecho |

### Pantallas

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `SPEC_LOGIN.md` | `/app/login` | Login, recuperación y nueva contraseña |
| `SPEC_HOME.md` | `/app` | Dashboard: métricas, comisión, consignación activa |
| `SPEC_MALETA.md` | `/app/maleta` | Lista, detalles y registrar venta |
| `SPEC_DEVOLUCAO.md` | `/app/maleta/[id]/devolver` | Flujo multi-step de devolución con cámara PWA |
| `SPEC_CATALOGO.md` | `/app/catalogo` | Catálogo y compartir fotos por WhatsApp |
| `SPEC_PROGRESSO.md` | `/app/progreso` | Cómo ganar puntos — mapa de tareas |
| `SPEC_EXTRATO_BRINDES.md` | `/app/progreso/extracto` + `/regalos` | Historial de puntos + canje de regalos |
| `SPEC_PERFIL.md` | `/app/perfil` | Perfil, datos, documentos, bancario, soporte |
| `SPEC_NOTIFICACOES.md` | `/app/notificaciones` + preferencias | Centro de notifs + configuración OneSignal |
| `SPEC_DESEMPENHO.md` | `/app/desempenho` | Analytics: visitas, conversiones, gráficos |
| `SPEC_VITRINE_PUBLICA.md` | `/vitrina/[slug]` | Vitrina pública — página pública de la revendedora |
| `SPEC_SEJA_REVENDEDORA.md` | `/seja-revendedora` | Formulario público de inscripción de candidatas |
| `SPEC_ONBOARDING_REVENDEDORA.md` | `/app/bienvenida` | Flujo de primer acceso — tour guiado + puntos iniciales |

---

## `consultoras/` — Portal de Consultoras

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `SPEC_CONSULTORA_PERFIL.md` | Múltiples rutas | Spec completa del portal: perfil, comisiones, analytics, maletas, perfil de revendedora, solicitudes de brindees y notificaciones |

**Rotas cubiertas en la spec:**
- `/admin/minha-conta` — Perfil + resumen mensal
- `/admin/minha-conta/comissoes` — Extrato de comisiones por mês
- `/admin/analytics` — Analytics del grupo (ranking, evolución, alertas)
- `/admin/maletas` — Lista de maletas del grupo (con badge de pendientes)
- `/admin/maletas/[id]/conferir` — Conferencia física + cierre
- `/admin/revendedoras/[id]` — Perfil individual de revendedora (KPIs, ventas, puntos)
- `/admin/solicitacoes` — Brindes pendientes del grupo (marcar como entregue)

---

## Flujos Clave — Lectura Recomendada

**Para implementar el schema:**
`sistema/SPEC_DATABASE.md` → `sistema/SPEC_BACKEND.md` → `sistema/SPEC_MIGRATIONS_SEED.md` → `sistema/SPEC_CRON_JOBS.md`

**Para implementar el portal de revendedoras:**
`revendedoras/PRD.md` → `revendedoras/SPEC_LOGIN.md` → `revendedoras/SPEC_ONBOARDING_REVENDEDORA.md` → `revendedoras/SPEC_HOME.md` → `revendedoras/SPEC_MALETA.md` → `revendedoras/SPEC_DEVOLUCAO.md`

**Para implementar el admin:**
`admin/SPEC_ADMIN_LAYOUT.md` → `sistema/SPEC_SECURITY_RBAC.md` → `admin/SPEC_ADMIN_MALETAS.md` → `admin/SPEC_ADMIN_CONFERIR_MALETA.md`

**Para implementar el portal de consultora:**
`consultoras/SPEC_CONSULTORA_PERFIL.md` → `admin/SPEC_ADMIN_MALETAS.md` → `admin/SPEC_ADMIN_CONFERIR_MALETA.md` → `admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`

**Para implementar gamificación:**
`sistema/SPEC_GAMIFICACAO_OVERVIEW.md` → `admin/SPEC_ADMIN_GAMIFICACAO.md` → `revendedoras/SPEC_PROGRESSO.md`

**Para subir a producción:**
`sistema/SPEC_ENVIRONMENT_VARIABLES.md` → `sistema/SPEC_DEPLOY_STRATEGY.md` → `sistema/SPEC_TESTING_STRATEGY.md`

**Para implementar seguridad:**
`sistema/SPEC_SECURITY_RBAC.md` → `sistema/SPEC_SECURITY_DATA_PROTECTION.md` → `sistema/SPEC_SECURITY_API_ENDPOINTS.md`

---

## Convenciones Críticas (Resumen)

| Tema | Decisión |
|------|---------|
| Roles válidos | `REVENDEDORA`, `COLABORADORA`, `ADMIN` (nunca `SUPER_ADMIN`) |
| Proveedor de email | Brevo exclusivamente (remover referencias a Resend) |
| Timezone | `America/Asuncion` — definir constante global |
| Idioma código | Inglés en variables/funciones, Español en UI y mensajes |
| Error responses | Siempre `ActionResult<T>` — nunca `throw` directo al cliente |