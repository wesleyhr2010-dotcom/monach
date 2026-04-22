# Design System — Monarca Semijoyas
> Baseado no **Manual de Identidad Visual Monarca** (Febrero 2021) + extensões do projeto digital.

## Documentos Relacionados

| Doc | Escopo |
|-----|--------|
| `DESIGN_SYSTEM.md` (este arquivo) | Identidade de marca, cores, tipografia, logo, layout web |
| [`SPEC_DESIGN_MODULES.md`](./app_revendedoras/SPEC_DESIGN_MODULES.md) | **Módulos pré-modulados do App Revendedoras** — tokens mobile, átomos, moléculas, organismos, templates |

---

## 1. Identidade de Marca

### Missão e Valores
Monarca Semijoyas existe para **inspirar mulheres a serem livres** através de semijoias exclusivas e de alta qualidade.

| Valor | Descrição |
|-------|-----------|
| **Transformadora** | O nome vem da Borboleta Monarca — cada mulher que usa um produto se sente transformada, poderosa e livre |
| **Sofisticada** | Produtos exclusivos que nenhuma outra semijoia oferece |
| **Única** | Cada cliente recebe serviço verdadeiramente personalizado |
| **Confiável** | Transparência fiscal e relações de confiança duradouras |
| **Valiente** | Coragem de ser mais autêntica, independente e segura da própria beleza |

### Visão e Posicionamento
> *"Existimos para mulheres que buscam liberdade financeira, através de produtos distintos e de qualidade, pagando um preço acessível para estar sempre com novos acessórios para as mais diversas ocasiões."*

Objetivo: **ser a maior loja de Semijoias do Paraguai.**

### Personalidade da Marca
> Monarca é uma mulher destacada por natureza. Atrai olhares porque é sofisticada. Cativa seguidores por ser extremamente confiável. Tem a coragem de propor novas formas de vida. Assim como as borboletas se transformam, Monarca também transforma o mundo das mulheres trazendo cor e distinção.

---

## 2. Filosofia Visual

- **Minimalista** — a beleza está nos pequenos detalhes, como uma semijoia
- **Geométrica e racional** — todas as formas são geométricas e sóbrias; zero formas orgânicas
- **Sofisticada** — equilíbrio entre linhas finas e grossas, serif fina e geométrica
- **Preto e branco como base** — branco = sofisticação, preto = poder
- **Liberdade e independência** — representadas na linha solta da letra "A" do logotipo
- A letra **"O"** contém a borboleta como se estivesse num casulo — a alma é sempre de borboleta, mesmo dentro do casulo

---

## 3. Logotipo

### Versões
| Versão | Uso |
|--------|-----|
| Versão principal | Logotipo completo com borboleta na letra "O" |
| Símbolo reduzido | Borboleta envolta em 3/4 de círculo (para redes sociais, favicons, avatars) |

### Tamanhos Mínimos
| Contexto | Versão completa | Versão símbolo |
|----------|----------------|----------------|
| Impresso | 7 mm de altura | 5 mm de altura |
| Digital | 25 px de altura | 23 px de altura |
| Serigrafia | 14 mm (dobro do impresso) | 10 mm |

### Usos Proibidos
- ❌ Rotacionar o logotipo
- ❌ Alterar as cores institucionais
- ❌ Usar em outline (contorno)
- ❌ Distorcer ou mudar proporções
- ❌ Usar em fundos sem contraste suficiente
- ❌ Criar moldura ao redor
- ❌ Alterar o design ou tipografia
- ❌ Usar peças do logotipo de forma autônoma (exceto o símbolo da borboleta)
- ❌ Aplicar efeitos (sombra, brilho, gradiente sobre o logo)

### Área de Segurança
Manter espaço equivalente à altura da letra "O" do logo em todos os lados.

---

## 4. Tipografia

### Tipografia Institucional (comunicação e digital)

| Fonte | Uso | Pesos | Import |
|-------|-----|-------|--------|
| **Playfair Display** | Títulos, headings, valores monetários (G$), display | Bold, Regular | Google Fonts |
| **Raleway** | Body, UI, botões, labels, textos gerais, legendas | Regular, Medium, SemiBold, Bold | Google Fonts |

### Tipografia do Logotipo
| Fonte | Uso |
|-------|-----|
| **Glacial Indifference Regular** | Exclusiva para construção do logotipo — usar sempre o arquivo vetorial |

