# SPEC — Modo Offline e Sincronização (PWA da Revendedora)

> Arquitetura offline-first para o portal da revendedora: a revendedora usa o app em locais com conectividade instável (visitas a clientes, viagens), registra operações sem rede, e quando volta a ficar online o sistema sincroniza automaticamente com o banco. Esta SPEC cobre o modelo de dados local, a fila de operações, estratégia de sync, resolução de conflitos, idempotência e UX.

**Status:** proposto — não iniciado.
**Aplica-se:** portal `/app/*` (revendedora). Admin/consultora permanece online-only por ora.
**Compatível com:** PWA atual (IndexedDB) **e** Capacitor (SQLite), com upgrade do storage como parte da migração nativa. Ver [`SPEC_CAPACITOR_MIGRATION.md`](./SPEC_CAPACITOR_MIGRATION.md).

---

## 1. Objetivo

Permitir que a revendedora:

1. **Consulte** catálogo, maleta ativa, itens e preços sem rede.
2. **Registre vendas** sem rede; elas ficam em fila local e sobem quando reconectar.
3. **Receba feedback imediato** (optimistic UI) e confirmação quando sincronizar.
4. **Não perca dados** em caso de perda de conexão, bateria ou reinício do app.

Objetivo secundário: reduzir latência percebida mesmo online — operações comuns respondem do cache local antes da resposta do servidor.

---

## 2. Cenários de uso alvo

| Cenário | Operação | Comportamento esperado |
|---|---|---|
| Revendedora em visita sem sinal | Abre maleta e vê catálogo | Funciona (lê do storage local) |
| Revendedora registra venda offline | `registrarVenda` | Aparece na lista imediatamente marcada como "pendente"; sincroniza quando conectar |
| Revendedora fica 8h sem sinal, registra 12 vendas | 12 inserts de venda | Ao conectar, sincroniza em lote e marca todas como confirmadas |
| Revendedora em avião abre o app | Navegação | Funciona; qualquer mutação fica em fila |
| Revendedora mata o app no meio de uma venda offline | Crash / close | A venda persistiu no storage local antes do crash; sincroniza no próximo boot |
| Revendedora tenta fazer login offline | Login | **Não permitido** (exceção: se já houver sessão válida em cookie, segue offline) |
| Revendedora tenta subir foto de devolução offline | Upload R2 | Venda fica em fila; upload da foto só quando conectar |
| Conflito: admin fechou a maleta enquanto estava offline | Venda enviada depois | Server rejeita com erro claro; UI explica e pede confirmação de descarte |

---

## 3. Arquitetura offline-first

```
┌─────────────────────────────────────────────────┐
│  UI (React/Next.js no WebView)                  │
│  ├── Reads ────► Query local cache (reactive)   │
│  └── Writes ───► Append to outbox (optimistic)  │
└───────┬─────────────────────────┬───────────────┘
        │                         │
        ▼                         ▼
┌──────────────┐          ┌────────────────┐
│ Local Store  │          │ Outbox Queue   │
│ (IDB/SQLite) │          │ (ops pendentes)│
│ - maleta     │          │ - id local     │
│ - itens      │          │ - type/payload │
│ - vendas     │          │ - status       │
│ - catalogo   │          │ - retries      │
│ - perfil     │          │ - client_op_id │
└──────┬───────┘          └────────┬───────┘
       │ refresh                    │ flush
       └────────┬───────────────────┘
                ▼
       ┌────────────────┐
       │ Sync Service   │
       │ (Worker/Loop)  │
       └────────┬───────┘
                │ HTTPS (Server Actions / API)
                ▼
       ┌────────────────┐
       │  Next.js Server│
       │  + Prisma + DB │
       └────────────────┘
```

**Princípios:**

- **Local-first write**: toda mutação vai para o outbox antes de qualquer chamada de rede. Se rede falhar, fica em fila.
- **Single source of truth eventual**: servidor é verdade final; cliente converge via sync.
- **Optimistic UI**: ação aparece "feita" instantaneamente com badge "pendente" até confirmar.
- **Idempotência**: cada op tem `client_operation_id` (UUID) — servidor descarta duplicatas.
- **Append-only outbox**: operações nunca são reeditadas; só retentadas ou descartadas.

---

## 4. Escopo: o que funciona offline

### 4.1 Leituras offline (cache)

