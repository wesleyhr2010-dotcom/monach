# Design System — Módulos da App Revendedoras
> Diretrizes de UI/UX para cada módulo pré-modulado do Portal Revendedora (PWA Mobile-First).  
> Baseado no esboço de referência, Manual de Identidade Visual Monarca + filosofia **minimalista · elegante · profissional**.

---

## 0. Tokens de App (Light Mode Mobile)

O portal revendedora usa um tema **light/cream** independente do dark mode do admin.

### Cores

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--app-bg` | `#F5F2EF` | Background geral da tela |
| `--app-surface` | `#EBEBEB` | Superfície de cards e containers |
| `--app-surface-hover` | `#E0DDD9` | Card em estado pressed |
| `--app-primary` | `#35605A` | Badges ativos, CTAs, nav ativo |
| `--app-primary-text` | `#FFFFFF` | Texto sobre --app-primary |
| `--app-text` | `#1A1A1A` | Texto principal |
| `--app-text-secondary` | `#777777` | Labels, captions, placeholders |
| `--app-text-accent` | `#917961` | "Veja mais", links secundários |
| `--app-border` | `#D9D6D2` | Bordas sutis, separadores |
| `--app-nav-bg` | `#FFFFFF` | Bottom nav background |
| `--app-badge-bronze` | `#B87333` | Badge Nível Bronze |
| `--app-badge-silver` | `#B4ABA2` | Badge Nível Prata |
| `--app-badge-gold` | `#D4A800` | Badge Nível Ouro |
| `--app-badge-diamond` | `#35605A` | Badge Nível Diamante |

### Tipografia

| Papel | Fonte | Peso | Tamanho | Letter-spacing |
|-------|-------|------|---------|----------------|
| Seção title | Playfair Display | Bold (700) | 20px | -0.3px |
| Card value / G$ | Playfair Display | Bold (700) | 18–22px | -0.5px |
| Body label | Raleway | Regular (400) | 13px | 0 |
| Body medium | Raleway | Medium (500) | 14px | 0 |
| Caption / badge | Raleway | Medium (500) | 11–12px | 0.3px |
| "Veja mais" | Raleway | Regular (400) | 13px | 0 |
| Nav label | Raleway | Medium (500) | 10px | 0.2px |

### Espaçamento Base

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-screen-x` | 20px | Padding horizontal de tela |
| `--space-section-gap` | 32px | Distância entre seções |
| `--space-card-gap` | 12px | Gap entre cards no grid |
| `--space-card-pad` | 20px | Padding interno dos cards |
| `--space-card-pad-sm` | 16px | Padding interno cards pequenos |

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-card` | 16px | Cards de estatística, maleta |
| `--radius-badge` | 100px | Badges de status e rank (pill) |
| `--radius-segment` | 100px | Segmentos de progresso |
| `--radius-avatar` | 100px | Avatar circular |
| `--radius-nav` | 20px 20px 0 0 | Bottom navigation (topo arredondado) |

### Ícones

- Família: **Lucide Icons** — estilo outline
- Stroke width: **1.5px** (thin, elegant)
- Tamanho UI padrão: **32px** para cards de stat, **20px** para UI geral, **24px** para navbar
- Cor: `--app-text` (`#1A1A1A`)

---

## 1. ÁTOMO — Avatar

**Propósito:** Foto de perfil circular da revendedora.

```
┌────────────┐
│   ╭────╮   │
│   │ 👤 │   │  ← 48px × 48px, circle
│   ╰────╯   │
└────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Tamanho | 48 × 48px |
| Shape | `border-radius: 100%` |
| Border | 2px solid `--app-primary` (quando ativo/logado) |
| Fallback | Iniciais do nome, bg `--app-surface`, text `--app-text` |
| Object-fit | `cover` |

### Classes Tailwind

```tsx
<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#35605A] shrink-0">
  <Image src={avatar} alt={nome} fill className="object-cover" />
</div>
```

---

## 2. ÁTOMO — RankBadge

**Propósito:** Indicador visual do nível da revendedora (Bronze/Prata/Ouro/Diamante).

```
┌─────────────────────┐
│   Nivel Bronze  ←── pill, bg-primary, branco
└─────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Shape | Pill (`border-radius: 100px`) |
| Padding | `6px 14px` |
| Font | Raleway Medium 12px, letter-spacing 0.3px |
| Uppercase | Não — manter case original |
| Cor Bronze | bg `#B87333`, text white |
| Cor Prata | bg `#B4ABA2`, text white |
| Cor Ouro | bg `#D4A800`, text white |
| Cor Diamante | bg `#35605A`, text white |

