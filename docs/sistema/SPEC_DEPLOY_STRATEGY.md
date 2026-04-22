# SPEC — Deploy, CI/CD e Rollback

## Objetivo
Documentar a estratégia completa de deploy do NEXT-MONARCA em Vercel + Supabase, o pipeline CI/CD via GitHub Actions e os procedimentos de rollback em caso de incidente.

## Atores
- **Desenvolvedores** — abrem PRs; Vercel gera preview.
- **GitHub Actions** — executa validações (lint, tests, build).
- **Vercel** — hospeda Next.js; cada push em main vai para produção.
- **Supabase** — banco e edge functions.
- **Admin de release** — executa rollbacks manuais quando necessário.

## Fluxo
1. Dev abre PR → CI roda lint, typecheck, tests, build; Vercel gera preview.
2. Revisão + merge na `staging` → deploy automático em `staging.monarca.com.py` com banco de staging.
3. Depois de validar, merge em `main` → deploy em produção (`monarca.com.py`).
4. Migrations Prisma aplicadas antes do deploy via pipeline.
5. Em incidente → rollback via Vercel (versão anterior) + migrations reversas se necessário.

## Regras de negócio
- Branch `main` = produção; `staging` = staging; PR = preview.
- Migrations destrutivas exigem plano explícito.
- Nenhum secret em código; todos em env do Vercel/Supabase.
- Rollback deve ser possível em ≤ 5 min para versão anterior.
- Produção só recebe merges aprovados com CI verde.

## Edge cases
- Migration aplica mas deploy falha → rollback de código + revert da migration.
- Preview cria recursos (ex.: buckets) → limpeza automática no close do PR.
- Falha intermitente do Supabase → retry no pipeline; alertar.
- Feature flag não aplicada → comportamento default do código (seguro).
- Deploy simultâneo de múltiplos PRs em staging → Vercel gerencia filas.

## Dependências
- `SPEC_ENVIRONMENT_VARIABLES.md` — secrets.
- `SPEC_MIGRATIONS_SEED.md` — aplicar migrations.
- `SPEC_LOGGING_MONITORING.md` — alertas.
- `SPEC_TESTING_STRATEGY.md` — CI gates.

---

## Detalhes técnicos / Referência

> Estratégia completa de deploy para Vercel + Supabase, com pipeline CI/CD e procedimentos de rollback.

---

## 1. Ambientes

| Ambiente | Branch | URL | Banco |
|---------|--------|-----|-------|
| **Development** | local | `localhost:3000` | Supabase local (Docker) |
| **Preview** | PRs e branches | `monarca-git-branch.vercel.app` | Supabase staging |
| **Staging** | `staging` | `staging.monarca.com.py` | Supabase staging |
| **Production** | `main` | `monarca.com.py` | Supabase produção |

---

## 2. Pipeline CI/CD — GitHub Actions

### Arquivo: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit + Integration Tests
        run: npm run test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          DIRECT_URL: ${{ secrets.TEST_DIRECT_URL }}
          # ... demais variáveis de teste

      - name: Coverage check
        run: npm run test:coverage

  e2e:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v4
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          # ... credenciais de teste E2E

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [validate, e2e]
    if: github.ref == 'refs/heads/staging'
    steps:
      - name: Deploy to Vercel (Staging)
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }} --env staging

      - name: Run Migrations (Staging)
        run: npx prisma migrate deploy
        env:
          DIRECT_URL: ${{ secrets.STAGING_DIRECT_URL }}

      - name: Smoke Test
        run: curl -f ${{ secrets.STAGING_URL }}/api/health

  deploy-production:
    runs-on: ubuntu-latest
    needs: [validate, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel (Production)
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}

      - name: Run Migrations (Production)
        run: npx prisma migrate deploy
        env:
          DIRECT_URL: ${{ secrets.PROD_DIRECT_URL }}

      - name: Smoke Test
        run: curl -f https://monarca.com.py/api/health
