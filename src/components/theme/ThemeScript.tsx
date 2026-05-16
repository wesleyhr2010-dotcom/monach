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

    var bgColor = resolved === 'dark' ? '#1a1816' : '#F5F2EF';

    // color-scheme + backgroundColor on the page canvas controls iOS safe-area
    // strips when no web content explicitly covers them.
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.style.backgroundColor = bgColor;
    if (document.body) {
      document.body.style.backgroundColor = bgColor;
    }

    var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < themeMetas.length; i++) {
      themeMetas[i].setAttribute("content", bgColor);
    }

    var themeMeta = document.querySelector('meta[name="theme-color"][data-monarca-theme]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      themeMeta.setAttribute("data-monarca-theme", "true");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", bgColor);

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
