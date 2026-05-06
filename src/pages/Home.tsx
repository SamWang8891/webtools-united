import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../lib/types";
import { loadAllTools } from "../lib/tool-loader";
import { createSearcher } from "../lib/search";
import { t } from "../i18n";
import { Header } from "../components/Header";
import { Card } from "../components/Card";
import { Footer } from "../components/Footer";

interface Props {
  lang: Lang;
}

const DEBOUNCE_MS = 150;

export function Home({ lang }: Props) {
  const tools = useMemo(() => loadAllTools(), []);
  const search = useMemo(() => createSearcher(tools), [tools]);
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof location !== "undefined" && location.hash.startsWith("#q=")) {
      const initial = decodeURIComponent(location.hash.slice(3));
      setRaw(initial);
      setQuery(initial);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setQuery(raw), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [raw]);

  useEffect(() => {
    if (typeof history === "undefined") return;
    const newHash = query ? `#q=${encodeURIComponent(query)}` : "";
    if (location.hash !== newHash) {
      history.replaceState(null, "", `${location.pathname}${location.search}${newHash}`);
    }
  }, [query]);

  const results = search(query);

  return (
    <div className="min-h-screen flex flex-col">
      <Header lang={lang} query={raw} onQueryChange={setRaw} />
      <main className="mx-auto max-w-screen-2xl w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 flex-1">
        {results.length === 0 ? (
          <div className="text-center text-muted py-12">
            <p>{t(lang, "search.empty")}</p>
            <a
              href="https://github.com/SamWang8891/webtools-united/issues/new?template=tool-suggestion.md"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(lang, "search.suggest")}
            </a>
          </div>
        ) : (
          <ul className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
            {results.map((tool) => (
              <li key={tool.slug}>
                <Card tool={tool} lang={lang} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
