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
    var root = document.querySelector(selector);
    var stored = localStorage.getItem(key);
    var theme = stored || "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    if (root) {
      root.setAttribute("data-theme", resolved);
    }
  } catch (e) {
    // Fallback: do nothing on error to avoid blocking hydration
  }
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