### Classes Tailwind

```tsx
const rankColors = {
  bronze: 'bg-[#B87333]',
  prata: 'bg-[#B4ABA2]',
  ouro: 'bg-[#D4A800]',
  diamante: 'bg-[#35605A]',
}

<span className={`${rankColors[rank]} text-white text-xs font-medium px-3.5 py-1.5 rounded-full font-raleway`}>
  Nivel {rank}
</span>
```

---

## 3. ÁTOMO — PointsBubble

**Propósito:** Contador de pontos em bolha circular compacta.

```
┌──────┐
│  9   │  ← 28px circle, bg-secondary, text-dark
└──────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Tamanho | 28 × 28px (min), expande para 2 dígitos |
| Shape | Circle (`border-radius: 100%`) |
| Background | `--app-text-accent` (`#917961`) |
| Texto | Raleway Bold 11px, white |
| Min-width | 28px (para números 1–9) |

---

## 4. ÁTOMO — StatusBadge

**Propósito:** Indicador de estado de uma maleta ou item.

```
┌───────────────────┐
│   Em andamento    │  ← pill, bg-primary, branco
└───────────────────┘
```

### Variantes

| Estado | Background | Texto |
|--------|-----------|-------|
| `em-andamento` | `#35605A` | white |
| `pendente` | `#917961` | white |
| `concluida` | `#B4ABA2` | white |
| `atrasada` | `#C0392B` | white |

### Classes Tailwind

```tsx
<span className="bg-[#35605A] text-white text-xs font-medium px-3.5 py-1.5 rounded-full font-raleway">
  Em andamento
</span>
```

---

## 5. ÁTOMO — SectionTitle

**Propósito:** Título de seção com link opcional "Veja mais".

```
Analises                          Veja mais
└── Playfair Bold 20px            └── Raleway 13px, tertiary
```

### Especificações

| Elemento | Estilo |
|----------|--------|
| Título | `font-playfair font-bold text-[20px] text-[#1A1A1A]` |
| "Veja mais" | `font-raleway text-[13px] text-[#917961]` |
| Container | `flex items-center justify-between mb-4` |

### Classes Tailwind

```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="font-playfair font-bold text-[20px] text-[#1A1A1A] tracking-tight">
    {title}
  </h2>
  {href && (
    <Link href={href} className="font-raleway text-[13px] text-[#917961]">
      Veja mais
    </Link>
  )}
</div>
```

---

## 6. MOLÉCULA — ProfileBar

**Propósito:** Barra de perfil no topo do dashboard. Combina Avatar + nome + RankBadge + PointsBubble.

```
┌─────────────────────────────────────────────────┐
│  [Avatar 48px]  Olá Maria    [Nivel Bronze] [9] │
└─────────────────────────────────────────────────┘
```

### Layout

```
flex items-center gap-3
├── Avatar (48px)
├── "Olá {nome}" — Raleway SemiBold 16px, flex-1
├── RankBadge
└── PointsBubble
```

### Especificações

| Prop | Valor |
|------|-------|
| Padding | `20px` horizontal, `16px` vertical |
| Background | `--app-bg` (transparente, sem card) |
| Nome | `font-raleway font-semibold text-[16px] text-[#1A1A1A]` |
| Gap entre elementos | `12px` |

### Classes Tailwind

```tsx
<div className="flex items-center gap-3 px-5 py-4">
  <Avatar src={foto} nome={nome} />
  <span className="font-raleway font-semibold text-base text-[#1A1A1A] flex-1">
    Olá {primeiroNome}
  </span>
  <RankBadge rank={rank} />
  <PointsBubble pontos={pontos} />
</div>
```

---

## 7. MOLÉCULA — StatCard

**Propósito:** Card de estatística única com ícone, label e valor. Base da grade de análise.

```
┌─────────────────────────────┐
│                             │
│         [Ícone 32px]        │  ← centered, stroke outline
│                             │
│      Meu Faturamento        │  ← label, Raleway 13px, muted
│       G$ 1.200.000          │  ← value, Playfair Bold 20px
│                             │
└─────────────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Background | `#EBEBEB` |
| Border-radius | `16px` |
| Padding | `20px` |
| Min-height | `130px` |
| Ícone | Lucide, 32px, stroke 1.5px, `#1A1A1A` |
| Label | Raleway Regular 13px, `#777777`, mt-3 do ícone |
| Value | Playfair Display Bold 20px, `#1A1A1A`, mt-1 |
| Alinhamento | Todo `text-center`, ícone `mx-auto` |

### Variantes de Ícone por Métrica

