# SPEC — Transições entre Telas (PWA Revendedora)

## Objetivo

Dar ao PWA da revendedora (`/app/*`) sensação de aplicação nativa por meio de transições de tela coerentes, rápidas e previsíveis. Adotar a **View Transitions API** (suportada nativamente por Chrome/Edge/Safari 18+) via `unstable_ViewTransition` do React 19 e Next 16, com **fallback gracioso** (navegação sem animação) onde não há suporte. A SPEC define quais padrões existem, quando aplicar cada um, os tokens de movimento e o plano de implementação faseado.

Escopo: **apenas `/app/*`**. Admin (`/admin/*`) e site público / vitrina (`/`, `/vitrina/[slug]`) ficam fora — admin é desktop e site público é SEO-first.

## Atores

- **Revendedora** — única persona afetada. Vê as transições no PWA mobile-first.
- **Sistema** — aplica a transição no roteamento Next, respeita `prefers-reduced-motion`, e cai para navegação normal quando o browser não suporta.

## Fluxo

A SPEC classifica toda navegação em `/app/*` em **5 padrões**, escolhidos pela relação semântica entre origem e destino. A escolha do padrão é determinística pelo par `(origem, destino)` — ver tabela em §Detalhes técnicos.

| # | Padrão | Significado | Direção visual |
|---|---|---|---|
| 1 | **Push horizontal** | Drill-down hierárquico (entrar em um nível mais profundo) | Tela nova entra da direita, atual sai para esquerda |
| 2 | **Pop horizontal** | Voltar para o nível anterior | Tela atual sai para a direita, anterior volta da esquerda |
| 3 | **Modal sheet** | Fluxo contextual que termina e volta ao mesmo lugar (ex.: registrar venda) | Sobe de baixo com handle visual, desce ao concluir/cancelar |
| 4 | **Crossfade** | Troca lateral entre abas de mesmo nível do bottom nav | Cross-fade rápido (sem deslocamento) |
| 5 | **Shared element (hero)** | Mesmo objeto continua entre rotas (card → tela de detalhe) | Imagem/card "voa" da posição A para a posição B |

Comportamento global:
1. Click/touch em `<Link>` ou `router.push()` dispara `startViewTransition()` (ou `unstable_ViewTransition` no React).
2. Estilos definidos por nome (`view-transition-name`) animam pseudo-elementos `::view-transition-*`.
3. Em browsers sem suporte, a navegação acontece sem animação — sem regressão funcional.
4. Em `prefers-reduced-motion: reduce`, todas as transições viram crossfade simples ≤ 100ms.

## Regras de negócio

1. **A SPEC manda no padrão, não o desenvolvedor.** A tabela em §Detalhes técnicos é normativa: novas rotas precisam ser classificadas antes de virar PR.
2. **Nada de animação supérflua.** Loading spinners, toasts, abrir/fechar de menus internos **não** usam View Transitions — só navegação entre rotas usa.
3. **Reduced motion é lei.** `@media (prefers-reduced-motion: reduce)` desativa slide e shared element; mantém crossfade ≤ 100ms ou navegação sem animação.
4. **Sem custo em Server Components.** O wrapper `<AppTransition>` é um Client Component fino; rotas continuam Server Components.
5. **Feature flag de produção.** `NEXT_PUBLIC_VIEW_TRANSITIONS` (`on` | `off`, default `on`). Se desligada, todas as transições viram navegação normal — para resposta rápida em incidente sem precisar de deploy.
6. **Duração teto:** nenhuma transição passa de **400ms**. Push/pop padrão: 280ms. Crossfade: 180ms. Modal sheet: 320ms. Shared element: 360ms.
7. **Easing iOS-like:** `cubic-bezier(0.32, 0.72, 0, 1)` para push/pop e modal sheet. Material-emphasized `cubic-bezier(0.2, 0, 0, 1)` para shared element.
8. **Token-first:** durations e easings ficam em `design-system/tokens.md` e em CSS variables `--motion-*`. Zero valores mágicos no JSX/CSS.
9. **Bottom nav nunca anima junto.** O `AppBottomNav` é marcado `view-transition-name: bottom-nav` para permanecer estável entre rotas (não pisca, não desliza).
10. **Header de página acompanha o conteúdo.** O `AppPageHeader` participa da transição da rota (sem `view-transition-name` dedicado), exceto em crossfade entre abas onde permanece estático.
11. **Modal sheet é uma rota real**, não um `<Dialog>` overlay. Mantém URL compartilhável e back nativo do browser/iOS.
12. **Shared element exige nomes únicos por instância.** O nome é construído como `product-${id}` ou `maleta-${id}`. Nomes duplicados quebram a transição.
13. **Nunca aplicar `view-transition-name` em listas inteiras** — apenas no item específico que persiste entre rotas, para evitar custo de composição.

