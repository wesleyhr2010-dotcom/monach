-- Migration: enable_rls_all_tables
-- Data: 2026-05-11
-- Motivo: O Supabase Security Advisor reportou 22+ tabelas com RLS desativado,
--         expostas via PostgREST. O Prisma usa service_role que bypassa RLS,
--         portanto esta migration NÃO afeta o funcionamento da aplicação.
--         O acesso via anon_key ao PostgREST fica bloqueado por padrão (sem policies).
--
-- IMPORTANTE: Não criar policies permissivas. O isolamento de dados é feito
--             no nível da aplicação via requireAuth() e getResellerScope().
--             O RLS aqui serve apenas como camada de defesa adicional.

-- ============================================================
-- Tabelas de usuários e revendedoras
-- ============================================================
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datos_bancarios ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Catálogo de produtos
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_products ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Maletas e vendas
-- ============================================================
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_maleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PDV — loja física
-- ============================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_loja_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_dia ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Gamificação e pontos
-- ============================================================
ALTER TABLE public.gamificacao_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_extrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nivel_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resgates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brindes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_brinde ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Notificações
-- ============================================================
ALTER TABLE public.notificacao_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacao_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacao_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Analytics e leads
-- ============================================================
ALTER TABLE public.analytics_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendedora_leads ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Emails e comunicação
-- ============================================================
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
