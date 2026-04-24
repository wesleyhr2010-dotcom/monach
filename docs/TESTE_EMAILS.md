# Guia de Teste — Emails Monarca (Brevo + Supabase Auth)

> Data: 2026-04-23
> Ambiente: Produção (`https://monarcasemijoyas.com.py`)
> SMTP configurado: Brevo (`smtp-relay.brevo.com:587`)

---

## Teste 1 — Reset de Senha (Admin/Consultora)

Este usa o **SMTP do Supabase Auth** (agora apontando para Brevo).

### Passos
1. Acesse: `https://monarcasemijoyas.com.py/admin/login`
2. Clique em **"¿Olvidé mi contraseña?"**
3. Digite o email de uma consultora ou admin existente no banco
4. Clique em **"Enviar enlace de recuperación"**

### Resultado esperado
- ✅ Mensagem de sucesso aparece na tela
- ✅ Email chega na caixa de entrada (verificar **Spam** também!)
- ✅ Assunto: `Monarca — Restablece tu contraseña`
- ✅ Remetente: `no-reply@monarcasemijoyas.com.py`
- ✅ Link aponta para: `https://monarcasemijoyas.com.py/admin/login/reset-password`

### Se não chegar
- Verificar caixa de **Spam / Correo no deseado**
- Confirmar se o email existe no banco (tabela `resellers`)
- Verificar logs do Supabase Dashboard → Auth → Logs
- Verificar se o domínio está verificado no Brevo Dashboard

---

## Teste 2 — Reset de Senha (Revendedora / PWA)

Este também usa o **SMTP do Supabase Auth**.

### Passos
1. Acesse: `https://monarcasemijoyas.com.py/app/login`
2. Clique em **"¿Olvidaste tu contraseña?"**
3. Digite o email de uma revendedora existente
4. Clique em enviar

### Resultado esperado
- ✅ Email chega com assunto sobre recuperação de senha
- ✅ Link aponta para: `https://monarcasemijoyas.com.py/app/nueva-contrasena`

---

## Teste 3 — Criar Nova Consultora (Convite por Email)

Este usa a **API Brevo via nosso código** (não o SMTP do Supabase).

### Passos
1. Acesse: `https://monarcasemijoyas.com.py/admin/consultoras`
2. Clique em **"+ Nueva Consultora"**
3. Preencha:
   - Nome: `Teste Convite`
   - Email: **use um email seu que consiga verificar**
   - WhatsApp: `+595 981 000 000`
   - Taxa de Comissão: `10`
4. Clique em **"Crear y Enviar Convite"**

### Resultado esperado
- ✅ Mensagem de sucesso na tela
- ✅ Usuário criado na tabela `resellers` com `role = COLABORADORA`
- ✅ Usuário criado no Supabase Auth (visible em Auth → Users)
- ✅ Email de convite chega com:
   - Assunto: `💼 ¡Bienvenida al equipo! — Monarca Semijoyas`
   - Link de definição de senha (válido por 24h)
   - Link para `/admin/login`

### Se der erro
- Verificar se o email já existe no Auth (erro: "Este correo ya está registrado")
- Verificar logs no console do servidor (Vercel)

---

## Teste 4 — Criar Nova Revendedora (Convite por Email)

Mesmo fluxo do Teste 3, mas com `role = REVENDEDORA`.

### Passos
1. Acesse: `https://monarcasemijoyas.com.py/admin/revendedoras`
2. Clique em **"+ Nueva Revendedora"**
3. Preencha os dados + selecione uma consultora
4. Clique em **"Crear y Enviar Convite"**

### Resultado esperado
- ✅ Email com assunto: `🦋 ¡Bienvenida a Monarca Semijoyas!`
- ✅ Link para `/app/login`

---

## Teste 5 — Verificar Limite Diário do Brevo

O plano gratuito do Brevo permite **300 emails/dia**.

### Como verificar uso
1. Acesse: [brevo.com](https://brevo.com) → Log in
2. Dashboard principal mostra o consumo do dia
3. Ou vá em **Statistics → Email** para ver detalhes

---

## Checklist de Verificação Final

| # | Verificação | Status |
|---|-------------|--------|
| 1 | Reset de senha admin chega no email | ⬜ |
| 2 | Link de reset admin funciona (define senha nova) | ⬜ |
| 3 | Reset de senha PWA chega no email | ⬜ |
| 4 | Criação de consultora envia convite | ⬜ |
| 5 | Criação de revendedora envia convite | ⬜ |
| 6 | Emails não caem em Spam | ⬜ |
| 7 | Links no email apontam para `monarcasemijoyas.com.py` | ⬜ |

---

## Troubleshooting

### Email não chega
1. **Verificar Spam** — primeiro lugar a olhar
2. **Verificar se o domínio está verificado no Brevo**
   - Brevo Dashboard → Settings → Senders & IPs → Domains
   - `monarcasemijoyas.com.py` deve estar verificado (verde)
3. **Verificar Supabase Auth Logs**
   - Supabase Dashboard → Authentication → Logs
4. **Verificar se a API Key do Brevo está ativa**
   - Brevo Dashboard → Settings → SMTP & API → API Keys

### Link de reset não funciona
1. Confirmar que `NEXT_PUBLIC_SITE_URL=https://monarcasemijoyas.com.py`
2. Verificar se a rota `/admin/login/reset-password` está acessível
3. Verificar se o middleware permite acesso sem auth em `/admin/login/*`

### Erro "Este correo ya está registrado"
- O email já existe no Supabase Auth
- Verificar em: Supabase Dashboard → Authentication → Users
- Se for um teste, delete o usuário do Auth primeiro

---

## Observações Importantes

- **Nunca commitar `.env.local`** — contém a API Key do Brevo
- **API Key exposta?** — Se alguém viu a chave, gere uma nova no Brevo Dashboard
- **Limite diário**: 300 emails/dia no plano gratuito (suficiente para 200 revendedoras ativas com 1 acerto/mês cada)
- **Domínio**: Todo email sai de `no-reply@monarcasemijoyas.com.py`

---

## Links Úteis

- **Brevo Dashboard**: [brevo.com](https://brevo.com)
- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **Site**: `https://monarcasemijoyas.com.py`
