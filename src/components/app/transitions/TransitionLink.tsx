"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type AnchorHTMLAttributes } from "react";
import { runViewTransition, type VtPattern } from "./viewTransition";

export type { VtPattern } from "./viewTransition";

/** Delay em ms antes de iniciar a transição. Dá tempo do browser
 *  pintar o estado visual de "pressed" (scale + opacity) antes de
 *  o startViewTransition congelar o DOM. */
const PRESSED_FEEDBACK_MS = 60;

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  pattern?: VtPattern;
  prefetch?: boolean;
};

export function TransitionLink({
  pattern = "push",
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  href,
  children,
  prefetch = true,
  className,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prefetch) {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
    onPointerDown?.(e);
    setPressed(true);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLAnchorElement>) {
    onPointerUp?.(e);
    setPressed(false);
  }

  function handlePointerLeave(e: React.PointerEvent<HTMLAnchorElement>) {
    onPointerLeave?.(e);
    setPressed(false);
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    onClick?.(e);
    if (e.defaultPrevented) return;

    e.preventDefault();

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      window.location.href = href;
      return;
    }

    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      router.push(href);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      runViewTransition(pattern, () => router.push(href));
    }, PRESSED_FEEDBACK_MS);
  }

  const combinedClass = [className, pressed ? "transition-link-pressed" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      href={href}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={combinedClass || undefined}
      {...props}
    >
      {children}
    </a>
  );
}
