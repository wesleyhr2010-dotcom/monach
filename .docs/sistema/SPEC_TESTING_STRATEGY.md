# SPEC — Estratégia de Testes

> Define tecnologias, cobertura obrigatória e casos de teste críticos para o sistema.

---

## 1. Stack de Testes

| Tipo | Ferramenta | Escopo |
|------|-----------|--------|
| Unitário | Vitest | Funções puras, cálculos, helpers |
| Integração | Vitest + Prisma Client de Teste | Server Actions com banco real |
| E2E | Playwright | Fluxos completos via browser |
| Mocks HTTP | MSW (Mock Service Worker) | Supabase Auth, OneSignal, Brevo em unit tests |

---

## 2. Cobertura Mínima Exigida

| Camada | Cobertura Mínima |
|--------|-----------------|
| Funções de cálculo (`src/lib/math/`) | 90% |
| Server Actions críticas | 80% |
| Componentes React | 40% (apenas lógica, não visual) |
| Fluxos E2E | 5 fluxos principais |

---

## 3. Testes Unitários — Funções Críticas

### 3.1 `computeCommissionPct`

```ts
// tests/unit/math.commissions.test.ts
describe('computeCommissionPct', () => {
  it('retorna taxa base quando vendas = 0', async () => { /* ... */ });
  it('sobe para o tier ao atingir exatamente o mínimo', async () => { /* ... */ });
  it('usa o tier mais alto quando vendas superam múltiplos', async () => { /* ... */ });
  it('reseta no início do mês (sem maletas do mês anterior)', async () => { /* ... */ });
  it('ignora maletas não concluídas no cálculo', async () => { /* ... */ });
});
```

### 3.2 `closeMaleta` — Cálculos Financeiros

```ts
// tests/unit/math.closeMaleta.test.ts
describe('closeMaleta — cálculos financeiros', () => {
  it('calcula comissão da revendedora corretamente', async () => { /* ... */ });
  it('calcula comissão da colaboradora corretamente', async () => { /* ... */ });
  it('comissão da colaboradora = 0 quando revendedora não tem colaboradora', async () => { /* ... */ });
  it('congela os valores financeiros (snapshot imutável)', async () => { /* ... */ });
  it('valor_total_enviado = soma de (preco_fixado × qtd_enviada)', async () => { /* ... */ });
  it('valor_total_vendido = soma de (preco_fixado × qtd_vendida)', async () => { /* ... */ });
});
```

### 3.3 Validação Zod — Schemas

```ts
// tests/unit/zod.schemas.test.ts
describe('createMaletaSchema', () => {
  it('aceita payload válido', () => { /* ... */ });
  it('rejeita quantidade de produto = 0', () => { /* ... */ });
  it('rejeita reseller_id inválido (não UUID)', () => { /* ... */ });
  it('rejeita lista de itens vazia', () => { /* ... */ });
});

describe('submitDevolucaoSchema', () => {
  it('aceita payload com comprovante_url válida', () => { /* ... */ });
  it('rejeita URL de comprovante inválida', () => { /* ... */ });
});
```

### 3.4 Gamificação — `awardPoints`

```ts
describe('awardPoints', () => {
  it('concede pontos e cria entrada no extrato', async () => { /* ... */ });
  it('não concede tipo=unico se já concedido anteriormente', async () => { /* ... */ });
  it('rejeita resgate quando saldo insuficiente', async () => { /* ... */ });
  it('resgate cria entrada negativa no extrato', async () => { /* ... */ });
  it('limite_diario: bloqueia após atingir limite', async () => { /* ... */ });
});
```

---

## 4. Testes de Integração — Server Actions com Banco

Usar banco de dados de teste isolado (Supabase local via Docker ou banco de teste dedicado).

### 4.1 `createMaleta` — Lock de Estoque

