import type { Lang } from "../lib/types";
import { t } from "../i18n";
import { SearchBar } from "./SearchBar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  lang: Lang;
  query: string;
  onQueryChange: (q: string) => void;
}

export function Header({ lang, query, onQueryChange }: Props) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="mx-auto max-w-screen-2xl px-4 py-4 flex flex-wrap items-center gap-4">
        <a href={lang === "en" ? "/" : "/zh-Hant/"} className="flex flex-col leading-tight mr-auto">
          <span className="font-bold text-2xl">{t(lang, "header.title")}</span>
          <span className="text-sm text-muted hidden sm:inline">{t(lang, "header.tagline")}</span>
        </a>
        <SearchBar lang={lang} value={query} onChange={onQueryChange} />
        <LanguageSwitcher lang={lang} />
        <ThemeToggle lang={lang} />
      </div>
    </header>
  );
}
