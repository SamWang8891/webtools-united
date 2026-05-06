import type { Lang } from "../lib/types";
import { t } from "../i18n";

interface Props {
  lang: Lang;
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ lang, value, onChange }: Props) {
  return (
    <input
      type="search"
      role="searchbox"
      aria-label={t(lang, "search.placeholder")}
      placeholder={t(lang, "search.placeholder")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-72 rounded-md border border-border bg-bg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}