| Métrica | Ícone Lucide |
|---------|-------------|
| Faturamento | `<Necklace />` ou SVG custom (colar) |
| Ganhos | `<Diamond />` ou SVG custom (diamante) |
| Peças Vendidas | `<CircleDot />` ou SVG custom (anel) |
| Pontos | `<Star />` (outline) |

### Classes Tailwind

```tsx
<div className="bg-[#EBEBEB] rounded-2xl p-5 flex flex-col items-center justify-center min-h-[130px]">
  <div className="w-8 h-8 text-[#1A1A1A]">
    {icon}
  </div>
  <p className="font-raleway text-[13px] text-[#777777] mt-3 text-center">
    {label}
  </p>
  <p className="font-playfair font-bold text-[20px] text-[#1A1A1A] mt-1 text-center">
    {value}
  </p>
</div>
```

---

## 8. ORGANISMO — StatsGrid

**Propósito:** Grade 2×2 de StatCards para o bloco "Análises" do dashboard.

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────┐     ┌───────────────┐        │
│  │  StatCard     │     │  StatCard     │        │
│  │  Faturamento  │     │  Ganhos       │        │
│  └───────────────┘     └───────────────┘        │
│  ┌───────────────┐     ┌───────────────┐        │
│  │  StatCard     │     │  StatCard     │        │
│  │  Peças vend.  │     │  Pontos       │        │
│  └───────────────┘     └───────────────┘        │
└─────────────────────────────────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Layout | `grid grid-cols-2` |
| Gap | `12px` |
| Padding horizontal | `20px` (herdado do container) |

### Classes Tailwind

```tsx
<div className="grid grid-cols-2 gap-3 px-5">
  <StatCard icon={<NecklaceIcon />} label="Meu Faturamento" value="G$ 1.200.000" />
  <StatCard icon={<DiamondIcon />} label="Meu Ganhos" value="G$ 100.000" />
  <StatCard icon={<RingIcon />} label="Peças vendidas" value="3" />
  <StatCard icon={<StarIcon />} label="Pontos" value="850" />
</div>
```

---

## 9. MOLÉCULA — CommissionProgress

**Propósito:** Barra de progresso segmentada representando os tiers de comissão mensais.

