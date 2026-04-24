# SPEC — Migração do PWA da Revendedora para Capacitor (iOS + Android)

> Plano de adoção do Capacitor como wrapper nativo do PWA da revendedora, publicando o app nas lojas (App Store e Google Play). Objetivo primário: **Universal Links / App Links** para que o link do email de recuperação de senha (e outros fluxos de deep link) abram direto no app. Objetivo secundário: melhorar retenção, credibilidade e capacidades nativas (push, câmera, biometria).

**Status:** proposto — não iniciado.
**Pré-requisito:** domínio oficial `monarcasemijoyas.com.py` ativo (ver [`SPEC_DOMAIN_MIGRATION.md`](./SPEC_DOMAIN_MIGRATION.md)).
**Responsável sugerido:** `@dev` + acesso Apple Developer + Google Play Console.

---

## 1. Objetivo

1. **Resolver a limitação de deep links no PWA** — links `https://monarcasemijoyas.com.py/app/...` (recuperação de senha, convite, push notification click) devem abrir o app instalado, não o navegador. PWAs iOS não conseguem interceptar links; PWAs Android conseguem apenas parcialmente com `launch_handler` em Android 12+. Capacitor resolve em ambas as plataformas via Universal Links (iOS) e App Links (Android).
2. **Elevar a percepção de produto** — estar na App Store e Google Play com ícone próprio aumenta credibilidade e facilita divulgação.
3. **Liberar capacidades nativas** — push native do OneSignal (melhor entrega que Web Push, especialmente iOS), câmera nativa (melhor UX na devolução), biometria, haptics, compartilhamento nativo.
4. **Viabilizar modo offline robusto** — storage SQLite com SQLCipher (vs IndexedDB limitado do PWA), garantia de persistência em iOS (sem purga automática), background sync quando volta a ficar online. Ver [`SPEC_OFFLINE_SYNC.md`](./SPEC_OFFLINE_SYNC.md) — Fase 4.
5. **Manter um único código-fonte** — o app Capacitor carrega o Next.js hospedado na Vercel; zero fork de código.

---

## 2. Estratégia escolhida — "Capacitor remoto"

O app nativo **não empacota** o bundle Next.js. Ele é um container de ~2 MB cujo único trabalho é:

1. Abrir o WebView em `https://monarcasemijoyas.com.py/app`.
2. Registrar Universal Links / App Links para domínios cobertos.
3. Expor APIs nativas (camera, push, deep link handler) via plugins Capacitor.

**Vantagens:**
- Deploys continuam na Vercel. Atualizar o app = fazer deploy, sem passar por store review.
- Qualquer melhoria no código web aparece imediatamente no app (próxima abertura).
- Release nativo só é necessário ao trocar: ícone, splash, deep link config, versão de plugin nativo, SDK OS.

**Alternativa descartada: Capacitor com bundle local.** Exigiria export estático do Next.js (sem SSR) e release a cada deploy — custo alto para ganho mínimo.

---

## 3. Arquitetura resultante

```
┌─────────────────────────────────────────┐
│  App Capacitor (iOS/Android)            │
│  ├── WebView → monarcasemijoyas.com.py  │
│  ├── Plugin Camera                      │
│  ├── Plugin Push (OneSignal)            │
│  ├── Plugin Browser (OAuth external)    │
│  ├── Plugin App (deep link listener)    │
│  └── Plugin Haptics, Biometric (opc.)   │
└──────────────────┬──────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────┐
│  Next.js na Vercel (código atual)       │
│  (idêntico ao PWA atual)                │
└─────────────────────────────────────────┘
```

---

## 4. Checklist de implementação

### 4.1 Scaffolding do Capacitor

