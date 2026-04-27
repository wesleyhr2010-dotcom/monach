import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Testes unitários — setVtPattern / clearVtPattern
// Ref: docs/sistema/SPEC_TRANSICOES_TELAS.md §3, §6, §10
// ============================================================

// Simular document.documentElement.classList em ambiente node
function makeClassList() {
  const classes = new Set<string>();
  return {
    _set: classes,
    add: vi.fn((...tokens: string[]) => tokens.forEach((t) => classes.add(t))),
    remove: vi.fn((...tokens: string[]) => tokens.forEach((t) => classes.delete(t))),
    contains: (t: string) => classes.has(t),
  };
}

let classList: ReturnType<typeof makeClassList>;

beforeEach(() => {
  classList = makeClassList();
  vi.stubGlobal("document", {
    documentElement: { classList },
  });
});

// Importar APÓS stubGlobal
const mod = () =>
  import("@/components/app/transitions/viewTransition") as Promise<
    typeof import("@/components/app/transitions/viewTransition")
  >;

describe("setVtPattern", () => {
  it("adiciona a classe vt- correta ao <html>", async () => {
    const { setVtPattern } = await mod();
    setVtPattern("push");
    expect(classList.add).toHaveBeenCalledWith("vt-push");
  });

  it("remove todas as classes VT antes de adicionar a nova", async () => {
    const { setVtPattern } = await mod();
    setVtPattern("crossfade");
    expect(classList.remove).toHaveBeenCalledWith(
      "vt-push", "vt-pop", "vt-crossfade",
      "vt-modal", "vt-modal-close", "vt-hero",
    );
    expect(classList.add).toHaveBeenCalledWith("vt-crossfade");
  });

  it.each([
    "push", "pop", "crossfade", "modal", "modal-close", "hero",
  ] as const)("padrão '%s' gera classe 'vt-%s'", async (pattern) => {
    const { setVtPattern } = await mod();
    setVtPattern(pattern);
    expect(classList.add).toHaveBeenCalledWith(`vt-${pattern}`);
  });
});

describe("clearVtPattern", () => {
  it("remove todas as classes VT do <html>", async () => {
    const { clearVtPattern } = await mod();
    clearVtPattern();
    expect(classList.remove).toHaveBeenCalledWith(
      "vt-push", "vt-pop", "vt-crossfade",
      "vt-modal", "vt-modal-close", "vt-hero",
    );
  });

  it("não lança exceção quando nenhuma classe está presente", async () => {
    const { clearVtPattern } = await mod();
    expect(() => clearVtPattern()).not.toThrow();
  });
});