- [x] Maleta ativa e itens (snapshot local ao abrir a tela).
- [x] Catálogo da maleta (imagens do catálogo cacheadas via Service Worker).
- [x] Lista de vendas já registradas.
- [x] Perfil, dados bancários (mascarados), progresso, extrato de pontos (últimos 30 dias).
- [x] Home (últimas métricas persistidas).

### 4.2 Mutações offline (outbox)

- [x] `registrarVenda` (enqueue; sincroniza na reconexão).
- [x] `registrarVendaMultipla` (enqueue em lote).
- [x] `registrarPuntosCompartirCatalogo` (enqueue — gamificação pode ser eventualmente consistente).
- [x] Atualização de perfil (nome, whatsapp — dados não críticos de negócio).

### 4.3 Online-only (nunca offline)

- **Login / logout** — precisa de rede para Supabase Auth. Se já logado com cookie válido, segue usando.
- **Reset de senha** — fluxo depende de email.
- **`submitDevolucao`** — exige upload de foto comprobatória ao R2. Pode ficar em fila (pendente de upload), mas **não** é finalizada até subir a foto.
- **Fechar maleta / conciliação** — operação admin/consultora, não se aplica ao PWA da revendedora.
- **Resgate de brinde** — afeta estoque de brindes; melhor forçar online para não prometer algo que não existe mais.
- **Solicitação de saque** — operação financeira; online-only.

---

## 5. Armazenamento local

### 5.1 Comparativo

| Capacidade | IndexedDB (PWA atual) | SQLite via `@capacitor-community/sqlite` (Capacitor) |
|---|---|---|
| Acesso | Browser API, async | Plugin native, async |
| Queries | Key-value + index | SQL completo |
| Volume | Limitado por quota do browser (~60% do disco) | Limitado pelo disco do device |
| Persistência iOS | Pode ser purgada por "Clear site data" do Safari | Garantida (sandboxed do app) |
| Transações | Sim | Sim |
| Criptografia | Via lib adicional | Nativa (SQLCipher) |

### 5.2 Recomendação

**Fase 1 (PWA atual):** usar **Dexie.js** (wrapper do IndexedDB) pela simplicidade e maturidade.
**Fase 2 (Capacitor):** migrar para **SQLite** com SQLCipher para dados sensíveis. Código de acesso via abstração (`src/lib/storage/`) para que a UI não saiba a diferença.

### 5.3 Schema local proposto

```ts
// src/lib/storage/schema.ts
export interface LocalDB {
  maletas: MaletaLocal[];           // maleta ativa completa
  maleta_itens: MaletaItemLocal[];  // itens com preco_fixado (snapshot)
  vendas: VendaLocal[];             // vendas locais + servidor
  outbox: OutboxOp[];               // fila de operações pendentes
  meta: MetaRow[];                  // last_sync_at, user_id, schema_version
}

export interface OutboxOp {
  id: string;                 // UUID local = client_operation_id
  type: 'venda_create' | 'venda_multipla_create' | 'perfil_update' | 'catalogo_share';
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'error' | 'conflict';
  created_at: string;         // ISO
  last_attempt_at: string | null;
  attempts: number;
  last_error: string | null;
}
```

**`vendas` local** inclui flag `_local_pending: true` enquanto não sincronizadas; após sync, flag vira `false` e o campo `id` é reescrito com o ID do servidor.

---

## 6. Outbox pattern (fila de operações)

### 6.1 Enqueue

Quando a revendedora toca "Registrar venda":

```ts
// Pseudocódigo
async function registrarVendaLocal(input: RegistrarVendaInput) {
  const clientOpId = crypto.randomUUID();
  const vendaLocal: VendaLocal = {
    id: `local-${clientOpId}`,
    ...input,
    _local_pending: true,
    created_at: new Date().toISOString(),
  };

  await db.transaction('rw', db.vendas, db.outbox, db.maleta_itens, async () => {
    // 1. Inserir venda local (aparece na UI imediatamente)
    await db.vendas.add(vendaLocal);

    // 2. Atualizar saldo do item na maleta local (otimista)
    const item = await db.maleta_itens.get(input.item_id);
    await db.maleta_itens.update(input.item_id, {
      quantidade_vendida: item.quantidade_vendida + input.quantidade,
    });

    // 3. Enfileirar op para sincronizar
    await db.outbox.add({
      id: clientOpId,
      type: 'venda_create',
      payload: { ...input, client_operation_id: clientOpId },
      status: 'pending',
      created_at: new Date().toISOString(),
      last_attempt_at: null,
      attempts: 0,
      last_error: null,
    });
  });

  // 4. Acordar o sync (no-op se offline)
  SyncService.kick();
}
```