```
┌──────────────────────────────────────────────────┐
│  Nível de Comissão Mensal                        │
│  [20%] [25%] [30%] [35%] [40%]                  │
│   ████  ████  ████  ───   ───                    │
│  Faltam 3 G$ 800.000 para a comissão de 30%.    │
└──────────────────────────────────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Layout | `flex gap-1.5` |
| Segmento ativo | `bg-[#35605A]`, text white, Raleway Medium 11px |
| Segmento inativo | `bg-[#D9D6D2]`, text `#777777`, Raleway Medium 11px |
| Segmento shape | `rounded-full px-3 py-1.5` |
| Label abaixo | Raleway Regular 12px, `#777777`, mt-2 |
| Título | Raleway SemiBold 13px, `#1A1A1A`, mb-2 |

### Classes Tailwind

```tsx
<div>
  <p className="font-raleway font-semibold text-[13px] text-[#1A1A1A] mb-2 text-center">
    Nível de Comissão Mensal
  </p>
  <div className="flex gap-1.5 items-center">
    {tiers.map((tier) => (
      <span
        key={tier.pct}
        className={`rounded-full px-3 py-1.5 text-[11px] font-medium font-raleway ${
          tier.ativo
            ? 'bg-[#35605A] text-white'
            : 'bg-[#D9D6D2] text-[#777777]'
        }`}
      >
        {tier.pct}%
      </span>
    ))}
  </div>
  <p className="font-raleway text-[12px] text-[#777777] mt-2">
    {mensagemProgresso}
  </p>
</div>
```

---

## 10. ORGANISMO — MaletaCard

**Propósito:** Card principal da maleta ativa mostrando status, prazo e progresso de comissão.

```
┌─────────────────────────────────────────────────┐
│  Maleta Atual          [Em andamento]           │
│  Faltam 3 dias                                  │
│                                                 │
│         Nível de Comissão Mensal                │
│  [20%] [25%] [30%] [35%] [40%]                 │
│  Faltam 3 G$ 800.000 para a comissão de 30%.   │
└─────────────────────────────────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Background | `#EBEBEB` |
| Border-radius | `16px` |
| Padding | `20px` |
| Título | Playfair Display Bold 18px, `#1A1A1A` |
| Status row | `flex justify-between items-center mb-1` |
| "Faltam X dias" | Raleway Regular 13px, `#777777`, mb-4 |
| Separador interno | Nenhum — usar espaçamento generoso |

### Classes Tailwind

```tsx
<div className="bg-[#EBEBEB] rounded-2xl p-5 mx-5">
  <div className="flex items-center justify-between mb-1">
    <h3 className="font-playfair font-bold text-[18px] text-[#1A1A1A]">
      Maleta Atual
    </h3>
    <StatusBadge status={status} />
  </div>
  <p className="font-raleway text-[13px] text-[#777777] mb-4">
    Faltam {diasRestantes} dias
  </p>
  <CommissionProgress tiers={tiers} mensagem={mensagemProgresso} />
</div>
```

---

## 11. ORGANISMO — BottomNavigation

**Propósito:** Navegação principal do app em barra fixa inferior.

```
┌─────────────────────────────────────────────────┐
│  [🧭]    [⠿]     [🏷]    [👝]    [▤]           │
│  Inicio  Shop  Catálogo  Maleta  Mais           │
│  ●                                              │  ← ponto ativo
└─────────────────────────────────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Background | `#FFFFFF` |
| Border-radius topo | `20px 20px 0 0` |
| Box-shadow | `0 -2px 16px rgba(0,0,0,0.06)` |
| Height | `72px` |
| Padding bottom | `env(safe-area-inset-bottom)` (safe area iOS/Android) |
| Ícone ativo | `#35605A` |
| Ícone inativo | `#B4ABA2` |
| Label ativo | Raleway Medium 10px, `#35605A` |
| Label inativo | Raleway Medium 10px, `#B4ABA2` |
| Item layout | `flex flex-col items-center gap-1` |
| Indicador ativo | Ponto 4px círculo `#35605A` abaixo do ícone |

### Tabs

| Index | Label | Ícone Lucide | Rota |
|-------|-------|-------------|------|
| 0 | Inicio | `Compass` | `/app` |
| 1 | Shop | `LayoutGrid` | `/app/shop` |
| 2 | Catálogo | `Store` | `/app/catalogo` |
| 3 | Maleta | `ShoppingBag` | `/app/maleta` |
| 4 | Mais | `LayoutGrid` ou `MoreHorizontal` | `/app/mais` |

### Classes Tailwind

```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] shadow-[0_-2px_16px_rgba(0,0,0,0.06)] pb-safe">
  <div className="flex items-center justify-around h-[72px] px-2">
    {tabs.map((tab) => (
      <Link key={tab.href} href={tab.href}
        className="flex flex-col items-center gap-0.5 min-w-[52px]">
        <tab.Icon
          size={24}
          strokeWidth={1.5}
          className={isActive(tab.href) ? 'text-[#35605A]' : 'text-[#B4ABA2]'}
        />
        <span className={`font-raleway font-medium text-[10px] tracking-wide ${
          isActive(tab.href) ? 'text-[#35605A]' : 'text-[#B4ABA2]'
        }`}>
          {tab.label}
        </span>
        {isActive(tab.href) && (
          <span className="w-1 h-1 rounded-full bg-[#35605A] -mt-0.5" />
        )}
      </Link>
    ))}
  </div>
</nav>
```

---

## 12. TEMPLATE — DashboardLayout

**Propósito:** Layout-base que compõe todos os módulos na tela de início.

```
┌─────────────────────────────────────────────────┐  ← bg: #F5F2EF
│  [ProfileBar]                                   │  pt-safe
│                                                 │
│  [SectionTitle "Análises"  "Veja mais"]         │  px-5
│  [StatsGrid 2×2]                                │  px-5
│                                                 │
│  [SectionTitle "Minhas Maleta"  "Veja mais"]    │  px-5
│  [MaletaCard]                                   │  px-5 (interno)
│                                                 │
│  ─────────────────── espaço pb-24 ─────────────  │  ← clearance nav
└─────────────────────────────────────────────────┘
│  [BottomNavigation]                             │  fixed bottom
```

### Especificações

| Prop | Valor |
|------|-------|
| Background | `#F5F2EF` |
| Padding top | `env(safe-area-inset-top, 16px)` |
| Padding bottom | `96px` (espaço para BottomNav) |
| Overflow | `scroll-y`, scrollbar hidden (`scrollbar-hide`) |
| Seção gap | `32px` entre blocos |

### Classes Tailwind

```tsx
<main className="bg-[#F5F2EF] min-h-screen pt-safe pb-24 overflow-y-auto">
  <ProfileBar ... />
  
  <section className="mt-8 px-5">
    <SectionTitle title="Análises" href="/app/analises" />
    <StatsGrid stats={stats} />
  </section>

  <section className="mt-8">
    <div className="px-5">
      <SectionTitle title="Minhas Maleta" href="/app/maleta" />
    </div>
    <MaletaCard maleta={maletaAtiva} />
  </section>
</main>

<BottomNavigation activeHref="/app" />
```

---

## 13. MOLÉCULA — EmptyState

**Propósito:** Estado vazio elegante quando não há dados.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [Ícone 48px, opacity 30%]               │
│         Nenhuma maleta ativa                    │  ← Raleway Regular 14px
│         Solicite uma maleta ao admin            │  ← Raleway Regular 12px muted
│                                                 │
└─────────────────────────────────────────────────┘
```

### Especificações

| Prop | Valor |
|------|-------|
| Container | `bg-[#EBEBEB] rounded-2xl p-8 flex flex-col items-center` |
| Ícone | 48px, `opacity-30`, cor `--app-text` |
| Título | Raleway Regular 14px, `#1A1A1A`, mt-4 |
| Subtítulo | Raleway Regular 12px, `#777777`, mt-1 |

---

## 14. MOLÉCULA — SkeletonCard

**Propósito:** Loading state animado para StatCards durante fetch.

### Especificações

| Prop | Valor |
|------|-------|
| Background | `#EBEBEB` com shimmer animado |
| Animation | `animate-pulse` (Tailwind built-in) |
| Shape | Espelha exatamente o StatCard (`rounded-2xl`, `min-h-[130px]`) |

```tsx
<div className="bg-[#EBEBEB] rounded-2xl p-5 min-h-[130px] animate-pulse">
  <div className="w-8 h-8 rounded-full bg-[#D9D6D2] mx-auto" />
  <div className="h-3 bg-[#D9D6D2] rounded-full mx-auto w-3/4 mt-4" />
  <div className="h-5 bg-[#D9D6D2] rounded-full mx-auto w-1/2 mt-2" />
</div>
```

---

## 15. ÁTOMO — Divider

**Propósito:** Separador visual sutil entre seções.

```css
/* Horizontal */
.divider-app {
  height: 1px;
  background: var(--app-border);  /* #D9D6D2 */
  margin: 0 20px;
}
```

---

## Regras de Composição

### O que NUNCA fazer

| ❌ Proibido | ✅ Correto |
|------------|-----------|
| Sombras pesadas / drop-shadow | Usar apenas `box-shadow` sutil (`0 -2px 16px rgba(0,0,0,0.06)`) |
| Border em cards | Sem border — usar contraste de background |
| Gradientes em cards | Cards usam cor sólida `#EBEBEB` |
| Textos coloridos em valores G$ | Sempre `#1A1A1A`, valores em Playfair Bold |
| Ícones filled/solid | Sempre outline, stroke 1.5px |
| Múltiplas fontes além de Playfair + Raleway | Apenas as duas fontes institucionais |
| Cantos vivos (radius 0) | Mínimo `radius: 12px` em qualquer card/container |

### Hierarquia visual por importância

1. **G$ Valores monetários** — Playfair Bold, maior tamanho
2. **Títulos de seção** — Playfair Bold, tamanho médio
3. **Status badges** — Cor primary, pill
4. **Labels descritivos** — Raleway Regular, muted
5. **Links "Veja mais"** — Raleway Regular, tertiary brown

### Motion & Microinterações

| Elemento | Interação | Animação |
|----------|-----------|----------|
| StatCard | Tap | `scale(0.97)` + `opacity: 0.9`, 150ms ease |
| BottomNav item | Tap | Cor transition 200ms ease |
| Badge | Aparição | Fade-in 300ms |
| Skeleton → Conteúdo | Load | Fade-in 400ms ease-out |

---

## Checklist de Conformidade por Tela

Antes de marcar qualquer tela como concluída, verificar:

- [ ] Background usa `#F5F2EF` (não branco puro)
- [ ] Cards usam `#EBEBEB` (não cinza neutro)
- [ ] Tipografia segue hierarquia: Playfair para valores/títulos, Raleway para UI
- [ ] Ícones Lucide outline com stroke 1.5px
- [ ] Todos os pills/badges usam `border-radius: 100px`
- [ ] Espaçamento mínimo horizontal de 20px preservado
- [ ] BottomNav tem safe-area padding (iOS/Android)
- [ ] Estados skeleton implementados para dados assíncronos
- [ ] Cores primary `#35605A` usadas apenas em elementos ativos e CTAs
- [ ] Acessibilidade: contrast ratio mínimo 4.5:1 para texto sobre background

---

*— Uma, desenhando com empatia 💝*  
*Módulos definidos em: 2026-04-16 | Baseado no esboço de referência Monarca App*
