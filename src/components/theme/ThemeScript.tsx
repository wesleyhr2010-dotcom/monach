"use client";

import React from "react";

interface ThemeScriptProps {
  surface: "app" | "admin";
}

export function ThemeScript({ surface }: ThemeScriptProps) {
  const key = surface === "app" ? "monarca-app-theme" : "monarca-admin-theme";
  const selector = surface === "app" ? ".app-shell" : ".admin-layout";

  const script = `(function() {
  try {
    var key = "${key}";
    var selector = "${selector}";
    var stored = localStorage.getItem(key);
    var theme = stored || "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;

    // color-scheme + backgroundColor on <html> controls the iOS safe-area strip
    // color. The <html> element is the page canvas — iOS uses it to paint the
    // safe-area zone when no web content explicitly covers it.
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.style.backgroundColor = resolved === 'dark' ? '#1a1816' : '#F5F2EF';

    function setTheme() {
      var el = document.querySelector(selector);
      if (el) {
        el.setAttribute("data-theme", resolved);
        return true;
      }
      return false;
    }

    if (!setTheme()) {
      var observer = new MutationObserver(function() {
        if (setTheme()) {
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function() { observer.disconnect(); }, 1000);
    }
  } catch (e) {
    // Fallback: do nothing on error to avoid blocking hydration
  }
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