- [ ] `pnpm add -D @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`
- [ ] `npx cap init "Monarca Semijoyas" "py.com.monarcasemijoyas.app" --web-dir=.next` (ou `public`)
- [ ] Criar `capacitor.config.ts`:
  ```ts
  import type { CapacitorConfig } from '@capacitor/cli';

  const config: CapacitorConfig = {
    appId: 'py.com.monarcasemijoyas.app',
    appName: 'Monarca Semijoyas',
    webDir: 'public',
    server: {
      url: 'https://monarcasemijoyas.com.py/app',
      cleartext: false,
    },
    ios: {
      contentInset: 'always',
    },
    android: {
      allowMixedContent: false,
    },
  };
  export default config;
  ```
- [ ] `npx cap add ios` e `npx cap add android` — cria diretórios `ios/` e `android/`.
- [ ] Commit `ios/` e `android/` no repo (Podfile, Gradle scripts); ignorar artefatos de build (`ios/App/Pods`, `android/app/build`, etc.) via `.gitignore`.

### 4.2 Universal Links (iOS)

- [ ] Obter **Team ID** no Apple Developer Account.
- [ ] Criar App ID `py.com.monarcasemijoyas.app` com capability **Associated Domains** ativada.
- [ ] Publicar `apple-app-site-association` em `https://monarcasemijoyas.com.py/.well-known/apple-app-site-association` (sem extensão, servido como `application/json`):
  ```json
  {
    "applinks": {
      "apps": [],
      "details": [
        {
          "appID": "<TEAM_ID>.py.com.monarcasemijoyas.app",
          "paths": [
            "/auth/callback",
            "/auth/callback/*",
            "/app",
            "/app/*"
          ]
        }
      ]
    }
  }
  ```
- [ ] Adicionar no Next.js uma rota `app/.well-known/apple-app-site-association/route.ts` que retorne esse JSON com `Content-Type: application/json`.
- [ ] No Xcode (`ios/App/App.xcworkspace`): Signing & Capabilities → Associated Domains → adicionar `applinks:monarcasemijoyas.com.py`.
- [ ] Instalar plugin: `pnpm add @capacitor/app` e `npx cap sync`.
- [ ] No lado web, capturar o deep link quando o app é aberto:
  ```ts
  import { App } from '@capacitor/app';
  App.addListener('appUrlOpen', ({ url }) => {
    const path = new URL(url).pathname + new URL(url).search;
    window.location.href = path; // dentro do WebView
  });
  ```
  (Esse listener roda no contexto do WebView, então navegar por `location.href` basta.)

### 4.3 App Links (Android)

