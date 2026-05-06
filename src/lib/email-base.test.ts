import { describe, it, expect } from "vitest";
import {
  renderEmailBase,
  emailButton,
  emailTable,
  emailAlert,
  emailDivider,
} from "./email-base";

describe("email-base", () => {
  describe("renderEmailBase", () => {
    it("retorna objeto com html e text strings", () => {
      const result = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(result).toHaveProperty("html");
      expect(result).toHaveProperty("text");
      expect(typeof result.html).toBe("string");
      expect(typeof result.text).toBe("string");
    });

    it("html contém <!DOCTYPE html> e 'Monarca Semijoyas' no footer", () => {
      const { html } = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Monarca Semijoyas");
    });

    it("text não contém nenhuma tag HTML (<)", () => {
      const { text } = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(text).not.toMatch(/</);
    });

    it("inclui prefers-color-scheme: dark no HTML", () => {
      const { html } = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(html).toContain("prefers-color-scheme: dark");
    });

    it("inclui imagem do logo com display:block e alt text", () => {
      const { html } = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(html).toContain('display:block');
      expect(html).toContain('alt="Monarca Semijoyas"');
    });

    it("preview text está oculto (display:none)", () => {
      const { html } = renderEmailBase({
        title: "Test",
        previewText: "Resumen del mes",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(html).toContain("display:none");
      expect(html).toContain("Resumen del mes");
    });

    it("versão texto contém 'Visitar sitio:'", () => {
      const { text } = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });
      expect(text).toContain("Visitar sitio:");
    });

    it("inclui greeting e cta quando fornecidos", () => {
      const { html, text } = renderEmailBase({
        title: "Test",
        greeting: "Hola María",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        cta: { text: "Ver más", url: "http://example.com/cta" },
      });
      expect(html).toContain("Hola María");
      expect(html).toContain("Ver más");
      expect(text).toContain("Ver más: http://example.com/cta");
    });

    it("inclui footerExtra quando fornecido", () => {
      const { html, text } = renderEmailBase({
        title: "Test",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        footerExtra: "Extra info",
      });
      expect(html).toContain("Extra info");
      expect(text).toContain("Extra info");
    });
  });

  describe("emailButton", () => {
    it("HTML contém <a com href=\"http://example.com\"", () => {
      const { html } = emailButton({
        text: "Ver más",
        url: "http://example.com",
      });
      expect(html).toContain("<a");
      expect(html).toContain('href="http://example.com"');
    });

    it("texto contém 'Ver más: http://example.com'", () => {
      const { text } = emailButton({
        text: "Ver más",
        url: "http://example.com",
      });
      expect(text).toBe("Ver más: http://example.com");
    });

    it("suporta variante outline com border", () => {
      const { html } = emailButton({
        text: "Outline",
        url: "http://example.com",
        variant: "outline",
      });
      expect(html).toContain("border:2px solid #35605a");
      expect(html).toContain("background:transparent");
    });
  });

  describe("emailTable", () => {
    it("HTML contém <table e <td", () => {
      const { html } = emailTable({
        headers: ["Col1", "Col2"],
        rows: [
          ["Val1", "Val2"],
          ["Val3", "Val4"],
        ],
      });
      expect(html).toContain("<table");
      expect(html).toContain("<td");
    });

    it("texto para dados 2x2 retorna linhas formatadas como 'Col1: Val1'", () => {
      const { text } = emailTable({
        headers: ["Col1", "Col2"],
        rows: [
          ["Val1", "Val2"],
          ["Val3", "Val4"],
        ],
      });
      expect(text).toContain("Val1: Val2");
      expect(text).toContain("Val3: Val4");
    });

    it("highlightRow aplica background diferente", () => {
      const { html } = emailTable({
        headers: ["A", "B"],
        rows: [
          ["1", "2"],
          ["3", "4"],
        ],
        highlightRow: 1,
      });
      expect(html).toContain("background:#fff8e7");
    });

    it("funciona sem headers", () => {
      const { html, text } = emailTable({
        rows: [["A", "B"]],
      });
      expect(html).not.toContain("<th");
      expect(text).toBe("A: B");
    });
  });

  describe("emailAlert", () => {
    it("HTML contém border-left style", () => {
      const { html } = emailAlert({ text: "Alerta", variant: "info" });
      expect(html).toContain("border-left:4px solid");
    });

    it("info usa cor primária no border-left", () => {
      const { html } = emailAlert({ text: "Info", variant: "info" });
      expect(html).toContain("border-left:4px solid #35605a");
    });

    it("success usa cor verde no border-left", () => {
      const { html } = emailAlert({ text: "Success", variant: "success" });
      expect(html).toContain("border-left:4px solid #2e7d32");
    });

    it("warning usa cor gold no border-left", () => {
      const { html } = emailAlert({ text: "Warning", variant: "warning" });
      expect(html).toContain("border-left:4px solid #C9A84C");
    });

    it("texto retorna formato '> texto'", () => {
      const { text } = emailAlert({ text: "Atenção", variant: "warning" });
      expect(text).toBe("> Atenção");
    });
  });

  describe("emailDivider", () => {
    it("HTML contém <hr", () => {
      const { html } = emailDivider();
      expect(html).toContain("<hr");
    });

    it("texto retorna '---'", () => {
      const { text } = emailDivider();
      expect(text).toBe("---");
    });
  });
});
