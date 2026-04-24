# Changelog — Monarca Semijoyas

## 2026-04-23 — Remoção dos logs temporários de diagnóstico de convite

### Contexto
Após validar o fluxo de criação de consultora/revendedora e identificar a causa de ambiente na Vercel, os logs temporários com `traceId` não são mais necessários em runtime.

### Modificado
- **`src/app/admin/actions-equipe.ts`**
  - Removidos logs estruturados temporários do fluxo de convite (`[Convite][Start|...|Done]`).
  - Mantidos apenas logs mínimos de erro para falhas de `generateLink`, envio de convite e fallback.

- **`src/lib/emails.ts`**
  - Removidos logs temporários de início/sucesso/erro por envio (`[Email][Brevo][...]`).
  - Mantida validação de `BREVO_API_KEY` e propagação de erro quando o envio falhar.

### Efeito
Fluxo funcional preservado com menos ruído em logs de produção.

---

## 2026-04-23 — Observabilidade do convite no cadastro admin (traceId por etapa)

### Problema
Sem rastreio detalhado, ficava difícil identificar por que o convite de consultora/revendedora não chegava (sem evidência clara se falhava na criação do usuário, geração do link, Brevo ou fallback).

### Modificado
- **`src/app/admin/actions-equipe.ts`**
  - Adicionado logging estruturado com `traceId` para cada criação:
    - `[Convite][Start]`
    - `[Convite][CreateUser][Success|Error]`
    - `[Convite][GenerateLink][Success|Error]`
    - `[Convite][Brevo][Success|Error]`
    - `[Convite][Fallback][Success|Error]`
    - `[Convite][Done]`
  - Logs sensíveis passam por `safeLogError` (sanitização).

- **`src/lib/emails.ts`**
  - `sendEmail` agora registra início/sucesso com `traceId`.
  - Em erro, registra payload sanitizado e relança exceção com `traceId` para correlação.

### Efeito
Agora é possível identificar com precisão em logs onde o fluxo quebra e qual caminho foi usado (Brevo ou fallback Supabase SMTP).

---

## 2026-04-23 — Fix envio no cadastro admin: fallback automático via Supabase SMTP

### Problema
No cadastro de consultora/revendedora, o envio por Brevo podia falhar silenciosamente (sem bloquear operação e sem feedback claro), resultando em usuário criado no Auth/Prisma mas sem email de convite recebido.

### Modificado
- **`src/lib/emails.ts`**
  - `sendEmail` deixou de engolir erro silencioso.
  - Agora valida `BREVO_API_KEY` e lança erro quando o envio falha.

- **`src/app/admin/actions-equipe.ts`**
  - Mantido envio principal por template de convite (senha temporária + link).
  - Adicionado fallback automático: se o envio por Brevo falhar, dispara `supabaseAdmin.auth.resetPasswordForEmail(...)` com `redirectTo` adequado por role (`/admin/login/reset-password` ou `/app/nueva-contrasena`), usando o mesmo canal SMTP já validado no fluxo de recuperação de senha.

### Efeito
Ao criar conta pelo admin, o sistema tenta o convite completo; se houver falha no provedor transacional, garante ao menos o envio do link de redefinição por Supabase SMTP.

---

## 2026-04-23 — Fix convite no cadastro admin: enviar senha temporária + link de redefinição

### Problema
No cadastro de consultora/revendedora pelo admin, o envio de convite podia não acontecer quando `NEXT_PUBLIC_SITE_URL` estava ausente. Nesse cenário, o link de redefinição ficava `null` e o envio era pulado.

### Modificado
- **`src/app/admin/actions-equipe.ts`**
  - Adicionado `getBaseUrl()` com fallback robusto: `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_VERCEL_URL` → `http://localhost:3000`.
  - `criarUsuarioAuthEEnviarConvite` agora monta `actionLink` com essa base e **sempre tenta enviar** o convite.
  - Convite passa a receber `senhaTemporaria` (a mesma criada no `auth.admin.createUser`).

- **`src/lib/email-templates/convite-usuario.ts`**
  - Template atualizado para incluir:
    - senha temporária no corpo do email;
    - botão com link de redefinição (`/auth/callback?...`) quando disponível;
    - fallback de URL base sem depender exclusivamente de `NEXT_PUBLIC_SITE_URL`.

### Efeito
Ao criar conta pelo admin, o usuário recebe automaticamente email com senha temporária e link para redefinir a senha.

---

## 2026-04-23 — Execução operacional do `CLAUDE.md` (validação e correções de lint em pontos críticos)

### Objetivo
Executar o checklist mínimo definido em `CLAUDE.md` para validar o estado real do repositório: leitura dos arquivos canônicos, execução de `lint`/`test` e correções cirúrgicas apenas nos erros críticos encontrados durante a verificação.

### Verificado
- Leitura dos contextos obrigatórios concluída:
  - `docs/project_overview.md`
  - `docs/next_steps.md`
  - `docs/README.md`
- `npm test` passou integralmente: **42/42 testes**.
- `npm run lint` continua falhando por dívida técnica pré-existente em múltiplos módulos fora do escopo da intervenção pontual (ex.: `lib/mcp/*`, `scripts/*`, e alguns arquivos de `src/app/*`).

### Modificado
- **`eslint.config.mjs`**
  - Adicionado ignore de `.claude/**` para evitar que worktrees efêmeros internos contaminem o resultado do lint do repositório principal.

- **`src/app/carrinho/page.tsx`**
  - Removido padrão que fazia `setState` síncrono dentro de `useEffect`.
  - Estado inicial do carrinho agora é carregado no initializer do `useState`; sincronização passa a acontecer apenas por evento (`CART_UPDATED_EVENT`).

- **`src/components/CartDrawer.tsx`**
  - Removido padrão de sincronização com `setState` direto dentro de efeitos.
  - Atualização passou a ser dirigida por versionamento de evento do carrinho, evitando erro de regra `react-hooks/set-state-in-effect`.

- **`src/components/onesignal/OneSignalWrapper.tsx`**
  - Substituídos usos de `any` por tipagem segura.
  - `showLog` convertido para `useCallback`.
  - Logs dentro do efeito movidos para agendamento assíncrono (`queueMicrotask`) para evitar `setState` síncrono no corpo do `useEffect`.

- **`src/__tests__/app/maleta-actions.test.ts`**
  - Removido cast com `any` no mock de transaction, adequando ao lint de TypeScript estrito.

### Resultado prático
- Correções locais aplicadas sem ampliar escopo funcional.
- Testes continuam verdes após as mudanças.
- Lint global ainda requer uma força-tarefa dedicada de saneamento para zerar os erros históricos remanescentes.

---

## 2026-04-23 — Convite de usuário: link de definição de senha usa `/auth/callback` + verifyOtp

### Problema
`criarColaboradora` e `criarRevendedora` montavam o link de convite via `supabaseAdmin.auth.admin.generateLink({ type: "recovery", options: { redirectTo } })` com `redirectTo` hardcoded para `/app/nueva-contrasena` (errado para consultora). O `action_link` retornado também usa fluxo PKCE — exige `code_verifier` no mesmo navegador que iniciou o pedido, o que nunca existe no fluxo de convite (o request parte do admin, não do convidado). Resultado: link falhava com `PKCE code verifier not found in storage`.

### Modificado
- **`src/app/admin/actions-equipe.ts` (`criarUsuarioAuthEEnviarConvite`)**:
  - Remove o `redirectTo` hardcoded.
  - Passa a usar `linkData.properties.hashed_token` para montar manualmente um link para `/auth/callback?token_hash=...&type=recovery`.
  - O route handler faz `verifyOtp` (não depende de PKCE verifier), estabelece sessão, consulta `resellers.role` e encaminha consultora → `/admin/login/reset-password` e revendedora → `/app/nueva-contrasena` automaticamente.
  - Log explícito se `generateLink` falhar.

### Efeito
Consultoras e revendedoras recém-cadastradas recebem agora um link de convite que funciona cross-device e cai na tela certa conforme o role, sem precisar de whitelist adicional no Supabase além de `/auth/callback`.