### 6.2 Flush (quando online)

```ts
async function flushOutbox() {
  if (!navigator.onLine) return;
  if (!(await hasValidSession())) return;

  const ops = await db.outbox
    .where('status').anyOf('pending', 'error')
    .sortBy('created_at');

  for (const op of ops) {
    await db.outbox.update(op.id, { status: 'syncing', last_attempt_at: new Date().toISOString() });
    try {
      const result = await executeServerOp(op);  // chama Server Action
      await commitOpSuccess(op, result);
    } catch (err) {
      await handleOpError(op, err);
    }
  }
}
```

### 6.3 Triggers de flush

- App volta a ficar online (`window.addEventListener('online', ...)`).
- App volta ao foreground (`document.visibilitychange`).
- Após login bem-sucedido.
- A cada N minutos enquanto o app estiver aberto (backoff exponencial se houver erros).
- Em Capacitor: usar **`@capacitor/background-task`** para flush rápido ao ganhar rede mesmo com app em segundo plano.

---

## 7. Sincronização com o servidor

### 7.1 Endpoint / Server Actions

Cada Server Action que aceita outbox deve:

1. Receber `client_operation_id` (UUID) obrigatório.
2. Verificar se já existe uma venda/op com esse `client_operation_id` para este reseller.
   - Se existe → retornar resultado da operação original (idempotente).
   - Se não existe → processar normalmente, persistir `client_operation_id`.
3. Persistir `client_operation_id` em coluna nova da tabela de destino (`vendas_maleta.client_operation_id UNIQUE`).

**Migration Prisma necessária:**

```prisma
model VendaMaleta {
  id                   String   @id @default(uuid())
  client_operation_id  String?  @unique  // nullable para compatibilidade com vendas antigas
  // ... campos existentes
}
```

### 7.2 Pulling de estado (down-sync)

Periodicamente e ao abrir o app:

- Buscar último `updated_at` conhecido localmente.
- `GET /api/sync/reseller?since=<iso>` retorna delta:
  - Maleta(s), itens modificados, vendas criadas pelo admin (ex.: ajuste manual), pontos ganhos, status.
- Aplicar no storage local de forma idempotente (upsert por ID).

### 7.3 Ordem das operações

- Upstream (outbox → server): ordem estrita por `created_at` local para preservar consistência causal (ex.: se revendedora registrou venda antes de editar perfil).
- Downstream (server → client): ordem por `updated_at` do servidor; sempre sobrescreve local quando o mesmo registro for tocado (LWW — last write wins).

### 7.4 Batching

Quando há > 5 operações pendentes, agrupar em um endpoint `/api/sync/batch` que recebe array e processa em uma transação (ou falha op por op retornando status individual). Reduz ida-e-volta.

---

## 8. Resolução de conflitos

Conflitos esperados em ordem de frequência:

### 8.1 Duplicatas (mais comum)

Usuário toca "registrar" duas vezes por lag. Protegido por `client_operation_id` único — servidor simplesmente retorna a venda original.

### 8.2 Saldo insuficiente (estoque da maleta)

Revendedora registrou 3 unidades de um item offline quando só tinha 2 no saldo real (admin tirou 1 fisicamente antes). Servidor rejeita com `BUSINESS:saldo_insuficiente`.

**Handling:** venda local fica `status: 'conflict'`, UI mostra:
> "No se pudo registrar esta venta: sólo hay 2 unidades disponibles. ¿Ajustar a 2 o descartar?"

Opções: ajustar quantidade e reenviar, ou descartar.

### 8.3 Maleta fechada

Admin fechou a maleta enquanto a revendedora estava offline. Todas as vendas pendentes daquela maleta falham com `BUSINESS:maleta_fechada`.

**Handling:** marcar todas como conflito, pedir confirmação de descarte em uma tela consolidada ("3 vendas pendientes no pueden sincronizarse porque la consignación fue cerrada").

### 8.4 Sessão expirada

Token expirou durante offline. Flush falha com 401.

**Handling:** manter fila intacta, disparar re-login. Após login, flush retoma.

### 8.5 Versão de schema incompatível

App antigo tentando sincronizar com API nova. Servidor retorna 409 com `required_app_version`. Cliente mostra "atualize o app" e bloqueia flush.

---

## 9. Idempotência e consistência

