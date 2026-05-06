import { renderToStaticMarkup } from "react-dom/server";
import type { Lang } from "./lib/types";
import { Home } from "./pages/Home";

export function render(lang: Lang): string {
  return renderToStaticMarkup(<Home lang={lang} />);
}