---

## 2026-04-23 — Reset de Senha: Callback `/auth/callback` + roteamento por role + suporte a `token_hash` (verifyOtp)

### Problema
Três problemas encadeados no fluxo de recuperação de senha, resolvidos em sequência:

1. **Link caía na raiz do domínio.** O email chegava como `https://monarca-six.vercel.app/?code=...` em vez de `/app/nueva-contrasena?code=...` ou `/admin/login/reset-password?code=...`. Causa: template de email no Supabase usa `{{ .SiteURL }}` ou os Redirect URLs não estão na whitelist, então o Supabase ignora o `redirectTo` e cai no Site URL (raiz do domínio).
2. **PKCE `code_verifier` não encontrado.** Após rotear `?code=` para o callback, `exchangeCodeForSession` falhava com `PKCE code verifier not found in storage` sempre que o usuário abria o email em um navegador/dispositivo diferente daquele que iniciou o reset (ou com cookies limpos, aba anônima etc.). O fluxo PKCE exige o verifier armazenado no mesmo browser que iniciou o reset.
3. **Sessão estabelecida pulava a tela de definir senha.** Com o callback funcionando, o middleware tratava toda rota sob `/admin/login/` como login page e, para usuário já logado, redirecionava para `/admin`. Resultado: ADMIN caía direto no painel sem passar pelo formulário de nova senha.

### Criado
- **`src/app/auth/callback/route.ts`** — Route Handler único que processa callbacks de auth e decide o destino por role:
  - **Aceita dois fluxos**:
    - `?token_hash=...&type=recovery` → `supabase.auth.verifyOtp()` (recomendado, não depende de storage local — funciona cross-device).
    - `?code=...` → `supabase.auth.exchangeCodeForSession()` (fallback PKCE).
  - **Roteamento por role** (consulta `resellers.role`):
    - `ADMIN` / `COLABORADORA` → `/admin/login/reset-password`.
    - `REVENDEDORA` (ou perfil ausente) → `/app/nueva-contrasena`.
  - **Falhas** (token/code inválido, expirado, sessão não criada) → `/app/login/recuperar-contrasena?error=expired`.
  - Suporta `?next=/caminho` para destino customizado (whitelistado para caminhos relativos).
  - Executa em Route Handler porque Server Components não podem setar cookies httpOnly de sessão.

### Modificado
- **`src/lib/middleware-auth.ts`**:
  - Detecção precoce na raiz: quando `url.pathname === "/"` e há `?code=` ou `?token_hash=`, redireciona para `/auth/callback?...` antes de qualquer outra lógica do middleware.
  - `/admin/login/reset-password` removido da condição `isAdminLoginPage` — assim permanece acessível mesmo com sessão ativa (necessário porque o callback estabelece sessão antes de chegar na página).

### Pendente (ação manual no Supabase Dashboard)
- **`Authentication → Email Templates → Reset Password`**: trocar o corpo para usar o fluxo OTP (token_hash), que não depende de PKCE verifier e funciona em qualquer dispositivo:
  ```html
  <h2>Restablecer contraseña</h2>
  <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Restablecer contraseña</a></p>
  ```
- **`Authentication → URL Configuration`**: garantir que **Site URL** aponta para o domínio atual (`https://monarca-six.vercel.app` enquanto Vercel preview; depois `https://monarcasemijoyas.com.py`) e que `https://<dominio>/auth/callback` está na whitelist de Redirect URLs.

### Verificado
- ✅ Fluxo testado manualmente em produção: link de recovery → callback → tela de nova senha (admin/revendedora) → senha atualizada com sucesso.
- ✅ Lint e typecheck sem erros nos arquivos modificados.

---

## 2026-04-23 — Reset de Senha Admin: Rota de Callback + Preparação SMTP Brevo

### Criado
- **`src/app/admin/login/reset-password/page.tsx`** — página de definição de nova senha para usuários admin/consultora. Recebe o token de recovery do Supabase Auth via URL hash, valida sessão, permite definir nova senha (mín. 6 caracteres) e redireciona para `/admin` após 2s. Design consistente com o tema dark do admin (`AdminAuthField`, `AdminAuthButton`).

### Contexto
✅ **Configuração concluída em 2026-04-23** — SMTP do Brevo configurado manualmente no Supabase Dashboard (host `smtp-relay.brevo.com`, port `587`, user `monarcasemijoyas@gmail.com`). Reset de senha, convites e magic links do Supabase Auth agora são enviados via Brevo em vez do SMTP padrão limitado. Ref.: [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md) §10.

---

## 2026-04-23 — Gestão de Equipe: Criação via Supabase Auth + Convite por Email

### Criado
- **`src/lib/email-templates/convite-usuario.ts`** — template de email transacional (Brevo) para convite de novos usuários. Contém saudação personalizada por tipo (consultora/revendedora), link de definição de senha e link para o portal.
- **Helper `criarUsuarioAuthEEnviarConvite`** em `src/app/admin/actions-equipe.ts` — centraliza a criação do usuário no Supabase Auth (`auth.admin.createUser` com senha temporária), gera link de recovery (`auth.admin.generateLink`) e dispara email via Brevo (best-effort, não bloqueia operação principal).

### Modificado
- **`src/app/admin/actions-equipe.ts`** — `criarColaboradora` e `criarRevendedora` reescritas:
  1. Validam email obrigatório antes de prosseguir.
  2. Criam usuário no Supabase Auth via helper e obtêm `authUserId`.
  3. Criam registro no Prisma com `auth_user_id` preenchido (vínculo automático).
  4. Implementam **compensação**: se a criação no Prisma falhar, o usuário do Auth é removido para evitar órfãos.
  5. Enviar convite por email com link de definição de senha (24h de validade).
  6. Tratam erro específico de email já registrado no Supabase Auth (`"Este correo ya está registrado en el sistema"`).

### Verificado
- ✅ Lint sem erros nos arquivos modificados.
- ✅ 42 testes existentes passam (incluindo 11 de regressão RBAC).

---

## 2026-04-23 — Fix: Compartilhamento de Fotos no Catálogo PWA (Individual e Múltiplo)

### Criado
- **`src/app/api/proxy-image/route.ts`** — Route Handler que faz proxy de imagens do Cloudflare R2, contornando CORS no PWA. Recebe `?url=`, faz fetch do blob e retorna com `Access-Control-Allow-Origin: *` e cache de 24h.
- **`src/lib/share-images.ts`** — helper reutilizável para compartilhamento de imagens:
  - `downloadImageAsFile(url, fileName)` — baixa imagem via proxy local e converte para `File`.
  - `isShareFilesSupported()` / `canShareFiles(files)` — detecta suporte a `navigator.canShare({ files })`.
  - `shareImages(files, text)` — wrapper que trata `AbortError` como cancelamento (não exibe erro) e retorna `{ shared, cancelled }`.
  - `fallbackWhatsApp(items)` / `fallbackWhatsAppIndividual(item)` — fallback para WhatsApp com nome + link do produto (`/produto/{id}`).

### Modificado
- **`src/app/app/actions-revendedora.ts`** — `getCatalogoRevendedora` agora retorna `slug: product.id` em cada item (necessário para gerar links públicos no fallback WhatsApp).
- **`src/app/app/catalogo/page.tsx`** — `handleShareIndividual` reescrito:
  1. Baixa imagem do produto via `downloadImageAsFile`.
  2. Tenta `navigator.share({ files, text })` com foto + nome + preço + variante.
  3. Se `canShare` não suportar ou imagem falhar, cai no `fallbackWhatsAppIndividual` com link do produto.
- **`src/app/app/catalogo/compartir/page.tsx`** — `handleCompartir` reescrito:
  1. Usa `downloadImageAsFile` via proxy para cada imagem selecionada.
  2. `shareImages` trata `AbortError` separadamente: se usuário cancelar o share sheet, não registra pontos nem limpa seleção.
  3. Fallback WhatsApp agora envia nomes + URLs dos produtos (não só nomes).
  4. Validação prévia: se nenhum item selecionado tiver imagem, exibe erro amigável e aborta antes de iniciar download.
  5. Interface `CatalogoItem` atualizada com `slug`.

