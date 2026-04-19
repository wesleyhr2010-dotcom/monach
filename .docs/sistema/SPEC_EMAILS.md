# SPEC — Sistema de Emails

**Decisão:** Todo o sistema de email usa **Brevo** (antigo Sendinblue) como único provedor.

Motivos:
- Free tier: 300 emails/dia · 9.000/mês — margem suficiente para crescer sem pagar de imediato
- Funciona como SMTP relay para os emails do Supabase Auth (reset, convite)
- Funciona via API/SDK para os emails transacionais do Next.js
- Um único domínio, um único DNS, um único dashboard

---

## Os dois caminhos de envio

```
SUPABASE AUTH (reset senha / convite)
  Supabase ──► smtp-relay.brevo.com:587 ──► inbox do usuário
  (configurado no dashboard Supabase, sem código)

EMAILS TRANSACIONAIS (documentos, acertos)
  Next.js Server Action ──► api.brevo.com ──► inbox do usuário
  (SDK @getbrevo/brevo instalado no projeto)
```

Ambos saem do domínio `no-reply@monarca.com.py`.

---

## Configuração do Brevo

### 1. Criar conta e verificar domínio

1. Criar conta em [brevo.com](https://brevo.com)
2. Ir em **Settings → Senders & IPs → Domains**
3. Adicionar `monarca.com.py` e seguir o wizard de DNS
4. Adicionar os registros no provedor DNS da Monarca:

```
# Registros a adicionar no DNS:
TXT  @   "v=spf1 include:spf.brevo.com ~all"
TXT  brevo._domainkey   [chave DKIM gerada pelo Brevo]
```

### 2. Configurar SMTP do Supabase

**Caminho:** Supabase Dashboard → Project Settings → Auth → SMTP Settings

| Campo | Valor |
|-------|-------|
| Sender name | Monarca Semijoyas |
| Sender email | `no-reply@monarca.com.py` |
| SMTP Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | seu email de login no Brevo |
| Password | **SMTP Key** gerada em Brevo → Settings → SMTP & API |

> ⚠️ A Password aqui é a **SMTP Key** do Brevo, não a senha da sua conta.

### 3. Variáveis de ambiente (Next.js)

```env
# Brevo — emails transacionais
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
BREVO_FROM_EMAIL=no-reply@monarca.com.py
BREVO_FROM_NAME=Monarca Semijoyas
```

### 4. Instalar SDK

```bash
npm install @getbrevo/brevo
```

---

## Templates dos Emails Auth (Supabase Dashboard)

Personalizar em: **Supabase Dashboard → Authentication → Email Templates**

### Template: Reset Password

```html
<!-- Assunto -->
Monarca — Restablece tu contraseña

<!-- HTML -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #35605a;">🔐 Restablecer contraseña</h2>
  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Monarca.</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: #35605a; color: white;
            padding: 12px 28px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
    Restablecer contraseña
  </a>
  <p style="color: #888; font-size: 13px;">El enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #aaa; font-size: 12px;">Monarca Semijoyas · monarca.com.py</p>
</div>
```

### Template: Invite User (boas-vindas)

```html
<!-- Assunto -->
Monarca — ¡Bienvenida! Crea tu contraseña

<!-- HTML -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #35605a;">💎 ¡Bienvenida a Monarca!</h2>
  <p>Tu cuenta fue creada. Haz clic abajo para definir tu contraseña y comenzar:</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: #35605a; color: white;
            padding: 12px 28px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
    Crear mi contraseña
  </a>
  <p style="color: #888; font-size: 13px;">El enlace expira en 24 horas.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #aaa; font-size: 12px;">Monarca Semijoyas · monarca.com.py</p>
</div>
```

---

## Emails Transacionais (Next.js + SDK Brevo)

### Cliente central

```ts
// src/lib/emails.ts
import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!,
);

const FROM = {
  email: process.env.BREVO_FROM_EMAIL ?? 'no-reply@monarca.com.py',
  name: process.env.BREVO_FROM_NAME ?? 'Monarca Semijoyas',
};

export async function sendEmail({
  to,
  subject,
  htmlContent,
}: {
  to: { email: string; name?: string } | { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}) {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = Array.isArray(to) ? to : [to];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (err) {
    // Email não deve bloquear a operação principal
    console.error('[Email Error]', subject, err);
  }
}
```

---

### Email 1: Documento enviado para revisão

**Trigger:** Revendedora pressiona "Enviar para Revisión" em `/app/perfil/documentos`  
**Destinatários:** Todos os admins + consultora da revendedora

```ts
// src/lib/email-templates/documento-pendente.ts
export async function emailDocumentoPendente(
  resellerName: string,
  resellerId: string,
  tipoDocumento: string,
  destinatarios: { email: string; name?: string }[],
) {
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/revendedoras/${resellerId}/documentos`;

  await sendEmail({
    to: destinatarios,
    subject: `📄 Nuevo documento para revisar — ${resellerName}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #35605a;">📄 Documento pendiente de revisión</h2>
        <p><strong>${resellerName}</strong> envió un <strong>${tipoDocumento}</strong> para revisión.</p>
        <a href="${link}"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Revisar en el panel admin
        </a>
      </div>
    `,
  });
}
```

---

### Email 2: Documento aprovado

**Trigger:** Admin aprova CI em `/admin/revendedoras/[id]/documentos`  
**Destinatário:** Revendedora

```ts
// src/lib/email-templates/documento-aprovado.ts
export async function emailDocumentoAprovado(
  resellerEmail: string,
  resellerName: string,
  tipoDocumento: string,
) {
  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: '✅ Tu documento fue aprobado — Monarca',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #35605a;">✅ ¡Documento aprobado!</h2>
        <p>Hola <strong>${resellerName}</strong>,</p>
        <p>Tu <strong>${tipoDocumento}</strong> fue revisado y aprobado. 🎉</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/perfil/documentos"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Ver mis documentos
        </a>
      </div>
    `,
  });
}
```

---

### Email 3: Documento rejeitado

**Trigger:** Admin rejeita CI  
**Destinatário:** Revendedora

```ts
// src/lib/email-templates/documento-rejeitado.ts
export async function emailDocumentoRejeitado(
  resellerEmail: string,
  resellerName: string,
  tipoDocumento: string,
  motivo: string,
) {
  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: '❌ Tu documento necesita corrección — Monarca',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #c0392b;">❌ Documento con observaciones</h2>
        <p>Hola <strong>${resellerName}</strong>,</p>
        <p>Tu <strong>${tipoDocumento}</strong> necesita correcciones.</p>
        <p><strong>Motivo:</strong> ${motivo}</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/perfil/documentos"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Actualizar documento
        </a>
      </div>
    `,
  });
}
```

---

### Email 4: Acerto confirmado

**Trigger:** Admin fecha acerto em `/admin/maletas/[id]/acerto`  
**Destinatário:** Revendedora

```ts
// src/lib/email-templates/acerto-confirmado.ts
export async function emailAcertoConfirmado(
  resellerEmail: string,
  resellerName: string,
  maletaNumero: number,
  valorVendido: string,
  comissao: string,
  pctComissao: number,
) {
  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: `✅ Consignación #${maletaNumero} confirmada — Monarca`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #35605a;">✅ ¡Consignación cerrada!</h2>
        <p>Hola <strong>${resellerName}</strong>,</p>
        <p>Tu consultora confirmó la recepción de la consignación <strong>#${maletaNumero}</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:10px; border:1px solid #ddd;">Total vendido</td>
            <td style="padding:10px; border:1px solid #ddd;"><strong>${valorVendido}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #ddd;">Tu comisión (${pctComissao}%)</td>
            <td style="padding:10px; border:1px solid #ddd; color:#35605a;"><strong>${comissao}</strong></td>
          </tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/maleta"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Ver mis consignaciones
        </a>
      </div>
    `,
  });
}
```

---

### Email 5: Candidatura aprovada — boas-vindas com acesso

**Trigger:** Admin aprova lead em `/admin/leads` → Server Action `aprovarLead()`  
**Destinatário:** Candidata aprovada

```ts
// src/lib/email-templates/candidatura-aprovada.ts
export async function emailCandidaturaAprovada(params: {
  email: string;
  nome: string;
  senhaTemp: string;
}) {
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/login`;

  await sendEmail({
    to: { email: params.email, name: params.nome },
    subject: '🦋 ¡Bienvenida a Monarca Semijoyas!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #C9A84C;">🦋 ¡Tu solicitud fue aprobada!</h2>
        <p>Hola <strong>${params.nome}</strong>,</p>
        <p>¡Felicitaciones! Tu candidatura para ser Revendedora Monarca fue <strong>aprobada</strong>. 🎉</p>
        <p>Aquí están tus datos de acceso al portal:</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0; background: #f9f9f9; border-radius: 8px;">
          <tr>
            <td style="padding:12px; font-weight:bold;">🌐 Portal</td>
            <td style="padding:12px;"><a href="${loginUrl}">${loginUrl}</a></td>
          </tr>
          <tr>
            <td style="padding:12px; font-weight:bold;">📧 Correo</td>
            <td style="padding:12px;">${params.email}</td>
          </tr>
          <tr style="background:#fff8e7;">
            <td style="padding:12px; font-weight:bold;">🔑 Contraseña temporal</td>
            <td style="padding:12px; font-family: monospace; font-size: 16px; letter-spacing: 2px;">${params.senhaTemp}</td>
          </tr>
        </table>
        <p style="color:#888; font-size:13px;">Por seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.</p>
        <p>Tu consultora asignada se pondrá en contacto contigo pronto para explicarte cómo funciona tu primera consignación.</p>
        <a href="${loginUrl}"
           style="display:inline-block; background:#35605a; color:white;
                  padding:12px 28px; border-radius:6px; text-decoration:none; margin:16px 0;">
          Ingresar al portal →
        </a>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
        <p style="color:#aaa; font-size:12px;">Monarca Semijoyas · monarca.com.py</p>
      </div>
    `,
  });
}
```

---

### Email 6: Candidatura rechazada

**Trigger:** Admin rechaza lead en `/admin/leads` → Server Action `recusarLead()`  
**Destinatário:** Candidata rejeitada

```ts
// src/lib/email-templates/candidatura-rechazada.ts
export async function emailCandidaturaRechazada(params: {
  email: string;
  nome: string;
}) {
  await sendEmail({
    to: { email: params.email, name: params.nome },
    subject: 'Sobre tu solicitud en Monarca Semijoyas',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #35605a;">Monarca Semijoyas</h2>
        <p>Hola <strong>${params.nome}</strong>,</p>
        <p>Gracias por tu interés en unirte a nuestra red de revendedoras.</p>
        <p>Lamentablemente, en esta oportunidad no podemos continuar con tu candidatura.</p>
        <p>Si tienes preguntas o deseas más información, puedes contactarnos directamente
           a través de nuestras redes sociales o por WhatsApp.</p>
        <p>Te agradecemos tu comprensión.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
        <p style="color:#aaa; font-size:12px;">Monarca Semijoyas · monarca.com.py</p>
      </div>
    `,
  });
}
```

---

## Estrutura de Arquivos

```
src/lib/
├── emails.ts                       ← Cliente Brevo central + sendEmail()
└── email-templates/
    ├── documento-pendente.ts
    ├── documento-aprovado.ts
    ├── documento-rejeitado.ts
    ├── acerto-confirmado.ts
    ├── candidatura-aprovada.ts     ← NOVO: boas-vindas + senha temp para revendedora aprovada
    └── candidatura-rechazada.ts    ← NOVO: email de recusa de candidatura
```


---

## Checklist de Configuração (pré-produção)

- [ ] Criar conta no Brevo em [brevo.com](https://brevo.com)
- [ ] Adicionar e verificar domínio `monarca.com.py` (DNS: SPF + DKIM)
- [ ] Gerar SMTP Key no Brevo → Settings → SMTP & API
- [ ] Configurar SMTP no Supabase Dashboard apontando para Brevo
- [ ] Testar email de reset de senha (revendedora + admin)
- [ ] Testar email de convite de nova revendedora
- [ ] Gerar API Key do Brevo e adicionar em `.env.local`
- [ ] Instalar SDK: `npm install @getbrevo/brevo`
- [ ] Testar emails transacionais em staging

---

## Limites do Free Tier Brevo

| Limite | Valor |
|--------|-------|
| Emails por dia | 300 |
| Emails por mês | 9.000 |
| Quando pagar | ~$25/mês para 20.000 emails/mês |

> Para referência: 200 revendedoras ativas com 1 acerto/mês cada = 200 emails/mês.
> O free tier aguenta ~45x esse volume sem pagar nada.