**Contrato:** toda Server Action que aceita outbox **deve** ser idempotente por `client_operation_id`.

Tabelas afetadas (candidatas a receber a coluna):

- `vendas_maleta` — registrarVenda
- `pontos_extrato` — awardPoints e congêneres
- `reseller_updates_log` (criar) — para auditoria de mutações do perfil

Para leituras (Server Actions GET), não é necessário `client_operation_id` — são seguras por definição.

---

## 10. Invariantes críticos a preservar

Já garantidos pelo código atual e que o offline **não pode violar**:

1. **Valores imutáveis em maleta fechada** — se a maleta foi fechada, todas as tentativas de inserção offline devem falhar com conflito. Não reabrir, não recalcular.
2. **`preco_fixado` vem do banco, nunca do cliente** — o cliente offline já trabalha com `preco_fixado` armazenado no snapshot local; servidor reverifica.
3. **Ownership** — toda operação verifica `reseller_id = user.profileId` no servidor. Outbox não altera isso.
4. **Rate limits de gamificação** — `registrarPuntosCompartirCatalogo` tem limite de 5x/dia; o servidor reprocessa esse limite ao receber ops em fila (pode rejeitar as 6ª+ silenciosamente).

---

## 11. UI/UX

### 11.1 Indicador de conectividade

Barra fina no topo do `AppShell`:

- Verde (silencioso): online, sync em dia.
- Amarelo "Sincronizando N ops...": online, flush em andamento.
- Cinza "Sin conexión — 3 pendientes": offline, operações enfileiradas.
- Vermelho "Error de sincronización — ver detalles": alguma op falhou; toque para ver detalhes.

### 11.2 Badge em venda pendente

Na lista de vendas, cada venda com `_local_pending: true` tem um ícone de relógio discreto ao lado do valor. Tooltip: "Esperando confirmación del servidor".

### 11.3 Tela de conflitos

Rota nova `/app/sincronizar` (ou drawer) listando ops em `status: 'conflict'` com ações: **Reintentar** / **Ajustar** / **Descartar**.

### 11.4 Empty state consciente do offline

Ao abrir `/app/maleta` offline pela primeira vez (sem cache), mostrar: "Necesitás conectarte al menos una vez para ver tu consignación". Não deixar tela em branco.

### 11.5 Permissão explícita

Antes de ativar modo offline (primeira vez), pedir: "¿Permitís a Monarca guardar datos en este dispositivo para usar sin conexión?" Guardar preferência em `meta.offline_enabled`.

---

## 12. Segurança

### 12.1 Dados sensíveis offline

- **Nunca armazenar localmente:** senha, tokens de API, service role keys, dados bancários descriptografados, CI/RUC.
- **Armazenar com cautela:** sessão Supabase (já é cookie httpOnly — ok), email, nome.
- **Armazenar livremente:** maleta, itens, vendas próprias, catálogo, pontos.

### 12.2 Criptografia do storage

- **PWA:** dados em IndexedDB não são criptografados nativamente. Para o escopo atual (não há PII crítica offline) é aceitável.
- **Capacitor:** usar SQLCipher (`@capacitor-community/sqlite` com `isEncryption: true`) a partir do dia 1.

### 12.3 Logout

Ao fazer logout: **limpar todos os stores locais**. Não deixar dados da conta anterior acessíveis se outra pessoa usar o celular.

### 12.4 Múltiplos dispositivos

Revendedora que loga em dois dispositivos tem duas outboxes independentes. Cada uma sincroniza — `client_operation_id` impede duplicidade cross-device.

---

## 13. Limites e políticas

| Limite | Valor | Motivo |
|---|---|---|
| Máx. operações pendentes antes de bloquear novas | 200 | Evitar fila impossível de reconciliar |
| Máx. tempo offline antes de forçar reconexão para operar | 7 dias | Dados locais envelhecem; preços podem estar defasados |
| TTL de cache de catálogo sem refresh | 24h | Catálogo muda pouco, mas não fica ilimitado |
| Tentativas de retry de uma op | 5 com backoff exponencial (30s, 2min, 10min, 1h, 6h) | Evitar flood; depois marca como erro e pede ação manual |
| Tamanho máx. do outbox em bytes | 10 MB | Proteção contra vazamento de memória |

---

## 14. Roadmap de adoção

