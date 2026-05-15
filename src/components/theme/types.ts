export type Theme = "light" | "dark" | "system";

export const MONARCA_APP_THEME_KEY = "monarca-app-theme";
export const MONARCA_ADMIN_THEME_KEY = "monarca-admin-theme";

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}
