-- Migration: enable_rls_prisma_migrations
-- Data: 2026-05-11
-- Motivo: Único erro restante no Supabase Security Advisor após a migration anterior.
--         _prisma_migrations é a tabela interna do Prisma para controle de migrations.
--         O Prisma usa service_role que bypassa RLS — sem impacto no funcionamento.

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
