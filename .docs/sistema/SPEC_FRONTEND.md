# Technical Specification: Frontend (UI/UX)

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