- [ ] Publicar `https://monarcasemijoyas.com.py/.well-known/assetlinks.json`:
  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "py.com.monarcasemijoyas.app",
      "sha256_cert_fingerprints": ["<SHA256 da keystore de release>"]
    }
  }]
  ```
- [ ] Rota Next.js `app/.well-known/assetlinks.json/route.ts` servindo o JSON (ou via `public/.well-known/`).
- [ ] Editar `android/app/src/main/AndroidManifest.xml` com `intent-filter` na activity principal:
  ```xml
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="monarcasemijoyas.com.py" />
    <data android:pathPrefix="/auth/callback" />
    <data android:pathPrefix="/app" />
  </intent-filter>
  ```
- [ ] Gerar keystore de release (`keytool`) e guardar em secret manager.
- [ ] Extrair SHA-256 da keystore e copiar no `assetlinks.json`.

### 4.4 Plugins essenciais

| Feature atual | Plugin Capacitor | Substitui |
|---|---|---|
| Câmera na devolução | `@capacitor/camera` | `<input type="file" capture>` |
| Push notifications | `onesignal-cordova-plugin` (oficial para Capacitor) | OneSignal Web SDK |
| Compartilhar catálogo | `@capacitor/share` | `navigator.share` |
| OAuth externo | `@capacitor/browser` | `window.open` |
| Deep link listener | `@capacitor/app` | — (novo) |
| Splash screen | `@capacitor/splash-screen` | — |
| Status bar style | `@capacitor/status-bar` | `<meta theme-color>` |

Detectar ambiente no código:
```ts
import { Capacitor } from '@capacitor/core';
const isNative = Capacitor.isNativePlatform();
```

Usar isso para escolher o plugin native vs. a API web. Pattern sugerido: criar `src/lib/platform/` com wrappers que fallback para web quando `!isNative`.

### 4.5 Assets para as lojas

- [ ] **Ícones** — PNG 1024x1024 (iOS) e resoluções adaptáveis Android (foreground+background).
  - Ferramenta sugerida: `@capacitor/assets` (`npx capacitor-assets generate`).
- [ ] **Splash screen** — PNG 2732x2732.
- [ ] **Screenshots para stores** — 5–8 screenshots por plataforma, português + espanhol se quiser.
- [ ] **Descrição** — curta (ASO) e longa em espanhol paraguaio.
- [ ] **Política de privacidade** — URL pública (já implícita no site, mas precisa estar acessível sem login).

### 4.6 Push Notifications nativos

- [ ] No OneSignal Dashboard, criar plataformas **iOS (APNs)** e **Android (FCM)** ao lado da Web Push atual.
- [ ] Gerar certificado APNs no Apple Developer e uploar no OneSignal.
- [ ] Criar projeto Firebase + habilitar FCM + uploar `google-services.json` no OneSignal.
- [ ] Instalar plugin: `pnpm add onesignal-cordova-plugin` + `npx cap sync`.
- [ ] Inicializar no web side (detectar `Capacitor.isNativePlatform()`):
  ```ts
  if (Capacitor.isNativePlatform()) {
    OneSignal.initialize(APP_ID);
    OneSignal.Notifications.requestPermission(true);
  } else {
    // Web Push atual
  }
  ```
- [ ] Atualizar `src/components/OneSignalWrapper.tsx` para delegar ao plugin native em Capacitor.

### 4.7 Publicação

**iOS (App Store Connect):**
- [ ] Criar app em App Store Connect com bundle ID `py.com.monarcasemijoyas.app`.
- [ ] Archive no Xcode → Upload → TestFlight para QA interno.
- [ ] Submeter para App Review (primeira revisão leva 1–7 dias).
- [ ] Preparar respostas para o reviewer: credenciais de teste, descrição do fluxo.

**Android (Google Play Console):**
- [ ] Criar app em Play Console com package `py.com.monarcasemijoyas.app`.
- [ ] Gerar AAB assinado: `cd android && ./gradlew bundleRelease`.
- [ ] Upload em Internal Testing → Closed Testing (com testers cadastrados) → Produção.
- [ ] Google Play faz verificação automática de App Links na publicação — conferir no console.

### 4.8 QA obrigatório antes de subir para produção

- [ ] Login → navega normalmente.
- [ ] Reset de senha: solicitar no app → receber email → **clicar no link** → app abre automaticamente na tela de nova senha.
- [ ] Convite de revendedora: consultora cria → revendedora recebe email → clica → app abre em `/app/nueva-contrasena`.
- [ ] Push notification: enviar campanha → chega no dispositivo → tap abre app no path correto.
- [ ] Câmera da devolução: foto tirada via plugin nativo, upload R2 ok.
- [ ] Navegar entre páginas offline → fallback gracioso (depende do Service Worker existente).
- [ ] Logout → reabrir app → tela de login (não cache indevido).
- [ ] Botão físico "voltar" do Android → funciona coerentemente.
- [ ] Tamanho final do binário < 20 MB (esperado ~5 MB).

---

## 5. Impacto em especificações existentes

Após adoção, atualizar:

- [`revendedoras/SPEC_LOGIN.md`](../revendedoras/SPEC_LOGIN.md) — adicionar seção "Comportamento nativo" com biometria opcional.
- [`revendedoras/SPEC_RECUPERAR_CONTRASENA.md`](../revendedoras/SPEC_RECUPERAR_CONTRASENA.md) — registrar que o link abre o app via Universal Links.
- [`revendedoras/SPEC_DEVOLUCAO.md`](../revendedoras/SPEC_DEVOLUCAO.md) — substituir input de câmera por `@capacitor/camera`.
- [`revendedoras/SPEC_NOTIFICACOES.md`](../revendedoras/SPEC_NOTIFICACOES.md) — documentar push native.
- [`sistema/SPEC_DEPLOY_STRATEGY.md`](./SPEC_DEPLOY_STRATEGY.md) — acrescentar esteira de release nativo (TestFlight + Closed Testing).
- [`prd/PRD_OneSignal_PWA.md`](../prd/PRD_OneSignal_PWA.md) — evoluir para mencionar push native quando aplicável.

---

## 6. Edge cases e riscos

| Risco | Mitigação |
|---|---|
| Apple rejeita app por "ser só um website em WebView" | Adicionar pelo menos 2–3 features nativas claras (push native, câmera com plugin, biometria ou haptics). Guideline 4.2 é frequentemente o motivo de rejeição. |
| Usuário abre link antes de ter o app instalado | OS abre no browser normalmente. Fluxo web continua funcionando — nenhuma regressão. |
| App Links Android falham na verificação automática | Testar com `adb shell pm verify-app-links`. Requer que `assetlinks.json` esteja público e com SHA-256 correto. |
| Certificado APNs expira | Notificar calendário 30 dias antes (expiração anual). |
| Update urgente via loja trava por review | Se for só mudança web (código Next.js), evita loja — release imediato via Vercel. Mantém esse fallback documentado. |
| Content Security Policy bloqueia WebView | Adicionar `capacitor://` e `ionic://` nas origens permitidas (ou desativar CSP estrito em produção mobile). |
| Cookies Supabase em WebView | Verificar `cookies.sameSite` e `secure` no fluxo de auth. WebView iOS tem comportamento específico; testar cedo. |

