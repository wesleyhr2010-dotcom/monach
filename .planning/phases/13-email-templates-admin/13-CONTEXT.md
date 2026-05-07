# Phase 13: Email Templates Admin - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase implementa a capacidade de administradores editarem o conteúdo dos e-mails transacionais diretamente no painel administrativo, eliminando a necessidade de deploys para alterações simples de texto, assunto ou layout interno.

**In scope:**
- CRUD de templates de e-mail em `/admin/config/emails`
- Edição de Assunto, Corpo HTML e Texto de Pré-visualização (Preview)
- Sistema de placeholders com chips clicáveis no editor
- Lógica de fallback para templates TypeScript hardcoded
- Validação estrita de variáveis permitidas e sintaxe de chaves

</domain>

<decisions>
## Implementation Decisions

### Estratégia de Sincronização e Fallback
- **D-01:** **Sincronização Lazy (Sob Demanda)** — O banco de dados não será pré-populado. O registro de override será criado apenas no primeiro salvamento pelo administrador.
- **D-02:** **Reset via Exclusão** — Ao clicar em "Resetar para Padrão", o registro do banco de dados é excluído, fazendo o sistema voltar instantaneamente para o template TypeScript correspondente.
- **D-03:** **Auditoria Simples** — O versionamento será baseado apenas no campo `updated_at` do Prisma, sem tabela de histórico dedicada nesta fase.
- **D-04:** **Toggle de Estado** — O administrador terá um interruptor visual (Toggle) para ativar/desativar o override sem precisar excluir os dados salvos.

### Validação de Variáveis e Segurança
- **D-05:** **Bloqueio Estrito no Salvamento** — O editor impedirá o salvamento se detectar variáveis (placeholders) não autorizadas para aquele tipo de e-mail, evitando falhas de envio em produção.
- **D-06:** **Definição Centralizada** — A lista de variáveis permitidas por template será definida em um novo arquivo `src/lib/emails-shared.ts`, seguindo o padrão de `notifications-shared.ts`.
- **D-07:** **Variáveis Globais** — Certas variáveis (ex: `{site_url}`, `{email_suporte}`, `{nome_revendedora}`) estarão disponíveis em todos os templates por padrão.
- **D-08:** **Validação de Sintaxe** — O editor validará se todas as chaves de variáveis foram fechadas corretamente (ex: detectar `{nome` sem o `}`) antes de permitir o salvamento.

### Escopo do Editor (Parâmetros renderEmailBase)
- **D-09:** **Campos Editáveis** — O admin terá controle sobre o Assunto (Subject), Corpo HTML (Body) e Texto de Pré-visualização (Preview Text).
- **D-10:** **Saudação Customizada** — O campo de saudação (Greeting) será editável pelo administrador, permitindo o uso de variáveis (ex: "¡Hola {nome}!").
- **D-11:** **Texto Puro Automático** — A versão em texto puro (plain text) será gerada automaticamente a partir do HTML usando o helper `htmlToPlainText`, sem exigir entrada manual do admin.
- **D-12:** **Variáveis no Assunto** — O campo de Assunto suportará o mesmo conjunto de variáveis permitidas no corpo do e-mail.

### Padrão de Integração e Envio
- **D-13:** **Wrapper Centralizado** — A lógica que decide entre usar o DB ou o fallback será injetada em um wrapper central no `src/lib/emails.ts` ou via `getEmailContent` helper.
- **D-14:** **Cache por Request** — Consultas ao banco de dados para templates serão cacheadas no escopo do request (via `React.cache`) para otimizar envios em lote ou campanhas.
- **D-15:** **Isolamento de Dev** — Em ambiente local (development), o sistema usará por padrão os templates TypeScript para evitar dependência de banco local, a menos que uma flag de teste seja ativada.
- **D-16:** **Tratamento de Erros Rigoroso** — Falhas críticas na consulta ao banco de dados ou templates corrompidos lançarão um erro para interromper o envio, em vez de enviar o texto padrão silenciosamente (evita confusão em envios "personalizados").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planejamento e Requisitos
- `.planning/ROADMAP.md` — Metas da Fase 13 e critérios de sucesso
- `.planning/REQUIREMENTS.md` — Requisitos ETML-01 a ETML-07
- `.planning/PROJECT.md` — Stack, restrições e decisões de arquitetura globais

### Infraestrutura de E-mail
- `.planning/phases/07-email-branding/07-CONTEXT.md` — Definições de tom de voz, emojis e wrapper `renderEmailBase`
- `src/lib/emails.ts` — Cliente Brevo e função principal de envio
- `src/lib/email-base.ts` — Wrapper visual e utilitários de renderização (Botões, Tabelas, Alertas)
- `src/lib/email-templates/` — Templates TypeScript atuais que servirão de fallback

### Padrões de Notificação e Editor
- `src/lib/notifications-shared.ts` — Referência para motor de substituição de variáveis e whitelists
- `src/app/admin/config/notif-push/TemplateEditor.tsx` — Referência para UI do editor com chips e lógica de inserção
- `prisma/schema.prisma` — Model `NotificacaoTemplate` servirá de blueprint para `EmailTemplate`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`renderEmailBase`**: Deve ser o wrapper obrigatório para todo conteúdo vindo do banco.
- **`substituirVariaveis`**: Motor de interpolação a ser estendido para suportar as novas variáveis de e-mail.
- **`htmlToPlainText`**: Utilitário crítico para gerar a versão dual (HTML/Text) exigida pelo Brevo.

### Established Patterns
- **Módulo de Configuração Admin**: Seguir o padrão visual e de Server Actions usados em `/admin/config/notif-push`.
- **ActionResult<T>**: Todas as mutações do editor (save/delete) devem retornar este tipo para tratamento de erro consistente na UI.

### Integration Points
- **Prisma Schema**: Necessário adicionar model `EmailTemplate`.
- **`src/lib/emails.ts`**: Ponto central de interceptação para injetar a lógica de override.

</code_context>

<specifics>
## Specific Ideas

- **Editor UI**: Utilizar textarea com fonte mono para o corpo HTML, com botões (chips) logo acima para inserir variáveis na posição do cursor (conforme padrão do Push Editor).
- **Indicador de Status**: Na lista de templates, usar um badge `Padrão (Código)` em cinza e `Personalizado (DB)` em verde/dourado para clareza total sobre o que está sendo enviado.

</specifics>

<deferred>
## Deferred Ideas

- **WYSIWYG Editor**: Descartado para esta fase para priorizar segurança e controle de HTML puro.
- **Envio de Teste no Editor**: Adiado para v1.4 para evitar esgotamento de cota do Brevo sem rate limiting.
- **Visualização (Preview) Real-time**: Adiado devido à complexidade de renderização segura (iframe sandbox).

### Reviewed Todos (not folded)
None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-Email Templates Admin*
*Context gathered: 2026-05-07*
