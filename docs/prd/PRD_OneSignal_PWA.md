# Product Requirements Document (PRD): Implementação de Push Notifications com OneSignal no PWA

## 1. Resumo Executivo
Este documento descreve os requisitos para a implementação de Push Notifications utilizando a plataforma **OneSignal** em nossa aplicação web progressiva (PWA) construída com Next.js (App Router). O objetivo principal é engajar as revendedoras através de notificações relevantes sobre suas maletas e atividades.

## 2. Objetivos
- Configurar e integrar o SDK do OneSignal na aplicação Next.js.
- Solicitar a permissão de envio de notificações **apenas** para usuárias que instalaram o PWA (adicionaram à tela inicial).
- Restringir a solicitação de permissão estritamente à rota `/app` (área logada da revendedora).
- Melhorar a retenção e o engajamento das revendedoras através de notificações oportunas, mantendo uma experiência de usuário (UX) não intrusiva.

## 3. Casos de Uso
1. **Instalação do PWA e Permissão Inicial:** A revendedora acessa o site via navegador, adiciona o PWA à tela inicial. Ao abrir o aplicativo instalado pela primeira vez e acessar o painel (`/app`), o sistema detecta que ela está no modo "Standalone" e solicita gentilmente a permissão para envio de notificações.
2. **Notificações Transacionais:** A revendedora recebe alertas sobre novas maletas disponíveis, prazos de devolução, confirmações de pagamento, etc.

## 4. Requisitos Funcionais (RF)
- **RF01:** O sistema deve verificar se a aplicação está sendo executada como um PWA instalado (modo `standalone`).
- **RF02:** O sistema não deve solicitar permissão para notificações web (Push) se a revendedora estiver acessando via navegador convencional (aba normal).
- **RF03:** A solicitação de permissão de notificação (Prompt) deve ocorrer de forma automática apenas dentro da rota `/app` (e sub-rotas), através de um componente injetado no layout focado na revendedora.
- **RF04:** O sistema deve registrar a inscrição (subscription) do dispositivo do usuário atrelado ao ID do usuário autenticado no sistema (Supabase), permitindo o envio de mensagens diretas usando métodos como `OneSignal.login(userId)`.
- **RF05:** (Recomendado) O sistema deve utilizar a abordagem de "Soft Prompt" do OneSignal para apresentar um aviso amigável explicando o benefício da notificação antes de chamar o prompt nativo impeditivo do sistema operacional.

## 5. Requisitos Técnicos e de Engenharia (RT)
- **Tecnologias:** Next.js (App Router), React, OneSignal SDK for Web (`react-onesignal`).
- **RT01:** O arquivo service worker do OneSignal (`OneSignalSDKWorker.js`) deve ser incluído publicamente na pasta `/public`.
- **RT02:** Inicialização do SDK deve respeitar o Server-Side Rendering (SSR) do Next.js, sendo executada exclusivamente no client-side usando a diretiva `'use client'` e o hook `useEffect`.
- **RT03:** Integração e detecção do modo PWA deve utilizar a API JavaScript `window.matchMedia('(display-mode: standalone)')` com fallbacks para dispositivos iOS antigos usando `navigator.standalone`.
- **RT04:** A chave App ID do OneSignal deve ser armazenada e obtida através de variáveis de ambiente (`NEXT_PUBLIC_ONESIGNAL_APP_ID`) no arquivo `.env`.

## 6. Fluxo de Execução Recomendado (User Flow)
1. **Acesso Browser:** Revendedora acessa o site na web (mobile ou desktop). Nenhuma permissão solicitada.
2. **Ação "Add to Home Screen":** Revendedora instala o PWA.
3. **Acesso Standalone (PWA Instalado):** Revendedora abre o aplicativo pelo ícone gerado no celular.
4. **Navegação (`/app`):** Ao carregar o layout da aplicação (`/app/layout.tsx`), um Hook processa a verificação:
   - *Está no aplicativo Standalone?* SIM.
   - *Permissão já foi fornecida?* NÃO.
   - *Ação:* O componente invoca a UI do OneSignal para solicitar acesso às notificações push.
5. **Autenticação de Player:** Após o login da usuária, o ID OneSignal vincula o device atual ao UUID registrado no Supabase de maneira segura.

## 7. Dependências e Considerações de Plataforma
- **iOS/Safari:** Dispositivos Apple (iOS 16.4+) exigem obrigatoriamente que a aplicação web seja instalada e inicializada a partir da Tela de Início para habilitar a Web Push API. Essa limitação técnica confirma o ajuste natural do escopo (somente requerer permissão no PWA instalado), centralizando assim o suporte consistente entre Android e iOS.
- **Android:** Não há restrição severa como a do iOS, mas para uniformizar abordagens e diminuir taxa de rejeição silenciosa, usaremos o padrão para todo cliente.

## 8. Critérios de Aceite
- [ ] O SDK `react-onesignal` está instalado e não afeta tempo de compilação ou build do projeto Vercel de forma impeditiva.
- [ ] Variáveis no `window` e falhas de Server Component rendering foram dribladas adequadamente no Next App Router.
- [ ] O prompt *NÃO* é exibido num acesso normal mobile pelo Chrome/Safari.
- [ ] O prompt *É* engatilhado com sucesso nas visualizações de WebAPK Android ou Atalho iOS, após a home principal (`/app`) ser carregada.
- [ ] Envios de notificações manuais emitidas do painel admin OneSignal chegam corretamente nos devices de desenvolvimento opt-in.
