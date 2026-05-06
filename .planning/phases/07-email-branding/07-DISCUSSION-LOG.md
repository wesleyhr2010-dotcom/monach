# Phase 7: Email Branding - Discussion Log

**Gathered:** 2026-05-06
**Status:** Context complete

---

## Area 1: Arquitetura do Wrapper

### Q1 — Qual abordagem o wrapper deve usar?
**Options presented:**
1. Função wrapper com HTML injection — `renderEmailBase({ title, content, cta? })`, templates mantêm HTML inline
2. Sistema de slots tipados — `renderEmailBase({ title, greeting, paragraphs, cta?, table?, footer? })`, sem HTML injection
3. Template engine híbrida — funções utilitárias (`emailButton`, `emailTable`, `emailAlert`) geram HTML padronizado, templates montam estrutura

**User selected:** Template engine híbrida
**Notes:** Usuário preferiu meio-termo entre flexibilidade e consistência. Utilitários forçam padrão nos componentes comuns sem limitar estrutura do conteúdo.

### Q2 — Qual identidade visual o header dos emails deve ter?
**Options presented:**
1. Banner com logo (imagem) — visual impactante, mas depende de imagem externa
2. Texto tipográfico estilizado — sempre renderiza, menos impacto
3. Minimalista — apenas título do email

**User selected:** Banner com logo (imagem)
**Notes:** Logo Monarca hospedado no R2, URL pública. Imagem deve ser leve (< 100KB).

### Q3 — Como deve ser o footer padronizado dos emails?
**Options presented:**
1. Footer completo com disclaimer + links — marca, link site, disclaimer seguridad, dados contato
2. Footer minimalista — apenas marca + disclaimer básico
3. Footer contextual — varia por tipo de email

**User selected:** Footer completo com disclaimer + links
**Notes:** Máxima credibilidade e conformidade. Footer maior é aceitável para emails transacionais.

### Q4 — Como gerar o fallback plaintext dos emails?
**Options presented:**
1. Auto-gerar de HTML com html-to-text — zero manutenção, mas formatação pode ficar estranha
2. Funções utilitárias geram HTML + text juntos — cada utilitário retorna `{ html, text }`, controle total
3. Texto simplificado no wrapper — wrapper gera texto genérico baseado nos dados

**User selected:** Funções utilitárias geram HTML + text juntos
**Notes:** Usuário priorizou controle sobre o conteúdo text. Tabela do email de acerto vira lista formatada em texto.

---

## Area 2: Compatibilidade de Clientes de Email

### Q1 — Quais clientes de email são obrigatórios (must-support)?
**Options presented:**
1. Gmail + Apple Mail apenas — ~85% cobertura, Outlook degrada graciosamente
2. Gmail + Apple Mail + Outlook (moderno) — Outlook 2019+, Web, Mac (motor Chromium)
3. Gmail + Apple Mail + Outlook (todos) — inclui Outlook 2016/2013 (motor Word), exige tabelas aninhadas

**User selected:** Gmail + Apple Mail + Outlook (moderno)
**Notes:** Bom equilíbrio. Outlook antigo aceita degradação graciosa (botões viram links).

### Q2 — Como lidar com dark mode nos emails?
**Options presented:**
1. Adaptar cores ativamente — `@media (prefers-color-scheme: dark)` com cores adaptadas
2. Deixar o cliente decidir — não adicionar regras de dark mode, clientes auto-invertem
3. Forçar light mode — meta tags e CSS para impedir adaptação

**User selected:** Adaptar cores ativamente
**Notes:** Melhor experiência para usuários que preferem dark mode. Adaptar fundo, texto e primary.

### Q3 — Como renderizar botões CTA de forma confiável no Outlook moderno?
**Options presented:**
1. Bulletproof buttons — `<table>` + comentários condicionais Microsoft
2. Botão nativo `<a>` estilizado — padding, background, border-radius
3. Link texto destacado — abandonar botão visual

**User selected:** Botão nativo `<a>` estilizado
**Notes:** Suficiente para Outlook moderno (Chromium). Código limpo, sem complexidade de bulletproof.

### Q4 — Como testar e validar a renderização dos emails?
**Options presented:**
1. Endpoint de preview local — `/api/test-email` renderiza HTML no navegador
2. Serviço de teste pago (Litmus/Email on Acid) — screenshots em dezenas de clientes
3. Testes manuais + checklist — enviar para contas de teste, validar visualmente

