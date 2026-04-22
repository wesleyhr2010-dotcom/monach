# SPEC — Frontend: Arquitetura UI/UX

## Objetivo
Definir a estrutura de roteamento Next.js, divisão entre Server/Client Components, padrões de layout do portal admin e PWA da revendedora, e o mecanismo B2B2C de compartilhamento via Web Share API.

## Atores
- **Next.js App Router** — base de roteamento.
- **Revendedora (mobile-first)** — consumidora de `/app/*`.
- **Admin/Consultora (desktop)** — consumidora de `/admin/*`.
- **Cliente final** — recebe compartilhamentos e visita vitrine pública.

## Fluxo
1. Monorepo Next.js divide em três áreas: `/admin/*` (desktop), `/app/*` (PWA mobile), `/vitrina/*` (público).
2. Server Components pré-renderizam dados críticos; Client Components tratam interatividade (forms, carrinho, shares).
3. PWA usa bottom nav e esconde header do browser para parecer app nativo.
4. Compartilhamento usa `navigator.share()` (URL/texto/arquivos) com fallback para `whatsapp://send`.
5. Atribuição de vendas via `?ref={user.id}` nas URLs compartilhadas.

## Regras de negócio
- Server Components são padrão; Client Components só quando interativos.
- Mobile-first nas telas `/app/*`; desktop-first em `/admin/*`.
- PWA (manifest + service worker) em `/app/*` (ver `PRD_OneSignal_PWA.md`).
- Imagens usam lazy loading e `next/image`.
- Reutilizar design tokens do `docs/design-system/`.

## Edge cases
- Dispositivo sem `navigator.share` → fallback para link `whatsapp://send` ou cópia.
- Revendedora em desktop tentando usar portal PWA → layout responsivo mas otimizado para mobile.
- Admin acessando em tablet → layout permanece desktop (rolagem horizontal se necessário).
- SSR com dados não prontos → skeleton/loading states padronizados (`SPEC_SKELETON_EMPTY_STATES.md`).

## Dependências
- `SPEC_DESIGN_MODULES.md` — componentes compartilhados.
- `design-system/DESIGN_SYSTEM.md` — tokens visuais.
- `SPEC_SKELETON_EMPTY_STATES.md` — padrões de loading/empty.
- `SPEC_CACHING_STRATEGY.md` — revalidação e ISR.
- PRD `PRD_OneSignal_PWA.md`.

---

## Detalhes técnicos / Referência

## Estruturação de Roteamento Next.js (Server Components vs Client Components)

O monorepo divide logicamente o App em fatias.

### 1. Espaço Admin (`/src/app/admin/*`)
Focado nos Super Admins e Consultoras.
- Framework visual: AdminLTE da vida, Dashboard pesado de grids de Desktop.
- **Roteamento**: 
  - `/admin/maletas/nova`: Multi-step form para a consultora bipar o código de barras da peça e adicionar à maleta. Necessita de validação reativa e otimista (`useTransition`).
  - `/admin/equipe`: Listagem de progressão da árvore da consultora usando tabelas server-side-rendered com paginação assíncrona.

### 2. Portal Revendedora (`/src/app/app/*`)
Focado 100% na experiência PWA Mobile First das Revendedoras. Deve parecer com um Aplicativo Físico.
- **Layouts**: Tab-Bottom navigation escondendo header desnecessário do browser.
- **Roteamento**:
  - `/app/dashboard`: Server Component carregado com dados base pré-renderizados para ultra-velocidade. Componente de Progressbar lendo do cálculo de *Comissões* da backend action. Mostra saldo da `Maleta Atual`.
  - `/app/catalogo`: Client component de vitrine filtrável, possuindo lazy loading das imagens para poupar rede PWA.
  
## Lógica de Compartilhamento (B2B2C Share)
A revendedora poderá clicar no produto para revender e partilha o mesmo pro cliente final no whatsapp.
Utilizaremos `Web Share API` caso disponível no dispositivo celular dela, visando uma partilha bonita com Metadata e foto embutida, com fallback manual para URIs.

```javascript
const shareProduct = async (productData: Product) => {
  if (navigator.share) {
    await navigator.share({
      title: productData.name,
      text: `Olha só essa peça nova: ${productData.name}!`,
      url: `${SITE_URL}/produto/${productData.slug}?ref=${user.id}`,
    });
  } else {
    const defaultUrl = `whatsapp://send?text=Olha a peca: ${SITE_URL}/...`;
    window.open(defaultUrl, "_blank");
  }
}
```
Isso amarra logicamente as vendas geradas pelas campanhas no sistema!
