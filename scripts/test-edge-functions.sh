#!/bin/bash
# =============================================================================
# Script de Teste — Edge Functions de Cron Jobs (Supabase)
# =============================================================================
# Uso: bash scripts/test-edge-functions.sh
#
# Pré-requisitos:
#   - Supabase CLI instalado: npm install -g supabase
#   - Logado no Supabase CLI: npx supabase login
#   - Variáveis de ambiente configuradas no Dashboard das Edge Functions
# =============================================================================

set -e

PROJECT_REF="amlwwakxpungeqpiyxwr"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "============================================================================="
echo "  TESTE — Edge Functions de Cron Jobs (Monarca)"
echo "============================================================================="
echo ""

# ------------------------------------------------------------------------------
# 0. Verificar login no Supabase CLI
# ------------------------------------------------------------------------------
echo "[0/5] Verificando login no Supabase CLI..."
if ! npx supabase projects list >/dev/null 2>&1; then
    echo "  ❌ Não está logado no Supabase CLI."
    echo "  Execute: npx supabase login"
    echo "  E depois: npx supabase link --project-ref ${PROJECT_REF}"
    exit 1
fi
echo "  ✅ Logado no Supabase CLI"
echo ""

# ------------------------------------------------------------------------------
# 1. Deploy das Edge Functions
# ------------------------------------------------------------------------------
echo "[1/5] Fazendo deploy das Edge Functions..."
echo "  → check-maleta-prazo"
npx supabase functions deploy check-maleta-prazo --project-ref ${PROJECT_REF}
echo "  → marcar-maletas-atrasadas"
npx supabase functions deploy marcar-maletas-atrasadas --project-ref ${PROJECT_REF}
echo "  → agrega-analytics-diario"
npx supabase functions deploy agrega-analytics-diario --project-ref ${PROJECT_REF}
echo "  ✅ Deploy concluído"
echo ""

# ------------------------------------------------------------------------------
# 2. Verificar variáveis de ambiente
# ------------------------------------------------------------------------------
echo "[2/5] Verificando variáveis de ambiente das Edge Functions..."
echo "  Acesse: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/functions"
echo "  Certifique-se de que estas variáveis estão configuradas:"
echo "    - SUPABASE_URL=${SUPABASE_URL}"
echo "    - SUPABASE_SERVICE_ROLE_KEY=***"
echo "    - ONESIGNAL_APP_ID=400a793c-dd76-4433-b07c-dc32745d0741"
echo "    - ONESIGNAL_REST_API_KEY=***"
echo ""
read -p "  Pressione ENTER quando as variáveis estiverem configuradas..."
echo ""

# ------------------------------------------------------------------------------
# 3. Teste manual via HTTP (invoke)
# ------------------------------------------------------------------------------
echo "[3/5] Testando Edge Functions via HTTP..."
echo ""

# Obter service role key do ambiente local (ou pedir ao usuário)
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
if [ -z "$SERVICE_ROLE_KEY" ]; then
    read -s -p "  Digite o SUPABASE_SERVICE_ROLE_KEY: " SERVICE_ROLE_KEY
    echo ""
fi

echo ""
echo "  --- Teste 1: check-maleta-prazo ---"
curl -s -X POST "${SUPABASE_URL}/functions/v1/check-maleta-prazo" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat
echo ""

echo "  --- Teste 2: marcar-maletas-atrasadas ---"
curl -s -X POST "${SUPABASE_URL}/functions/v1/marcar-maletas-atrasadas" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat
echo ""

echo "  --- Teste 3: agrega-analytics-diario ---"
curl -s -X POST "${SUPABASE_URL}/functions/v1/agrega-analytics-diario" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat
echo ""

echo "  ✅ Chamadas HTTP enviadas"
echo ""

# ------------------------------------------------------------------------------
# 4. Verificar logs
# ------------------------------------------------------------------------------
echo "[4/5] Como verificar logs:"
echo "  Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
echo "  Clique em cada function → 'Invocations' para ver logs em tempo real."
echo ""

# ------------------------------------------------------------------------------
# 5. Configurar pg_cron (SQL)
# ------------------------------------------------------------------------------
echo "[5/5] Configurando pg_cron..."
echo "  Execute no SQL Editor do Supabase Dashboard:"
echo "    https://supabase.com/dashboard/project/${PROJECT_REF}/sql"
echo ""
echo "  Cole o conteúdo de: scripts/setup-cron-jobs.sql"
echo ""
echo "  Ou execute via psql (se tiver acesso direto):"
echo "    psql 'DATABASE_URL' -f scripts/setup-cron-jobs.sql"
echo ""

echo "============================================================================="
echo "  ✅ Script de teste concluído!"
echo "============================================================================="
echo ""
echo "Próximos passos:"
echo "  1. Verifique os logs no Supabase Dashboard"
echo "  2. Confirme que as notificações apareceram no PWA (/app/notificaciones)"
echo "  3. Verifique se analytics_diario foi populado (se houver dados em analytics_acessos)"
echo ""
