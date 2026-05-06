export type ThemePreference = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "wt-theme";

export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (pref === "auto") return prefersDark ? "dark" : "light";
  return pref;
}

export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function getStoredPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "auto";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "auto") return v;
  return "auto";
}

export function setStoredPreference(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, pref);
}

// Inlined into <head> before paint to prevent flash-of-wrong-theme.
// The data-ready attribute is set after the first paint so CSS transitions
// don't fire on initial render (eliminating the language-switch flash).
export const INLINE_SCRIPT = `
(function(){
  try {
    var p = localStorage.getItem('wt-theme');
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = (p === 'light' || p === 'dark') ? p : (dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', resolved);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        document.documentElement.setAttribute('data-ready', 'true');
      });
    });
  } catch(e) {}
})();
`.trim();
