import { describe, it, expect } from "vitest";
import {
  substituirVariaveis,
  VARIAVEIS_POR_TIPO,
  htmlToPlainText,
  mapTipoParaWhitelist,
} from "@/lib/notifications-shared";
import { sanitizeTemplateVars } from "@/lib/notifications-server";

describe("substituirVariaveis", () => {
  it("substitui variáveis simples", () => {
    const result = substituirVariaveis("Hola {nome}", { nome: "Ana" });
    expect(result).toBe("Hola Ana");
  });

  it("substitui variáveis quando whitelist permite", () => {
    const result = substituirVariaveis("Hola {nome}", { nome: "Ana" }, ["nome"]);
    expect(result).toBe("Hola Ana");
  });

  it("ignora variáveis fora da whitelist", () => {
    const result = substituirVariaveis("Hola {nome}", { nome: "Ana" }, ["outro"]);
    expect(result).toBe("Hola {nome}");
  });

  it("substitui todas as variáveis sem whitelist", () => {
    const result = substituirVariaveis("Hola {nome}", { nome: "Ana" });
    expect(result).toBe("Hola Ana");
  });

  it("mantém placeholder quando variável está ausente", () => {
    const result = substituirVariaveis("Hola {nome}", {});
    expect(result).toBe("Hola {nome}");
  });

  it("suporta notação de ponto para objetos aninhados", () => {
    const result = substituirVariaveis(
      "Maleta {maleta.id}",
      { maleta: { id: "123" } }
    );
    expect(result).toBe("Maleta 123");
  });

  it("mantém placeholder quando caminho aninhado não existe", () => {
    const result = substituirVariaveis(
      "Maleta {maleta.id}",
      { maleta: {} }
    );
    expect(result).toBe("Maleta {maleta.id}");
  });

  it("substitui múltiplas variáveis", () => {
    const result = substituirVariaveis(
      "Hola {nome}, tu maleta {maleta_id} vence en {dias} días.",
      { nome: "Ana", maleta_id: "M-42", dias: 3 }
    );
    expect(result).toBe("Hola Ana, tu maleta M-42 vence en 3 días.");
  });

  it("converte números para string", () => {
    const result = substituirVariaveis("{pontos} puntos", { pontos: 150 });
    expect(result).toBe("150 puntos");
  });
});

describe("VARIAVEIS_POR_TIPO", () => {
  it("contém whitelists para todos os tipos principais", () => {
    expect(VARIAVEIS_POR_TIPO.prazo_proximo).toEqual([
      "maleta_id",
      "dias_restantes",
      "nome_revendedora",
    ]);
    expect(VARIAVEIS_POR_TIPO.maleta_atrasada).toEqual([
      "maleta_id",
      "nome_revendedora",
    ]);
    expect(VARIAVEIS_POR_TIPO.pontos_ganhos).toEqual([
      "pontos",
      "motivo",
      "nome_revendedora",
    ]);
    expect(VARIAVEIS_POR_TIPO.acerto_confirmado).toEqual([
      "maleta_id",
      "valor_comissao",
      "nome_revendedora",
    ]);
    expect(VARIAVEIS_POR_TIPO.devolucao_recebida).toEqual([
      "maleta_id",
      "nome_revendedora",
    ]);
    expect(VARIAVEIS_POR_TIPO.nova_maleta).toEqual([
      "maleta_id",
      "nome_revendedora",
    ]);
    expect(VARIAVEIS_POR_TIPO.brinde_entregue).toEqual([
      "nome_regalo",
      "nome_revendedora",
    ]);
  });
});

describe("sanitizeTemplateVars", () => {
  it("permite tags de formatação básicas", () => {
    const html = "<p>Hola <strong>Ana</strong></p>";
    expect(sanitizeTemplateVars(html)).toBe("<p>Hola <strong>Ana</strong></p>");
  });

  it("remove scripts", () => {
    const html = 'Hola <script>alert("xss")</script>Ana';
    expect(sanitizeTemplateVars(html)).toBe("Hola Ana");
  });

  it("remove event handlers", () => {
    const html = '<p onclick="evil()">Hola</p>';
    expect(sanitizeTemplateVars(html)).toBe("<p>Hola</p>");
  });

  it("mantém links com href", () => {
    const html = '<a href="https://monarca.com">Link</a>';
    expect(sanitizeTemplateVars(html)).toBe('<a href="https://monarca.com">Link</a>');
  });

  it("remove atributos não permitidos", () => {
    const html = '<a href="https://monarca.com" target="_blank">Link</a>';
    expect(sanitizeTemplateVars(html)).toBe('<a href="https://monarca.com">Link</a>');
  });
});

describe("htmlToPlainText", () => {
  it("converte <br> em nova linha", () => {
    expect(htmlToPlainText("Hola<br>Ana")).toBe("Hola\nAna");
  });

  it("converte <p> em nova linha", () => {
    expect(htmlToPlainText("<p>Hola</p><p>Ana</p>")).toBe("Hola\n\nAna");
  });

  it("remove tags restantes", () => {
    expect(htmlToPlainText("<b>Hola</b>")).toBe("Hola");
  });

  it("decodifica entidades HTML", () => {
    expect(htmlToPlainText("Hola &amp; Ana &lt;3")).toBe("Hola & Ana <3");
  });

  it("normaliza espaços em branco excessivos", () => {
    expect(htmlToPlainText("<p>Hola</p>\n\n\n\n<p>Ana</p>")).toBe("Hola\n\nAna");
  });
});

describe("mapTipoParaWhitelist", () => {
  it("mapeia prazo_proximo_d3 para prazo_proximo", () => {
    expect(mapTipoParaWhitelist("prazo_proximo_d3")).toBe("prazo_proximo");
  });

  it("mapeia prazo_proximo_d1 para prazo_proximo", () => {
    expect(mapTipoParaWhitelist("prazo_proximo_d1")).toBe("prazo_proximo");
  });

  it("mapeia maleta_atrasada diretamente", () => {
    expect(mapTipoParaWhitelist("maleta_atrasada")).toBe("maleta_atrasada");
  });

  it("mapeia maleta_devolvida_admin para devolucao_recebida", () => {
    expect(mapTipoParaWhitelist("maleta_devolvida_admin")).toBe("devolucao_recebida");
  });

  it("mapeia nova_maleta_revendedora para nova_maleta", () => {
    expect(mapTipoParaWhitelist("nova_maleta_revendedora")).toBe("nova_maleta");
  });

  it("mapeia brinde_disponivel para brinde_entregue", () => {
    expect(mapTipoParaWhitelist("brinde_disponivel")).toBe("brinde_entregue");
  });

  it("mapeia pontos_concedidos para pontos_ganhos", () => {
    expect(mapTipoParaWhitelist("pontos_concedidos")).toBe("pontos_ganhos");
  });

  it("retorna null para tipos desconhecidos", () => {
    expect(mapTipoParaWhitelist("tipo_inexistente")).toBeNull();
  });
});
