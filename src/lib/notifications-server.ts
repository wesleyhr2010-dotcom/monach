import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza HTML de template, permitindo apenas tags de formatação básicas.
 * Remove scripts, handlers de evento e atributos perigosos.
 *
 * NOTA: Este arquivo é server-only. Não importar em componentes client-side.
 */
export function sanitizeTemplateVars(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "strong", "em", "br", "p", "a"],
    ALLOWED_ATTR: ["href"],
  });
}
