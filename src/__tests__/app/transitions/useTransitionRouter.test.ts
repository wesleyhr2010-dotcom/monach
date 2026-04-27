import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// Testes unitários — useTransitionRouter
// Verifica classificação correta (push vs sheet vs pop vs modal-close)
// Ref: docs/sistema/SPEC_TRANSICOES_TELAS.md §3.2, §10
// ============================================================

function makeClassList() {
  const classes = new Set<string>();
  return {
    _classes: classes,
    add: vi.fn((...t: string[]) => t.forEach((x) => classes.add(x))),
    remove: vi.fn((...t: string[]) => t.forEach((x) => classes.delete(x))),
  };
}

let routerPushMock: ReturnType<typeof vi.fn>;
let routerBackMock: ReturnType<typeof vi.fn>;
let classList: ReturnType<typeof makeClassList>;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    back: routerBackMock,
  }),
}));

// startTransition chama o callback diretamente nos testes
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, startTransition: (fn: () => void) => fn() };
});

beforeEach(() => {
  routerPushMock = vi.fn();
  routerBackMock = vi.fn();
  classList = makeClassList();

  // startViewTransition precisa existir para withTransition não fazer early return
  vi.stubGlobal("document", {
    documentElement: { classList },
    startViewTransition: vi.fn((cb: () => void) => { cb(); }),
  });
  vi.stubGlobal("window", { location: { pathname: "/" } });
  delete process.env.NEXT_PUBLIC_VIEW_TRANSITIONS;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function getRouter() {
  const { useTransitionRouter } = await import(
    "@/components/app/transitions/useTransitionRouter"
  );
  // Simular o hook diretamente (sem renderHook — sem jsdom)
  // O hook é apenas uma closure sobre useRouter(), testamos a lógica interna
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useTransitionRouter();
}

describe("useTransitionRouter.push", () => {
  it("usa padrão 'modal' para rotas de modal sheet", async () => {
    const router = await getRouter();
    router.push("/app/maleta/abc/registrar-venta");

    expect(classList.add).toHaveBeenCalledWith("vt-modal");
    expect(routerPushMock).toHaveBeenCalledWith("/app/maleta/abc/registrar-venta");
  });

  it("usa padrão 'modal' para rota devolver", async () => {
    const router = await getRouter();
    router.push("/app/maleta/abc/devolver");

    expect(classList.add).toHaveBeenCalledWith("vt-modal");
  });

  it("usa padrão 'modal' para rota compartir", async () => {
    const router = await getRouter();
    router.push("/app/catalogo/compartir");

    expect(classList.add).toHaveBeenCalledWith("vt-modal");
  });

  it("usa padrão 'push' para rotas hierárquicas comuns", async () => {
    const router = await getRouter();
    router.push("/app/maleta/abc123");

    expect(classList.add).toHaveBeenCalledWith("vt-push");
    expect(routerPushMock).toHaveBeenCalledWith("/app/maleta/abc123");
  });

  it("aceita override de padrão explícito", async () => {
    const router = await getRouter();
    router.push("/app/maleta", "crossfade");

    expect(classList.add).toHaveBeenCalledWith("vt-crossfade");
  });
});

describe("useTransitionRouter.back", () => {
  it("usa 'modal-close' quando currentPath é uma rota modal", async () => {
    const router = await getRouter();
    router.back("/app/maleta/abc/registrar-venta");

    expect(classList.add).toHaveBeenCalledWith("vt-modal-close");
    expect(routerBackMock).toHaveBeenCalled();
  });

  it("usa 'pop' quando currentPath é uma rota comum", async () => {
    const router = await getRouter();
    router.back("/app/maleta/abc123");

    expect(classList.add).toHaveBeenCalledWith("vt-pop");
    expect(routerBackMock).toHaveBeenCalled();
  });

  it("usa 'pop' quando currentPath não é informado", async () => {
    const router = await getRouter();
    router.back();

    expect(classList.add).toHaveBeenCalledWith("vt-pop");
  });
});

describe("useTransitionRouter.pushSheet", () => {
  it("sempre usa 'modal' independente da rota", async () => {
    const router = await getRouter();
    router.pushSheet("/qualquer/rota");

    expect(classList.add).toHaveBeenCalledWith("vt-modal");
    expect(routerPushMock).toHaveBeenCalledWith("/qualquer/rota");
  });
});

describe("useTransitionRouter.pushHero", () => {
  it("sempre usa 'hero' independente da rota", async () => {
    const router = await getRouter();
    router.pushHero("/app/maleta/abc123");

    expect(classList.add).toHaveBeenCalledWith("vt-hero");
    expect(routerPushMock).toHaveBeenCalledWith("/app/maleta/abc123");
  });
});

describe("feature flag NEXT_PUBLIC_VIEW_TRANSITIONS=off", () => {
  it("navega sem setar VT class quando flag é 'off'", async () => {
    process.env.NEXT_PUBLIC_VIEW_TRANSITIONS = "off";
    const router = await getRouter();
    router.push("/app/maleta/abc123");

    // Com flag off, setVtPattern não é chamado (classList.add não recebe vt-*)
    expect(classList.add).not.toHaveBeenCalled();
    // A navegação ainda acontece
    expect(routerPushMock).toHaveBeenCalledWith("/app/maleta/abc123");
  });
});
