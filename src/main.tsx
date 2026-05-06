import { useEffect, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import type { Lang } from "./lib/types";
import { Home } from "./pages/Home";
import "./styles/tailwind.css";

function resolveLang(): Lang {
  if (typeof window === "undefined") return "en";
  return window.location.pathname.startsWith("/zh-Hant") ? "zh-Hant" : "en";
}

// Root holds `lang` as state and listens for navigation events so the UI
// re-renders with the new language without a full page reload.
function Root() {
  const [lang, setLang] = useState<Lang>(resolveLang());
  useEffect(() => {
    const onChange = () => setLang(resolveLang());
    window.addEventListener("popstate", onChange);
    window.addEventListener("wt-langchange", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("wt-langchange", onChange);
    };
  }, []);
  return <Home lang={lang} />;
}

const root = document.getElementById("root")!;
if (root.hasChildNodes()) {
  hydrateRoot(root, <Root />);
} else {
  createRoot(root).render(<Root />);
}