### Fase 1 — Cache de leitura (baixo risco, alto ganho)
- [ ] Service Worker atual (Serwist) já cobre shell e imagens. Estender para cachear respostas de Server Actions (`getMinhasMaletas`, `getCatalogoRevendedora`) com estratégia `stale-while-revalidate`.
- [ ] Persistir maleta ativa + itens em IndexedDB via Dexie no primeiro load.
- [ ] UI: indicador de conectividade, skeleton quando cache não existe.

### Fase 2 — Outbox para `registrarVenda` (ciclo completo)
- [ ] Adicionar coluna `client_operation_id` em `vendas_maleta` (migration + backfill null).
- [ ] Refatorar `registrarVenda` server-side para idempotência.
- [ ] Implementar `SyncService` e outbox (`src/lib/sync/`).
- [ ] Migrar UI de venda para fluxo local-first.
- [ ] Telemetria: logar taxa de sync bem-sucedido vs conflitos.

### Fase 3 — Expansão para outras mutações
- [ ] `registrarVendaMultipla`, `registrarPuntosCompartirCatalogo`, atualizações de perfil.
- [ ] Tela de conflitos em `/app/sincronizar`.

### Fase 4 — Capacitor + SQLite criptografado
- [ ] Após migração Capacitor (ver [`SPEC_CAPACITOR_MIGRATION.md`](./SPEC_CAPACITOR_MIGRATION.md)), migrar storage de IndexedDB para SQLCipher.
- [ ] Abstração `src/lib/storage/` permite troca sem mudar UI.
- [ ] Background sync via `@capacitor/background-task`.

---

## 15. Métricas de sucesso

Após implementado, acompanhar:

- % de vendas registradas offline (esperado: 20–40% em regiões com cobertura ruim).
- Tempo médio entre enqueue e sync confirmado (esperado: < 5s online, < 2 min pós-reconexão).
- Taxa de conflitos por 1000 vendas (esperado: < 1%).
- Taxa de operações descartadas pelo usuário após conflito (deve ser baixa; se alta, UX de conflito precisa ser revisitada).
- Queixas de suporte envolvendo "minha venda sumiu" (esperado: zero; se aparecer, há bug em outbox).

---

## 16. Edge cases e riscos

| Risco | Mitigação |
|---|---|
| Relógio do dispositivo errado | Não usar timestamps locais para ordenação autoritativa; servidor é quem carimba `created_at` final. |
| Storage local corrompido | Versionar schema (`schema_version`) e migrar; em último caso, limpar e refetch. |
| Venda enviada 2x por bug no cliente | `client_operation_id UNIQUE` no DB protege. |
| Outbox cresce indefinido após erros repetidos | Limite de 200 ops + UI que exige ação manual para erros. |
| Revendedora usa múltiplos dispositivos, confusão de estado | Tela de sincronização mostra ops daquele dispositivo apenas; servidor é fonte única. |
| Foto de devolução gigante em fila | Comprimir antes de salvar em fila (já existe); se > 3 MB após compressão, bloquear e pedir nova foto. |
| Vulnerabilidade de replay (atacante pega outbox do device) | Cada op é validada server-side com sessão autenticada; sem token válido, ops não executam. |

---

## 17. Dependências

- [`revendedoras/SPEC_MALETA.md`](../revendedoras/SPEC_MALETA.md) — fluxo atual de `registrarVenda` (fonte do contrato a manter idempotente).
- [`sistema/SPEC_BACKEND.md`](./SPEC_BACKEND.md) — padrões de Server Actions.
- [`sistema/SPEC_SECURITY_RBAC.md`](./SPEC_SECURITY_RBAC.md) — ownership check continua obrigatório server-side em toda op do outbox.
- [`sistema/SPEC_CACHING_STRATEGY.md`](./SPEC_CACHING_STRATEGY.md) — cache de leitura se sobrepõe ao offline-first; coordenar invalidação.
- [`SPEC_CAPACITOR_MIGRATION.md`](./SPEC_CAPACITOR_MIGRATION.md) — Fase 4 depende de Capacitor + SQLite.
- Migration Prisma nova (coluna `client_operation_id`).

---

## 18. Decisão

Esta SPEC é **opcional e faseada**. Fase 1 (cache de leitura) tem ROI claro e baixo risco — pode ser adotada isoladamente. Fases 2–4 exigem refatoração mais significativa e só compensam se for mapeado que a revendedora sofre com conectividade instável no dia a dia.

Se prosseguir, priorizar Fase 1 + Fase 2; Fase 3 e 4 conforme adoção de Capacitor e métricas da Fase 2.