---

## 7. Custos

| Item | Valor | Frequência |
|---|---|---|
| Apple Developer Program | USD 99 | Anual |
| Google Play Developer | USD 25 | Único |
| Certificado APNs | Incluso no Developer Program | Anual (renovação) |
| Tempo de dev (setup) | ~15 dias corridos | Único |
| Manutenção | ~2h/mês (updates de plugin, novos OS) | Recorrente |

---

## 8. Decisão

Esta SPEC é **opcional e futura**. O PWA atual atende o ciclo básico e o fluxo de reset de senha funciona via browser. A migração para Capacitor é um investimento que se justifica se:

- A base de revendedoras ativas crescer (mais de ~50 usuários diários).
- O custo de suporte com "o link não abre o app" ou "perdi a notificação" começar a aparecer.
- Houver intenção de posicionar Monarca como um produto mobile-first em materiais de captação.

Se for decidido prosseguir, adicionar itens acionáveis em `docs/next_steps.md` com prioridade apropriada e referenciar esta SPEC.

---

## 9. Dependências

- [`SPEC_DOMAIN_MIGRATION.md`](./SPEC_DOMAIN_MIGRATION.md) — domínio oficial é pré-requisito para Universal Links / App Links.
- [`SPEC_EMAILS.md`](./SPEC_EMAILS.md) — templates usam `{{ .SiteURL }}/auth/callback?token_hash=...`, compatíveis com deep link.
- `src/app/auth/callback/route.ts` — já faz o roteamento correto por role; servirá tanto para browser quanto para WebView.
- [`revendedoras/SPEC_NOTIFICACOES.md`](../revendedoras/SPEC_NOTIFICACOES.md) — OneSignal já integrado; extensão para native é incremental.
- [`SPEC_OFFLINE_SYNC.md`](./SPEC_OFFLINE_SYNC.md) — o modo offline ganha qualidade significativa com Capacitor (SQLite + background sync); Fase 4 da roadmap offline depende desta SPEC.
