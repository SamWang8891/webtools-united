import type { Lang, Tool } from "./types";
import { getToolStrings, t } from "../i18n";

export const SITE_ORIGIN = "https://tools365.link";

const PATH_BY_LANG: Record<Lang, string> = {
  en: "/",
  "zh-Hant": "/zh-Hant/",
};

export function buildHreflangLinks(origin: string = SITE_ORIGIN) {
  return [
    { hreflang: "en", href: `${origin}/` },
    { hreflang: "zh-Hant", href: `${origin}/zh-Hant/` },
    { hreflang: "x-default", href: `${origin}/` },
  ];
}

export function getPageMeta(lang: Lang) {
  return {
    lang,
    title: `${t(lang, "header.title")} — ${t(lang, "header.tagline")}`,
    description: t(lang, "header.tagline"),
    canonical: `${SITE_ORIGIN}${PATH_BY_LANG[lang]}`,
  };
}

export function buildItemListJsonLd(tools: Tool[], lang: Lang, origin: string = SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t(lang, "header.title"),
    itemListElement: tools.map((tool, i) => {
      const { title, description } = getToolStrings(tool, lang);
      const url = tool.type === "external" ? tool.url! : `${origin}${tool.path}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: title,
        description,
        url,
      };
    }),
  };
}