### Corrigido
- **CORS no R2** — `fetch(imageUrl)` direto falhava silenciosamente; proxy local resolve.
- **AbortError tratado como erro genérico** — cancelamento do share sheet não exibe mais "Erro ao compartir".
- **Fallback WhatsApp sem links** — agora inclui URL pública de cada produto.
- **Seleção vazia de imagens** — botão "Compartir" desabilita implicitamente quando `itemsWithImage.length === 0`.

---

## 2026-04-23 — Sidebar da Consultora + Perfil e Extrato de Comissões

### Criado
- **`src/components/admin/AdminLayoutClient.tsx`** — Client Component extraído do `layout.tsx` do admin. Recebe `userRole` como prop e filtra a sidebar e o bottom nav para mostrar apenas itens permitidos por role.
- **`src/app/admin/minha-conta/actions.ts`** — Server Actions para a consultora logada:
  - `getMinhaConta()` — perfil da consultora + resumo do grupo (faturamento mensal, comissão, maletas ativas, revendedoras ativas, totais históricos).
  - `getExtratoComissoes(ano?)` — agrupa maletas concluídas por mês, detalhando comissão da consultora por revendedora.
- **`/admin/minha-conta/page.tsx`** — página de perfil da consultora com avatar, dados pessoais, taxa de comissão (read-only), cards de resumo e links rápidos para Comissões, Analytics e Revendedoras.
- **`/admin/minha-conta/comissoes/page.tsx`** — extrato de comissões mês a mês com seleção de ano, total anual, e expansão de detalhes por maleta/revendedora.

### Modificado
- **`src/app/admin/layout.tsx`** — refatorado de Client Component para Server Component. Chama `getCurrentUser()`, valida role e is_active, redireciona se necessário, e passa `userRole` para `AdminLayoutClient`.
- **`src/components/admin/BottomNav.tsx`** — recebe `userRole` como prop e filtra itens: COLABORADORA vê Inicio, Revend., Maleta, Analytics, Perfil, Comissões.
- **`src/app/admin/actions-equipe.ts`** — ajustadas permissões para COLABORADORA:
  - `getRevendedoras` agora aceita `COLABORADORA` e filtra por `colaboradora_id = user.profileId`.
  - `getPerfilRevendedora` aceita `COLABORADORA` com `assertIsInGroup` para evitar IDOR.
  - `getPerfilConsultora` aceita `COLABORADORA` mas só permite visualizar o próprio perfil.
- **`docs/next_steps.md`** — item "Sidebar da Consultora" marcado como `[x]`.

---

## 2026-04-23 — Fix build Vercel: import quebrado e demo órfão

### Corrigido
- **`src/app/app/catalogo/compartir/page.tsx`** — import de `getCatalogoRevendedora` e `registrarPuntosCompartirCatalogo` corrigido de `"../actions-revendedora"` para `"../../actions-revendedora"` (a página está dois níveis abaixo de `src/app/app/`, não um). Quebrava o build com `Module not found`.

### Removido
- **`src/pages/api/paper-mcp-call.ts`** (e diretório `src/pages/` vazio) — arquivo demo órfão do Paper MCP (ferramenta de design), sem relação com Monarca, importando um módulo `../../lib/mcp` inexistente. Quebrava o build após a primeira correção.

---

## 2026-04-23 — Catálogo PWA (Revendedora)

### Criado
- **`/app/catalogo/page.tsx`** — vitrine dos produtos da maleta ativa da revendedora logada. Layout seguindo o Paper: header com seta, busca "Buscar en consignación...", chips de categoria (scroll horizontal), grid 2 colunas com imagem, preço (Playfair Display), nome do produto e botão "Compartir" verde. Botão sticky preto "Seleccionar varias fotos" para navegar à tela de multi-seleção.
- **`/app/catalogo/compartir/page.tsx`** — seleção multi-foto (máx. 10) com grid 3 colunas. Overlay de checkmark verde + borda `#35605A` nas selecionadas. Barra inferior sticky com contagem dinâmica, botão "Cancelar" e "📲 Compartir". Download progressivo das imagens do R2 (`fetch` → `blob` → `File[]`) e compartilhamento via `navigator.share({ files })`. Fallback para WhatsApp com links de texto em dispositivos sem suporte.
- **Server Actions em `src/app/app/actions-revendedora.ts`**:
  - `getCatalogoRevendedora` — retorna itens da maleta ativa (`status in [ativa, atrasada]`) com saldo positivo (`quantidade_vendida < quantidade_enviada`), incluindo produto, variante, preço fixado e imagens.
  - `registrarPuntosCompartirCatalogo` — dispara `awardPoints(resellerId, 'compartilhou_catalogo')` para gamificação (+50 pts, limite 5x/dia).

---

## 2026-04-23 — Gestão de Equipe: Perfis Detalhados (Admin)

### Criado
- **`/admin/consultoras/page.tsx`** — lista separada de consultoras com métricas agregadas (faturamento do grupo, comissão, revendedoras ativas), busca, filtro de status e modal de nova consultora. Server Action `getColaboradoras` atualizada com agregações de `maletas.valor_total_vendido`.
- **`/admin/consultoras/[id]/page.tsx`** — perfil detalhado da consultora: identidade, taxa de comissão, cards de resumo (revendedoras ativas/inativas, faturamento do grupo, comissão total), tabela de revendedoras do grupo com faturamento individual, pontos e link para perfil. Server Action `getPerfilConsultora`.
- **`/admin/revendedoras/[id]/page.tsx`** — perfil detalhado da revendedora: identidade com avatar/nome/rank/pontos/comissão, dados de candidatura (cédula, instagram, idade, estado civil, filhos, empresa, informconf), documentos com status, maletas com badge de status, dados bancários mascarados (`maskAlias`, `maskCuenta`), faturamento total/mensal. Server Action `getPerfilRevendedora`.
- **`src/lib/format.ts`** — utilitários de formatação: `formatGs`, `formatGsCompact`, `formatPct`, `formatDate`, `formatDateMonth`, `formatPhone`.

### Modificado
- **`src/app/admin/actions-equipe.ts`** — `getColaboradoras` agora agrega faturamento do grupo e conta revendedoras ativas. Adicionadas `getPerfilRevendedora` (com pontos, nível, dados bancários, maletas, documentos) e `getPerfilConsultora` (com revendedoras, faturamento, comissão).
- **`src/lib/types.ts`** — novos tipos `RevendedoraPerfil`, `ConsultoraPerfil`, e campos `revendedorasAtivas` / `faturamentoGrupo` em `ColaboradoraItem`.
- **`src/app/admin/layout.tsx`** — sidebar: link "Consultoras" agora aponta para `/admin/consultoras` (em vez de `/admin/equipe`).
- **`src/app/admin/revendedoras/page.tsx`** — adicionado link "Ver perfil" (ArrowRight) em cada linha da tabela, levando para `/admin/revendedoras/[id]`.

### Pendente (próxima entrega)
- Criação de consultora/revendedora via Supabase Auth + envio de convite por email (Brevo).
- Sidebar escopada para COLABORADORA e rotas `/admin/minha-conta`, `/admin/minha-conta/comissoes`.

---

## 2026-04-22 — Fix build Vercel: tipos Next 16, SDK Brevo, paths e prerender

### Renomeado
- **`src/app/app/progresso/`** → **`src/app/app/progreso/`** (typo de pasta corrigido). `actions.ts` e `page.tsx` movidos via `git mv`. Todos os links do app já apontavam para `/app/progreso/...`; pages `extracto/` e `regalos/` agora encontram o `actions.ts` esperado em `../actions`.

