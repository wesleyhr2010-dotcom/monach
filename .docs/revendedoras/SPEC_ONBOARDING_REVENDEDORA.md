# SPEC — Onboarding: Primeiro Acesso da Revendedora

**Rota:** `/app/bienvenida`  
**Ativado:** Primeiro login do usuário (verificado via flag ou ausência de atividade)

---

## Objetivo

Guiar a revendedora nos primeiros minutos após criar sua conta, garantindo:
1. Ela entende o que é o portal e como funciona
2. Ela completa seu perfil (dispara gamificação `perfil_completo`)
3. Ela conhece onde ficam as funções principais
4. Ela recebe +50 pts do `primeiro_acesso` de forma visível e motivadora

---

## Detecção de Primeiro Acesso

```ts
// src/app/app/layout.tsx (Server Component)
const reseller = await getResellerProfile(session.resellerId);

// Considerar "primeiro acesso" se:
const isPrimeiroAcesso =
  !reseller.onboarding_completo &&  // campo novo no schema
  reseller.maletas.length === 0;

if (isPrimeiroAcesso) {
  redirect('/app/bienvenida');
}
```

> **Nota de schema:** Adicionar campo `onboarding_completo Boolean @default(false)` ao modelo `Reseller`.

---

## Fluxo de Telas (Multi-Step)

```
Step 1: Boas-vindas + pontos ganhos
    ↓
Step 2: Como funciona (3 cards)
    ↓
Step 3: Complete seu perfil
    ↓
Step 4: Notificações (opt-in push)
    ↓
[Ir para o Dashboard]
```

---

## Tela — Step 1: Boas-Vindas

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            🎉  ¡Bienvenida, Ana!                       │
│                                                         │
│  Eres parte del equipo Monarca Semijoyas.               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⭐ +50 puntos                                   │   │
│  │  Por tu primer ingreso                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Desde aquí podrás:                                     │
│  • Ver tu consignación de joyas                         │
│  • Registrar tus ventas                                 │
│  • Ganar puntos y canjearlos por regalos                │
│  • Compartir el catálogo con tus clientes               │
│                                                         │
│              [Comenzar tour →]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Comportamento
- Dispara `awardPoints(resellerId, 'primeiro_acesso', 50)` ao renderizar
- Proteção anti-duplicatas: verifica se `primeiro_acesso` já foi concedido
- Nome da revendedora exibido a partir de `reseller.name`
- Animação de confetti leve (CSS only) nos primeiros 2 segundos

---

## Tela — Step 2: Como Funciona

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│     ¿Cómo funciona Monarca?           [1] [2] [3]      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │    📦  Tu consultora te envía                    │  │
│  │        una consignación                          │  │
│  │                                                  │  │
│  │  Recibes una maleta con joyas para vender.       │  │
│  │  Tienes un plazo para vender y devolver.         │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│              [← Anterior]  [Siguiente →]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**3 slides:**

| # | Ícone | Título | Descrição |
|---|-------|--------|-----------|
| 1 | 📦 | Tu consultora te envía una consignación | Recibes joyas con plazo. Vendes y devuelves lo que no vendiste. |
| 2 | 💰 | Registra tus ventas y gana comisión | Cuanto más vendas, mayor es tu porcentaje de comisión. |
| 3 | ⭐ | Acumula puntos y canjea regalos | Ganas puntos por cada venta, por devolver a tiempo y más. |

---

## Tela — Step 3: Complete seu Perfil

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Completa tu perfil             +100 pts si completas  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Foto de perfil                                   │  │
│  │  [📷 Agregar foto]                               │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ WhatsApp                                         │  │
│  │  [+595 ___________________]                      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Datos bancarios (para recibir tu comisión)       │  │
│  │  [Agregar alias Bancard o cuenta bancaria]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ¿No tienes estos datos ahora?                          │
│  [Completar más tarde]    [Guardar y continuar →]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Regras
- "Completar mais tarde" não bloqueia o fluxo
- Ao salvar com foto + whatsapp + dados bancários → dispara `awardPoints('perfil_completo', 100)`
- Se os campos já estiverem preenchidos (ex: admin preencheu antes), pular este step automaticamente

---

## Tela — Step 4: Notificações

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🔔  Activa las notificaciones                          │
│                                                         │
│  Recibe alertas cuando:                                 │
│  • Tu nueva consignación llegue                         │
│  • Tu plazo esté próximo a vencer                       │
│  • Confirmen tu devolución                              │
│  • Ganes puntos y regalos                               │
│                                                         │
│                                                         │
│           [Activar notificaciones]                      │
│                                                         │
│           [Ahora no — activar después]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Comportamento
- Botão "Activar" dispara o soft prompt do OneSignal (`OneSignal.Notifications.requestPermission()`)
- Se o usuário permitir → salvar `player_id` vinculado ao reseller_id
- Se recusar ou clicar "Ahora no" → registrar `notif_recusada = true` em sessão, não perguntar por 30 dias
- Exibir este step apenas se `Notification.permission !== 'granted'`

---

## Tela Final: Conclusão

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│        ✅  ¡Todo listo!                                 │
│                                                         │
│  Ya tienes:                                             │
│                                                         │
│  ⭐  50 pts — Primer acceso                             │
│  ⭐ 100 pts — Perfil completo (si completó)             │
│                                                         │
│  Tu saldo actual: 150 puntos                            │
│                                                         │
│                                                         │
│            [Ir al Dashboard →]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ação final
- Marcar `onboarding_completo = true` no reseller via Server Action
- Redirecionar para `/app`
- Nunca exibir o onboarding novamente para este usuário

---

## Server Actions

```ts
// src/app/app/bienvenida/actions.ts

export async function completeOnboarding(
  profileData?: { whatsapp?: string; avatar_url?: string }
): Promise<ActionResult> {
  const session = await getServerSession();

  // Atualizar perfil se dados fornecidos
  if (profileData) {
    await prisma.reseller.update({
      where: { id: session.resellerId },
      data: {
        whatsapp: profileData.whatsapp,
        avatar_url: profileData.avatar_url,
        onboarding_completo: true,
      },
    });
  } else {
    await prisma.reseller.update({
      where: { id: session.resellerId },
      data: { onboarding_completo: true },
    });
  }

  // Verificar se perfil está completo para gamificação
  const reseller = await prisma.reseller.findUnique({
    where: { id: session.resellerId },
    include: { dados_bancarios: true },
  });

  const perfilCompleto =
    reseller?.avatar_url &&
    reseller?.whatsapp &&
    reseller?.dados_bancarios;

  if (perfilCompleto) {
    await awardPoints(session.resellerId, 'perfil_completo', 100);
  }

  return { success: true, data: undefined };
}
```

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `OnboardingPage` | **Client** | Controla step atual (useState) |
| `OnboardingStep1Welcome` | Client | Animação + pontos concedidos |
| `OnboardingStep2HowItWorks` | Client | Carrossel 3 slides |
| `OnboardingStep3Profile` | Client | Formulário perfil rápido |
| `OnboardingStep4Push` | Client | Permissão OneSignal |
| `OnboardingStepFinal` | Client | Resumo e CTA para dashboard |

---

## Notas de Design

- Mobile-first: toda a tela é scrollável em telas pequenas
- Fundo branco com acentos em dourado (cor da marca)
- Sem sidebar/navbar durante o onboarding (experiência focada)
- Progress indicator: pontos no topo `● ● ○ ○` indicando step atual
- Botão "Saltar" sempre visível em cada step (exceto no final)
