import type { Lang } from "../lib/types";
import { t } from "../i18n";

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>© 2026 webtools-united</span>
        <a
          href="https://github.com/SamWang8891/webtools-united"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-fg"
        >
          {t(lang, "footer.repo")}: SamWang8891/webtools-united
        </a>
        <span className="ml-auto">MIT</span>
      </div>
    </footer>
  );
}