> ⚠️ Glacial Indifference é usada **apenas no logotipo**. Para o restante da comunicação, usar Playfair Display + Raleway.

### Classes Tailwind
```js
// tailwind.config.ts
fontFamily: {
  playfair: ['Playfair Display', 'serif'],
  raleway: ['Raleway', 'sans-serif'],
}
```

- `font-playfair` — headings, títulos de seções, valores em G$, logo "MONARCA"
- `font-raleway` — texto geral (padrão do body)

### Hierarquia Tipográfica Sugerida

| Nível | Fonte | Peso | Tamanho |
|-------|-------|------|---------|
| Display / Hero | Playfair Display | Bold | 48–72px |
| H1 | Playfair Display | Bold | 32–40px |
| H2 | Playfair Display | Bold | 24–28px |
| H3 | Raleway | SemiBold | 18–20px |
| Body | Raleway | Regular | 14–16px |
| Label / Caption | Raleway | Medium | 11–13px |
| Valor monetário | Playfair Display | Bold | contextual |

> **Stitch (protótipos):** usa **EB Garamond** como substituto de Playfair Display e **Work Sans** como substituto de Raleway — as únicas fontes similares disponíveis na plataforma.

---

## 5. Cores

### Paleta Auxiliar (Manual de Identidade)

| Token | Nome | Hex | RGB | CMYK | Pantone |
|-------|------|-----|-----|------|---------|
| `--color-primary` | Dark Slate Gray | `#35605A` | R:054 G:096 B:090 | C:079 M:045 Y:060 K:027 | 4167 C |
| `--color-secondary` | Silver Chalice | `#B4ABA2` | R:180 G:171 B:162 | C:031 M:029 Y:033 K:000 | 407 C |
| `--color-tertiary` | Liver Chestnut | `#917961` | R:145 G:121 B:098 | C:041 M:047 Y:062 K:013 | 7504 C |

> O manual orienta não usar mais de **4 cores** por peça. Sempre partir do preto institucional e adicionar as cores auxiliares quando necessário.

### Paleta Completa do Projeto Digital

| Token | Nome | Hex | Uso |
|-------|------|-----|-----|
| `--color-primary` | Dark Slate Gray | `#35605A` | Verde principal, CTAs, elementos ativos |
| `--color-secondary` | Silver Chalice | `#B4ABA2` | Acento areia/prata, hover, badges de rank |
| `--color-tertiary` | Liver Chestnut | `#917961` | Acento terroso, detalhes secundários |
| `--color-dark` | — | `#363636` | Texto principal (modo claro) |
| `--color-black` | — | `#0f0f0f` | Backgrounds do app (dark mode) |
| `--color-surface` | — | `#1a1a1a` | Cards e superfícies (dark mode) |
| `--color-white` | — | `#ffffff` | Backgrounds claros, vitrina pública |
| `--color-snow` | — | `#fffbfb` | Branco quente sutil |

### Classes Tailwind
- `text-primary`, `bg-primary` — verde escuro #35605A
- `text-secondary`, `bg-secondary` — areia/prata #B4ABA2
- `text-tertiary`, `bg-tertiary` — terroso #917961
- `text-dark`, `bg-dark` — texto/fundo escuro
- `text-snow`, `bg-snow` — branco quente

---

## 6. Elementos Gráficos

### Símbolo da Borboleta
A borboleta minimalista do logotipo pode ser usada de forma independente:

- **Autônoma:** borboleta envolta em 3/4 de círculo (representa a borboleta saindo do casulo — liberdade e escolha)
- **Pattern:** borboletas em 3/4 de círculo conectadas entre si, podendo variar a orientação da abertura
- Usos recomendados: fundos fotográficos, papelaria, brindes, decoração de interiores, assets digitais

> Sempre usar os **arquivos vetoriais** originais para garantir fidelidade de reprodução.

---

## 7. Fundos Fotográficos

- Sempre escolher a área de **maior uniformidade** dentro da foto para posicionar o logo
- Quando o fundo não permite espaço uniforme → usar o símbolo reduzido (3/4 círculo)
- Para redes sociais → usar sempre a **versão reduzida** do logo
- Fundos escuros → logo em branco; fundos claros → logo em preto ou primary

---

## 8. Container e Layout

O container principal do projeto é uma **classe CSS customizada** (não o container do Tailwind):