```

---

## 3. Secrets do GitHub Actions

| Secret | Usado em |
|--------|---------|
| `VERCEL_TOKEN` | Deploy Vercel |
| `VERCEL_ORG_ID` | Deploy Vercel |
| `VERCEL_PROJECT_ID` | Deploy Vercel |
| `TEST_DATABASE_URL` | Testes de integração |
| `TEST_DIRECT_URL` | Testes de integração |
| `STAGING_DIRECT_URL` | Migrations staging |
| `PROD_DIRECT_URL` | Migrations produção |
| `STAGING_URL` | Smoke tests |

> Configurar em: GitHub repo → Settings → Secrets and Variables → Actions

---

## 4. Fluxo de Deploy

### Deploy de Feature Normal

```
1. Developer abre PR de feature/xxx → main
2. CI roda: typecheck + lint + tests + E2E
3. Vercel gera Preview URL automaticamente
4. Review no PR
5. Merge para main
6. CI dispara deploy para produção
7. Migrations executadas automaticamente (prisma migrate deploy)
8. Smoke test valida /api/health
```

### Deploy de Hotfix (Urgente)

```
1. Criar branch hotfix/xxx a partir de main
2. Corrigir o bug
3. PR diretamente para main
4. CI roda (pipeline completo)
5. Merge aprovado → deploy automático
```

---

## 5. Supabase Edge Functions — Deploy

```bash
# Deploy individual
supabase functions deploy prazo-notification --project-ref $SUPABASE_PROJECT_REF

# Deploy todas as functions
supabase functions deploy --project-ref $SUPABASE_PROJECT_REF

# Verificar logs pós-deploy
supabase functions logs prazo-notification --project-ref $SUPABASE_PROJECT_REF
```

Incluir no pipeline CI quando arquivos em `supabase/functions/` forem alterados.

---

## 6. Zero-Downtime Deployment

Vercel gerencia automaticamente deploys com zero downtime:
- Novo deployment fica em "warming up"
- Tráfego só é redirecionado após health check passar
- Instâncias antigas ficam ativas por 60s após troca

### Migrations: Compatibilidade com Zero-Downtime

Migrations devem ser **aditivas** (nunca destrutivas em produção direta):

```
✅ SEGURO: Adicionar nova coluna nullable
✅ SEGURO: Criar nova tabela
✅ SEGURO: Adicionar índice com CONCURRENTLY
❌ RISCO: DROP COLUMN (pode quebrar versão anterior em execução)
❌ RISCO: ALTER COLUMN ... NOT NULL (bloqueia tabela)
❌ RISCO: Renomear tabela ou coluna (quebra código ainda rodando)
```

**Para migrations destrutivas:**
1. Deploy 1: Adicionar novo campo/tabela (código lê ambos)
2. Deploy 2: Migrar dados
3. Deploy 3: Remover campo antigo

---

## 7. Rollback

### Rollback de Aplicação (Vercel)

```bash
# Via Vercel Dashboard: Deployments → [deployment anterior] → Promote to Production
# Ou via CLI:
vercel rollback [deployment-url] --token $VERCEL_TOKEN
```

**Tempo estimado:** < 2 minutos

### Rollback de Migration (Banco de Dados)

> ⚠️ Rollback de banco é arriscado. Evitar ao máximo com design aditivo.

```bash
# Opção 1: Reverter migration específica (se Prisma suportar)
npx prisma migrate resolve --rolled-back "20260115_add_campo_xyz"

# Opção 2: Restaurar backup (último resort)
psql "$DIRECT_URL" < backup_pre_deploy.sql
```

**Antes de qualquer deploy com migration:**
```bash
supabase db dump -f "backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql" --linked
```

---

## 8. Smoke Tests Pós-Deploy

Script executado automaticamente após cada deploy:

```bash
#!/bin/bash
BASE_URL=${1:-"https://monarca.com.py"}

echo "Smoke testing $BASE_URL..."

# Health check
curl -sf "$BASE_URL/api/health" | jq '.database == true' || exit 1
echo "✅ Database: OK"

# Login page carrega
curl -sf "$BASE_URL/app/login" > /dev/null || exit 1
echo "✅ Login page: OK"

# Vitrine pública (cache warm)
curl -sf "$BASE_URL/vitrina/test-slug" > /dev/null || exit 1
echo "✅ Vitrine: OK"

echo "✅ All smoke tests passed!"
```

---

## 9. Variáveis de Ambiente no Vercel

Configurar no painel Vercel → Settings → Environment Variables:

- Marcar cada var com os ambientes corretos (Production / Preview / Development)
- **Nunca** colocar credenciais de produção em variáveis de Preview/Development
- Usar `ENCRYPTION_KEY` diferente por ambiente

---

## 10. Checklist de Release

```
Antes do deploy:
[ ] Testes passando (CI verde)
[ ] Migration revisada para segurança zero-downtime
[ ] Backup do banco feito (se tem migration)
[ ] CHANGELOG.md atualizado
[ ] Env vars novas adicionadas no Vercel

Durante o deploy:
[ ] Monitorar Vercel Deployment logs
[ ] Monitorar Supabase Dashboard (queries, erros)

Após o deploy:
[ ] Smoke tests passando
[ ] Verificar Sentry: novos erros?
[ ] Testar fluxo principal manualmente (login → dashboard)
[ ] Comunicar a equipe se houver impacto visível
```
