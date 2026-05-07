import { describe, it, expect } from "vitest";
import { sanitizeEmailHtml, EMAIL_ALLOWED_TAGS } from "@/lib/email-sanitizer";

/**
 * Testes de contrato da allowlist de sanitização de email.
 * Estes testes documentam e enforcement a allowlist D-01..D-04 (CONTEXT.md).
 * São usados também como referência pela Fase 13 (editor de templates admin).
 *
 * Ref: SEC-04, D-11
 */
describe("sanitizeEmailHtml — allowlist contrato", () => {
  describe("Remove vetores de ataque", () => {
    it("remove <script> e seu conteúdo", () => {
      const result = sanitizeEmailHtml("<script>alert(1)</script>texto");
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert(1)");
      expect(result).toContain("texto");
    });

    it("remove event handlers em atributos (onclick)", () => {
      const result = sanitizeEmailHtml('<p onclick="evil()">texto</p>');
      expect(result).not.toContain("onclick");
      expect(result).toContain("<p>");
      expect(result).toContain("texto");
    });

    it("remove event handlers em atributos (onerror, onload)", () => {
      const result = sanitizeEmailHtml('<img src="x" onerror="evil()" onload="also()">');
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("onload");
      expect(result).not.toContain("<img");
    });

    it("remove href com protocolo javascript:", () => {
      const result = sanitizeEmailHtml('<a href="javascript:alert(1)">clique</a>');
      expect(result).not.toContain("javascript:");
      expect(result).toContain("clique");
    });

    it("remove href com protocolo data:", () => {
      const result = sanitizeEmailHtml('<a href="data:text/html,<script>evil()</script>">link</a>');
      expect(result).not.toContain("data:");
      expect(result).toContain("link");
    });

    it("remove tags não na allowlist (<table>, <img>)", () => {
      const result = sanitizeEmailHtml("<table><tr><td>dado</td></tr></table>");
      expect(result).not.toContain("<table");
      expect(result).not.toContain("<tr");
      expect(result).not.toContain("<td");
      expect(result).toContain("dado");
    });

    it("remove atributos não permitidos (class, id, data-*)", () => {
      const result = sanitizeEmailHtml('<p class="danger" id="x" data-payload="evil">texto</p>');
      expect(result).not.toContain('class=');
      expect(result).not.toContain('id=');
      expect(result).not.toContain('data-payload');
      expect(result).toContain("texto");
    });
  });

  describe("Preserva conteúdo legítimo (D-01..D-03)", () => {
    it("preserva atributo style em qualquer tag (D-02)", () => {
      const result = sanitizeEmailHtml('<p style="color:red;font-weight:bold">texto</p>');
      expect(result).toContain('style="color:red;font-weight:bold"');
      expect(result).toContain("texto");
    });

    it("preserva href https em <a> (D-03)", () => {
      const result = sanitizeEmailHtml('<a href="https://monarcasemijoyas.com.py">link</a>');
      expect(result).toContain('href="https://monarcasemijoyas.com.py"');
      expect(result).toContain("link");
    });

    it("preserva href http em <a> (D-03)", () => {
      const result = sanitizeEmailHtml('<a href="http://example.com">link</a>');
      expect(result).toContain('href="http://example.com"');
    });

    it("preserva todas as tags de formatação (D-01)", () => {
      const html = "<p>p</p><strong>s</strong><em>e</em><ul><li>l</li></ul><ol><li>n</li></ol><h1>h1</h1><h2>h2</h2><h3>h3</h3><span>sp</span><div>d</div><a href='https://x.com'>a</a>";
      const result = sanitizeEmailHtml(html);
      EMAIL_ALLOWED_TAGS
        .filter(t => !["br"].includes(t)) // br não tem closing
        .forEach(tag => {
          expect(result).toContain(`<${tag}`);
        });
    });

    it("não altera string vazia", () => {
      expect(sanitizeEmailHtml("")).toBe("");
    });

    it("não altera texto puro sem HTML", () => {
      const text = "Olá João, sua maleta foi enviada.";
      expect(sanitizeEmailHtml(text)).toBe(text);
    });
  });
});

describe("sanitizeEmailHtml — EMAIL_ALLOWED_TAGS export", () => {
  it("contém as 13 tags canônicas D-01", () => {
    const expected = ["p", "br", "strong", "em", "ul", "ol", "li", "a", "h1", "h2", "h3", "span", "div"];
    expected.forEach(tag => {
      expect(EMAIL_ALLOWED_TAGS).toContain(tag);
    });
    expect(EMAIL_ALLOWED_TAGS).toHaveLength(13);
  });
});
