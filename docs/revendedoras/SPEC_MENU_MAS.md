# SPEC — Menu "Más" da Revendedora (`/app/mais`)

## Objetivo
Oferecer à revendedora um hub de navegação com acesso rápido às áreas secundárias do PWA (perfil, atividade, suporte) e ao logout, acionado pela aba **Más** do bottom nav. Substitui o uso direto de `/app/perfil` como entrada geral de configurações, mantendo `/app/perfil*` apenas como telas de detalhe.

## Atores
- **Revendedora** — única persona com acesso a `/app/*`. Usa o menu para navegar até cada área secundária.

## Fluxo
1. Revendedora toca em **Más** no `AppBottomNav` → navega para `/app/mais`.
2. Server Component carrega dados leves exibidos no header (nada pesado — esta tela é só navegação; métricas pertencem às telas de destino).
3. Renderiza cabeçalho, 3 grupos de itens ("Mi Cuenta", "Actividad", "Soporte") e botão de logout.
4. Toque em cada item navega para a rota-alvo (ver tabela em §Detalhes).
5. Toque em **Cerrar Sesión** dispara Server Action `signOut()` (Supabase + `OneSignal.logout()`) e redireciona para `/app/login`.

## Regras de negócio
- **Sem duplicação de dados:** esta tela não repete métricas — apenas navega.
- **`Soporte WhatsApp`** abre WhatsApp da consultora da revendedora (fallback: WhatsApp institucional). Lógica em `SPEC_PERFIL.md` §`/app/perfil/soporte`.
- **`¿Cómo funciona?`** abre tela de onboarding em modo revisão (`/app/bienvenida?modo=review`) — reaproveita componentes do onboarding existente.
- **Logout** deve sempre chamar `OneSignal.logout()` antes do `supabase.auth.signOut()` para evitar vazamento de `external_id` entre sessões (ver `SPEC_PERFIL.md` Edge cases).
- **Ícone de configurações (gear) no header** abre `/app/mais/ajustes` — reservado para preferências transversais (idioma, tema, versão). Se a rota não for implementada já nesta entrega, o ícone fica oculto — não deixar botão morto.
- **Estado ativo do bottom nav:** a aba **Más** deve ficar ativa quando `pathname` começar com `/app/mais` **ou** `/app/perfil` (pois perfil é subárea de "Mi Cuenta"). Atualizar `AppBottomNav` para considerar esse conjunto.

## Edge cases
- **Revendedora sem consultora vinculada** → "Soporte WhatsApp" cai no número institucional com mensagem fallback.
- **Documentos pendentes** → badge "•" (dot) no item "Mis Documentos" quando `ResellerDocumento.status = 'pendente'` existir (tag visual discreta, sem número).
- **Notificações não vistas** → badge "•" em "Notificaciones" se houver registros não lidos (futuro — depende do histórico persistente de notificações ainda pendente em `next_steps.md`).
- **Offline** → itens clicáveis mantêm navegação; chamadas de servidor ficam a cargo da tela de destino. Logout offline exibe toast "Sin conexión, intenta de nuevo".

## Dependências
- `SPEC_PERFIL.md` — destinos de "Mi Cuenta" (`/app/perfil`, `/app/perfil/documentos`).
- `SPEC_NOTIFICACOES.md` — destino de "Notificaciones" (`/app/perfil/notificaciones`).
- `SPEC_DESEMPENHO.md` — destino de "Mi Desempeño" (`/app/desempeno`).
- `SPEC_PROGRESSO.md` — destino de "Programa de Puntos" (`/app/progreso`).
- `SPEC_VITRINE_PUBLICA.md` — destino de "Mi Vitrina Pública" (`/vitrina/[slug]` — abrir em nova aba).
- `SPEC_ONBOARDING_REVENDEDORA.md` — reaproveitamento de `/app/bienvenida?modo=review` para "¿Cómo funciona?".
- `SPEC_DESIGN_MODULES.md` — átomos/moléculas do PWA. Esta tela **reaproveita** componentes existentes e adiciona duas moléculas novas (ver §Componentes).

---

## Detalhes técnicos / Referência

### Rota
- `/app/mais` (Server Component + Client Component para interações de logout/toast).

### Mapa de destinos

| Grupo | Item | Rota / Ação | Ícone (lucide-react) |
|---|---|---|---|
| Mi Cuenta | Editar Perfil | `/app/perfil` | `UserCog` |
| Mi Cuenta | Notificaciones | `/app/perfil/notificaciones` | `Bell` |
| Mi Cuenta | Mis Documentos | `/app/perfil/documentos` | `FileText` |
| Actividad | Mi Desempeño | `/app/desempeno` | `BarChart3` |
| Actividad | Programa de Puntos | `/app/progreso` | `Trophy` |
| Actividad | Mi Vitrina Pública | `/vitrina/[slug]` (abrir em nova aba) | `Share2` |
| Soporte | Soporte WhatsApp | `https://wa.me/...` (consultora/institucional) | `MessageCircle` |
| Soporte | ¿Cómo funciona? | `/app/bienvenida?modo=review` | `BookOpen` |
| — | Cerrar Sesión | Server Action `signOut()` | `LogOut` |

### Layout (referência Paper)
Arquivo: `monarca` / Page 1 / artboard **Menu** (`1G-0`).
Tela mobile 390×877, fundo `#F5F2EF`.

**Header** (`1H-0`, `pt-6 pb-4 px-5`):
- Botão voltar (seta esquerda, 24px, `#1A1A1A`) + título `MÁS OPCIONES` (Raleway Bold 14px, tracking 0.5px, uppercase).
- Botão de configurações: círculo 36px `bg-[#EBEBEB]` com ícone `Settings` 18px.

