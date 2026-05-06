/**
 * Base de email branding Monarca — wrapper visual unificado, utilitários híbridos
 * (HTML + plaintext) e dark mode inline.
 *
 * ⚠️  Esta camada é **apresentação pura**. Consumidores DEVEM sanitizar inputs
 * (nomes, tipos de documento, etc.) com DOMPurify **antes** de passar para
 * `renderEmailBase`, `emailAlert` ou `emailTable`.
 *
 * Regras de tom de voz:
 * - Aprovação / cadastro: entusiasmado, pode usar exclamação.
 * - Documentos / acertos: neutro, informativo.
 * - Rejeição: respeitoso, **sem exclamação**.
 * - Máximo 2 emojis por email.
 * - Paleta aprovada: 💎 🦋 ✅ ❌ 📄 🎉
 */

export interface EmailContent {
  html: string;
  text: string;
}

interface RenderEmailBaseOptions {
  title: string;
  previewText?: string;
  greeting?: string;
  bodyHtml: string;
  bodyText: string;
  cta?: { text: string; url: string };
  footerExtra?: string;
}

const BANNER_URL =
  process.env.EMAIL_BANNER_URL ??
  "https://fotos-monarca.s3.amazonaws.com/logo-email-banner.png";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : `https://${process.env.NEXT_PUBLIC_SITE_URL}`) ??
  "https://monarcasemijoyas.com.py";

const PRIMARY = "#35605a";
const PRIMARY_DARK = "#4A7D76";
const BG_LIGHT = "#F5F2EF";
const TEXT_LIGHT = "#1A1A1A";
const BG_DARK = "#1A1A1A";
const TEXT_DARK = "#F5F2EF";

/**
 * Gera o wrapper visual completo de um email Monarca.
 *
 * @param options.title — Assunto / título do email (aparece no `<title>` e no texto)
 * @param options.previewText — Texto de pré-visualização (hidden div, não exceder 90 caracteres)
 * @param options.greeting — Saudação inicial. Use entusiasmado para aprovação/cadastro,
 *        neutro para documentos/acertos, respeitoso sem exclamação para rejeição.
 * @param options.bodyHtml — Corpo em HTML. **Deve ser pré-sanitizado pelo consumidor.**
 * @param options.bodyText — Corpo em texto puro. **Deve ser pré-sanitizado pelo consumidor.**
 * @param options.cta — Botão de ação (opcional). Será renderizado com `emailButton`.
 * @param options.footerExtra — Texto adicional no rodapé (opcional).
 *
 * @remarks
 * - Máximo 2 emojis por email.
 * - Paleta aprovada: 💎 🦋 ✅ ❌ 📄 🎉
 */
export function renderEmailBase(options: RenderEmailBaseOptions): EmailContent {
  const { title, previewText, greeting, bodyHtml, bodyText, cta, footerExtra } =
    options;

  const ctaHtml = cta
    ? `<tr><td style="padding:0 24px 24px;">${emailButton({ text: cta.text, url: cta.url }).html}</td></tr>`
    : "";

  const ctaText = cta ? `${cta.text}: ${cta.url}` : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(title)}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body, .email-wrapper { background-color: ${BG_DARK} !important; }
      .email-body { color: ${TEXT_DARK} !important; }
      .email-primary { color: ${PRIMARY_DARK} !important; }
      .email-button { background-color: ${PRIMARY_DARK} !important; }
    }
  </style>
</head>
<body bgcolor="${BG_LIGHT}" style="margin:0; padding:0; background-color:${BG_LIGHT}; font-family:Arial,sans-serif; color:${TEXT_LIGHT};">
  ${previewText ? `<div style="display:none; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${escapeHtml(previewText)}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;" class="email-wrapper">
          <tr>
            <td>
              <img src="${BANNER_URL}" alt="Monarca Semijoyas" style="display:block; width:100%; max-width:600px; border:0;" />
            </td>
          </tr>
          ${greeting ? `<tr><td style="padding:24px 24px 0; font-size:16px;" class="email-body">${escapeHtml(greeting)}</td></tr>` : ""}
          <tr>
            <td style="padding:24px; font-size:16px; line-height:1.6;" class="email-body">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaHtml}
          <tr>
            <td style="padding:0 24px 24px; font-size:13px; color:#888; line-height:1.5;" class="email-body">
              <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
              <p style="margin:0 0 8px; font-weight:bold; color:${PRIMARY};" class="email-primary">Monarca Semijoyas</p>
              <p style="margin:0 0 8px;"><a href="${SITE_URL}" style="color:${PRIMARY}; text-decoration:underline;" class="email-primary">Visitar sitio</a></p>
              <p style="margin:0 0 8px;">Este correo fue enviado automáticamente. No respondas a esta dirección.</p>
              <p style="margin:0 0 8px;">¿Necesitás ayuda? Escríbenos por WhatsApp.</p>
              ${footerExtra ? `<p style="margin:8px 0 0;">${footerExtra}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    "Monarca Semijoyas",
    "---",
    title,
    previewText ?? "",
    greeting ?? "",
    bodyText,
    ctaText,
    "---",
    `Visitar sitio: ${SITE_URL}`,
    "Este correo fue enviado automáticamente. No respondas a esta dirección.",
    "¿Necesitás ayuda? Escríbenos por WhatsApp.",
    footerExtra ?? "",
  ];

  const text = textLines.filter(Boolean).join("\n");

  return { html, text };
}

