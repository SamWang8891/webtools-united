import { useEffect, useState } from "react";
import type { Lang } from "../lib/types";
import { t } from "../i18n";
import {
  type ThemePreference,
  applyTheme,
  getStoredPreference,
  resolveTheme,
  setStoredPreference,
} from "../lib/theme";

const ICON: Record<ThemePreference, string> = {
  light: "☀",
  dark: "☾",
  auto: "◐",
};

const NEXT: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "auto",
  auto: "light",
};

interface Props {
  lang: Lang;
}

export function ThemeToggle({ lang }: Props) {
  const [pref, setPref] = useState<ThemePreference>("auto");

  useEffect(() => {
    setPref(getStoredPreference());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme(resolveTheme(pref, mq.matches));
    update();
    if (pref === "auto") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, [pref]);

  function cycle() {
    const next = NEXT[pref];
    setPref(next);
    setStoredPreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${t(lang, "theme.label")}: ${t(lang, `theme.${pref}`)}`}
      title={t(lang, `theme.${pref}`)}
      className="rounded-md border border-border px-2.5 py-1 text-sm hover:bg-bg"
    >
      <span aria-hidden="true">{ICON[pref]}</span>
    </button>
  );
}