**Conteúdo** (`1N-0`, `flex flex-col` com gap entre grupos):

Cada **grupo** (`Frame 350×~220`) tem:
- Label pequena uppercase Raleway Bold 11px / letter-spacing 1px / cor `#B4ABA2` / `px-1`.
- Card branco `rounded-2xl border border-[#EBEBEB] overflow-clip`, com itens empilhados.

Cada **item** (`h-16`, `py-3.75 px-4`):
- Esquerda: wrapper `w-[34px] h-[34px] rounded-[10px] bg-[#F5F2EF]` com ícone 16px `stroke-[#35605A]`; label Raleway SemiBold 14px / cor `#1A1A1A`; gap 14px.
- Divisor inferior `border-b-[#F5F2EF]` em todos menos o último.
- Direita: chevron 16px `stroke-[#B4ABA2]`.

**Variante "Soporte WhatsApp"** (item de destaque):
- Wrapper do ícone `bg-[#E8F5E9]`, stroke `#1F7A4A`; label Raleway **Bold** cor `#1F7A4A`.

**Botão Cerrar Sesión** (`5F-0`, logo após o último grupo):
- `mt-1 rounded-2xl py-3.75 px-5 flex items-center justify-center gap-2.5`.
- `bg-[#FFF5F5]` + `border border-[#FFCDD2]`.
- Ícone `LogOut` 18px `stroke-[#D32F2F]`; texto Raleway Bold 15px `#D32F2F` "Cerrar Sesión".

**Bottom nav** (`5L-0`): já implementado em `AppBottomNav.tsx` — reusar (com ajuste de estado ativo descrito em §Regras).

### Componentes (reaproveitar + criar)

**Reaproveitar (existentes em `src/components/app/`):**
- `AppPageShell` — container + bottom nav.
- `AppBottomNav` — já aponta para `/app/mais`; ajustar regra de `active`.

**Criar (moléculas novas, uso reutilizável):**
- `MenuSectionCard` — card branco com label + lista de `MenuRow`.
  - Props: `label: string`, `children: ReactNode`.
- `MenuRow` — linha clicável com ícone à esquerda, texto, chevron.
  - Props: `icon: LucideIcon`, `label: string`, `href?: string`, `onClick?: () => void`, `variant?: 'default' | 'accent-green'`, `external?: boolean`, `dot?: boolean` (badge de pendência).
- `MenuHeader` — cabeçalho com back, título uppercase e botão de ação à direita.
  - Props: `title: string`, `onBack?: () => void`, `rightIcon?: LucideIcon`, `onRightClick?: () => void`.
- `LogoutButton` — botão destacado de logout (client component) que chama a Server Action e dispara `OneSignal.logout()`.

Esses componentes devem ser genéricos o suficiente para serem reaproveitados em outras telas de lista (ex.: submenus em `/app/perfil`, telas de configurações futuras). **Não criar componentes hard-coded para esta tela** — sempre extrair as partes reutilizáveis.

### Tokens

| Token | Valor | Uso |
|---|---|---|
| `--app-bg` | `#F5F2EF` | Fundo da tela |
| `--app-card-bg` | `#FFFFFF` | Card branco |
| `--app-card-border` | `#EBEBEB` | Borda externa do card |
| `--app-divider` | `#F5F2EF` | Divisor entre linhas |
| `--app-icon-bg` | `#F5F2EF` | Wrapper do ícone |
| `--app-primary` | `#35605A` | Ícone padrão, estado ativo |
| `--app-text` | `#1A1A1A` | Texto primário |
| `--app-muted` | `#B4ABA2` | Label de grupo, chevron |
| `--app-accent-green-bg` | `#E8F5E9` | Variante WhatsApp (fundo ícone) |
| `--app-accent-green` | `#1F7A4A` | Variante WhatsApp (stroke + texto) |
| `--app-danger-bg` | `#FFF5F5` | Botão Cerrar Sesión (fundo) |
| `--app-danger-border` | `#FFCDD2` | Botão Cerrar Sesión (borda) |
| `--app-danger` | `#D32F2F` | Botão Cerrar Sesión (texto + ícone) |

Se algum desses tokens ainda não existir em `design-system/tokens.md`, **adicioná-los na mesma PR** antes de usar hex hard-coded nos componentes.

### Server Actions
- `signOut()` em `src/app/app/actions-revendedora.ts` (se ainda não existir) — chama `supabase.auth.signOut()`, revalida e redireciona para `/app/login`.
- Nenhuma outra Server Action é necessária nesta tela: os destinos carregam os próprios dados.

### Acessibilidade
- Cada `MenuRow` deve ser um `<Link>` ou `<button>` com `aria-label` descritivo (ex.: "Editar perfil, abre tela de dados pessoais").
- Área de toque mínima 44×44 garantida pelo `py-3.75` + altura ≥65px.
- Contraste: textos pretos (`#1A1A1A` sobre `#FFFFFF`) — aprovado. Label de grupo (`#B4ABA2`) deve ser tamanho ≥11px (já é 11px).

### Testes
- Unit: render do hub com 3 grupos, 8 itens e botão de logout.
- Unit: `LogoutButton` chama `OneSignal.logout()` antes do `signOut()`.
- Integration: clique em "Mi Vitrina Pública" abre nova aba com `/vitrina/[slug]`.
- E2E (Playwright, futuro): revendedora loga → toca Más → navega para Editar Perfil → volta → faz logout.
