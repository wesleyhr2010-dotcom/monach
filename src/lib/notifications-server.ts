const ALLOWED_TAGS = new Set(["b", "i", "strong", "em", "br", "p", "a"]);

// Sanitiza variáveis de template: mantém tags básicas de formatação,
// remove scripts, handlers de evento e atributos perigosos.
// Usa regex simples para evitar dependência em jsdom (incompatível com Turbopack SSR).
export function sanitizeTemplateVars(input: string): string {
  return input
    // Remove event handlers em qualquer tag
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    // Remove href com javascript:
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"')
    // Remove tags não permitidas (mantém conteúdo interno)
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
      return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : "";
    })
    // Remove scripts e seus conteúdos completamente
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}
