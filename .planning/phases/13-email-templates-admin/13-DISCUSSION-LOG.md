# Phase 13: Email Templates Admin - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 13-Email Templates Admin
**Areas discussed:** Synchronization & Fallback Strategy, Variable Whitelisting & Validation, Editor Scope (renderEmailBase params), Send Logic Integration Pattern

---

## Estratégia de Sincronização e Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy (Ao Editar) | DB permanece vazio até edição; primeiro save cria override. | ✓ |
| Pre-seed total | Insere todos os 7 templates no DB na primeira visita. | |
| Excluir Registro | Resetar para o padrão remove override do DB e volta para o código. | ✓ |
| Desativar (Toggle) | Mantém no DB mas desativa o override. | |
| Apenas timestamp | Usa updated_at padrão; sem tabela de histórico dedicada. | ✓ |
| Histórico completo | Tabela separada para todas as versões. | |
| Etiquetas visuais | Puramente informativo (Padrão vs Personalizado). | |
| Toggle funcional | Permite ativar/desativar override sem excluir os dados. | ✓ |

**User's choice:** Misto de Lazy, Excluir no Reset e Toggle funcional.
**Notes:** Decidido por um modelo onde o banco é o override opcional, permitindo voltar ao código TypeScript a qualquer momento.

---

## Validação de Variáveis e Segurança

| Option | Description | Selected |
|--------|-------------|----------|
| Aviso apenas | Alerta mas permite salvar. | |
| Bloqueio estrito | Impede salvar se houver variáveis desconhecidas. | ✓ |
| Arquivo Centralizado | Definições em src/lib/emails-shared.ts. | ✓ |
| Nos arquivos de template | Definições locais em cada arquivo de template. | |
| Sempre permitir globais | site_url, email_suporte sempre disponíveis. | ✓ |
| Whitelist estrito | Tudo deve estar listado no template. | |
| Validar chaves e sintaxe | Verifica chaves não fechadas e caracteres inválidos. | ✓ |
| Apenas lista permitida | Verifica apenas o nome da variável. | |

**User's choice:** Bloqueio estrito e validação de sintaxe.
**Notes:** Segurança é prioridade para evitar que e-mails quebrem em produção por erros de digitação nos placeholders.

---

## Escopo do Editor (Parâmetros renderEmailBase)

| Option | Description | Selected |
|--------|-------------|----------|
| Mínimo (Assunto + Corpo) | Foco no conteúdo principal. | |
| Assunto + Corpo + Preview | Adiciona o texto de pré-visualização. | ✓ |
| Controle Total | Inclui Saudação e Rodapé extra. | |
| Lógica fixa por tipo | Sistema escolhe o tom da saudação. | |
| Saudação editável | Admin escreve a saudação manualmente. | ✓ |
| Gerar automaticamente | Helper htmlToPlainText gera o texto puro. | ✓ |
| Campo manual separado | Admin escreve a versão texto puro. | |
| Permitir no Assunto | Placeholders permitidos no Assunto do e-mail. | ✓ |

**User's choice:** Assunto + Corpo + Preview + Saudação editável.
**Notes:** O administrador terá controle sobre os elementos que influenciam a taxa de abertura e o tom pessoal do e-mail.

---

## Padrão de Integração e Envio

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper Centralizado | Lógica de busca no DB em função mestre. | ✓ |
| Dentro de cada template | Busca manual em cada arquivo de template. | |
| Cache por Request | Usa React.cache para otimizar envios em lote. | ✓ |
| Sempre em tempo real | Sem cache, sempre consulta o DB. | |
| Usar DB em Dev | Permite testar o editor localmente. | |
| Sempre TS em Dev | Fallback fixo para estabilidade local. | ✓ |
| Fallback Silencioso | Se o DB falhar, usa a versão do código. | |
| Lançar Erro (Rigoroso) | Falha no DB interrompe o envio. | ✓ |

**User's choice:** Wrapper centralizado com cache e tratamento rigoroso de erros.
**Notes:** A decisão de lançar erro garante que o sistema não envie algo diferente do que o administrador configurou como "Personalizado".

---

## Claude's Discretion

- Nome exato do novo modelo Prisma (`EmailTemplate`).
- Implementação detalhada do helper `getEmailContent`.
- Design exato das etiquetas de status na lista de templates.
- Lógica de ativação/desativação da flag de teste para overrides em Dev.

## Deferred Ideas

- Editor WYSIWYG (Adiado para garantir segurança do HTML).
- Envio de teste via Editor (Adiado por motivos de cota do Brevo).
- Preview em tempo real (Adiado pela complexidade técnica do sandbox).