## Edge cases

- **Browser sem suporte (Firefox atual, iOS < 18):** `startViewTransition` cai para o fallback síncrono — a navegação acontece sem animação. Nenhum erro, nenhum toast.
- **`prefers-reduced-motion: reduce`:** o wrapper detecta e troca `--motion-duration-base` por `0ms` em CSS; mantém um crossfade ≤ 100ms para preservar continuidade visual.
- **Navegação via push notification** (OneSignal abre rota destino direto): primeira renderização **não anima** — não há tela anterior. Próximas navegações animam normalmente.
- **Navegação durante carregamento** (clique enquanto a rota anterior ainda está streaming): cancelar transição em andamento; aplicar a nova. Não enfileirar.
- **PWA standalone iOS:** swipe-back nativo do Safari **não funciona** em standalone — confiar no botão voltar do header de cada página. Implementação custom de swipe-back fica para a fase Capacitor (ver `SPEC_CAPACITOR_MIGRATION.md`).
- **PWA Android Chrome standalone:** botão back do sistema dispara `popstate` → o wrapper detecta direção e aplica **pop** (ao invés de push).
- **Hard refresh / deep link:** chega na rota direta, sem animação de entrada. Esperado.
- **Logout:** transição simples de fade — não usar push/pop (não é hierarquia, é troca de contexto).
- **Onboarding multi-step (`/app/bienvenida`):** transições entre passos são internas ao componente (não entre rotas) — fora do escopo desta SPEC.
- **Rotação de tela / resize durante transição:** cancelar transição ativa; finalizar sem animação.
- **Galeria nativa do iOS aberta sobre o PWA** (devolução com câmera): ao voltar, browser dispara `pageshow` — pular animação de entrada.
- **Conflito entre `view-transition-name` repetido** (ex.: dois cards com mesmo `product-${id}` na mesma DOM): warning em DEV; em produção a API ignora a transição. Garantir unicidade no `key` do React resolve.
- **Frames perdidos em dispositivo lento:** se a transição ficar abaixo de 30fps, descontinuar visualmente é aceitável — não bloqueia funcionalidade. Telemetria opcional via `performance.measure`.

## Dependências

- [`SPEC_DESIGN_MODULES.md`](./SPEC_DESIGN_MODULES.md) — átomos/moléculas do PWA. Esta SPEC adiciona um wrapper transversal (`AppTransition`) e nomes de transição em moléculas existentes (cards de maleta, produto e item de notificação).
- [`SPEC_FRONTEND.md`](./SPEC_FRONTEND.md) — uso de `unstable_ViewTransition` de `react` e roteador do Next 16 (App Router).
- [`design-system/tokens.md`](../design-system/tokens.md) — adicionar tokens `--motion-*` antes de implementar.
- [`SPEC_CACHING_STRATEGY.md`](./SPEC_CACHING_STRATEGY.md) — transições não devem entrar em conflito com `revalidatePath/Tag`; a transição é puramente client-side.
- [`SPEC_CAPACITOR_MIGRATION.md`](./SPEC_CAPACITOR_MIGRATION.md) — swipe-back nativo e push/pop com gesto vivem nessa fase futura. Esta SPEC já entrega a base.
- [`SPEC_OFFLINE_SYNC.md`](./SPEC_OFFLINE_SYNC.md) — transições não dependem de rede; quando offline, a navegação local segue animando normalmente.
- [`SPEC_NOTIFICACOES.md`](../revendedoras/SPEC_NOTIFICACOES.md), [`SPEC_MALETA.md`](../revendedoras/SPEC_MALETA.md), [`SPEC_CATALOGO.md`](../revendedoras/SPEC_CATALOGO.md), [`SPEC_PERFIL.md`](../revendedoras/SPEC_PERFIL.md), [`SPEC_PROGRESSO.md`](../revendedoras/SPEC_PROGRESSO.md), [`SPEC_DEVOLUCAO.md`](../revendedoras/SPEC_DEVOLUCAO.md), [`SPEC_MENU_MAS.md`](../revendedoras/SPEC_MENU_MAS.md) — rotas-alvo classificadas na tabela abaixo.

---

## Detalhes técnicos / Referência

### 1. Mapa de rotas → padrão de transição

A tabela é **normativa**: cada par origem → destino tem um único padrão. Linhas marcadas como `(qualquer)` aceitam qualquer origem.