```ts
// tests/integration/lock.createMaleta.test.ts
describe('createMaleta — lock de estoque', () => {
  it('impede estoque negativo em requisições concorrentes', async () => {
    // Setup: produto com estoque = 1
    // Executar 2 createMaleta() simultâneas para o mesmo produto
    // Uma deve ter sucesso, a outra deve retornar INSUFFICIENT_STOCK
    const [result1, result2] = await Promise.all([
      createMaleta({ items: [{ product_variant_id: variantId, quantidade: 1 }] }),
      createMaleta({ items: [{ product_variant_id: variantId, quantidade: 1 }] }),
    ]);
    
    const successes = [result1, result2].filter(r => r.success);
    const failures  = [result1, result2].filter(r => !r.success);
    
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].code).toBe('INSUFFICIENT_STOCK');
  });

  it('não cria maleta se revendedora já tem uma ativa', async () => { /* ... */ });
  it('decrementa estoque corretamente após criação', async () => { /* ... */ });
});
```

### 4.2 `closeMaleta` — Fluxo Completo

```ts
describe('closeMaleta — fluxo completo', () => {
  it('restaura estoque dos itens não vendidos', async () => { /* ... */ });
  it('dispara awardPoints após fechar', async () => { /* ... */ });
  it('muda status da maleta para "concluida"', async () => { /* ... */ });
  it('não permite fechar maleta já concluída', async () => { /* ... */ });
});
```

---

## 5. Testes E2E — Playwright

### 5.1 Fluxo: Login → Dashboard

```ts
// tests/e2e/login.spec.ts
test('login com credenciais válidas redireciona para /app', async ({ page }) => {
  await page.goto('/app/login');
  await page.fill('[name=email]', 'revendedora@test.com');
  await page.fill('[name=password]', 'test123456');
  await page.click('[type=submit]');
  await expect(page).toHaveURL('/app');
  await expect(page.locator('h1')).toContainText('Hola');
});

test('login com senha errada exibe erro legível', async ({ page }) => {
  // ...
  await expect(page.locator('[role=alert]')).toContainText('Contraseña incorrecta');
});
```

### 5.2 Fluxo: Registrar Venda na Maleta

```ts
// tests/e2e/maleta.spec.ts
test('registrar venda incrementa quantidade vendida', async ({ page }) => {
  // Login como revendedora com maleta ativa
  // Navegar para /app/maleta
  // Clicar em "Registrar Venta"
  // Preencher dados do cliente e confirmar
  // Verificar que qtd_vendida aumentou +1
});
```

### 5.3 Fluxo: Admin Cria Maleta

```ts
// tests/e2e/admin-maleta.spec.ts
test('admin cria maleta para revendedora', async ({ page }) => {
  // Login como admin
  // Navegar para /admin/maletas/nueva
  // Selecionar revendedora, produtos, prazo
  // Confirmar
  // Verificar que maleta aparece na lista
});
```

### 5.4 Fluxo: Resgate de Brinde

```ts
// tests/e2e/brindes.spec.ts
test('revendedora resgata brinde com saldo suficiente', async ({ page }) => {
  // Login com revendedora que tem > 200 pontos
  // Navegar para /app/progreso/regalos
  // Clicar em "Canjear" em um brinde disponível
  // Confirmar modal
  // Verificar que saldo diminuiu e solicitação aparece no histórico
});
```

### 5.5 Fluxo: Devolução com Câmera

```ts
// tests/e2e/devolucao.spec.ts
test('revendedora inicia devolução e envia comprovante', async ({ page, context }) => {
  // Conceder permissão de câmera no contexto
  await context.grantPermissions(['camera']);
  // Navegar para /app/maleta/[id]/devolver
  // Completar steps 1, 2, 3
  // Verificar redirect para /app com mensagem de sucesso
});
```

---

## 6. Setup de Ambiente de Teste

### Variáveis de Ambiente para Testes

```env
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"
# Supabase local (docker)
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..." # chave local do supabase start
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
# R2 mock (Miniflare ou similar)
R2_ACCOUNT_ID="test"
R2_ACCESS_KEY_ID="test"
R2_SECRET_ACCESS_KEY="test"
R2_BUCKET_NAME="test-bucket"
R2_PUBLIC_URL="http://localhost:9000"
```

### Vitest Config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
```

---

## 7. Scripts no `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:integration": "vitest run --reporter=verbose tests/integration"
  }
}
```

---

## 8. CI — Testes no Pipeline

Ver `SPEC_DEPLOY_STRATEGY.md` para integração com GitHub Actions.

Requisitos para PR ser aceito:
- `test` passa (unitários + integração)
- `test:coverage` >= limites definidos
- `test:e2e` passa nos 5 fluxos principais
