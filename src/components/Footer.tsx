import type { Lang } from "../lib/types";
import { t } from "../i18n";

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 text-base text-muted flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>© 2026 webtools-united</span>
        <a
          href="https://github.com/SamWang8891/webtools-united"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(lang, "footer.repo")}
          className="inline-flex items-center gap-2 hover:text-fg"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.97c-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.95 10.95 0 0 1 5.74 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
          </svg>
          <span>SamWang8891/webtools-united</span>
        </a>
        <span className="ml-auto">MIT</span>
      </div>
    </footer>
  );
}