### Corrigido
- **`src/lib/emails.ts`** — reescrito para a API atual do `@getbrevo/brevo` v4 (`BrevoClient` + `client.transactionalEmails.sendTransacEmail`). A API antiga (`Brevo.TransactionalEmailsApi`, `SendSmtpEmail`) não existe mais no SDK.
- **`src/app/admin/brindes/SolicitudActions.tsx`** — `../actions` → `./actions`.
- **`src/app/admin/brindes/page.tsx`** — `AdminPageHeader.action` recebe `ReactNode` (não objeto literal); `AdminEmptyState.icon` recebe `LucideIcon` (componente, não elemento) e usa `action` (não `actionHref`/`actionLabel`).
- **`src/app/admin/brindes/solicitudes/page.tsx`** — `AdminEmptyState.icon` recebe componente `LucideIcon`.
- **`src/app/admin/produtos/CategoryFilter.tsx`** e **`SearchBar.tsx`** — `searchParams?.toString() ?? ""` (Next 16: `useSearchParams()` agora retorna `ReadonlyURLSearchParams | null`).
- **`src/components/admin/BottomNav.tsx`** e **`src/components/app/AppShell.tsx`** — `usePathname() ?? ""` (Next 16: `usePathname()` agora retorna `string | null`).
- **`src/app/app/bienvenida/page.tsx`** — `let avatarUrl: string | undefined = profile.avatar_url` (tipo explícito para aceitar `undefined`).
- **`src/app/app/progreso/regalos/page.tsx`** — substituído anti-pattern `useState(() => fetch())` + `if (!mounted) setMounted(true)` (que dispara server actions durante render e quebra o prerender) por um único `useEffect`. Tipos `BrindesData` / `BrindeAtivo` extraídos de `getBrindesAtivos`.

---

## 2026-04-22 — Sistema de Brindes (Admin + PWA)

### Criado (Admin)
- **`src/app/admin/brindes/actions.ts`** — Server Actions completas: `getBrindes`, `criarBrinde`, `atualizarBrinde`, `toggleBrindeAtivo`, `getSolicitacoes`, `marcarSeparado`, `marcarEntregado` (com notificação push), `cancelarSolicitacion` (reembolsa pontos e devolve estoque).
- **`/admin/brindes/page.tsx`** — lista de brindes com imagem, pontos, estoque e status; alerta de solicitações pendentes.
- **`/admin/brindes/nuevo/page.tsx`** — formulário para criar brinde com upload de imagem (URL).
- **`/admin/brindes/[id]/editar/page.tsx`** — formulário para editar brinde.
- **`/admin/brindes/solicitudes/page.tsx`** — lista de solicitações com filtros (todas/pendiente/separado/entregado) e cards de ação.
- **`src/components/admin/BrindesBadge.tsx`** — badge dinâmico na sidebar com count de solicitações pendentes.

### Criado (PWA)
- **`/app/progreso/extracto/page.tsx`** — historial paginado de pontos (ganhos em verde, resgates em vermelho) com saldo atual.
- **`/app/progreso/regalos/page.tsx`** — catálogo de brindes ativos; botão "Canjear" habilitado apenas se houver saldo e estoque; modal de confirmação com preview do saldo restante.
- **`src/app/app/progresso/actions.ts`** — `getBrindesAtivos`, `canjearRegalo` (transacional: debita pontos, decrementa estoque, cria solicitação), `getExtratoPontos` (paginado, 20/página).

### Modificado
- **`src/app/admin/layout.tsx`** — link "Brindes" na sidebar agora mostra badge dinâmico de solicitações pendentes.

---

## 2026-04-22 — Fix build Vercel: imports quebrados pós-refatoração da gamificação

### Corrigido
- **`src/app/admin/actions-maletas.ts`** — `atribuirXP` (que não existia mais após reescrita de `actions-gamificacao.ts`) substituído por `awardPoints` de `@/lib/gamificacao`. Linhas 9, 595 e 605.
- **`src/app/admin/gamificacao/page.tsx`** — reescrito para alinhar com a nova API: usa `upsertNivelRegra`, `deleteNivelRegra`, `atualizarRegra` (com schema Zod completo) e os campos reais do schema Prisma (`pontos_minimos`, `cor`, `ordem`, `tipo`). Tipos derivados de `Awaited<ReturnType<...>>` em vez de tipos custom inexistentes. UI traduzida para espanhol.

### Notas
- Correções de paths relativos também foram aplicadas localmente em arquivos do módulo `brindes/` (ainda untracked no working tree) — não entram neste commit. Devem ser comitadas junto quando o módulo brindes for publicado.

---

## 2026-04-22 — Motor de Gamificação

### Criado
- **`src/app/app/progresso/actions.ts`** — Server Action `getRegrasProgresso` que busca regras ativas, calcula progresso diário/total por revendedora e determina estado visual (`disponible`, `en_progreso`, `completado_hoy`, `completado_siempre`).
- **`src/app/app/progresso/page.tsx`** — tela "Cómo Ganar Puntos" com cards de cada regra, ícones Lucide, barra de progresso para tarefas diárias, estados completados e saldo total.

### Modificado
- **`src/lib/gamificacao.ts`** — `awardPoints` totalmente reescrito para respeitar:
  - `ativo = false` → silencioso
  - `tipo = 'unico'` → só 1x na vida
  - `tipo = 'diario'` → respeita `limite_diario`
  - `tipo = 'mensal'` → só 1x por mês
  - `tipo = 'por_evento'` → ilimitado
  - Usa `regra.nome` como descrição no extrato
- **`prisma/seed-gamificacao.ts`** — seed atualizado com 7 módulos completos (`icone`, `tipo`, `limite_diario`, `meta_valor`, `ordem`) + upsert para manter dados atualizados. Tiers e níveis também usam upsert.
- **`src/app/admin/actions-gamificacao.ts`** — reescrito com CRUD completo:
  - `getRegras`, `atualizarRegra` (com validação Zod)
  - `getNiveis`, `upsertNivelRegra`, `deleteNivelRegra` (protege nível base Bronze)
  - `getResgates`, `atualizarStatusResgate`, `getExtratoPontos`

---

## 2026-04-22 — Integração Brevo (Emails Transacionais)

### Criado
- **`src/lib/emails.ts`** — cliente central Brevo usando SDK `@getbrevo/brevo`. Envia emails via API com fallback silencioso em caso de erro (não bloqueia operação principal).
- **`src/lib/email-templates/`** — 6 templates de email transacional:
  - `documento-pendente.ts` — notifica admin/consultora quando revendedora envia documento
  - `documento-aprovado.ts` — confirma aprovação de documento para revendedora
  - `documento-rejeitado.ts` — informa rejeição com motivo
  - `acerto-confirmado.ts` — resumo financeiro após fechamento de maleta
  - `candidatura-aprovada.ts` — boas-vindas com senha temporária para lead aprovada
  - `candidatura-rechazada.ts` — recusa de candidatura