#### 1.1 Tabs do bottom nav (entre si) — Padrão **Crossfade**

| Origem | Destino |
|---|---|
| `/app` | `/app/maleta` |
| `/app` | `/app/catalogo` |
| `/app` | `/app/mais` |
| `/app/maleta` | `/app/catalogo` |
| `/app/maleta` | `/app/mais` |
| `/app/maleta` | `/app` |
| `/app/catalogo` | `/app/maleta` |
| `/app/catalogo` | `/app/mais` |
| `/app/catalogo` | `/app` |
| `/app/mais` | `/app` |
| `/app/mais` | `/app/maleta` |
| `/app/mais` | `/app/catalogo` |

> **Regra:** qualquer navegação **entre raízes do bottom nav** usa crossfade.

#### 1.2 Drill-down hierárquico — Padrão **Push horizontal** (ida) e **Pop horizontal** (volta)

| Origem | Destino | Padrão (ida) |
|---|---|---|
| `/app/maleta` | `/app/maleta/[id]` | Push (com **shared element** no card → ver §1.5) |
| `/app/maleta/[id]` | `/app/maleta` | Pop |
| `/app/notificaciones` | `/app/maleta/[id]` (CTA da notificação) | Push |
| `/app/mais` | `/app/perfil` | Push |
| `/app/mais` | `/app/notificaciones` | Push |
| `/app/perfil` | `/app/perfil/datos` | Push |
| `/app/perfil` | `/app/perfil/bancario` | Push |
| `/app/perfil` | `/app/perfil/documentos` | Push |
| `/app/perfil` | `/app/perfil/notificaciones` | Push |
| `/app` | `/app/notificaciones` (sino do header) | Push |
| `/app` | `/app/progreso` | Push |
| `/app/progreso` | `/app/progreso/extracto` | Push |
| `/app/progreso` | `/app/progreso/regalos` | Push |
| `/app/mais` | `/app/progreso` | Push |
| `/app/mais` | `/app/desempeno` (futuro) | Push |

> **Detecção de pop:** o wrapper escuta `popstate` (botão voltar do navegador/Android). O botão voltar do header (componente da página) chama `router.back()` que também aciona `popstate`.

#### 1.3 Fluxos modais — Padrão **Modal sheet**

Rotas que abrem como ação contextual sobre uma rota "âncora" e devolvem o usuário para a mesma âncora ao concluir/cancelar.

| Origem (âncora) | Destino (modal sheet) |
|---|---|
| `/app/maleta/[id]` | `/app/maleta/[id]/registrar-venta` |
| `/app/maleta/[id]` | `/app/maleta/[id]/devolver` |
| `/app/catalogo` | `/app/catalogo/compartir` |

> **Apresentação:** sobe de baixo, com handle 36×4px no topo, fundo da âncora visível com leve dim (`rgba(0,0,0,0.16)`). Header da rota modal usa botão **Cerrar** (X) à esquerda em vez de seta voltar.

#### 1.4 Auth e onboarding — **Sem transição**

| Rota | Razão |
|---|---|
| `/app/login` | Tela inicial, sem origem dentro de `/app`. |
| `/app/login/recuperar-contrasena` | Mesma família de auth. |
| `/app/nueva-contrasena` | Idem. |
| `/app/bienvenida` (todos os passos) | Onboarding controla transições internas próprias. |

> Estas rotas não recebem `view-transition-name` e não disparam `startViewTransition`.

#### 1.5 Shared element (hero) — quando o objeto persiste

Aplicar `view-transition-name` único nos elementos abaixo, em ambos os lados da navegação:

| Objeto | Origem (item) | Destino (hero) | `view-transition-name` |
|---|---|---|---|
| Card de maleta | `/app/maleta` (item da lista) | `/app/maleta/[id]` (header da maleta) | `maleta-${id}` |
| Card de produto | `/app/catalogo` (grid) | `/app/maleta/[id]` quando vier do contexto da maleta — futuro | `product-${maletaId}-${itemId}` |

Entradas adicionais surgem com novas telas (ex.: detalhe de produto no PWA, hoje só existente no site público) e devem ser registradas aqui antes de implementar.

### 2. Tokens de movimento

Adicionar em `docs/design-system/tokens.md` e em CSS variables (raiz `:root` ou container `/app`).