interface EmailButtonOptions {
  text: string;
  url: string;
  variant?: "primary" | "outline";
}

/**
 * Gera um botão CTA estilizado nativo (link `<a>` com padding/background/border-radius).
 *
 * @remarks Não usa bulletproof tables — link inline com estilos nativos.
 */
export function emailButton(options: EmailButtonOptions): EmailContent {
  const { text, url, variant = "primary" } = options;

  const isOutline = variant === "outline";
  const bg = isOutline ? "transparent" : PRIMARY;
  const color = isOutline ? PRIMARY : "#ffffff";
  const border = isOutline ? `2px solid ${PRIMARY}` : "none";

  const html = `<a href="${escapeHtml(url)}" style="display:inline-block; background:${bg}; color:${color}; padding:12px 28px; border-radius:6px; text-decoration:none; font-family:Arial,sans-serif; font-size:16px; border:${border};" class="email-button">${escapeHtml(text)}</a>`;

  const plain = `${text}: ${url}`;

  return { html, text: plain };
}

interface EmailTableOptions {
  headers?: string[];
  rows: string[][];
  highlightRow?: number;
}

/**
 * Gera uma tabela de dados com estilos inline para email.
 *
 * @remarks O consumidor deve garantir que os valores de `rows` estejam sanitizados.
 */
export function emailTable(options: EmailTableOptions): EmailContent {
  const { headers, rows, highlightRow } = options;

  const headerHtml = headers
    ? `<tr style="background:#f5f5f5;">${headers
        .map(
          (h) =>
            `<th style="padding:10px; border:1px solid #ddd; font-weight:bold; text-align:left;">${escapeHtml(h)}</th>`
        )
        .join("")}</tr>`
    : "";

  const rowsHtml = rows
    .map((row, idx) => {
      const bg =
        idx === highlightRow ? "background:#fff8e7;" : "";
      return `<tr style="${bg}">${row
        .map(
          (cell) =>
            `<td style="padding:10px; border:1px solid #ddd;">${escapeHtml(cell)}</td>`
        )
        .join("")}</tr>`;
    })
    .join("");

  const html = `<table style="width:100%; border-collapse:collapse; margin:16px 0;" cellpadding="0" cellspacing="0" border="0">${headerHtml}${rowsHtml}</table>`;

  const text = rows
    .map((row) =>
      row.map((cell) => cell.replace(/\n/g, " ")).join(": ")
    )
    .join("\n");

  return { html, text };
}

interface EmailAlertOptions {
  text: string;
  variant: "info" | "success" | "warning";
}

/**
 * Gera um bloco de alerta/destaque com borda lateral colorida.
 *
 * @remarks O consumidor deve sanitizar `text` antes de chamar.
 */
export function emailAlert(options: EmailAlertOptions): EmailContent {
  const { text, variant } = options;

  const styles: Record<EmailAlertOptions["variant"], string> = {
    info: "background:#e8f4f8; border-left:4px solid #35605a; color:#1a1a1a;",
    success: "background:#e8f5e9; border-left:4px solid #2e7d32; color:#1a1a1a;",
    warning: "background:#fff8e7; border-left:4px solid #C9A84C; color:#1a1a1a;",
  };

  const html = `<div style="padding:12px 16px; margin:12px 0; ${styles[variant]}">${escapeHtml(text)}</div>`;

  return { html, text: `> ${text}` };
}

/**
 * Gera um divisor horizontal.
 */
export function emailDivider(): EmailContent {
  const html = `<hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />`;
  return { html, text: "---" };
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
