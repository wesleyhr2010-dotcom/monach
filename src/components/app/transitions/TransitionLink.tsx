"use client";

import { useRouter } from "next/navigation";
import { useEffect, type AnchorHTMLAttributes } from "react";
import { runViewTransition, type VtPattern } from "./viewTransition";

export type { VtPattern } from "./viewTransition";

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  pattern?: VtPattern;
  prefetch?: boolean;
};

export function TransitionLink({
  pattern = "push",
  onClick,
  href,
  children,
  prefetch = true,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  useEffect(() => {
    if (prefetch) {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

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

    runViewTransition(pattern, () => router.push(href));
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
