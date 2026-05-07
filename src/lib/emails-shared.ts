/**
 * Metadados centralizados de templates de e-mail transacional Monarca.
 *
 * Fonte de verdade para:
 * - Lista de tipos de e-mail disponíveis (7 templates)
 * - Whitelist de variáveis permitidas por tipo
 * - Variáveis globais disponíveis em todos os templates
 *
 * Segue padrão de notifications-shared.ts (D-06).
 */

export interface EmailTemplateOption {
  value: string; // e.g., 'acerto_confirmado'
  label: string; // e.g., 'Confirmação de Acerto' (Paraguayan Spanish)
}

/**
 * Lista completa dos 7 tipos de e-mail transacional.
 */
export const TIPO_EMAIL_OPTIONS: EmailTemplateOption[] = [
  { value: "acerto_confirmado", label: "Confirmación de Consignación" },
  { value: "candidatura_aprobada", label: "Candidatura Aprobada" },
  { value: "candidatura_rechazada", label: "Candidatura Rechazada" },
  { value: "convite_usuario", label: "Invitación de Usuario" },
  { value: "documento_aprobado", label: "Documento Aprobado" },
  { value: "documento_pendiente", label: "Documento Pendiente" },
  { value: "documento_rejeitado", label: "Documento Rechazado" },
];

/**
 * Variáveis permitidas por tipo de e-mail (whitelist D-05).
 * Apenas estas variáveis serão interpoladas nos templates.
 */
export const EMAIL_VARIAVEIS_POR_TIPO: Record<string, string[]> = {
  acerto_confirmado: [
    "nome_revendedora",
    "maleta_numero",
    "valor_vendido",
    "comissao",
    "pct_comissao",
    "portal_url",
  ],
  candidatura_aprobada: [
    "nome_revendedora",
    "portal_url",
    "whatsapp_colaboradora",
  ],
  candidatura_rechazada: [
    "nome_revendedora",
    "motivo_rechazo",
    "whatsapp_soporte",
  ],
  convite_usuario: [
    "nome_convidado",
    "nome_convidante",
    "url_registro",
    "whatsapp_soporte",
  ],
  documento_aprobado: [
    "nome_revendedora",
    "tipo_documento",
    "docs_url",
  ],
  documento_pendiente: [
    "nome_revendedora",
    "tipo_documento",
    "docs_url",
    "prazo_limite",
  ],
  documento_rejeitado: [
    "nome_revendedora",
    "tipo_documento",
    "motivo_rechazo",
    "docs_url",
  ],
};

/**
 * Variáveis globais disponíveis em TODOS os templates (D-07).
 */
export const EMAIL_VARIAVEIS_GLOBAIS: string[] = [
  "site_url",
  "email_suporte",
  "nome_revendedora",
  "whatsapp_soporte",
];
