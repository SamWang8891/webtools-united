import { createRoot, hydrateRoot } from "react-dom/client";
import type { Lang } from "./lib/types";
import { Home } from "./pages/Home";
import "./styles/tailwind.css";

const LANG_MAP: Record<string, Lang> = {
  "/zh-Hant/": "zh-Hant",
};

function resolveLang(): Lang {
  if (typeof window !== "undefined") {
    const p = window.location.pathname;
    if (p.startsWith("/zh-Hant")) return "zh-Hant";
  }
  return "en";
}

const lang = resolveLang();
const root = document.getElementById("root")!;

// If the server pre-rendered content exists, hydrate; otherwise mount fresh.
if (root.hasChildNodes()) {
  hydrateRoot(root, <Home lang={lang} />);
} else {
  createRoot(root).render(<Home lang={lang} />);
}

// Exported for use by scripts/prerender.mjs (vite SSR mode picks this up).
export { LANG_MAP };