| Token | Valor | Uso |
|---|---|---|
| `--motion-duration-fast` | `180ms` | Crossfade entre tabs; fade de logout. |
| `--motion-duration-base` | `280ms` | Push / pop horizontal padrão. |
| `--motion-duration-modal` | `320ms` | Modal sheet (subir/descer). |
| `--motion-duration-hero` | `360ms` | Shared element. |
| `--motion-duration-reduced` | `100ms` | Crossfade quando `prefers-reduced-motion: reduce`. |
| `--motion-ease-standard` | `cubic-bezier(0.32, 0.72, 0, 1)` | Push/pop, modal sheet (curva iOS-like). |
| `--motion-ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Shared element, ênfase. |
| `--motion-ease-linear` | `linear` | Crossfade puro. |
| `--motion-sheet-dim` | `rgba(0, 0, 0, 0.16)` | Fundo dim atrás do modal sheet. |
| `--motion-sheet-handle-bg` | `var(--app-divider)` | Handle do modal sheet. |

### 3. Wrapper interno e API

#### 3.1 `AppTransition` (Client Component)

Arquivo: `src/components/app/transitions/AppTransition.tsx`.

Responsabilidades:
1. Detectar suporte a View Transitions (`document.startViewTransition`).
2. Detectar `prefers-reduced-motion`.
3. Detectar feature flag `NEXT_PUBLIC_VIEW_TRANSITIONS`.
4. Detectar direção (push vs pop) via comparação de pathname + `popstate`.
5. Renderizar `<unstable_ViewTransition name="...">` (React 19) ao redor do conteúdo da rota, com `name` definido pelo padrão classificado.
6. Aplicar classe no `<html>` (`vt-push` | `vt-pop` | `vt-crossfade` | `vt-modal` | `vt-hero`) para que o CSS saiba qual variante aplicar nos pseudo-elementos `::view-transition-old/new(*)`.

API:

```tsx
<AppTransition pattern="push" name="page">
  {children}
