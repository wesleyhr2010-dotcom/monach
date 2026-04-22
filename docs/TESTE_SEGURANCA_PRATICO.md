# Guia de Testes Práticos de Segurança — RBAC

> Este guia descreve como validar na prática, em ambiente de desenvolvimento ou staging, que todas as correções da auditoria RBAC 2026-04-22 estão funcionando.

---

## 1. Testes Automatizados (rode primeiro)

```bash
# Todos os testes unitários e de regressão
npm test
```

**Esperado:** 42 testes passando (38 existentes + 4 novos do cron job).

---

## 2. Teste do Cron Job (`/api/cron/check-overdue-maletas`)

### 2.1 Sem token (deve bloquear)
```bash
curl -i http://localhost:3000/api/cron/check-overdue-maletas
```
**Esperado:** `HTTP/1.1 401 Unauthorized`

### 2.2 Com token incorreto (deve bloquear)
```bash
curl -i -H "Authorization: Bearer wrong-secret" \
  http://localhost:3000/api/cron/check-overdue-maletas
```
**Esperado:** `HTTP/1.1 401 Unauthorized`

### 2.3 Com token correto (deve executar)
```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/check-overdue-maletas
```
**Esperado:** `HTTP/1.1 200 OK`, corpo JSON com `{ "success": true, "updated": N }`

### 2.4 Sem CRON_SECRET configurado no servidor (fail-closed)
Remova a variável `CRON_SECRET` do `.env` e reinicie o servidor. Repita o teste 2.3.
**Esperado:** `HTTP/1.1 401 Unauthorized` (o endpoint NÃO deve funcionar sem secret configurado).

---

## 3. Testes Manuais no Browser — Middleware

### 3.1 Usuário sem perfil no banco não acessa `/admin`
1. Crie uma conta no Supabase Auth com email/senha.
2. **NÃO crie** um registro correspondente em `resellers`.
3. Faça login e tente acessar `http://localhost:3000/admin`.

**Esperado:** Redirecionamento para `/app` (middleware fail-closed).

### 3.2 Query Supabase falha (simulação)
Não é trivial simular falha de query no middleware. Como proxy, verifique que o middleware usa:
```ts
if (userRole !== 'ADMIN' && userRole !== 'COLABORADORA') {
    url.pathname = "/app"
    return NextResponse.redirect(url)
}
```
Isso garante que `userRole === null` (query falhou ou perfil não existe) sempre redireciona para `/app`.

### 3.3 REVENDEDORA bloqueada em `/admin`
1. Faça login com uma conta de revendedora.
2. Tente acessar `http://localhost:3000/admin`.

**Esperado:** Redirecionamento para `/app`.

### 3.4 COLABORADORA bloqueada em rotas exclusivas
1. Faça login com uma conta de colaboradora.
2. Tente acessar:
   - `http://localhost:3000/admin/productos`
   - `http://localhost:3000/admin/gamificacion`
   - `http://localhost:3000/admin/brindes`
   - `http://localhost:3000/admin/commission-tiers`
   - `http://localhost:3000/admin/contratos`
   - `http://localhost:3000/admin/equipo/consultoras`

**Esperado:** Redirecionamento para `/admin`.

---

## 4. Testes Manuais — Server Actions (via UI)

### 4.1 `devolverMaleta` — ownership check
1. Login como revendedora A.
2. Abra o DevTools → Network.
3. Tente manipular uma maleta que pertence à revendedora B (via tampering de requisição ou console).

**Esperado:** Erro `"Consignación no encontrada."` — a action verifica `reseller_id` antes de atualizar.

### 4.2 `getActiveResellers` — scope COLABORADORA
1. Login como colaboradora X.
2. Acesse a tela de criar maleta (`/admin/maleta/nova`).
3. Observe a lista de revendedoras disponíveis.

**Esperado:** Apenas revendedoras cujo `colaboradora_id = X` aparecem na lista.

### 4.3 `getAvailableVariants` — autenticação
1. Faça logout.
2. Tente acessar diretamente o endpoint interno que chama `getAvailableVariants` (via console ou tampering).

**Esperado:** Erro `"BUSINESS: Sesión no válida..."` — a action exige `requireAuth`.

### 4.4 `registrarVenda` — `preco_fixado` do banco
1. Login como revendedora.
2. Vá para uma maleta ativa → "Registrar Venta".
3. No DevTools, intercepte a requisição e tente enviar `preco_unitario: 0`.

**Esperado:** A venda é registrada com o `preco_fixado` da maleta, não com `0`. O campo `preco_unitario` do input é ignorado pelo servidor.

---

## 5. Teste de Auto-link de Email

### 5.1 Takeover de ADMIN/COLABORADORA bloqueado
1. No banco, crie um perfil `role=ADMIN` ou `role=COLABORADORA` com `auth_user_id=null` e um email conhecido.
2. Registre uma nova conta Supabase Auth com esse mesmo email.
3. Faça login.

**Esperado:** `getCurrentUser` retorna `null` (não faz auto-link). O usuário não recebe contexto de ADMIN/COLABORADORA.

### 5.2 Auto-link de REVENDEDORA funciona
1. No banco, crie um perfil `role=REVENDEDORA` com `auth_user_id=null` e um email conhecido.
2. Registre uma nova conta Supabase Auth com esse mesmo email.
3. Faça login.

**Esperado:** `getCurrentUser` retorna o perfil vinculado. A revendedora consegue acessar o PWA normalmente.

---

## 6. Teste de COLABORADORA + `assertIsInGroup`

### 6.1 Acesso negado a dados fora do grupo
1. Login como colaboradora X.
2. Tente acessar diretamente (via URL ou console) dados de uma revendedora Y que **não** pertence ao grupo de X.

**Esperado:** Erro `"BUSINESS: Esta revendedora no pertenece a tu equipo."`

### 6.2 Acesso permitido dentro do grupo
1. Login como colaboradora X.
2. Acesse dados de uma revendedora Z que **pertence** ao grupo de X.

**Esperado:** Dados carregam normalmente.

---

## 7. Checklist Final

| # | Teste | Como verificar | Status |
|---|-------|---------------|--------|
| 1 | `npm test` passa | Rode no terminal | [ ] |
| 2 | Cron job sem token = 401 | `curl` sem header | [ ] |
| 3 | Cron job com token = 200 | `curl` com `CRON_SECRET` | [ ] |
| 4 | Usuário sem perfil não entra em `/admin` | Criar auth_user sem reseller | [ ] |
| 5 | REVENDEDORA redirecionada de `/admin` | Login como revendedora | [ ] |
| 6 | COLABORADORA redirecionada de rotas exclusivas | Acessar `/admin/productos` | [ ] |
| 7 | `devolverMaleta` verifica ownership | Tentar devolver maleta de outra | [ ] |
| 8 | `getActiveResellers` filtra por colaboradora | Criar maleta como colab | [ ] |
| 9 | `registrarVenda` ignora preço do cliente | Interceptar request no DevTools | [ ] |
| 10 | Auto-link bloqueado para ADMIN/COLABORADORA | Criar perfil com auth_user_id=null | [ ] |
| 11 | `assertIsInGroup` bloqueia COLABORADORA fora do grupo | Acessar revendedora de outro grupo | [ ] |

---

*Última atualização: 2026-04-22*
