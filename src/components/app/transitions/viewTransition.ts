"use client";

export type VtPattern = "push" | "pop" | "crossfade" | "modal" | "modal-close" | "hero";

const VT_CLASSES = [
  "vt-push", "vt-pop", "vt-crossfade",
  "vt-modal", "vt-modal-close", "vt-hero",
] as const;

const COMMIT_TIMEOUT_MS = process.env.NODE_ENV === "development" ? 3000 : 1500;

let pendingCommit: { resolve: () => void; timeout: ReturnType<typeof setTimeout> } | null = null;

function startCommitWait() {
  // Limpa pendente anterior (caso de navegação rápida)
  if (pendingCommit) {
    clearTimeout(pendingCommit.timeout);
    pendingCommit.resolve();
    pendingCommit = null;
  }

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (pendingCommit) {
        pendingCommit = null;
        resolve();
      }
    }, COMMIT_TIMEOUT_MS);

    pendingCommit = { resolve, timeout };
  });
}

export function notifyAppRouteCommit() {
  if (!pendingCommit) return;
  const p = pendingCommit;
  pendingCommit = null;
  clearTimeout(p.timeout);
  p.resolve();
}

export function setVtPattern(pattern: VtPattern) {
  const html = document.documentElement;
  html.classList.remove(...VT_CLASSES);
  html.classList.add(`vt-${pattern}`);
}

export function clearVtPattern() {
  document.documentElement.classList.remove(...VT_CLASSES);
}

/**
 * Executa navegação dentro de startViewTransition.
 *
 * Estratégia:
 * 1. Seta a classe CSS de animação no <html>
 * 2. Chama document.startViewTransition(async () => { ... })
 * 3. Dentro do callback: navega (router.push/back)
 * 4. Espera o App Router commitar o DOM novo (via notifyAppRouteCommit)
 * 5. O browser captura o snapshot "new" quando a Promise resolve
 * 6. Limpa a classe CSS quando a transição termina
 *
 * O timeout evita deadlock se o commit demorar demais (Turbopack dev).
 */
export function runViewTransition(pattern: VtPattern, navigate: () => void) {
  if (
    process.env.NEXT_PUBLIC_VIEW_TRANSITIONS === "off" ||
    typeof document === "undefined" ||
    !document.startViewTransition
  ) {
    navigate();
    return;
  }

  setVtPattern(pattern);

  const commitPromise = startCommitWait();

  try {
    const transition = document.startViewTransition(async () => {
      navigate();
      await commitPromise;
    });

    transition?.finished?.finally(clearVtPattern);
  } catch {
    clearVtPattern();
    navigate();
  }
}