</AppTransition>
```

Props:
- `pattern: 'push' | 'pop' | 'crossfade' | 'modal' | 'hero'` — define o conjunto de keyframes.
- `name?: string` — `view-transition-name` específico (default: `page`).
- `disabled?: boolean` — bypass total (rotas de auth/onboarding).

> **Onde aplicar:** no `layout.tsx` da rota correspondente, ou em `(group)/layout.tsx` quando um grupo de rotas compartilhar o mesmo padrão.

#### 3.2 Roteador — `useTransitionRouter`

Hook helper opcional em `src/components/app/transitions/useTransitionRouter.ts` para casos onde o desenvolvedor precisa decidir o padrão programaticamente (ex.: redirect após Server Action). Wrapper sobre `useRouter()` que classifica a navegação antes do `push`.

```ts
const router = useTransitionRouter();
router.pushSheet('/app/maleta/123/registrar-venta');
router.pushHero('/app/maleta/123', { name: 'maleta-123' });
```

### 4. Implementação por padrão (CSS de referência)

> Os keyframes são aplicados nos pseudo-elementos `::view-transition-old(name)` e `::view-transition-new(name)`. Cada padrão tem sua folha CSS dedicada em `src/components/app/transitions/styles/`.

#### 4.1 Push horizontal

```css
html.vt-push::view-transition-old(page) {
  animation: vt-slide-out-left var(--motion-duration-base) var(--motion-ease-standard) both;
}
html.vt-push::view-transition-new(page) {
  animation: vt-slide-in-right var(--motion-duration-base) var(--motion-ease-standard) both;
}
```

#### 4.2 Pop horizontal

Inverte a direção — old sai para a direita, new entra da esquerda.

#### 4.3 Crossfade

```css
html.vt-crossfade::view-transition-old(page),
html.vt-crossfade::view-transition-new(page) {
  animation-duration: var(--motion-duration-fast);
  animation-timing-function: var(--motion-ease-linear);
}
```

#### 4.4 Modal sheet

`new` sobe de `translateY(100%)` para `0`. `old` permanece estático com leve overlay (`view-transition-name: page` mantém posição; um pseudo-elemento adicional aplica o dim).

#### 4.5 Shared element

Apenas o elemento com nome dedicado anima — o resto da página faz crossfade leve (`page` com duração reduzida).

### 5. Acessibilidade

- **`prefers-reduced-motion: reduce`** detectado por `matchMedia` no wrapper. Quando `true`, todas as durações caem para `--motion-duration-reduced` e os keyframes de slide são substituídos por crossfade.
- **Foco:** após transição, o foco vai para o `<h1>` da nova rota (ou primeiro elemento focável). Implementar via `useEffect` que dispara `element.focus({ preventScroll: true })` em cada layout de rota.
- **`aria-live`:** anúncios importantes (toasts, erros) vivem fora do view transition tree para não serem cortados por `contain: paint`.
- **Contraste do dim do modal sheet:** `rgba(0,0,0,0.16)` foi escolhido para preservar legibilidade do conteúdo subjacente sem prejudicar contraste WCAG AA dos textos no sheet.

### 6. Feature flag e rollout

Variável `NEXT_PUBLIC_VIEW_TRANSITIONS`:

| Valor | Comportamento |
|---|---|
| `on` (default) | Wrapper aplica transições onde suportado. |
| `off` | Wrapper renderiza filhos diretos sem `unstable_ViewTransition`. |

Adicionar em `SPEC_ENVIRONMENT_VARIABLES.md` na mesma PR.

### 7. Plano de implementação faseado

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **F1 — Fundação** | Tokens em `tokens.md`; wrapper `AppTransition`; classes globais `vt-*`; feature flag. | App roda sem regressão com flag `off`; com flag `on` push/pop padrão funciona em `/app/maleta` ↔ `/app/maleta/[id]`. |
| **F2 — Crossfade entre tabs** | `AppBottomNav` com `view-transition-name: bottom-nav`; layout do `/app/(tabs)/layout.tsx` aplica `pattern="crossfade"`. | Trocar tabs não desloca o nav; conteúdo faz crossfade em ≤ 180ms. |
| **F3 — Modal sheet** | Layouts dedicados em `/app/maleta/[id]/registrar-venta/layout.tsx`, `…/devolver/layout.tsx`, `/app/catalogo/compartir/layout.tsx` com `pattern="modal"`. Header da rota modal exibe X (Cerrar). | Sheet sobe de baixo, fecha descendo; URL preservada; back nativo fecha o sheet. |
| **F4 — Shared element** | `view-transition-name: maleta-${id}` no card e no header da maleta. | Card da lista "voa" para o header do detalhe e vice-versa, sem clipping visual. |
| **F5 — Polimento e métricas** | Telemetria opcional (`performance.measure` em DEV); QA cross-browser; checklist de QA por padrão. | Documento de QA preenchido; 0 regressões funcionais; durations conferidas em iPhone, Android Chrome e PWA standalone. |

### 8. Telemetria (opcional, dev/preview only)

`performance.mark('vt:start')` no início do callback de `startViewTransition`; `performance.measure('vt', 'vt:start')` no `finished.then`. Logado no console apenas quando `NODE_ENV !== 'production'`. Permite detectar transições acima do orçamento de duração sem custo em produção.

### 9. Checklist de QA por entrega

Para cada PR que toca rotas listadas em §1:

- [ ] Padrão classificado conforme tabela §1.
- [ ] `view-transition-name` único quando há shared element.
- [ ] Tokens `--motion-*` usados (zero `ms`/`cubic-bezier()` hard-coded no JSX/CSS).
- [ ] Testado em Chrome desktop, Safari iOS 18+, Firefox (fallback) e Android Chrome.
- [ ] `prefers-reduced-motion: reduce` testado (DevTools → Rendering → Emulate CSS media).
- [ ] PWA standalone (Adicionar à tela inicial) testado em pelo menos um dispositivo iOS.
- [ ] Foco vai para `<h1>` ou elemento equivalente após transição.
- [ ] Nenhum elemento sticky pisca durante a transição (verificar com DevTools throttling 4× CPU).

### 10. Testes

- **Unit (Vitest):** wrapper `AppTransition` aplica classe correta em `<html>` para cada `pattern`; respeita `disabled` e flag `off`.
- **Unit:** `useTransitionRouter` chama `router.push` com classificação correta (push vs sheet vs hero).
- **Integration (Vitest + JSDOM):** mock de `document.startViewTransition` confirma que é chamado apenas quando suportado e flag `on`.
- **E2E (Playwright, F5):** golden path
  - login → home → toca maleta (crossfade) → toca card de maleta (push + hero) → toca "Registrar venta" (sheet) → fecha (sheet down) → volta (pop).
- **E2E reduced motion:** mesma jornada com `prefersReducedMotion: 'reduce'` no contexto do Playwright; validar que durações são curtas e não há slide.

### 11. Não-objetivos (fora do escopo)

- Animações **dentro** de uma mesma rota (toggle de menu, abrir/fechar modal de seleção interna). Vivem na molécula correspondente, com CSS local.
- Gestos de swipe-back custom — fora do escopo até a fase Capacitor.
- Paralax, blur dinâmico, transições 3D — não há orçamento de performance no PWA mobile-first em 4G paraguaio para isso.
- Admin (`/admin/*`) e site público — explicitamente excluídos. Transições nesses contextos exigiriam SPEC própria.