**User selected:** Endpoint de preview local
**Notes:** Aproveita endpoint existente. Iteração rápida durante desenvolvimento. Sanity check manual em Gmail/Apple Mail/Outlook Web como complemento.

---

## Area 3: Templates do Supabase Auth

### Q1 — Como gerenciar os templates do Supabase Auth?
**Options presented:**
1. Documentação manual em markdown — atualização manual no dashboard
2. Script de sync via Management API — atualização automática via API
3. Templates no código + referência no dashboard — versionamento no git, sync manual

**User selected:** Script de sync via Management API
**Notes:** Garante sincronia entre código e dashboard. Requer `SUPABASE_MANAGEMENT_API_KEY`.

### Q2 — Quanto branding os templates do Supabase Auth devem ter?
**Options presented:**
1. Mesmo branding completo dos emails transacionais — logo banner, cores, footer
2. Branding simplificado — sem imagem, apenas cores e texto
3. Branding mínimo — apenas cor primária nos links

**User selected:** Mesmo branding completo dos emails transacionais
**Notes:** Consistência total de marca, inclusive em emails de autenticação.

### Q3 — Como lidar com a sobreposição entre invite do Supabase e template customizado?
**Options presented:**
1. Manter ambos com propósitos distintos — Brevo para onboarding padrão, Supabase para criação direta
2. Unificar no Supabase invite — depreciar `emailConviteUsuario`
3. Manter Brevo como padrão, Supabase como fallback — branding básico no Supabase

**User selected:** Manter ambos com propósitos distintos
**Notes:** Brevo `emailConviteUsuario` é fluxo padrão de onboarding (mensagem personalizada, dados da consultora). Supabase invite é para emergências/criação direta de usuários.

### Q4 — Quando e como executar o script de sync dos templates Supabase?
**Options presented:**
1. Script manual — rodar localmente
2. CI/CD auto-sync no push para main — GitHub Actions
3. Script manual + checklist de release

**User selected:** CI/CD auto-sync no push para main
**Notes:** Zero esquecimento. Requer Management API key como GitHub Secret.

---

## Area 4: Tom de Voz e Emojis

### Q1 — Qual tom de voz padronizado para os emails transacionais?
**Options presented:**
1. Premium e acolhedor — sofisticado mas próximo, 'tú' informal, emojis moderados
2. Amigável e direto — casual e energético, mais emojis
3. Formal institucional — corporativo, 'Estimada', zero emojis

**User selected:** Premium e acolhedor
**Notes:** Alinha com marca de semijoias premium. Linguagem valorizadora: 'Tu consignación', 'Tu comisión'.

### Q2 — Como padronizar o uso de emojis nos emails?
**Options presented:**
1. Paleta fixa de marca — emojis aprovados limitados, máx 2 por email
2. Livre contextual — emojis que fazam sentido, máx 3 por email
3. Sem emojis — profissionais, sem emojis

**User selected:** Paleta fixa de marca
**Notes:** Paleta: 💎🦋 (marca), ✅ (confirmação), ❌ (rejeição), 📄 (documento), 🎉 (celebração).

### Q3 — Padronizar saudação e fechamento em TODOS os emails?
**Options presented:**
1. Saudação e fechamento fixos — sempre 'Hola {nombre},' e 'Equipo Monarca 💎🦋'
2. Saudação fixa, fechamento contextual — fixa para revendedoras, neutro para admin
3. Estrutura flexível por tipo — varia por contexto emocional

**User selected:** Estrutura flexível por tipo
**Notes:** Aprovação/cadastro: entusiasmado. Documentos/acertos: neutro. Rejeição: respeitoso, sem exclamação.

### Q4 — Criar um guia de estilo de copy para emails como documento permanente?
**Options presented:**
1. Guia completo em markdown — documento separado em `docs/sistema/`
2. Seção no CONTEXT.md + comentários no código
3. README na pasta `src/lib/email-templates/`

**User selected:** Seção no CONTEXT.md + comentários no código
**Notes:** Documentação perto do código, sem overhead de documento separado.

---

## Deferred Ideas

None — all gray areas for Phase 7 were discussed and decided. No scope creep detected.

## Summary

**Areas discussed:** 4/4
- Arquitetura do wrapper
- Compatibilidade de clientes de email
- Templates do Supabase Auth
- Tom de voz e emojis

**Decisions captured:** 16

**Next step:** `/gsd-plan-phase 7` to create implementation plans based on these decisions.

---

*Phase: 07-Email Branding*
*Discussion completed: 2026-05-06*
