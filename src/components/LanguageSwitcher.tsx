import type { Lang } from "../lib/types";
import { t } from "../i18n";

const ROUTES: Record<Lang, string> = {
  en: "/",
  "zh-Hant": "/zh-Hant/",
};

interface Props {
  lang: Lang;
}

export function LanguageSwitcher({ lang }: Props) {
  function go(target: Lang) {
    if (target === lang) return;
    try {
      document.cookie = `wt-lang=${target}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
    history.pushState(null, "", ROUTES[target] + location.hash);
    window.dispatchEvent(new Event("wt-langchange"));
  }
  return (
    <div role="group" aria-label={t(lang, "lang.label")} className="text-base flex rounded-md border border-border overflow-hidden">
      {(["en", "zh-Hant"] as Lang[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => go(opt)}
          aria-current={lang === opt ? "true" : undefined}
          className={`px-3.5 py-1.5 ${lang === opt ? "bg-accent text-white" : "hover:bg-bg"}`}
        >
          {t(lang, `lang.${opt}`)}
        </button>
      ))}
    </div>
  );
}