- **`.env.local.example`** — adicionadas `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `NEXT_PUBLIC_SITE_URL`.

### Nota
- Configuração SMTP do Supabase Auth (reset/convite via Brevo) é **manual no dashboard** e permanece pendente. Ver checklist em `SPEC_EMAILS.md` §10.

---

## 2026-04-22 — Recuperar Contraseña (PWA)

### Criado
- **`src/app/app/nueva-contrasena/page.tsx`** — tela para definir nova senha após clicar no link do email. Valida senha mínima de 6 caracteres e confirmação; chama `supabase.auth.updateUser({ password })`; redireciona para `/app` após 2s em caso de sucesso.

### Modificado
- **`src/lib/middleware-auth.ts`** — rota `/app/nueva-contrasena` excluída da verificação de sessão/role, igual a `/app/login`.
- **`src/app/app/login/recuperar-contrasena/page.tsx`** — já existia; fluxo completo de solicitação de link por email via `supabase.auth.resetPasswordForEmail`.

---

## 2026-04-22 — Dashboard (Home) da Revendedora (PWA)

### Criado
- **`src/lib/gamificacao.ts`** — `getRankAtual(resellerId)` calcula rank (Bronce/Plata/Oro/Diamante) sobre pontos históricos; `computeCommissionPct(faturamentoMes)` calcula tier atual e próximo tier baseado em `CommissionTier` do banco.
- **Seed de gamificação** — `prisma/seed-gamificacao.ts` agora popula `NivelRegra` (4 ranks com pontos mínimos e cores) e `CommissionTier` (5 tiers de 20% a 40%).

### Modificado
- **`src/app/app/actions-revendedora.ts`** — `getDashboardCompleto` totalmente reescrito:
  - Métricas agora são do **mês civil vigente** (`faturamentoMes`, `ganhosMes`, `pecasVendidasMes`) em vez de histórico total.
  - Busca `rank` real via `getRankAtual`, `pontosSaldo` histórico total, `maletaAtiva` com `data_limite`, e `commissionInfo` com tiers do banco.
  - Retorna `avatarUrl` para exibição no header.
- **`src/components/app/AppHeader.tsx`** — recebe `rank` (nome + cor), `pontos` e `avatarUrl`; exibe avatar real, nome, pontos e badge de rank colorido.
- **`src/components/app/CommissionTiers.tsx`** — reescrito para aceitar `tiers` e `commissionInfo` via props (dinâmico do banco). Pills mostram tiers alcançados em verde, tier atual com bordo destacado, próximos em cinza. Texto auxiliar mostra quanto falta para o próximo tier ou mensagem de nível máximo.
- **`src/components/app/MaletaCard.tsx`** — aceita `tiers` e `commissionInfo`; destaca visualmente maleta vencida (dias ≤ 0) em vermelho; mostra CTA "Solicitar consignación" quando não há maleta ativa.
- **`src/app/app/AppDashboardClient.tsx`** — atualizado para consumir novos campos do `getDashboardCompleto` (`rank`, `pontosSaldo`, `faturamentoMes`, `ganhosMes`, `pecasVendidasMes`, `maletaAtiva`, `commissionInfo`).

### Corrigido
- Lint nos arquivos modificados: zero erros (1 warning pré-existente sobre `<img>` no avatar).

---

## 2026-04-22 — Onboarding e Perfil da Revendedora (PWA)

### Criado
- **Campo `onboarding_completo`** no schema `Reseller` com migration `20260422000000_add_onboarding_completo`.
- **Regras de gamificação** `primeiro_acesso` (50 pts, `unico`) e `perfil_completo` (100 pts, `unico`) adicionadas ao `seed-gamificacao.ts`.
- **Página `/app/bienvenida`** — fluxo multi-step de onboarding:
  - Step 1: Boas-vindas com pontos de primeiro acesso (anti-duplicata via verificação no `PontosExtrato`).
  - Step 2: 3 slides explicando o funcionamento (consignação, comissão, pontos).
  - Step 3: Completar perfil rápido (avatar, WhatsApp) com upload para R2.
  - Step 4: Opt-in de push notifications (OneSignal `requestPermission`).
  - Step 5: Tela final com resumo de pontos ganhos.
- **Server Actions** em `src/app/app/bienvenida/actions.ts`: `awardPrimeiroAcesso`, `completeOnboarding`, `getOnboardingStatus`.
- **Páginas de Perfil** em `/app/perfil/*`:
  - `page.tsx` — resumo com avatar, nome, pontos, tasa de comisión, consultora e menu.
  - `datos/page.tsx` — edição de dados pessoais (nome, whatsapp, avatar, endereço) com upload R2.
  - `bancario/page.tsx` — formulário de dados bancários com tabs Alias (Bancard) e Cuenta Bancaria.
  - `soporte/page.tsx` — redirect automático para WhatsApp da consultora ou suporte geral.
  - `documentos/page.tsx` e `notificaciones/page.tsx` — stubs com mensagem "Próximamente".
- **Server Actions** em `src/app/app/perfil/actions.ts`: `actualizarPerfilRevendedora`, `guardarDatosBancarios`, `getPerfilCompleto`.

### Modificado
- **`src/app/app/layout.tsx`** — convertido para Server Component leve; lógica client (nav, bottom nav, OneSignal) extraída para `AppShell.tsx`.
- **`src/app/app/page.tsx`** — Server Component wrapper que detecta primeiro acesso (`!onboarding_completo && maletas.length === 0`) e redireciona para `/app/bienvenida`; renderiza `AppDashboardClient`.
- **`src/components/app/AppShell.tsx`** — novo componente client com navegação desktop/mobile; exclui shell em `/app/login` e `/app/bienvenida`.
- **`prisma/seed-gamificacao.ts`** — adicionado campo `tipo` às regras (`unico`, `por_evento`, `mensal`, `diario`).

---

## 2026-04-22 — Proteção de Dados Sensíveis (PII, Documentos, Bancários)

### Criado
- **`src/lib/prisma/encrypt-middleware.ts`** — Prisma Client Extension (`$extends`) que cifra/decifra campos sensíveis de `DadosBancarios` em AES-256-GCM. Campos protegidos: `alias_ci_ruc`, `alias_valor`, `cuenta`, `ci_ruc`. Formato: `iv:encrypted:authTag` (hex). Falha silenciosa em dev se `ENCRYPTION_KEY` ausente; erro fatal em produção.
- **`src/lib/errors/sanitize-log.ts`** — helper `sanitizeForLog(obj)` que substitui campos sensíveis (senha, email, whatsapp, conta, CI, token, etc.) por `[REDACTED]` recursivamente. `safeLogError(prefix, payload)` como wrapper conveniente.
- **`src/lib/data-protection/document-access.ts`** — Server Actions `getDocumentSignedUrl` (revendedora) e `getDocumentSignedUrlAdmin` (admin/consultora). Geram signed URLs de documentos em R2 com TTL de 1h. Incluem owner check, validação de grupo para COLABORADORA, e log de auditoria estruturado (`event: document_accessed` / `admin_document_accessed`).
- **`src/lib/data-protection/mask-utils.ts`** — helpers de máscara para UI: `maskAlias`, `maskCuenta`, `maskCI`, `maskEmail`, `maskWhatsApp`.
- **`src/lib/data-protection/vitrina-sanitizer.ts`** — `getPublicVitrinaData(slug)` e `toPublicResellerPayload()` garantem que a vitrina pública exponha apenas `name`, `avatar_url`, `slug` e link `wa.me` — nunca email, endereço, taxa ou role.

### Modificado
- **`src/lib/prisma.ts`** — cliente Prisma agora instanciado com `withEncryptionExtension()`, garantindo criptografia transparente para todas as operações de `dadosBancarios`.
- **`src/app/api/upload-r2/route.ts`** — adicionado suporte a path `private/resellers/{id}/docs/` para documentos pessoais, com validação de ownership. Revendedoras só podem subir em seu próprio path privado; admin/consultora podem subir em qualquer path privado.
- **`src/lib/r2.ts`** — `R2_PUBLIC_DOMAIN` exportado para reutilização em extratores de chave.
- **`src/.env.local.example`** — adicionada variável `ENCRYPTION_KEY` com instrução de geração.
- **Logs sanitizados** — `src/lib/onesignal-server.ts`, `src/app/api/track/route.ts`, `src/app/api/cron/check-overdue-maletas/route.ts`, `src/app/api/cron/aggregate-analytics/route.ts`, `src/app/api/export/route.ts`, `src/app/api/export/pdf/route.ts`: erro logs agora emitem apenas `err.message` em vez do objeto de erro completo, evitando vazamento acidental de dados de payload.

### Dependências
- Adicionado `@aws-sdk/s3-request-presigner` para geração de signed URLs no R2.

---

## 2026-04-22 — Correção de Vulnerabilidades Críticas RBAC

### Corrigido (todas as vulnerabilidades da auditoria 2026-04-22)
- **`src/app/admin/actions-maletas.ts`** — `devolverMaleta`: adicionado `requireAuth(["REVENDEDORA"])` + ownership check (`findFirst({ id, reseller_id })`) + validação de status. `fecharMaleta` e `conciliarMaleta`: removidos exports inseguros (renomeados para `_fecharMaleta` / `_conciliarMaleta`). `getActiveResellers`: adicionado `requireAuth(["ADMIN","COLABORADORA"])` + filtro por `colaboradora_id`. `getAvailableVariants`: adicionado `requireAuth(["ADMIN","COLABORADORA"])`. `getColaboradoras` duplicada removida; importação em `maleta/page.tsx` migrada para `actions-equipe.ts`.
- **`src/app/api/cron/check-overdue-maletas/route.ts`** — `checkOverdueMaletas` convertida de Server Action pública para cron job autenticado por `CRON_SECRET`. Chamada removida do client component `maleta/page.tsx`.
- **`src/lib/user.ts`** — Auto-link por email agora restrito a `role=REVENDEDORA` (previne takeover de perfis ADMIN/COLABORADORA). `getCurrentUser` retorna `null` quando não há perfil no banco, eliminando defaults permissivos (`role=REVENDEDORA`, `isActive=true`).
- **`src/lib/middleware-auth.ts`** — Middleware invertido para fail-closed: só permite `/admin` se `userRole` for explicitamente `'ADMIN'` ou `'COLABORADORA'`; todos os outros casos redirecionam para `/app`.
- **`src/app/app/actions-revendedora.ts`** — `getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro`: adicionado `assertIsInGroup` para COLABORADORA. `registrarVenda`: agora usa `item.preco_fixado` do banco em vez de `input.preco_unitario`; schema e frontend (`RegistrarVentaClient.tsx`) atualizados.
- **`src/__tests__/security/rbac-regression.test.ts`** — 11 testes de regressão cobrindo: (a) chamadas sem sessão retornam `BUSINESS:` error; (b) COLABORADORA não acessa dados fora do grupo; (c) `getCurrentUser` retorna `null` sem perfil.

## 2026-04-22 — Auditoria de Segurança RBAC (follow-up)

### Identificado
Auditoria crítica posterior à primeira implementação do RBAC revelou vulnerabilidades remanescentes — documentadas em `docs/next_steps.md` §Prioridade Crítica e nos novos padrões obrigatórios adicionados em `docs/sistema/SPEC_SECURITY_RBAC.md` §8–10.

- **CRÍTICO:** Server Actions de mutação financeira sem `requireAuth` — `devolverMaleta`, `fecharMaleta`, `conciliarMaleta`, `checkOverdueMaletas` em `src/app/admin/actions-maletas.ts`.
- **CRÍTICO:** Leitura de PII sem autenticação — `getActiveResellers`, `getColaboradoras` (em `actions-maletas.ts`), `getAvailableVariants`.
- **ALTO:** Email auto-linking em `getCurrentUser` permite takeover de perfis ADMIN/COLABORADORA com `auth_user_id=null`.
- **ALTO:** `getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro` em `actions-revendedora.ts` bloqueiam IDOR só para REVENDEDORA — COLABORADORA ainda vê dados fora do grupo (falta `assertIsInGroup`).
- **ALTO:** Middleware fail-open quando `userRole === null` (query Supabase falha → usuário autenticado passa para `/admin`).
- **MÉDIO:** `registrarVenda` aceita `preco_unitario` controlado pelo cliente.
- **MÉDIO:** `getCurrentUser` retorna `REVENDEDORA` ativa por default quando perfil não existe.

### Documentado (implementação pendente)
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §8 "Padrões Obrigatórios — Anti-Patterns Proibidos"** — 8 anti-patterns com exemplo ❌/✅ para usar em code review.
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §9 "Cron Jobs e Actions Automáticas"** — cron não expõe Server Action pública; usar Route Handler autenticado por `CRON_SECRET` ou Edge Function.
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §10 "Testes de Regressão de Segurança"** — 7 casos mínimos por Server Action.
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §7** — checklist expandido com 4 novos itens (cross-parent check, valores financeiros do banco, operações incrementais, whatsapp como PII).
- **`docs/next_steps.md`** — criada seção "Prioridade Crítica — Auditoria de segurança RBAC" com 13 itens acionáveis referenciando arquivo:linha e correção específica. Item RBAC anterior movido de `[x]` para `[~]` (parcial) até os críticos serem resolvidos.

### Não modificado neste commit
Esta entrada é apenas de documentação — nenhum código `.ts` foi alterado. As correções de código estão planejadas na seção Crítica do `next_steps.md`.

---

## 2026-04-22 — RBAC e RLS Validados por Tabela

### Criado
- **`src/lib/auth/assert-in-group.ts`** — helper `assertIsInGroup(resellerId, colaboradoraId)` que lança `BUSINESS:` error se a revendedora não pertencer ao grupo da colaboradora.
- **`src/lib/auth/get-reseller-scope.ts`** — helper `getResellerScope(caller)` que retorna filtro WHERE baseado na role (ADMIN = sem filtro, COLABORADORA = `colaboradora_id`, REVENDEDORA = `id`).
- **`scripts/rls-policies.sql`** — script consolidado com RLS policies para 23 tabelas sensíveis, incluindo owner checks, leitura pública para produtos/categorias, e restrições por role.

### Modificado
- **`src/lib/user.ts`** — `requireAuth` agora lança `BUSINESS:` errors (throw) em vez de retornar `null`; verifica `is_active` com mensagem específica; retorna `colaboradoraId` no `CurrentUser`.
- **`src/lib/middleware-auth.ts`** — middleware agora busca `is_active` no perfil e redireciona usuários inativos; adicionada restrição de rotas admin exclusivas para COLABORADORA (`/admin/productos`, `/admin/gamificacion`, `/admin/brindes`, `/admin/commission-tiers`, `/admin/contratos`, `/admin/equipo/consultoras`).
- **`src/components/auth/role-gate.tsx`** — agora usa `getCurrentUser` (não-throwing) adequado para Server Components.
- **Todas as Server Actions do admin** — `requireAuth` adicionado em `actions-products`, `actions-categories`, `actions-dashboard`, `actions-equipe`, `actions-gamificacao`, `actions-leads`, `actions-analytics`.
- **`actions-maletas.ts`** — `getMaletaById` agora usa `findFirst` com filtro de colaboradora; removidos checks `if (!user)` obsoletos.
- **`actions-revendedora.ts`** — `getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro` agora validam `profileId` contra o `resellerId` para prevenir IDOR.
- **Páginas (page.tsx)** — todas as páginas de `/app/*` e `/admin/page.tsx` migradas de `requireAuth` para `getCurrentUser` para evitar throw em Server Components.

---

## 2026-04-22 — Editar Maleta (Admin)

### Criado
- **Server Action `adicionarItensMaleta`** — permite a ADMIN/COLABORADORA adicionar itens a uma maleta `ativa` ou `atrasada`. Regras: apenas acréscimo, valida estoque, novos itens recebem snapshot de preço, itens existentes incrementam `quantidade_enviada` mantendo `preco_fixado`, registra `estoqueMovimento` tipo `reserva_maleta`, dispara push para revendedora. Implementa compensação de rollback se a reserva de estoque falhar (mesmo padrão de `criarMaleta`).
- **Schema Zod `adicionarItensMaletaSchema`** — validação de `maleta_id` + array de `itens` com `product_variant_id` e `quantidade`.
- **Página `/admin/maleta/[id]/editar/`** — interface para adicionar produtos novos ou aumentar quantidade de itens já existentes na consignação. Layout de duas colunas (busca + selecionados), reutilizando padrão visual do admin dark.

### Modificado
- **`src/app/admin/maleta/[id]/page.tsx`** — adicionado botão "Editar Consignación" visível quando status é `ativa` ou `atrasada`.
- **`docs/admin/SPEC_ADMIN_MALETAS.md`** — nova seção "Tela 5: Editar Maleta" com layout, regras de negócio e assinatura da Server Action.
- **`docs/revendedoras/SPEC_MALETA.md`** — adicionado edge case sobre notificação push quando a maleta é editada pelo admin.

---

## 2026-04-22 — Hotfix: Build Error no Vercel

### Corrigido
- **Import inválido do Prisma em `gamificacao.ts`** — O módulo `@/generated/prisma` não existe como entry point; o Prisma gera os arquivos em sub-módulos (`client.ts`, `browser.ts`, etc.). Import corrigido de `@/generated/prisma` para `@/generated/prisma/client`. O erro bloqueava todo o deploy na `main` com `Type error: Cannot find module '@/generated/prisma'`.
- **Propriedade CSS duplicada em `ConferirItemRow.tsx`** — Removida `borderRight` duplicada no objeto `style` que causava erro de TypeScript.

---

## 2026-04-22 — Fechar Maleta sem Comprovante (Admin)

### Modificado
- **`conferirEFecharMaleta`** — aceita parâmetro `cierre_manual_sin_comprobante?: boolean`. Quando `true`:
  - Permite maletas em `ativa`/`atrasada`/`aguardando_revisao` (sem exigir comprovante).
  - Pula validação de `comprovante_devolucao_url`.
  - Registra `nota_acerto` com prefixo `"Cierre manual sin comprobante"`.
- **Schema Zod `conferirMaletaSchema`** — adicionado campo `cierre_manual_sin_comprobante: z.boolean().optional()`.
- **Página `/admin/maleta/[id]/conferir/`** — botão "Cerrar sin Comprobante" na barra inferior de ações, visível quando a maleta está em `aguardando_revisao` sem comprovante. Abre diálogo com campo de justificativa opcional e confirmação.
- **Página `/admin/maleta/[id]/`** — removido botão "Cerrar sin Comprobante" daqui (movido para `/conferir` onde faz mais sentido no fluxo).

## 2026-04-22 — Devolução de Consignación (PWA)

### Criado
- **API de Upload R2** — `POST /api/upload-r2` centraliza uploads autenticados para Cloudflare R2 com validação de path por role, tipo MIME, tamanho máximo (10 MB) e autorização de comprovante por ownership da maleta.
- **Compressão de Imagem Client-Side** — `src/lib/compress-image.ts` usando Canvas API (redimensiona para max 1920px, JPEG 85% qualidade).
- **Fluxo de Devolução Multi-Step** — página `/app/maleta/[id]/devolver` com 4 pasos:
  1. Resumen — totais enviados/vendidos/a devolver, badge de atrasada, info de próximos passos.
  2. Foto — captura via `<input capture="environment">`, preview, opção de retomar.
  3. Revisión final — resumo financeiro + comissão estimada + preview do comprovante + confirmação.
  4. Confirmación — splash de sucesso com status "Esperando Recepción" e link para Início.
- **Server Action `submitDevolucao`** — em `src/app/app/actions-revendedora.ts`: verifica ownership, valida estado (`ativa`/`atrasada`), atualiza para `aguardando_revisao`, salva `comprovante_devolucao_url`, notifica consultora e admins via push (best-effort).

### Modificado
- **`src/app/app/actions-revendedora.ts`** — adicionadas `submitDevolucao` e `notificarDevolucaoPendente`.

## 2026-04-22 — Maleta: PWA da Revendedora

### Criado
- **Validação de Dados** — criados schemas Zod `registrarVendaSchema` e `registrarVendaMultiplaSchema` em `src/lib/validators/maleta.schema.ts`.
- **Motor de Gamificação** — criado utilitário `src/lib/gamificacao.ts` para conceder pontos de forma resiliente.
- **Testes Unitários** — base de testes criada em `src/__tests__/app/maleta-actions.test.ts`.

### Modificado
- **PWA Maletas (`src/app/app/actions-revendedora.ts`)** — adicionado *lock pessimista* (`SELECT FOR UPDATE`), validação Zod e integração da gamificação para pontos normais e bônus de maleta completa nas actions `registrarVenda` e `registrarVendaMultipla`.
- **UI de Imagens** — `MaletaItemRow.tsx` agora utiliza `next/image` otimizado (`unoptimized={true}`).
- **Loading UI** — Adicionados skeletons para carregamento assíncrono das páginas `/app/app/maleta/` e `/app/app/maleta/[id]/`.

### Corrigido
- **Build Error do Next.js** — Removida a dependência do componente inexistente `AppPageHeader` nas rotas de loading e substituída por layouts em HTML (`skeleton`) na funcionalidade `/app/maleta/`.


## 2026-04-20 — Maleta: backlog de flexibilização

### Documentado (pendente implementação)
- Fechamento de maleta pelo admin/consultora sem comprovante de devolução obrigatório (botão "Cerrar sin comprobante" com `nota_acerto` justificando). Ver `docs/next_steps.md` §Alta.
- Edição de maleta após criação — acréscimo de itens e aumento de quantidade enquanto a maleta estiver em `ativa`/`atrasada`. Ver `docs/next_steps.md` §Alta.

## 2026-04-20 — Admin Maleta UI Refatoração

### Refatorado
- Telas admin/maleta alinhadas com design system dark do Paper:
  - `/admin/maleta/` — lista com filtros, stats cards, tabela dark theme
  - `/admin/maleta/[id]/` — detalhe com tabs, info cards, diálogos
  - `/admin/maleta/[id]/conferir/` — conferência com tabela editável, resumo financeiro
  - `/admin/maleta/nova/` — wizard 4 steps (revendedora, prazo, produtos, confirmar)

### Criado
- **8 componentes reutilizáveis admin** em `src/components/admin/`:
  - `AdminPageHeader` — título + descrição + ação + botão voltar
  - `AdminStatCard` — card de estatística com ícone e cor
  - `AdminStatusBadge` — badge de status de maleta (ativa, atrasada, ag. conferência, concluída)
  - `AdminStepIndicator` — indicador de passos para wizard
  - `AdminFilterBar` — barra de busca + filtros select + botão limpar
  - `AdminEmptyState` — estado vazio com ícone, texto e ação
  - `AdminFinancialSummary` — grid de resumo financeiro
  - `AdminAvatar` — avatar com iniciais fallback
- **Helpers centralizados** em `src/lib/maleta-helpers.ts`:
  - `maletaStatusConfig`, `fmtCurrency`, `daysRemaining`, `daysLabel`, `daysColorClass`
- **Tema dark do shadcn/ui** mapeado no `.admin-layout` via CSS variables em `globals.css`

### Removido
- Código duplicado: `statusConfig`, `fmtCurrency`, `daysRemaining` que eram copiados em cada página de maleta

## 2026-02-24 — Sessão 1: Homepage Migration

### Criado
- **Projeto Next.js 15** inicializado (App Router, TypeScript, Tailwind v4, ESLint)
- **Design system** em `globals.css`: Montserrat + Inter, cores da marca, container customizado
- **11 componentes** criados:
  - `Header.tsx` — Announcement bar animado, nav sticky transparent→solid, hamburger menu, logo centralizado, ícones search/cart
  - `HeroBanner.tsx` — Banner full-width com `banner01.jpg`, gradiente de topo (preto→transparente 50%), gradiente lateral (esquerda→direita)
  - `ValueProps.tsx` — 3 cards horizontais (Elegancia, Hechas para vos, Atención)
  - `CategoryTabs.tsx` — Tabs interativos (Aro, Pulsera, Collar, Anillo)
  - `ProductCard.tsx` — Card de produto reutilizável (imagem + nome + preço ₲)
  - `CategoryBanner.tsx` — Banner de categoria com overlay e label
  - `ProductGrid.tsx` — Grid assimétrico misturando ProductCards e CategoryBanners em 4 linhas
  - `ResellerCTA.tsx` — "Sé una Revendedora Autorizada" com gradiente bottom→top
  - `HistoryCTA.tsx` — "Conoce Nuestra Historia" com gradiente top→bottom
  - `FAQ.tsx` — Accordion pill-shaped com 5 perguntas
  - `Footer.tsx` — 3 colunas (enlaces, redes, copyright)
- **Page assembly** em `page.tsx` como Server Component
- **Placeholder SVGs** para produtos e categorias
- **SEO metadata** configurado (title, description, OpenGraph)

### Modificado
- `HeroBanner.tsx` — Imagem trocada de placeholder para `banner01.jpg` (real)
- `HeroBanner.tsx` — Adicionado gradiente de topo `linear-gradient(180deg, #000, transparent 50%)` conforme design WordPress original
- `Header.tsx` — Tentativa de extrair ícone do carrinho para `carrinho.svg`; revertido para SVG inline (arquivo deletado pelo usuário)

### Verificado
- ✅ Build com zero erros
- ✅ Dev server rodando em localhost:3000
- ✅ Screenshots visuais de todas as seções em 1440px
- ✅ Layout consistente com design original do WordPress

## 2026-02-24 — Sessão 2: Painel de Administração e Gestão de Produtos

### Criado
- **Painel Administrativo (`/admin`)** protegido, com layout em Sidebar escura estilo Vercel.
- **Tabela de Produtos (`/admin/produtos`)** com listagem SSR, paginação, busca por nome/SKU e filtro por categoria.
- **Formulário de Produtos (`/admin/produtos/novo` e `[id]`)**:
  - `ImageUploader`: Componente drag-and-drop com upload direto para Cloudflare R2 (bucket `fotos-monarca`).
  - `VariantManager`: Gerenciamento unificado de atributos e precificação para produtos variáveis.
  - `CategorySelect`: Dropdown avançado aninhado, com auto-seleção inteligente de categorias parent/child e busca.
- **Hierarquia de Categorias (`/admin/categorias`)**:
  - Tabela em árvore (Tree View) representando níveis de indentação.
  - CRUD inline completo (edição de nome, remoção com deleção em cascata, adição rápida de subcategorias pai/filho).

### Banco de Dados (Supabase)
- Adição de `parent_id` e `sort_order` à tabela de `categories`.
- Criação de scripts de migração (`seed-hierarchy.ts` e `migrate-products.ts`) que mapearam o caminho textual original legado (ex: `Aros > Grandes`) em nós relacionais em árvore robustos.
- Conexão e armazenamento corretos em bucket de Storage customizado via `S3Client`.

### Verificado
- ✅ Build otimizada do Next.js passando sem vazamento de erros de Hidratação (fix aplicado no RootLayout).
- ✅ Relacionamento Bidirecional de Categorias operando suavemente no Componente.
- ✅ Upload de imagens funcionando com feedback visual em tempo real.

## 2026-02-24 — Sessão 3: Página de Produto Pública e Integração de Dados

### Criado
- **Rota dinâmica `/produto/[slug]/page.tsx`**: Página pública de detalhe do produto com layout em duas colunas:
  - Coluna esquerda: Imagem principal responsiva (aspect 4:5).
  - Coluna direita: Nome, preço (₲), botão "Agregar a mi joyero", descrição e SKU.
- **Server Actions públicas (`src/app/actions.ts`)**:
  - `getProductBySlug()` — busca produto completo com variantes.
  - `getRelatedProducts()` — busca produtos para seção "Más Productos para Explorar".
- **Seção de produtos relacionados** com grid 2×2 (mobile) / 4 colunas (desktop) no fim da página.
- **Faixa de envíos** — barra preta estática com mensagem de frete.

### Modificado
- `ProductCard.tsx` — Agora recebe `id` como prop e envolve o card com `<Link>` para `/produto/{id}`.
- `ProductGrid.tsx` — Convertido de componente estático com dados mock para **Server Component async** que busca dados reais do Supabase.
- `CategorySelect.tsx` — Seleção inteligente: marcar filho auto-seleciona o pai; desmarcar pai remove todos os filhos.
- `layout.tsx` — Adicionado `suppressHydrationWarning` para suprimir erros de hydration causados por extensões do navegador.

### Scripts de Migração
- `scripts/migrate-products.ts` — Migrou 2014 produtos de caminhos flat legado ("Collar > Con dije") para nomes de nó corretos da árvore hierárquica.

### Verificado
- ✅ Página de produto renderiza dados reais do banco (nome, preço, descrição, SKU, imagem).
- ✅ Grid da homepage puxa produtos reais do Supabase com links funcionais.
- ✅ Navegação Homepage → Produto funcionando corretamente.
- ✅ Build sem erros de hydration.

## 2026-04-19 — Sessão 4: Ciclo Completo da Maleta no Admin

### Criado
- **Server Action `conferirEFecharMaleta`** — fluxo de conferência e fechamento com RBAC (`requireAuth`), validação Zod, `quantidade_recebida`, `nota_acerto`, `EstoqueMovimento`, gamificação (`atribuirXP`), push notification, snapshot financeiro imutável
- **Server Action `fecharManualmenteMaleta`** — admin força fechamento de maleta ativa/atrasada, move para `aguardando_revisao`
- **Server Action `getColaboradoras`** — dropdown de filtro por consultora na listagem
- **Página `/admin/maleta/[id]/conferir`** — formulário interativo com tabela de conferência (Enviado/Vendido/Esperado/Recebido/Dif.), comprovante viewer (lightbox), preview financeiro em tempo real, campo de nota do acuerdo, alerta de divergência, botão WhatsApp
- **Model `EstoqueMovimento`** no Prisma — trilha de auditoria de estoque com enum `EstoqueMovimentoTipo` (`reserva_maleta`, `devolucao_maleta`, `ajuste_manual`, `venda_direta`), migração aplicada no Supabase
- **`conferirMaletaSchema`** (Zod) — validação de `quantidade_recebida` e `nota_acerto`
- **Validação comprovante obrigatório** no `conferirEFecharMaleta` — bloqueia conferência sem comprovante

### Modificado
- **`getMaletas`** — adicionados parâmetros `colaboradoraId`, `search`, `dataInicio`, `dataFim`; RBAC automático (COLABORADORA só vê suas maletas)
- **`criarMaleta`** — adicionado RBAC (COLABORADORA só cria para suas revendedoras), validação de maleta ativa por revendedora, `EstoqueMovimento` na reserva, campo `criada_por`
- **Página `/admin/maleta`** (listagem) — filtros por consultora, busca por revendedora, card "Total Vendido", badge "Conferir" em `aguardando_revisao`, coluna `#numero`
- **Página `/admin/maleta/[id]`** (detalhe) — abas (Itens/Acuerdo/Historial), botão "Cerrar Manualmente" com modal, botão "Conferir Consignación" para `aguardando_revisao`, resumo financeiro congelado na aba Acuerdo
- **Tipos** (`MaletaListItem`, `MaletaDetail`, `MaletaItemDetail`) — adicionados campos `numero`, `valor_total_enviado`, `pct_comissao_aplicado`, `nota_acerto`, `quantidade_recebida`, `colaboradora`
- **Mapper** (`maleta.mapper.ts`) — expandido para mapear novos campos incluindo `colaboradora`
- **`next_steps.md`** — item 1 marcado como `[~]` com sub-itens detalhados

## 2026-04-20 — Sessão 5: Fix de transações Prisma 7 + PrismaPg

### Corrigido
- **Bug crítico: `Cannot read properties of undefined (reading 'create')`** — Prisma 7 com driver adapter `PrismaPg` não suporta transações interativas (`$transaction(async tx => {...})`). O `tx` chega como `undefined`, causando erro em todas as operações dentro do callback.
- **`criarMaleta`** — Refatorada: validações (RBAC, maleta ativa, stock) como pre-reads fora da transação; criação da maleta como operação isolada; decrementos de stock como operações sequenciais com compensação (delete maleta se falhar); movimentos de estoque como writes sequenciais não-críticos; push notification fora da transação (best-effort).
- **`conferirEFecharMaleta`** — Refatorada: pre-read da maleta + validações fora da transação; operações batch em `$transaction([arr])` para update de itens, incrementos de stock, movimentos de estoque e freeze de valores; gamificação e push notification como best-effort fora da transação.
- **`conciliarMaleta`** (legado) — Refatorada de transação interativa para pre-read + `$transaction([arr])` batch.
- **`fecharMaleta`** — Refatorada de transação interativa para `$transaction([arr])` batch.
- **`fecharManualmenteMaleta`** — Refatorada: pre-read com RBAC + validação de status; operações batch em `$transaction([arr])`.

### Verificado
- ✅ Lint sem erros em `actions-maletas.ts`
- ✅ TypeScript sem novos erros (erros pré-existentes em outros arquivos)
- ✅ Nenhuma transação interativa (`$transaction(async tx => ...)`) restante no arquivo
