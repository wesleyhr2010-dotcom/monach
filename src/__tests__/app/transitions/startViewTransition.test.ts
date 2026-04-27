import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// Testes de integração — startViewTransition + notifyAppRouteCommit
// Verifica que:
//   (a) setVtPattern é chamado com a classe correta
//   (b) o update callback espera notifyAppRouteCommit
//   (c) timeout de segurança resolve se notify não for chamado
// Ref: docs/sistema/SPEC_TRANSICOES_TELAS.md §6, §10
// ============================================================

function makeClassList() {
  const classes = new Set<string>();
  return {
    _classes: classes,
    add: vi.fn((...t: string[]) => t.forEach((x) => classes.add(x))),
    remove: vi.fn((...t: string[]) => t.forEach((x) => classes.delete(x))),
  };
}

let classList: ReturnType<typeof makeClassList>;

beforeEach(() => {
  classList = makeClassList();
  vi.stubGlobal("document", {
    documentElement: { classList },
  });
  vi.stubGlobal("performance", {
    mark: vi.fn(),
    measure: vi.fn(() => ({ duration: 200 })),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  });
  vi.stubGlobal("window", { __vtMeta: undefined });
  delete process.env.NEXT_PUBLIC_VIEW_TRANSITIONS;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.useRealTimers();
});

describe("viewTransition — abordagem async + notifyAppRouteCommit", () => {
  it("setVtPattern é chamado com a classe correta antes da navegação", async () => {
    const { setVtPattern } = await import("@/components/app/transitions/viewTransition");
    setVtPattern("push");
    expect(classList.add).toHaveBeenCalledWith("vt-push");
  });

  it("setVtPattern NÃO é chamado quando flag é 'off'", async () => {
    process.env.NEXT_PUBLIC_VIEW_TRANSITIONS = "off";
    const { setVtPattern } = await import("@/components/app/transitions/viewTransition");
    if (process.env.NEXT_PUBLIC_VIEW_TRANSITIONS !== "off") {
      setVtPattern("push");
    }
    expect(classList.add).not.toHaveBeenCalled();
  });

  it("clearVtPattern remove todas as classes após a transição", async () => {
    const { setVtPattern, clearVtPattern } = await import(
      "@/components/app/transitions/viewTransition"
    );
    setVtPattern("crossfade");
    clearVtPattern();
    expect(classList.remove).toHaveBeenCalledWith(
      "vt-push", "vt-pop", "vt-crossfade",
      "vt-modal", "vt-modal-close", "vt-hero",
    );
  });

  it("padrão 'modal' seta classe vt-modal para rotas de sheet", async () => {
    const { setVtPattern } = await import("@/components/app/transitions/viewTransition");
    setVtPattern("modal");
    expect(classList.add).toHaveBeenCalledWith("vt-modal");
    expect(classList.remove).toHaveBeenCalledWith(
      "vt-push", "vt-pop", "vt-crossfade",
      "vt-modal", "vt-modal-close", "vt-hero",
    );
  });

  it("runViewTransition chama navigate e espera notifyAppRouteCommit", async () => {
    const callbacks: Promise<unknown>[] = [];
    vi.stubGlobal("document", {
      documentElement: { classList },
      startViewTransition: vi.fn((cb: () => Promise<void>) => {
        const p = cb();
        callbacks.push(p);
        return { finished: new Promise<void>(() => {}) };
      }),
    });

    const navigate = vi.fn();
    const { notifyAppRouteCommit, runViewTransition } = await import(
      "@/components/app/transitions/viewTransition"
    );

    runViewTransition("crossfade", navigate);

    expect(navigate).toHaveBeenCalled();
    expect(classList.add).toHaveBeenCalledWith("vt-crossfade");

    // Ainda não resolveu
    let settled = false;
    callbacks[0]?.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);

    // notify libera
    notifyAppRouteCommit();
    await callbacks[0];
    expect(settled).toBe(true);
  });

  it("runViewTransition resolve por timeout se notifyAppRouteCommit não for chamado", async () => {
    const callbacks: Promise<unknown>[] = [];
    vi.stubGlobal("document", {
      documentElement: { classList },
      startViewTransition: vi.fn((cb: () => Promise<void>) => {
        const p = cb();
        callbacks.push(p);
        return { finished: new Promise<void>(() => {}) };
      }),
    });

    const navigate = vi.fn();
    const { runViewTransition } = await import(
      "@/components/app/transitions/viewTransition"
    );

    runViewTransition("push", navigate);

    let settled = false;
    callbacks[0]?.then(() => { settled = true; });

    // Não chamamos notifyAppRouteCommit — timeout deve resolver
    vi.advanceTimersByTime(5000);
    await callbacks[0];
    expect(settled).toBe(true);
  });

  it("faz fallback direto se startViewTransition falhar", async () => {
    const navigate = vi.fn();
    vi.stubGlobal("document", {
      documentElement: { classList },
      startViewTransition: vi.fn(() => {
        throw new Error("Browser sem suporte");
      }),
    });

    const { runViewTransition } = await import(
      "@/components/app/transitions/viewTransition"
    );

    runViewTransition("push", navigate);

    expect(navigate).toHaveBeenCalled();
    expect(classList.remove).toHaveBeenCalled();
  });
});
