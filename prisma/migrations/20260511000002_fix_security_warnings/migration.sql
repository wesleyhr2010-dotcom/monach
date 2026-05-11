-- Migration: fix_security_warnings
-- Data: 2026-05-11
-- Motivo: Corrigir 6 warnings do Supabase Security Advisor:
--   1. Function Search Path Mutable → aggregate_yesterday_analytics, update_updated_at_column
--   2. RLS Policy Always True → analytics_acessos, categories
--   3. Extension in Public (pg_net) → aceitável, gerenciado pelo Supabase
--   4. Leaked Password Protection → configurar via Auth dashboard (não via SQL)

-- ============================================================
-- FIX 1: Function Search Path Mutable
-- Usa ALTER FUNCTION para adicionar SET search_path TO 'public'
-- sem reescrever a lógica interna das funções.
-- ============================================================

-- Função de trigger para update de updated_at
ALTER FUNCTION public.update_updated_at_column()
  SET search_path TO 'public';

-- Função de agregação de analytics do dia anterior
ALTER FUNCTION public.aggregate_yesterday_analytics()
  SET search_path TO 'public';

-- ============================================================
-- FIX 2: RLS Policy Always True
-- Dropar as policies USING (true) existentes e NÃO recriar
-- nenhuma policy permissiva. Sem policy = deny all via PostgREST.
-- O acesso é controlado pela aplicação via service_role.
-- ============================================================

-- Drop todas as policies da tabela analytics_acessos
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analytics_acessos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.analytics_acessos', pol.policyname);
  END LOOP;
END;
$$;

-- Drop todas as policies da tabela categories
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
  END LOOP;
END;
$$;

-- ============================================================
-- NOTA: Extension in Public (pg_net)
-- pg_net é gerenciado pelo Supabase internamente para
-- requisições HTTP assíncronas. Não é possível mover para
-- outro schema sem afetar o Supabase. Warning aceitável.
--
-- NOTA: Leaked Password Protection
-- Esta configuração está no Supabase Auth dashboard:
-- Authentication → Settings → "Enable leaked password protection"
-- Não pode ser ativada via SQL migration.
-- ============================================================