```css
.container-monarca {
  width: 100%;
  max-width: 1279px;
  margin: 0 auto;
  padding: 0 20px;        /* Mobile */
}
@media (min-width: 768px) {
  .container-monarca {
    padding: 0 80px;      /* Desktop */
  }
}
```

**Uso:** Sempre envolver conteúdo de seção com `<div className="container-monarca">`.

---

## 9. Espaçamento

| Contexto | Valor |
|----------|-------|
| Gap entre sections | `py-10 md:py-14` ou `py-16 md:py-20` |
| Gap dentro de grids | `gap-5` (20px) |
| Padding do container | `px-5` mobile / `px-20` desktop |

---

## 10. Gradientes

### Gradiente de topo (hero/banner):
```
bg-[linear-gradient(180deg,_#000,_rgba(0,0,0,0)_50%)]
```
Preto sólido no topo, transparente em 50%. Usado no hero para fundir com o header.

### Gradiente lateral (hero):
```
bg-gradient-to-r from-black/60 to-transparent
```

### Gradiente de fundo (CTAs):
```
bg-gradient-to-t from-black to-transparent
bg-gradient-to-t from-black/60 to-transparent
```

### Gradiente primary (app dark mode — cards de destaque):
```
bg-gradient-to-b from-[#35605A] to-[#0f0f0f]
```

---

## 11. Ícones

Todos os ícones são **SVG inline** com `stroke="currentColor"` para herdar a cor via Tailwind.

### Ícones do portal público:
- **Busca**: Lupa (circle + line)
- **Carrinho**: Shopping bag (path + line)
- **Instagram**: Rect + circle + dot
- **Facebook**: Path
- **FAQ expand**: Plus (two lines)

### Ícones do portal revendedoras (app):
- Usar família consistente (ex: Lucide Icons ou Heroicons — outline style)
- Tamanho padrão: 20px (`w-5 h-5`) para UI, 24px (`w-6 h-6`) para navbar

---

## 12. Imagens

| Tipo | Dimensões | Formato |
|------|-----------|---------|
| Hero banner | 1440×630 | `.jpg` |
| Product card | 260×340 (aspect ratio) | `.jpg` / `.svg` placeholder |
| Category banner | 546×383 (aspect ratio) | `.jpg` / `.svg` placeholder |
| CTA backgrounds | 1440×700/900 | `.jpg` / `.svg` placeholder |

### Regras:
- Usar `next/image` com `fill` + `object-cover` para backgrounds
- Usar `next/image` com `width`/`height` fixos para ítens de grid
- Sempre incluir `alt` descritivo
- `priority` somente na imagem do hero (above the fold)
- `sizes` prop obrigatório para imagens responsivas

### Origem das imagens de produto
```
https://images.monarcasemijoyas.com.py/products/{filename}.webp
```
Bucket Cloudflare R2 `fotos-monarca`. Configurado em `next.config.ts` via `images.remotePatterns`.

---

## 13. Admin Panel

O admin usa um tema escuro separado com variáveis CSS próprias:

| Token | Hex | Uso |
|-------|-----|-----|
| `--admin-bg` | `#0a0a0a` | Background geral |
| `--admin-surface` | `#171717` | Cards, tabelas |
| `--admin-border` | `#2a2a2a` | Bordas |
| `--admin-text` | `#ededed` | Texto principal |
| `--admin-text-muted` | `#999999` | Texto secundário |
| `--admin-primary` | `#35605a` | Botões primários (mesmo verde da marca) |

---

## 14. Layout da Página de Produto

```
┌─────────────────────────────────────────────────┐
│  Header (shared)                                │
├────────────────────┬────────────────────────────┤
│                    │  Nome do produto            │
│   Imagem           │  Preço (₲ X.XXX)           │
│   Principal        │  [Agregar a mi joyero]     │
│   (aspect 4:5)     │  DESCRIPCIÓN               │
│                    │  Texto da descrição...      │
│                    │  SKU: XXXX                  │
├────────────────────┴────────────────────────────┤
│  Faixa preta "Hacemos envíos..."                │
├─────────────────────────────────────────────────┤
│  MÁS PRODUCTOS PARA EXPLORAR                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ Card │ │ Card │ │ Card │ │ Card │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
├─────────────────────────────────────────────────┤
│  Footer (shared)                                │
└─────────────────────────────────────────────────┘
```

### Cores específicas:
- Botão CTA: `bg-[#35605a]` (verde escuro da marca)
- Texto principal: `text-darkslategray-200` (`#363636`)
- Faixa de envios: `bg-black text-white`
